// Minimal, self-contained renderer. No external imports.
// - Always renders a wireframe cube so you see *something*
// - Tries to fetch assets/models/teapot.obj; if it loads, renders that instead
// - Shows a visible overlay on any error (no more black-screen mysteries)

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const statusEl = document.getElementById('status');
const spinChk = document.getElementById('spin');
const speedSl = document.getElementById('speed');
const distSl  = document.getElementById('dist');
const tryObjBtn = document.getElementById('tryObj');

// ----- resize handling -----
function fitCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || window.innerWidth;
  const h = (canvas.clientHeight || (window.innerHeight - 48)); // minus header
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// ----- tiny math helpers -----
const mul4 = (a,b)=>[
  a[0]*b[0]+a[1]*b[4]+a[2]*b[8]+a[3]*b[12],
  a[0]*b[1]+a[1]*b[5]+a[2]*b[9]+a[3]*b[13],
  a[0]*b[2]+a[1]*b[6]+a[2]*b[10]+a[3]*b[14],
  a[0]*b[3]+a[1]*b[7]+a[2]*b[11]+a[3]*b[15],

  a[4]*b[0]+a[5]*b[4]+a[6]*b[8]+a[7]*b[12],
  a[4]*b[1]+a[5]*b[5]+a[6]*b[9]+a[7]*b[13],
  a[4]*b[2]+a[5]*b[6]+a[6]*b[10]+a[7]*b[14],
  a[4]*b[3]+a[5]*b[7]+a[6]*b[11]+a[7]*b[15],

  a[8]*b[0]+a[9]*b[4]+a[10]*b[8]+a[11]*b[12],
  a[8]*b[1]+a[9]*b[5]+a[10]*b[9]+a[11]*b[13],
  a[8]*b[2]+a[9]*b[6]+a[10]*b[10]+a[11]*b[14],
  a[8]*b[3]+a[9]*b[7]+a[10]*b[11]+a[11]*b[15],

  a[12]*b[0]+a[13]*b[4]+a[14]*b[8]+a[15]*b[12],
  a[12]*b[1]+a[13]*b[5]+a[14]*b[9]+a[15]*b[13],
  a[12]*b[2]+a[13]*b[6]+a[14]*b[10]+a[15]*b[14],
  a[12]*b[3]+a[13]*b[7]+a[14]*b[11]+a[15]*b[15],
];
const rotY = (a)=>{const c=Math.cos(a),s=Math.sin(a);return[
  c,0,-s,0,  0,1,0,0,  s,0,c,0,  0,0,0,1
];};
const rotX = (a)=>{const c=Math.cos(a),s=Math.sin(a);return[
  1,0,0,0,  0,c,s,0,  0,-s,c,0,  0,0,0,1
];};
const trans = (x,y,z)=>[1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
const persp = (fov, asp, n, f)=>{
  const t = 1/Math.tan(fov/2);
  return [
    t/asp,0,0,0,
    0,t,0,0,
    0,0,(f+n)/(n-f),-1,
    0,0,(2*f*n)/(n-f),0
  ];
};

// project vec3 by mat4 → NDC → screen
function proj(v, mvp, W, H) {
  const x=v[0],y=v[1],z=v[2];
  const X = mvp[0]*x+mvp[4]*y+mvp[8]*z+mvp[12];
  const Y = mvp[1]*x+mvp[5]*y+mvp[9]*z+mvp[13];
  const Z = mvp[2]*x+mvp[6]*y+mvp[10]*z+mvp[14];
  const Ww= mvp[3]*x+mvp[7]*y+mvp[11]*z+mvp[15];
  const iw = Ww!==0 ? 1/Ww : 1;
  const ndcx = X*iw, ndcy = Y*iw;
  return [(ndcx*0.5+0.5)*W, (1-(ndcy*0.5+0.5))*H];
}

// ----- geometry: fallback cube -----
const cubeVerts = [
  [-1,-1,-1], [ 1,-1,-1], [ 1, 1,-1], [-1, 1,-1],
  [-1,-1, 1], [ 1,-1, 1], [ 1, 1, 1], [-1, 1, 1],
];
const cubeEdges = [
  [0,1],[1,2],[2,3],[3,0],
  [4,5],[5,6],[6,7],[7,4],
  [0,4],[1,5],[2,6],[3,7],
];

// ----- super-light OBJ loader (supports: v, f with triangles or quads) -----
function parseOBJ(text) {
  const verts = [];
  const faces = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const s = line.trim();
    if (s.startsWith('v ')) {
      const [,x,y,z] = s.split(/\s+/);
      verts.push([+x,+y,+z]);
    } else if (s.startsWith('f ')) {
      const parts = s.slice(2).trim().split(/\s+/);
      const idx = parts.map(p => (parseInt(p.split('/')[0],10)-1));
      if (idx.length === 3) faces.push([idx[0], idx[1], idx[2]]);
      if (idx.length === 4) faces.push([idx[0], idx[1], idx[2]], [idx[0], idx[2], idx[3]]);
    }
  }
  // convert faces to unique edges for wireframe
  const edgeSet = new Set();
  const edges = [];
  const addEdge = (a,b)=>{
    const lo = Math.min(a,b), hi = Math.max(a,b);
    const key = lo+'_'+hi;
    if (!edgeSet.has(key)) { edgeSet.add(key); edges.push([lo,hi]); }
  };
  for (const f of faces) {
    addEdge(f[0],f[1]); addEdge(f[1],f[2]); addEdge(f[2],f[0]);
  }
  return { verts, edges };
}

// ----- state -----
let model = { verts: cubeVerts, edges: cubeEdges };
let angle = 0;

// try to load OBJ
async function tryLoadOBJ(url) {
  try {
    statusEl.textContent = `fetching ${url}…`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();
    const parsed = parseOBJ(text);
    if (!parsed.verts.length || !parsed.edges.length) {
      throw new Error('OBJ parsed but empty (check file)');
    }
    model = parsed;
    statusEl.textContent = `loaded ${url} (verts:${model.verts.length}, edges:${model.edges.length})`;
    overlay.hidden = true;
  } catch (err) {
    overlay.hidden = false;
    overlay.innerHTML = `
      <div><strong>OBJ load failed</strong></div>
      <div>URL: <code>${url}</code></div>
      <div>Reason: <code>${String(err.message || err)}</code></div>
      <div>Staying on fallback cube so you still see a render.</div>
      <div style="margin-top:6px;opacity:.8">
        Tips: ensure the file exists at <code>/assets/models/teapot.obj</code> (case-sensitive),<br>
        and you started the server in the project root.
      </div>
    `;
    statusEl.textContent = 'OBJ load failed → showing cube';
  }
}

tryObjBtn.addEventListener('click', ()=> tryLoadOBJ('/assets/models/teapot.obj'));

// ----- render loop -----
function draw() {
  const W = canvas.clientWidth || window.innerWidth;
  const H = canvas.clientHeight || (window.innerHeight - 48);

  ctx.fillStyle = '#140f1f'; // dark purpley background
  ctx.fillRect(0,0,W,H);

  const spin = spinChk.checked ? parseFloat(speedSl.value) : 0;
  const dist = parseFloat(distSl.value);

  // build MVP
  angle += 0.016 * spin; // ~60fps baseline
  const modelM = mul4(rotY(angle*0.9), rotX(angle*0.3));
  const viewM  = trans(0, 0, -dist);
  const aspect = W / Math.max(1,H);
  const projM  = persp(Math.PI/3, aspect, 0.1, 100);
  const mv = mul4(modelM, viewM);
  const mvp = mul4(mv, projM);

  // transform and draw all edges
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#b8a1ff';
  ctx.beginPath();
  for (const [a,b] of model.edges) {
    const va = model.verts[a], vb = model.verts[b];
    const pa = proj(va, mvp, W, H);
    const pb = proj(vb, mvp, W, H);
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
  }
  ctx.stroke();

  requestAnimationFrame(draw);
}
draw();

// Try loading OBJ automatically once
tryLoadOBJ('/assets/models/teapot.obj');

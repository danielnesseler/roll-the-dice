// src/core/scene.js
import { rotX, rotY, project } from './math.js';
import { createTextureMaterial } from '../materials/textureMaterial.js';

export class Scene {
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.eye = [0,0,6];
    this.target = [0,0,0];

    this.spin = true;
    this.angle = 0;
    this.drawMode = 'faces'; // faces | wire | points
    this.uvMode = 'box';

    this.model = null; // {verts, faces}
    this.material = createTextureMaterial({ uvMode: this.uvMode, texture: null });
    this._raf = null;
  }

  setCamera(eye, target){ this.eye=eye; this.target=target; }
  setSpin(v){ this.spin = !!v; }
  setDrawMode(m){ this.drawMode = m; }
  setUVMode(m){ this.uvMode = m; if (this.material) this.material.uvMode = m; }
  setTexture(tex){ if (this.material) this.material.texture = tex; }

  setGeometry(model){ this.model = model; }

  start(){ const loop=(t)=>{ this.render(t); this._raf=requestAnimationFrame(loop); }; this._raf=requestAnimationFrame(loop); }
  stop(){ if (this._raf) cancelAnimationFrame(this._raf); }

  render(t){
    const { ctx, canvas } = this;
    ctx.fillStyle='#111'; ctx.fillRect(0,0,canvas.width,canvas.height);
    if (!this.model) return;

    if (this.spin) this.angle = t*0.001;

    // world & project
    const world = this.model.verts.map(v => rotX(rotY(v,this.angle*0.6), this.angle*0.35));
    const projV = world.map(v => project(v, canvas.width, canvas.height));
    const screen = projV.map(p => [p[0], p[1]]);

    if (this.drawMode==='points'){
      ctx.fillStyle='#9ef';
      for (const p of screen){ ctx.fillRect(p[0]-1,p[1]-1,2,2); }
      return;
    }

    if (this.drawMode==='wire'){
      ctx.strokeStyle='#ddd'; ctx.lineWidth=1; ctx.beginPath();
      for (const f of this.model.faces){
        const a=f[0], b=f[1], c=f[2];
        const p=screen[a], q=screen[b], r=screen[c];
        ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.lineTo(r[0],r[1]); ctx.lineTo(p[0],p[1]);
      }
      ctx.stroke();
      return;
    }

    // faces: flat fill with texture-sampled color
    for (const f of this.model.faces){
      const i=f[0], j=f[1], k=f[2];
      const p=screen[i], q=screen[j], r=screen[k];
      const col = this.material.sampleTriangle(world[i], world[j], world[k], p, q, r, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.moveTo(p[0],p[1]);
      ctx.lineTo(q[0],q[1]);
      ctx.lineTo(r[0],r[1]);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();

      ctx.strokeStyle = '#0008';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
}

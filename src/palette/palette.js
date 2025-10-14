const clamp = (v, lo, hi)=> Math.min(hi, Math.max(lo, v));
const normHue = h => ((h % 360) + 360) % 360;

export function hslToHex(h,s,l){
  l/=100; const a=(s*Math.min(l,1-l))/100;
  const f=n=>{ const k=(n+h/30)%12; const c=l-a*Math.max(Math.min(k-3,9-k,1),-1);
    return Math.round(255*c).toString(16).padStart(2,'0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
}
export function hexToRgb(hex){ return {
  r: parseInt(hex.slice(1,3),16),
  g: parseInt(hex.slice(3,5),16),
  b: parseInt(hex.slice(5,7),16),
}; }
export function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b);
  let h, s, l=(mx+mn)/2;
  const d=mx-mn;
  if(!d){ h=0; s=0; }
  else {
    s = l>0.5 ? d/(2-mx-mn) : d/(mx+mn);
    switch(mx){ case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      default: h=(r-g)/d+4; }
    h*=60;
  }
  return [h, s*100, l*100];
}

function makeHueOffsets(mode, n){
  const anchors = {
    mono:[0], complementary:[0,180], splitcomp:[0,150,210],
    triadic:[0,120,240], tetradic:[0,90,180,270], analogous:[-60,-30,0,30,60]
  };
  if (mode==='even') return Array.from({length:n}, (_,i)=> i*360/n);
  const base = anchors[mode] || anchors.triadic;
  return Array.from({length:n}, (_,i)=> base[i % base.length]);
}
function curveT(t, kind){
  if (kind==='linear') return t;
  if (kind==='easeIn') return t*t;
  if (kind==='easeOut') return 1-(1-t)*(1-t);
  return t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
}

export function generatePalette(opts){
  const { palSize, hueMode, hueSeed, hueRot, hueJitter,
          satBase, satSpread, litBase, litSpread } = opts;
  const n = palSize;
  const offs = makeHueOffsets(hueMode, n);
  const hues = offs.map(o => normHue(hueSeed + hueRot + o + (hueJitter? (Math.random()*2-1)*hueJitter : 0)));
  const hexes = [];
  for (let i=0;i<n;i++){
    const t = n<=1?0:i/(n-1);
    const s = clamp(satBase + (t-.5)*2*satSpread, 0,100);
    const l = clamp(litBase + (t-.5)*2*litSpread, 0,100);
    hexes.push(hslToHex(hues[i], s, l));
  }
  return hexes;
}

export function adjustPalette(hexList, {adjHue, adjSat, adjBright, adjContrast}){
  return hexList.map(hex=>{
    const {r,g,b} = hexToRgb(hex);
    let [h,s,l] = rgbToHsl(r,g,b);
    h = normHue(h + adjHue);
    s = clamp(s*adjSat, 0, 100);
    l = clamp(50 + (l-50)*adjContrast + adjBright, 0,100);
    return hslToHex(h,s,l);
  });
}

// src/core/math.js

export const add3 = (a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const sub3 = (a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const len3 = (a)=> Math.hypot(a[0],a[1],a[2]);
export const norm3 = (a)=>{ const L=len3(a)||1; return [a[0]/L,a[1]/L,a[2]/L]; };

export function rotY([x,y,z], a){ const c=Math.cos(a), s=Math.sin(a); return [ c*x + s*z, y, -s*x + c*z ]; }
export function rotX([x,y,z], a){ const c=Math.cos(a), s=Math.sin(a); return [ x, c*y - s*z, s*y + c*z ]; }

export function centerAndScale(verts){
  let min=[Infinity,Infinity,Infinity], max=[-Infinity,-Infinity,-Infinity];
  for (const v of verts){
    if (v[0]<min[0]) min[0]=v[0]; if (v[1]<min[1]) min[1]=v[1]; if (v[2]<min[2]) min[2]=v[2];
    if (v[0]>max[0]) max[0]=v[0]; if (v[1]>max[1]) max[1]=v[1]; if (v[2]>max[2]) max[2]=v[2];
  }
  const c=[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2];
  const s=Math.max(max[0]-min[0], max[1]-min[1], max[2]-min[2])||1;
  return verts.map(v=>[(v[0]-c[0])*(2/s),(v[1]-c[1])*(2/s),(v[2]-c[2])*(2/s)]);
}

// simple perspective projector
export function project([x,y,z], canvasW, canvasH, fov=700, zOff=6){
  const f=fov/(z+zOff);
  return [ canvasW/2 + x*f, canvasH/2 - y*f, f ];
}

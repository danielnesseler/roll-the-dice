// src/palette/palette.js

function normHue(h){ return ((h%360)+360)%360; }
function hslToHex(h,s,l){
  l/=100; const a=(s*Math.min(l,1-l))/100;
  const f=n=>{ const k=(n+h/30)%12;
    const c=l-a*Math.max(Math.min(k-3,9-k,1),-1);
    return Math.round(255*c).toString(16).padStart(2,'0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function makePalette(n=5){
  const seed = Math.floor(Math.random()*360);
  const offsets = [0,120,240,60,300].slice(0,n);
  const hex=[];
  for (let i=0;i<n;i++){
    const h=normHue(seed + offsets[i%offsets.length]);
    const s=60 + (i%2?20:-10);
    const l=55 + (i%3===0?10:-10);
    hex.push(hslToHex(h,s,l));
  }
  return hex;
}

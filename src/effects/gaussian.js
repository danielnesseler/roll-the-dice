// src/effects/gaussian.js

function randn(){ let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
  
  function gaussianKernel1D(sigma) {
    if (sigma<=0) return {k:new Float32Array([1]), r:0};
    const r=Math.max(1, Math.floor(sigma*3));
    const sz=r*2+1;
    const k=new Float32Array(sz);
    const s2=2*sigma*sigma; let sum=0;
    for (let i=-r,j=0;i<=r;i++,j++){ const v=Math.exp(-(i*i)/s2); k[j]=v; sum+=v; }
    for (let j=0;j<sz;j++) k[j]/=sum;
    return {k,r};
  }
  function convolveH(src,w,h,{k,r}) {
    if (r===0) return src.slice(0);
    const out=new Float32Array(src.length);
    for(let y=0;y<h;y++){
      const row=y*w;
      for(let x=0;x<w;x++){
        let acc=0;
        for(let i=-r;i<=r;i++){
          const xx=Math.min(w-1,Math.max(0,x+i));
          acc+=src[row+xx]*k[i+r];
        }
        out[row+x]=acc;
      }
    }
    return out;
  }
  function convolveV(src,w,h,{k,r}) {
    if (r===0) return src.slice(0);
    const out=new Float32Array(src.length);
    for(let x=0;x<w;x++){
      for(let y=0;y<h;y++){
        let acc=0;
        for(let i=-r;i<=r;i++){
          const yy=Math.min(h-1,Math.max(0,y+i));
          acc+=src[yy*w+x]*k[i+r];
        }
        out[y*w+x]=acc;
      }
    }
    return out;
  }
  function normalize01(a){
    let mn=Infinity,mx=-Infinity;
    for(const v of a){ if(v<mn) mn=v; if(v>mx) mx=v; }
    const rng=mx-mn || 1;
    const out=new Float32Array(a.length);
    for(let i=0;i<a.length;i++) out[i]=(a[i]-mn)/rng;
    return out;
  }
  function hexToRGB(hex){ return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]; }
  
  export function makeFieldTexture(W,H, { sigma=8, bands=7, scale=8, dither=0.02, gamma=1, palette } = {}){
    const w = Math.max(1, Math.floor(W/scale));
    const h = Math.max(1, Math.floor(H/scale));
  
    let f=new Float32Array(w*h);
    for (let i=0;i<f.length;i++) f[i]=randn();
  
    const ker=gaussianKernel1D(sigma);
    f=convolveH(f,w,h,ker);
    f=convolveV(f,w,h,ker);
    f=normalize01(f);
  
    if (gamma!==1){ for(let i=0;i<f.length;i++) f[i]=Math.pow(f[i], gamma); }
    if (dither>0){ for(let i=0;i<f.length;i++){ f[i]=Math.min(1,Math.max(0,f[i]+(Math.random()-0.5)*dither)); } }
  
    const q=new Uint8Array(f.length);
    const B=Math.max(1, bands|0);
    for(let i=0;i<f.length;i++){
      let idx=Math.floor(f[i]*B);
      if (idx>=B) idx=B-1;
      q[i]=idx;
    }
  
    const off=document.createElement('canvas'); off.width=w; off.height=h;
    const octx=off.getContext('2d');
    const img=octx.createImageData(w,h);
    for(let i=0;i<q.length;i++){
      const band=q[i]%palette.length;
      const [r,g,b]=hexToRGB(palette[band]);
      const p=i*4; img.data[p]=r; img.data[p+1]=g; img.data[p+2]=b; img.data[p+3]=255;
    }
    octx.putImageData(img,0,0);
  
    // expose sampling
    const ctx = off.getContext('2d');
    function sample01(u,v){
      const x=Math.floor(((u%1)+1)%1 * (w-1));
      const y=Math.floor(((v%1)+1)%1 * (h-1));
      const d=ctx.getImageData(x,y,1,1).data;
      return `rgb(${d[0]},${d[1]},${d[2]})`;
    }
  
    return { off, w, h, sample01 };
  }
  
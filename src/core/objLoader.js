// src/core/objLoader.js
import { centerAndScale } from './math.js';

function parseOBJ(text){
  const verts=[], faces=[];
  const normIndex = w => parseInt(w.split('/')[0],10)-1;
  const tri = idx => {
    if (idx.length===3) faces.push([idx[0],idx[1],idx[2]]);
    else if (idx.length===4){ faces.push([idx[0],idx[1],idx[2]]); faces.push([idx[0],idx[2],idx[3]]); }
  };
  for (const raw of text.split('\n')) {
    const s = raw.trim(); if (!s || s.startsWith('#')) continue;
    const p = s.split(/\s+/);
    if (p[0]==='v'){ verts.push([+p[1],+p[2],+p[3]]); }
    else if (p[0]==='f'){ tri(p.slice(1).map(normIndex)); }
  }
  return { verts, faces };
}

export async function loadOBJ(input, opts={}){
  let text;
  if (opts.rawText) text = input; // read from provided string
  else {
    const res = await fetch(input, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`OBJ HTTP ${res.status}`);
    text = await res.text();
  }
  const model = parseOBJ(text);
  model.verts = centerAndScale(model.verts);
  return model;
}

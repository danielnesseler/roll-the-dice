// src/utils/cache.js
const memory = new Map();

export async function cachedText(url){
  if (memory.has(url)) return memory.get(url);
  const res = await fetch(url, { cache: 'no-cache' });
  const t = await res.text();
  memory.set(url, t);
  return t;
}

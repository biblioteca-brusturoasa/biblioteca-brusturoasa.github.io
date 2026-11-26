(function(root){'use strict';
function clean(u){const x=new URL(u);for(const k of [...x.searchParams.keys()])if(/^utm_/i.test(k)||['fbclid','gclid'].includes(k))x.searchParams.delete(k);return x.href}
function words(s){return String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]}
const ignored=new Set(['ce','cum','unde','care','este','sunt','sa','de','la','in','si','cu','pentru','o','un','imi','spune','despre','pot','cauta']);
function ranked(q,items){const ts=[...new Set(words(q).filter(t=>!ignored.has(t)))];return items.map(item=>{const a=words(item.title),b=words(item.body);return {item,score:ts.reduce((v,t)=>v+(a.includes(t)?6:a.some(x=>x.startsWith(t))?3:0)+(b.includes(t)?2:b.some(x=>x.startsWith(t))?1:0),0)}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,12)}
function relations(items){const tags=new Map();for(const x of items){for(const w of new Set(words(x.title).filter(w=>w.length>4&&!ignored.has(w)))){if(!tags.has(w))tags.set(w,[]);tags.get(w).push(x.title)}}return [...tags].filter(x=>x[1].length>1).sort((a,b)=>b[1].length-a[1].length).slice(0,30)}
function csv(rows){return ['Titlu,Stare,Inceput,Sfarsit',...rows.map(r=>[r.title,r.state,r.start,r.end].map(v=>'"'+String(v||'').replace(/^[=+@\-]/,"'$&").replace(/"/g,'""')+'"').join(','))].join('\r\n')}
const api={clean,ranked,relations,csv};if(typeof module!=='undefined')module.exports=api;else{root.NFA=api;const u=clean(location.href);if(u!==location.href)history.replaceState(null,'',u)}})(globalThis);

(function(root){'use strict';
const safe=s=>typeof s==='string'?s.slice(0,5000):'';
function items(data){if(!data||typeof data!=='object')return [];return ['books','news','events','resources','rubrics'].flatMap(k=>(Array.isArray(data[k])?data[k]:[]).slice(0,5000).filter(x=>x&&typeof x==='object'&&typeof x.title==='string').map(x=>({title:safe(x.title),body:[x.author,x.genre,x.isbn,x.body,x.description,x.date,x.end_date,x.place,x.institution].map(safe).filter(Boolean).join(' · '),url:root.NF.safeUrl(x.source||x.url||x.link),kind:k,start:safe(x.date),end:safe(x.end_date)})))}
function eventPhase(r,t){return root.NF.phase({kind:'event',start:r.start,end:r.end||r.start},t)}
function visible(data){return !!data&&typeof data==='object'&&data.maintenance?.enabled!==true;}
root.NFAdapter=Object.freeze({items,eventPhase,visible});
})(globalThis);

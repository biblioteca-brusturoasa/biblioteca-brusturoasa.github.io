(function(root){'use strict';
const norm=s=>String(s??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const tokens=s=>norm(s).match(/[\p{L}\p{N}]+/gu)||[];
const stop=new Set(['ce','cum','unde','care','este','sunt','sa','de','la','in','si','cu','pentru','o','un','imi','spune','despre','pot']);
function search(q,items){const ts=[...new Set(tokens(q).filter(t=>!stop.has(t)))];if(!ts.length)return [];return items.map(item=>({item,score:ts.reduce((n,t)=>n+(tokens(item.title).some(x=>x.startsWith(t))?3:0)+(tokens(item.body).some(x=>x.startsWith(t))?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,10).map(x=>x.item)}
function safeUrl(s){try{const u=new URL(s);return u.protocol==='https:'?u.href:''}catch{return ''}}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function phase(r,d=today()){if(r.kind!=='event')return '—';if(r.end&&d>r.end)return 'Finalizat';if(r.start&&d<r.start)return 'Planificat';return r.start?'Activ':'Fără dată'}
function approved(rows,d=today()){return rows.filter(r=>r.approved===true&&['page','event','knowledge'].includes(r.kind)&&(!r.publish||r.publish<=d)).map(({id,kind,title,body,url,start,end,publish})=>({id,kind,title,body,url:safeUrl(url),start,end,publish}))}
function fromCatalog(data){return ['books','events','news','resources','rubrics'].flatMap(k=>(Array.isArray(data[k])?data[k]:[]).filter(x=>x&&typeof x==='object').map(x=>({title:String(x.title||x.name||'Resursă'),body:[x.author,x.genre,x.isbn,x.body,x.description,x.date].filter(v=>typeof v==='string').join(' · '),url:safeUrl(x.source||x.url||x.link),kind:k}))) }
const api={norm,search,safeUrl,phase,approved,fromCatalog,today};if(typeof module!=='undefined')module.exports=api;else root.NF=api;
})(globalThis);

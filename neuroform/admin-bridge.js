(()=>{'use strict';let last='';const out=$('nf-admin-results');
const authorized=()=>isEditorAuthenticated&&cloud.hasSession;
function clear(){out.replaceChildren();last=''}
function research(q){clear();if(!authorized())return;const result=NFI.answer(q,NFAdapter.items(data));const hits=result.hits;for(const hit of hits){const item=hit.item;const a=h('article','notice');a.append(h('strong','',item.title),h('p','',item.body));if(item.url){const link=h('a','','Sursa');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';a.append(link)}out.append(a)}last=result.text;if(!hits.length)out.append(h('p','','Nu există potriviri în registrul curent.'));out.append(h('p','hint','Cercetare externă la cerere; rezultatele nu sunt verificate automat.'));for(const r of NFI.sources(q)){const a=h('a','btn',r.title);a.href=r.url;a.target='_blank';a.rel='noopener noreferrer';out.append(a)}}
$('nf-admin-form').onsubmit=e=>{e.preventDefault();research($('nf-admin-query').value.trim())};
$('nf-horizon').onclick=()=>{if(authorized()){$('nf-admin-query').value='parteneriate culturale biblioteci';research($('nf-admin-query').value)}};
function openEditor(section){if(!authorized())return;active=section;render();$('add-record').click()}
$('nf-genesis').onclick=()=>openEditor('rubrics');$('nf-chronos').onclick=()=>openEditor('events');
$('nf-admin-voice').onclick=()=>{if(!authorized())return;const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R)return notify('Dictarea nu este disponibilă.');if(!confirm('Vocea poate fi transmisă către serviciul browserului. Nu dictați date personale. Continuați?'))return;try{const r=new R();r.lang='ro-RO';r.onresult=e=>{if(authorized())$('nf-admin-query').value=e.results[0][0].transcript};r.onerror=()=>notify('Dictarea nu a reușit.');r.start()}catch{notify('Dictarea nu a pornit.')}};
$('nf-admin-speak').onclick=()=>{if(authorized())NFI.speak(last,msg=>{$('nf-admin-voice-status').textContent=msg})};
$('logout-button').addEventListener('click',()=>{clear();$('nf-admin-query').value='';window.speechSynthesis?.cancel()});
})();

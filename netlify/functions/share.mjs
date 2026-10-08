import { lambda, blobStore } from '../lib/fn.mjs';

// Idea 35: one list shared with family or a friend. The share code (32 hex chars made on his phone) is the only key and
// opens only that list. Items: {id, text, done, at, del?}; for each item the newest change wins, deletes stay as `del`.
// His phone uses /.netlify/functions/share?code=; others open https://<pc>.ts.net:8443/s/<code> (Tailscale Funnel, /s only).
const CODE = /^[a-f0-9]{32}$/;
const MAX = 300;

export function merge(old, incoming) {
  const by = new Map((old || []).map(i => [i.id, i]));
  for (const x of incoming || []) {
    if (!x || typeof x.id !== 'string' || !x.id || x.id.length > 40) continue;
    const i = { id: x.id, text: String(x.text || '').trim().slice(0, 120), done: !!x.done, at: Number(x.at) || 0, ...(x.del ? { del: true } : {}) };
    const have = by.get(i.id);
    if ((i.text || i.del) && (!have || i.at > have.at)) by.set(i.id, i);
  }
  const week = Date.now() - 7 * 864e5; // deletes are kept a week so a phone that was offline still hears about them
  return [...by.values()].filter(i => !i.del || i.at > week).slice(-MAX);
}

const handler = async (event) => {
  const q = event.queryStringParameters || {}, code = q.code || '';
  if (!CODE.test(code)) return json(400, { error: 'Bad code' });
  if (q.page) return { statusCode: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, body: PAGE };
  const store = blobStore('daytrack-share');
  const list = await store.get(code, { type: 'json' });
  if (event.httpMethod === 'GET') return list ? json(200, list) : json(404, { error: 'No such list' });
  if (event.httpMethod !== 'POST') return json(405, { error: 'GET or POST' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (_) { return json(400, { error: 'Bad JSON' }); }
  if (body.stop) { await store.setJSON(code, null); return json(200, { ok: true }); }
  // Only his phone creates a list (with a name); others can only change one that exists
  if (!list && !body.name) return json(404, { error: 'No such list' });
  const out = { name: String(body.name || list.name).trim().slice(0, 40), items: merge(list && list.items, body.items), at: Date.now() };
  await store.setJSON(code, out);
  return json(200, out);
};

const json = (statusCode, d) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(d) });
export default lambda(handler);

const PAGE = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shared list</title>
<style>body{font-family:system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;margin:0;background:#FAF5FF;color:#2E1065}main{max-width:520px;margin:0 auto;padding:18px 14px 40px}
h1{font-size:20px;margin:6px 0 14px}form{display:flex;gap:8px;margin-bottom:12px}input{flex:1;font:inherit;padding:11px 12px;border:1.5px solid #E9D5FF;border-radius:12px;background:white}
button{font:inherit;border:none;border-radius:12px;background:#7C3AED;color:white;padding:0 16px;cursor:pointer}.row{display:flex;align-items:center;gap:10px;background:white;border-radius:12px;padding:11px 12px;margin-bottom:6px}
.row span{flex:1;cursor:pointer}.done span{text-decoration:line-through;color:#7C5ABF}.x{background:none;color:#7C5ABF;padding:0 4px}.chk{width:22px;height:22px;border-radius:7px;border:2px solid #C4B5FD;display:flex;align-items:center;justify-content:center;font-size:13px;color:white;cursor:pointer}
.done .chk{background:#7C3AED;border-color:#7C3AED}small{color:#7C5ABF}</style></head>
<body><main><h1 id="name">…</h1><form id="f"><input id="in" placeholder="Add… / أضف…" autocomplete="off" dir="auto"><button>+</button></form><div id="list"></div><small id="st"></small></main>
<script>
const base=location.pathname.replace(/\\/$/,'')+'/data';let items=[];
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function show(d){if(!d||!d.items){document.getElementById('name').textContent='This list was unshared';items=[];render();return;}document.getElementById('name').textContent=d.name;document.title=d.name;items=d.items;render();}
function render(){const v=items.filter(i=>!i.del),l=[...v.filter(i=>!i.done),...v.filter(i=>i.done)];
document.getElementById('list').innerHTML=l.map(i=>'<div class="row'+(i.done?' done':'')+'"><div class="chk" onclick="tick(\\''+i.id+'\\')">'+(i.done?'✓':'')+'</div><span dir="auto" onclick="tick(\\''+i.id+'\\')">'+esc(i.text)+'</span><button class="x" onclick="del(\\''+i.id+'\\')">✕</button></div>').join('')||'<small>Nothing here yet</small>';}
async function send(ch){try{const r=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:ch})});show(r.ok?await r.json():null);}catch(e){document.getElementById('st').textContent='Offline, will retry';}}
async function pull(){try{const r=await fetch(base,{cache:'no-store'});show(r.ok?await r.json():null);document.getElementById('st').textContent='';}catch(e){document.getElementById('st').textContent='Offline';}}
function tick(id){const i=items.find(x=>x.id===id);if(!i)return;i.done=!i.done;i.at=Date.now();render();send([i]);}
function del(id){const i=items.find(x=>x.id===id);if(!i)return;i.del=true;i.at=Date.now();render();send([i]);}
document.getElementById('f').onsubmit=e=>{e.preventDefault();const inp=document.getElementById('in'),t=inp.value.trim();if(!t)return;inp.value='';const i={id:uid(),text:t,done:false,at:Date.now()};items.push(i);render();send([i]);};
pull();setInterval(()=>{if(!document.hidden)pull();},10000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull();});
</script></body></html>`;

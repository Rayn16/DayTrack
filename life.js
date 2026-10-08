// DayTrack, second round of ideas (2026-10-08): Ramadan, adhkar, Quran plan, spending, places, shared lists, routines,
// phone calendar, steps, phone time, quick tiles, Arabic, waking the PC, and the phone's side of Gwen's day across
// house / desktop / phone (her day, daily quest, planning the week, peeking into the house, our first year).
// Loaded after index.html's own script, so it uses its globals (tasks, lists, gwenCfg, save, sheet, ask, toDateStr…).

// Synced with the rest (sync data `life`); per-phone settings stay in dt_life_dev
let life={spend:[],quran:null,fasts:[],routines:[],places:[],adhkar:{on:false,done:{}},games:{won:0,lost:0,draw:0},yearShown:false};
let lifeDev={steps:false,cal:false,screen:''};
try{life={...life,...JSON.parse(localStorage.getItem('dt_life')||'{}')};lifeDev={...lifeDev,...JSON.parse(localStorage.getItem('dt_life_dev')||'{}')};}catch(e){}
const N=()=>window.DayTrackNative||null,has=f=>!!(N()&&N()[f]);
const lifeStore=()=>{try{localStorage.setItem('dt_life',JSON.stringify(life));}catch(e){}};
const lifeDevStore=()=>{try{localStorage.setItem('dt_life_dev',JSON.stringify(lifeDev));}catch(e){}};
function lifeSave(){lifeStore();save();}
// Called by index.html: sync data in and out, and after every save
window.lifeData=()=>life;
window.lifeApply=d=>{if(d&&typeof d==='object'){life={...life,...d};lifeStore();renderLife();}};
window.lifeReload=()=>{try{life={...life,...JSON.parse(localStorage.getItem('dt_life')||'{}')};}catch(e){}};
const addDays=(ds,n)=>{const d=new Date(ds+'T12:00:00');d.setDate(d.getDate()+n);return toDateStr(d);};
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes();};
const fmtLeft=m=>m>=60?`${Math.floor(m/60)}h ${m%60}m`:`${m}m`;
const btnS='border:none;border-radius:12px;padding:11px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;';
const head=t=>`<div style="font-size:17px;font-weight:700;text-align:center;margin-bottom:10px;color:var(--txt);">${t}</div>`;
// DayTrack.exe on the PC (phone: over Tailscale; the PC app: itself)
const lifeApi=(p,opts,ms)=>fetchT('/.netlify/functions/'+p,opts,ms||8000);
const lifePost=(p,body,ms)=>lifeApi(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:gwenCfg.key,...body})},ms);

// ── Idea 5: Ramadan ───────────────────────────────────────────────────────────
const HIJ=(()=>{try{return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'});}catch(e){return null;}})();
function hijri(ds){
  if(!HIJ)return{y:0,m:0,d:0};
  const p=Object.fromEntries(HIJ.formatToParts(new Date(ds+'T12:00:00Z')).map(x=>[x.type,x.value]));
  return{y:parseInt(p.year,10),m:Number(p.month),d:Number(p.day)};
}
function ramadanInfo(ds){
  const h=hijri(ds);
  if(h.m===9){let n=1;while(n<31&&hijri(addDays(ds,n)).m===9)n++;return{on:true,day:h.d,days:h.d+n-1,start:addDays(ds,1-h.d),end:addDays(ds,n-1)};}
  let n=1;while(n<400&&hijri(addDays(ds,n)).m!==9)n++;
  return{on:false,in:n,start:addDays(ds,n)};
}
function ramadanCard(){
  const tod=toDateStr(new Date()),r=ramadanInfo(tod);
  if(!r.on)return r.in<=14?`<div class="card life-card"><div style="font-size:14px;font-weight:700;">🌙 Ramadan starts in ${r.in} day${r.in>1?'s':''}</div><div style="font-size:12px;color:var(--sub);margin-top:4px;">${fmtDay(r.start)}. ${life.quran?'':'Set a Quran plan in Settings to finish a khatma in Ramadan.'}</div></div>`:'';
  const p=todayPrayers(),x=nowMin();
  let count='<div style="font-size:12px;color:var(--sub);">Turn on prayer times in Settings for the iftar and suhoor countdown.</div>';
  if(p){
    const fajr=hmMin(p.Fajr),mag=hmMin(p.Maghrib);
    const tomorrow=todayPrayers(addDays(tod,1));
    count=x<fajr?`<div class="rmd-big">Suhoor ends in ${fmtLeft(fajr-x)}</div><div class="rmd-sub">Fajr ${fmt12(p.Fajr)}</div>`
      :x<mag?`<div class="rmd-big">Iftar in ${fmtLeft(mag-x)}</div><div class="rmd-sub">Maghrib ${fmt12(p.Maghrib)}</div>`
      :`<div class="rmd-big">Suhoor ends in ${fmtLeft(1440-x+hmMin((tomorrow||p).Fajr))}</div><div class="rmd-sub">Fajr ${fmt12((tomorrow||p).Fajr)} · Taqabbal Allah 🤲</div>`;
  }
  const dots=[...Array(r.days)].map((_,i)=>{const ds=addDays(r.start,i),f=life.fasts.includes(ds);return`<button class="rmd-dot${f?' on':''}${ds===tod?' today':''}" ${ds>tod?'disabled':''} onclick="lifeFast('${ds}')" aria-label="Day ${i+1}${f?', fasted':''}">${i+1}</button>`;}).join('');
  const n=life.fasts.filter(d=>d>=r.start&&d<=r.end).length;
  return`<div class="card life-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-size:14px;font-weight:700;">🌙 Ramadan · day ${r.day}</span><span style="font-size:12px;color:var(--sub);">${n} fasted</span></div>${count}<div class="rmd-dots">${dots}</div></div>`;
}
function lifeFast(ds){life.fasts=life.fasts.includes(ds)?life.fasts.filter(d=>d!==ds):[...life.fasts,ds].slice(-400);lifeSave();renderLife();}

// ── Idea 31: adhkar after Fajr and Asr, and a tasbih counter ─────────────────
// Hisn al-Muslim; [text, count, which: m = morning only, e = evening only]
const ADHKAR=[
  ['الله لا إله إلا هو الحي القيوم لا تأخذه سنة ولا نوم له ما في السماوات وما في الأرض من ذا الذي يشفع عنده إلا بإذنه يعلم ما بين أيديهم وما خلفهم ولا يحيطون بشيء من علمه إلا بما شاء وسع كرسيه السماوات والأرض ولا يؤوده حفظهما وهو العلي العظيم',1],
  ['قل هو الله أحد ۝ الله الصمد ۝ لم يلد ولم يولد ۝ ولم يكن له كفوا أحد',3],
  ['قل أعوذ برب الفلق ۝ من شر ما خلق ۝ ومن شر غاسق إذا وقب ۝ ومن شر النفاثات في العقد ۝ ومن شر حاسد إذا حسد',3],
  ['قل أعوذ برب الناس ۝ ملك الناس ۝ إله الناس ۝ من شر الوسواس الخناس ۝ الذي يوسوس في صدور الناس ۝ من الجنة والناس',3],
  ['أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، رب أسألك خير ما في هذا اليوم وخير ما بعده، وأعوذ بك من شر ما في هذا اليوم وشر ما بعده، رب أعوذ بك من الكسل وسوء الكبر، رب أعوذ بك من عذاب في النار وعذاب في القبر',1,'m'],
  ['أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، رب أسألك خير ما في هذه الليلة وخير ما بعدها، وأعوذ بك من شر ما في هذه الليلة وشر ما بعدها، رب أعوذ بك من الكسل وسوء الكبر، رب أعوذ بك من عذاب في النار وعذاب في القبر',1,'e'],
  ['اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور',1,'m'],
  ['اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير',1,'e'],
  ['اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي، وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت',1],
  ['رضيت بالله ربا، وبالإسلام دينا، وبمحمد صلى الله عليه وسلم نبيا',3],
  ['اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري، لا إله إلا أنت. اللهم إني أعوذ بك من الكفر والفقر، وأعوذ بك من عذاب القبر، لا إله إلا أنت',3],
  ['بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم',3],
  ['أعوذ بكلمات الله التامات من شر ما خلق',3,'e'],
  ['يا حي يا قيوم برحمتك أستغيث، أصلح لي شأني كله، ولا تكلني إلى نفسي طرفة عين',1],
  ['حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم',7],
  ['لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير',10],
  ['سبحان الله وبحمده',100],
  ['أستغفر الله وأتوب إليه',100,'m'],
];
// Which adhkar are due now: morning from Fajr to Dhuhr, evening from Asr to Isha (rough hours without prayer times)
function adhkarNow(){
  const p=todayPrayers(),x=nowMin(),at=k=>p?hmMin(p[k]):{Fajr:240,Dhuhr:720,Asr:900,Isha:1200}[k];
  return x>=at('Fajr')&&x<at('Dhuhr')?'m':x>=at('Asr')&&x<at('Isha')?'e':null;
}
const adhkarDone=(w,ds)=>((life.adhkar.done||{})[ds||toDateStr(new Date())]||[]).includes(w);
let adhkarLeft=[],adhkarWhich='m';
function openAdhkar(w){
  adhkarWhich=w;adhkarLeft=ADHKAR.filter(a=>!a[2]||a[2]===w).map(a=>a[1]);
  renderAdhkar();
}
function renderAdhkar(){
  const list=ADHKAR.filter(a=>!a[2]||a[2]===adhkarWhich);
  sheet(head(adhkarWhich==='m'?'🌅 Morning adhkar':'🌇 Evening adhkar')+`<div style="font-size:12px;color:var(--sub);text-align:center;margin-bottom:10px;">Tap a card each time you say it</div>`
    +list.map((a,i)=>`<div class="dhikr${adhkarLeft[i]?'':' done'}" onclick="adhkarTap(${i})" translate="no"><div dir="rtl" lang="ar">${a[0]}</div><b>${adhkarLeft[i]?adhkarLeft[i]+' ×':'✓'}</b></div>`).join('')+closeBtn);
}
function adhkarTap(i){
  if(!adhkarLeft[i])return;adhkarLeft[i]--;if(navigator.vibrate)navigator.vibrate(8);
  const y=document.getElementById('dt-ov-body').scrollTop;renderAdhkar();document.getElementById('dt-ov-body').scrollTop=y;
  if(adhkarLeft.every(n=>!n)){
    const tod=toDateStr(new Date()),d=life.adhkar.done||{};
    d[tod]=[...new Set([...(d[tod]||[]),adhkarWhich])];life.adhkar.done=Object.fromEntries(Object.entries(d).filter(([k])=>k>=addDays(tod,-30)));
    lifeSave();renderLife();lifeQuestCheck('adhkar');
    showToast('🤲 Taqabbal Allah');if(gwenCfg.key)gwenBond(1);
  }
}
let tasbihN=0,tasbihWhat='سبحان الله';
function openTasbih(){
  sheet(head('📿 Tasbih')+`<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;" translate="no">${['سبحان الله','الحمد لله','الله أكبر','لا إله إلا الله','أستغفر الله'].map(t=>`<button class="rb${t===tasbihWhat?' on':''}" onclick="tasbihWhat='${t}';tasbihN=0;openTasbih()">${t}</button>`).join('')}</div>
    <button id="tasbih-btn" onclick="tasbihTap()" style="display:block;margin:0 auto;width:190px;height:190px;border-radius:50%;border:none;background:var(--pril);color:var(--pri);font-size:54px;font-weight:700;font-family:inherit;cursor:pointer;">${tasbihN}</button>
    <div style="text-align:center;font-size:13px;color:var(--sub);margin-top:10px;" dir="rtl" translate="no">${tasbihWhat}${tasbihN&&tasbihN%33===0?' · 33 ✓':''}</div>
    <button onclick="tasbihN=0;openTasbih()" style="width:100%;margin-top:12px;background:var(--inp);color:var(--sub);${btnS}">Reset</button>${closeBtn}`);
}
function tasbihTap(){tasbihN++;if(navigator.vibrate)navigator.vibrate(tasbihN%33===0?[30,60,30]:8);openTasbih();}
function adhkarCard(){
  if(!life.adhkar.on)return'';
  const w=adhkarNow();if(!w||adhkarDone(w))return'';
  return`<div class="card life-card" onclick="openAdhkar('${w}')" style="cursor:pointer;display:flex;align-items:center;gap:10px;"><span style="font-size:24px;">🤲</span><div style="flex:1;"><div style="font-size:14px;font-weight:700;">${w==='m'?'Morning':'Evening'} adhkar</div><div style="font-size:12px;color:var(--sub);">A few minutes with Allah's remembrance</div></div><span style="color:var(--pri);font-size:20px;">›</span></div>`;
}

// ── Idea 32: Quran plan (604 pages, Madinah mushaf) ──────────────────────────
const PAGES=604;
function quranTarget(){
  const q=life.quran,tod=toDateStr(new Date());if(!q)return 0;
  if(q.mode==='daily')return q.perDay;
  const read=(q.log||{})[tod]||0,days=Math.max(1,Math.round((new Date(q.by+'T12:00:00')-new Date(tod+'T12:00:00'))/864e5)+1);
  return Math.max(1,Math.ceil((PAGES-(q.page-read))/days));
}
function quranCard(){
  const q=life.quran;if(!q)return'';
  const tod=toDateStr(new Date()),read=(q.log||{})[tod]||0,target=quranTarget(),pct=Math.min(100,read/target*100);
  if(q.page>=PAGES)return`<div class="card life-card"><div style="font-size:14px;font-weight:700;">📖 Khatma done! Masha'Allah 🎉</div><button class="minibtn" style="margin-top:8px;" onclick="quranSetup()">Start a new plan</button></div>`;
  return`<div class="card life-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-size:14px;font-weight:700;">📖 Quran · page ${q.page} of ${PAGES}</span><button class="minibtn" onclick="quranSetup()">⋯</button></div>
    <div class="bar"><i style="width:${pct}%;${read>=target?'background:var(--grn);':''}"></i></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;"><span style="font-size:12px;color:var(--sub);">Today ${read} of ${target} page${target>1?'s':''}${q.mode==='khatma'?` · khatma by ${fmtDay(q.by)}`:''}</span>
    <span style="display:flex;gap:6px;"><button class="minibtn" onclick="quranRead(1)">+1</button><button class="minibtn" onclick="quranAsk()">+ pages</button></span></div></div>`;
}
function quranRead(n){
  const q=life.quran,tod=toDateStr(new Date());if(!q||!n)return;
  const before=(q.log||{})[tod]||0,target=quranTarget();
  n=Math.max(-before,Math.min(PAGES-q.page,n));
  q.page+=n;q.log={...(q.log||{}),[tod]:before+n};
  q.log=Object.fromEntries(Object.entries(q.log).filter(([d])=>d>=addDays(tod,-400)));
  lifeSave();renderLife();
  if(before<target&&before+n>=target){confetti();if(gwenCfg.key)gwenLine(q.page>=PAGES?'You finished the whole Quran! Masha\'Allah, I\'m so proud of you 💜':`Today's ${target} page${target>1?'s':''} done 💜 Masha'Allah`,'happy');}
}
async function quranAsk(){
  const v=(await ask('Which page did you get to?',`Now on page ${life.quran.page}`)||'').trim();if(!v)return;
  const n=parseInt(v.replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)),10);
  if(!(n>=1&&n<=PAGES))return showToast('A page from 1 to 604');
  quranRead(n-life.quran.page);
}
function quranSetup(){
  const q=life.quran||{mode:'daily',perDay:1,page:1,by:null,log:{}},tod=toDateStr(new Date()),r=ramadanInfo(tod);
  const ramEnd=r.on?r.end:r.in<=45?addDays(r.start,29):null;
  sheet(head('📖 Quran plan')+`<div class="sl" style="margin-top:0;">I'm on page</div><input class="inp" id="qp-page" type="number" min="1" max="604" value="${q.page}">
    <div class="sl">Goal</div><div style="display:flex;gap:8px;margin-bottom:8px;"><button class="rb${q.mode==='daily'?' on':''}" id="qp-d" onclick="qpMode('daily')">Pages a day</button><button class="rb${q.mode==='khatma'?' on':''}" id="qp-k" onclick="qpMode('khatma')">Finish by a date</button></div>
    <div id="qp-daily" style="display:${q.mode==='daily'?'block':'none'};"><input class="inp" id="qp-per" type="number" min="1" max="60" value="${q.perDay||1}"><div style="font-size:11px;color:var(--sub);margin-top:4px;">20 pages a day is a khatma a month.</div></div>
    <div id="qp-khatma" style="display:${q.mode==='khatma'?'block':'none'};"><input class="inp" id="qp-by" type="date" min="${addDays(tod,1)}" value="${q.by||ramEnd||addDays(tod,30)}">${ramEnd?`<button class="minibtn" style="margin-top:6px;" onclick="document.getElementById('qp-by').value='${ramEnd}'">🌙 By the end of Ramadan</button>`:''}</div>
    <button onclick="quranSave()" style="width:100%;margin-top:12px;background:var(--pri);color:white;${btnS}">Save</button>
    ${life.quran?`<button class="mi" style="color:#EF4444;margin-top:4px;" onclick="if(confirm('Remove the Quran plan?')){life.quran=null;lifeSave();renderLife();closeOv('dt-ov');}">🗑️ Remove plan</button>`:''}${closeBtn}`);
  window._qpMode=q.mode;
}
function qpMode(m){window._qpMode=m;['d','k'].forEach(k=>document.getElementById('qp-'+k).classList.toggle('on',(k==='d')===(m==='daily')));document.getElementById('qp-daily').style.display=m==='daily'?'block':'none';document.getElementById('qp-khatma').style.display=m==='khatma'?'block':'none';}
function quranSave(){
  const page=Math.max(1,Math.min(PAGES,parseInt(document.getElementById('qp-page').value)||1)),by=document.getElementById('qp-by').value;
  if(window._qpMode==='khatma'&&!(by>toDateStr(new Date())))return showToast('Pick a date after today');
  life.quran={mode:window._qpMode,perDay:Math.max(1,parseInt(document.getElementById('qp-per').value)||1),by:window._qpMode==='khatma'?by:null,page,log:(life.quran||{}).log||{}};
  lifeSave();renderLife();closeOv('dt-ov');showToast('📖 Quran plan saved');
}

// ── Idea 33: spending in SAR ──────────────────────────────────────────────────
const SPEND_CATS=[
  ['🍔 Food',/coffee|cafe|caf[eé]|starbucks|barns|lunch|dinner|breakfast|restaurant|burger|pizza|shawarma|mcdonald|kfc|albaik|al baik|snack|food|\btea\b|juice|dunkin|hungerstation|jahez|قهوة|غدا|عشا|فطور|مطعم|شاورما|برجر|بيتزا|البيك|جاهز/i],
  ['🛒 Groceries',/grocer|supermarket|market|panda|danube|tamimi|othaim|lulu|carrefour|bread|milk|eggs|بقالة|سوبرماركت|بنده|الدانوب|العثيم|كارفور/i],
  ['🚗 Transport',/fuel|gas|petrol|benzene|uber|careem|taxi|parking|car wash|bus|metro|بنزين|وقود|اوبر|كريم|موقف/i],
  ['🎮 Games',/steam|game|playstation|psn|xbox|valorant|riot|skin|nintendo|epic|lol|league|battle pass|v-?bucks|robux|لعبة|العاب|ستيم/i],
  ['📱 Bills',/bill|stc|mobily|zain|internet|electric|water|rent|phone|recharge|subscription|netflix|spotify|youtube|shahid|فاتورة|كهرباء|ايجار|اشتراك|شحن/i],
  ['🛍 Shopping',/amazon|noon|shein|clothes|shirt|shoes|jacket|nike|adidas|ikea|jarir|extra|ملابس|حذاء|نون|امازون|جرير/i],
  ['💊 Health',/pharmacy|nahdi|dawaa|doctor|clinic|medicine|gym|dentist|صيدلية|دكتور|دواء|نادي/i],
  ['🎁 Gifts',/gift|present|هدية/i],
];
const arDigits=s=>String(s).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g,'.');
function parseSpend(text){
  const s=arDigits(text).trim(),m=[...s.matchAll(/(\d+(?:[.,]\d{1,2})?)/g)].pop();
  if(!m)return null;
  const amt=Math.round(parseFloat(m[1].replace(',','.'))*100)/100;if(!(amt>0&&amt<1e6))return null;
  let label=(s.slice(0,m.index)+' '+s.slice(m.index+m[1].length)).replace(/\b(sar|sr|riyals?|rs)\b|ريال|ر\.س/gi,' ').replace(/\s+/g,' ').trim();
  const tag=label.match(/#(\S+)/);label=label.replace(/#\S+/,'').trim()||'Something';
  const cat=(tag&&SPEND_CATS.find(([c])=>c.toLowerCase().includes(tag[1].toLowerCase())))||SPEND_CATS.find(([,re])=>re.test(label));
  return{amt,label:label.slice(0,40),cat:cat?cat[0]:'📦 Other'};
}
const spendSum=(from,to)=>{const cats={};let total=0;for(const e of life.spend)if(e.d>=from&&e.d<=to){total+=e.amt;cats[e.cat]=(cats[e.cat]||0)+e.amt;}return{total:Math.round(total),cats:Object.fromEntries(Object.entries(cats).map(([k,v])=>[k,Math.round(v)]).sort((a,b)=>b[1]-a[1]))};};
function spendMonths(){
  const d=new Date(),tod=toDateStr(d),m0=tod.slice(0,8)+'01',pm=new Date(d.getFullYear(),d.getMonth()-1,1),p0=toDateStr(pm);
  const pSame=toDateStr(new Date(pm.getFullYear(),pm.getMonth(),Math.min(d.getDate(),new Date(pm.getFullYear(),pm.getMonth()+1,0).getDate())));
  return{now:spendSum(m0,tod),lastSoFar:spendSum(p0,pSame),last:spendSum(p0,addDays(m0,-1))};
}
function addSpend(text,quiet){
  const e=parseSpend(text);if(!e){if(!quiet)showToast('Type what and how much, like "coffee 18"');return null;}
  life.spend=[...life.spend,{id:uid(),d:toDateStr(new Date()),...e}].slice(-3000);lifeSave();renderSpend();
  if(!quiet)showToast(`💰 ${e.label} · ${e.amt} SAR · ${e.cat}`);
  return e;
}
function renderSpend(){
  const el=document.getElementById('spend-card');if(!el)return;
  const s=spendMonths(),max=Math.max(1,...Object.values(s.now.cats)),diff=s.now.total-s.lastSoFar.total;
  const recent=[...life.spend].reverse().slice(0,5);
  el.innerHTML=`<div class="cl">💰 Spending · SAR</div>
    <div style="display:flex;gap:8px;margin-bottom:10px;"><input class="inp" id="sp-in" placeholder="coffee 18" style="flex:1;" onkeydown="if(event.key==='Enter'){event.preventDefault();spendAdd();}"><button onclick="spendAdd()" style="background:var(--pri);color:white;border:none;border-radius:12px;padding:0 16px;font-size:18px;cursor:pointer;">+</button></div>
    <div style="display:flex;align-items:baseline;gap:8px;"><span style="font-size:24px;font-weight:700;">${s.now.total.toLocaleString('en-US')}</span><span style="font-size:12px;color:var(--sub);">this month${s.lastSoFar.total?` · ${diff>0?'▲':'▼'} ${Math.abs(diff).toLocaleString('en-US')} vs last month so far`:''}</span></div>
    ${Object.entries(s.now.cats).map(([c,v])=>`<div style="display:flex;align-items:center;gap:8px;margin-top:7px;font-size:12px;"><span style="width:96px;flex-shrink:0;">${c}</span><div class="bar" style="flex:1;"><i style="width:${v/max*100}%;"></i></div><span style="width:46px;text-align:right;color:var(--sub);">${v}</span></div>`).join('')}
    ${recent.length?`<div style="margin-top:10px;border-top:1px solid var(--brd);">${recent.map(e=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 0;font-size:13px;border-bottom:1px solid var(--brd);"><span>${e.cat.split(' ')[0]}</span><span style="flex:1;">${esc(e.label)}</span><span style="color:var(--sub);font-size:11px;">${fmtDay(e.d).replace(/^\w+, /,'')}</span><b>${e.amt}</b><button onclick="spendDel('${e.id}')" aria-label="Delete" style="background:none;border:none;color:var(--sub);cursor:pointer;">✕</button></div>`).join('')}</div>`
      :'<div style="font-size:12px;color:var(--sub);margin-top:8px;">Type what you spent, like "coffee 18" or "fuel 90". No bank link, just what you type. Gwen notices trends.</div>'}`;
}
function spendAdd(){const i=document.getElementById('sp-in');if(addSpend(i.value)){i.value='';i.focus();}}
function spendDel(id){life.spend=life.spend.filter(e=>e.id!==id);lifeSave();renderSpend();}
function spendLines(){
  if(!life.spend.length)return'';
  const s=spendMonths(),c=o=>Object.entries(o.cats).map(([k,v])=>`${k.replace(/^\S+ /,'')} ${v}`).join(', ');
  return`His spending this month so far: ${s.now.total} SAR (${c(s.now)||'nothing'}). Same point last month: ${s.lastSoFar.total} SAR (${c(s.lastSoFar)||'nothing'}). If something stands out (a category way up), you can point it out kindly, now and then, never preachy.
If he tells you he spent money (like "I paid 30 for lunch"), put this on its own line (the app logs it and hides the line):\nSPEND: <what> | <amount in SAR>`;
}
// The week's numbers for the server (Gwen's Sunday recap)
function spendWeek(){if(!life.spend.length)return null;const tod=toDateStr(new Date());return{week:spendSum(addDays(tod,-6),tod),lastWeek:spendSum(addDays(tod,-13),addDays(tod,-7))};}

// ── Idea 34: places (remind me when I get home / at the supermarket) ─────────
let dPlace=null;
const isShop=n=>/grocer|super|market|panda|danube|tamimi|othaim|lulu|carrefour|بقالة|سوبر/i.test(n);
function placesSection(){
  if(!has('places'))return'';
  return`<div class="card"><div class="cl">📍 Places</div><div style="font-size:12px;color:var(--sub);margin-bottom:8px;">Save places like Home or the supermarket, then give a task a place: you get the reminder when you get there. At a supermarket you also see your grocery list.</div>
    ${life.places.map(p=>`<div class="row" style="cursor:default;"><span style="flex:1;font-size:14px;">${isShop(p.name)?'🛒':/home|بيت|منزل/i.test(p.name)?'🏠':'📍'} ${esc(p.name)}</span><button onclick="placeDel('${p.id}')" style="background:none;border:none;color:var(--sub);cursor:pointer;" aria-label="Delete">✕</button></div>`).join('')}
    <button onclick="placeAdd()" style="width:100%;margin-top:8px;background:var(--pril);color:var(--pri);${btnS}">📍 Save where I am now</button>
    ${life.places.length&&!N().hasPerm('locationAlways')?`<div style="font-size:11px;color:#F97316;margin-top:6px;">Reminders need location "Allow all the time". <a href="#" onclick="N().askPerm('locationAlways');return false;">Allow</a></div>`:''}</div>`;
}
function placeAdd(){
  if(!N().hasPerm('location')){window.__dtPerm2=(w,ok)=>{if(ok)placeAdd();};N().askPerm('location');return;}
  showToast('📍 Finding where you are…');
  window.__dtHere=async j=>{
    let pos=null;try{pos=typeof j==='string'?JSON.parse(j):j;}catch(e){}
    if(!pos)return showToast('Couldn\'t get your location, try outside or with Wi-Fi on');
    const name=((await ask('What do you call this place?','Home, Panda, Gym…'))||'').trim().slice(0,30);if(!name)return;
    life.places=[...life.places,{id:uid(),name,lat:pos.lat,lon:pos.lon}];lifeSave();renderLifeSettings();
    if(!N().hasPerm('locationAlways')){showToast('Next: allow location "all the time" so reminders work in the background');setTimeout(()=>N().askPerm('locationAlways'),1500);}
    else showToast(`📍 Saved ${name}`);
  };
  N().here();
}
function placeDel(id){if(!confirm('Remove this place?'))return;life.places=life.places.filter(p=>p.id!==id);tasks.forEach(t=>{if(t.place===id)t.place=null;});lifeSave();renderLifeSettings();}
// The add/edit task sheet: pick a place
window.lifeTaskSheet=t=>{
  dPlace=t&&t.place||null;
  const el=document.getElementById('place-wrap');if(!el)return;
  if(!life.places.length){el.innerHTML='';return;}
  el.innerHTML=`<div class="sl">Remind me at a place 📍</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">${[{id:null,name:'Off'},...life.places].map(p=>`<button class="rb${dPlace===p.id?' on':''}" onclick="dPlace=${p.id?`'${p.id}'`:'null'};lifeTaskSheet({place:dPlace})">${esc(p.name)}</button>`).join('')}</div>`;
};
window.lifePlace=()=>dPlace;
// "...when I get home", "...when I'm at Panda": a saved place's name in a spoken task
window.lifePlaceFromText=text=>{
  const names=life.places.map(p=>p.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');if(!names)return{text,place:null};
  const m=text.match(new RegExp(`\\s*\\b(?:when i(?: get|'m| am| arrive)?(?: back)?(?: to| at)?|at)\\s+(?:the\\s+)?(${names})\\b`,'i'));
  if(!m)return{text,place:null};
  return{text:text.replace(m[0],' ').replace(/\s+/g,' ').trim(),place:life.places.find(p=>p.name.toLowerCase()===m[1].toLowerCase()).id};
};
let lastPlaces='';
function syncPlaces(){
  if(!has('places'))return;
  const tod=toDateStr(new Date()),dow=new Date().getDay(),groc=lists.find(l=>/grocer|بقال/i.test(l.name));
  const out=life.places.map(p=>{
    const due=tasks.filter(t=>t.place===p.id&&!t.done.includes(tod)&&(t.recurring?isTodayTask(t,tod,dow):!t.done.length));
    const items=isShop(p.name)&&groc?groc.items.filter(i=>!i.done).map(i=>i.text):[];
    if(!due.length&&!items.length)return null;
    return{id:p.id,lat:p.lat,lon:p.lon,radius:150,title:`📍 ${p.name}`,body:[...due.map(t=>t.name),...(items.length?[`🛒 ${items.slice(0,12).join(', ')}`]:[])].join(' · ').slice(0,400)};
  }).filter(Boolean),j=JSON.stringify(out);
  if(j!==lastPlaces){lastPlaces=j;try{N().places(j);}catch(e){}}
}

// ── Idea 35: share one list with family or a friend ──────────────────────────
// The list keeps its share code (l.share); what the server last had (shareSeen) tells what changed here since
let shareSeen={};try{shareSeen=JSON.parse(localStorage.getItem('dt_share_seen')||'{}');}catch(e){}
const shareLink=code=>{const h=(gwenCfg.pc||'').trim().replace(/\/+$/,'').replace(/:\d+$/,'');return h.startsWith('https://')?`${h}:8443/s/${code}`:'';};
window.lifeShareBtn=l=>`<button class="mi" style="flex:1;" onclick="shareList('${l.id}')">${l.share?'👥 Shared':'🔗 Share'}</button>`;
async function shareList(id){
  const l=lists.find(x=>x.id===id);if(!l)return;
  if(!l.share){
    if(!gwenCfg.key)return showToast('Add your PC address and Gwen key in Settings first');
    if(!confirm(`Share "${l.name}" with someone? They get a link that opens only this list.`))return;
    l.share=[...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(!await pushShare(l,true)){l.share=null;return showToast('❌ Your PC needs to be on to share a list');}
    save();
  }
  const link=shareLink(l.share);
  sheet(head(`👥 ${esc(l.name)}`)+`<div style="font-size:13px;color:var(--sub);text-align:center;margin-bottom:10px;line-height:1.5;">Anyone with this link can see and change this list (only this one), no app needed. Changes show up on both phones.</div>
    ${link?`<div style="font-family:ui-monospace,monospace;font-size:12px;background:var(--inp);border-radius:10px;padding:10px;word-break:break-all;user-select:all;margin-bottom:10px;">${esc(link)}</div>
    <div style="display:flex;gap:8px;"><button onclick="shareSend('${l.id}')" style="flex:1;background:var(--pri);color:white;${btnS}">📤 Send link</button><button onclick="navigator.clipboard.writeText('${link}').then(()=>showToast('📋 Copied'))" style="flex:1;background:var(--pril);color:var(--pri);${btnS}">📋 Copy</button></div>`
    :'<div style="font-size:12px;color:#F97316;text-align:center;">Set your PC address (https://…ts.net) in Settings to get the link.</div>'}
    <button class="mi" style="color:#EF4444;margin-top:6px;" onclick="unshareList('${l.id}')">Stop sharing</button>
    <button onclick="openList('${l.id}')" style="width:100%;margin-top:8px;background:none;border:none;color:var(--sub);font-size:13px;cursor:pointer;font-family:inherit;padding:8px;">‹ Back to the list</button>`);
}
function shareSend(id){const l=lists.find(x=>x.id===id),link=l&&shareLink(l.share);if(!link)return;if(navigator.share)navigator.share({title:l.name,text:`${l.name} (shared list)`,url:link}).catch(()=>{});else navigator.clipboard.writeText(link).then(()=>showToast('📋 Copied'));}
async function unshareList(id){
  const l=lists.find(x=>x.id===id);if(!l||!confirm('Stop sharing? The link stops working; the list stays here.'))return;
  try{await lifeApi('share?code='+l.share,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stop:true})});}catch(e){}
  delete shareSeen[l.share];l.share=null;save();openList(id);showToast('Not shared anymore');
}
// Send what changed here, take what changed there
async function pushShare(l,create){
  const seen=shareSeen[l.share]||{},now=Date.now(),changes=[];
  for(const i of l.items){const s=seen[i.id];if(!s||s.text!==i.text||!!s.done!==!!i.done)changes.push({id:i.id,text:i.text,done:!!i.done,at:now});}
  for(const id of Object.keys(seen))if(!l.items.some(i=>i.id===id))changes.push({id,del:true,at:now});
  try{
    const r=await lifeApi('share?code='+l.share,changes.length||create?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...(create?{name:l.name}:{}),items:changes})}:{},8000);
    if(r.status===404&&!create){l.share=null;save();return false;} // unshared somewhere else
    if(!r.ok)return false;
    const d=await r.json(),live=d.items.filter(i=>!i.del),before=JSON.stringify(l.items);
    l.items=live.map(i=>({id:i.id,text:i.text,done:!!i.done}));
    shareSeen[l.share]=Object.fromEntries(live.map(i=>[i.id,{text:i.text,done:!!i.done}]));
    try{localStorage.setItem('dt_share_seen',JSON.stringify(shareSeen));}catch(e){}
    return JSON.stringify(l.items)!==before?'changed':true;
  }catch(e){return false;}
}
let sharing=false;
async function syncShares(){
  if(sharing||!gwenCfg.key)return;sharing=true;
  let changed=false;
  for(const l of lists.filter(x=>x.share))if(await pushShare(l)==='changed')changed=true;
  sharing=false;
  if(changed){writeLocal();queueSync();renderLists();const ov=document.getElementById('dt-ov-body'),open=lists.find(l=>ov&&ov.querySelector(`[onclick*="addListItem('${l.id}')"]`));if(open&&document.getElementById('dt-ov').classList.contains('on'))openList(open.id);}
}
let shareTimer;
const queueShare=()=>{if(!lists.some(l=>l.share))return;clearTimeout(shareTimer);shareTimer=setTimeout(syncShares,1200);};

// ── Idea 36: routines, a set of tasks added with one tap ─────────────────────
function routinesCard(){
  return`<div class="card life-card">${cardHead('⚡ Routines','<button class="minibtn" onclick="editRoutine()">+ New</button>')}
    ${life.routines.length?`<div style="display:flex;flex-wrap:wrap;gap:8px;">${life.routines.map(r=>`<span class="routine"><button onclick="runRoutine('${r.id}')">${esc(r.name)} <small>${r.items.length}</small></button><button onclick="editRoutine('${r.id}')" aria-label="Edit ${esc(r.name)}">⋯</button></span>`).join('')}</div>`
      :'<div style="font-size:12px;color:var(--sub);">Make a set once, like "Gym day" or "Before bed", then add all its tasks with one tap.</div>'}</div>`;
}
function editRoutine(id){
  const r=life.routines.find(x=>x.id===id)||{id:null,name:'',items:[]};
  sheet(head(r.id?'⚡ Edit routine':'⚡ New routine')+`<div class="sl" style="margin-top:0;">Name</div><input class="inp" id="rt-name" maxlength="30" placeholder="Gym day" value="${esc(r.name)}">
    <div class="sl">Tasks, one per line (a time works too: "protein shake at 7pm")</div><textarea class="inp" id="rt-items" style="min-height:130px;" placeholder="Pack gym bag&#10;Gym at 6pm&#10;Protein shake at 7:30pm&#10;Stretch">${esc(r.items.join('\n'))}</textarea>
    <button onclick="saveRoutine(${r.id?`'${r.id}'`:'null'})" style="width:100%;margin-top:12px;background:var(--pri);color:white;${btnS}">Save</button>
    ${r.id?`<button class="mi" style="color:#EF4444;margin-top:4px;" onclick="if(confirm('Delete this routine?')){life.routines=life.routines.filter(x=>x.id!=='${r.id}');lifeSave();renderLife();closeOv('dt-ov');}">🗑️ Delete routine</button>`:''}${closeBtn}`);
}
function saveRoutine(id){
  const name=document.getElementById('rt-name').value.trim().slice(0,30),items=document.getElementById('rt-items').value.split('\n').map(s=>s.trim().slice(0,80)).filter(Boolean).slice(0,20);
  if(!name||!items.length)return showToast('Give it a name and at least one task');
  if(id){const r=life.routines.find(x=>x.id===id);r.name=name;r.items=items;}else life.routines.push({id:uid(),name,items});
  lifeSave();renderLife();closeOv('dt-ov');
}
function runRoutine(id){
  const r=life.routines.find(x=>x.id===id);if(!r)return;
  const tod=toDateStr(new Date());let n=0;
  for(const line of r.items){
    const p=parseSpokenTask(line);
    if(tasks.some(t=>!t.recurring&&!t.done.length&&t.name===p.name&&(t.date||tod)===(p.date||tod)))continue; // already on the list
    tasks.push({id:uid(),name:p.name.slice(0,80),notes:`From ${r.name}`,icon:'⚡',iconType:'emoji',recurring:false,days:[],done:[],date:p.date,priority:'none',notifStyle:'default',showInCal:true,
      createdAt:tod,subtasks:[],reminder:p.time?{type:'time',time:p.time}:null,reminderLastFired:null,reminded:[]});n++;
  }
  save();renderTaskList();showToast(n?`⚡ ${r.name}: added ${n} task${n>1?'s':''}`:`⚡ ${r.name} is already on your list`);
}

// ── Idea 37: the phone's calendar ────────────────────────────────────────────
let calCache={at:0,from:'',events:[]};
function phoneEvents(from,days){
  if(!lifeDev.cal||!has('calendar'))return[];
  const to=addDays(from,days);
  if(Date.now()-calCache.at>5*60e3||calCache.from>from||calCache.to<to){
    try{const a=new Date(addDays(from,-7)+'T00:00:00').getTime(),b=new Date(addDays(from,days+21)+'T00:00:00').getTime();calCache={at:Date.now(),from:addDays(from,-7),to:addDays(from,days+21),events:JSON.parse(N().calendar(a,b)||'[]')};}catch(e){calCache={at:Date.now(),from,to,events:[]};}
  }
  const a=new Date(from+'T00:00:00').getTime(),b=new Date(to+'T00:00:00').getTime();
  return calCache.events.filter(e=>e.end>a&&e.start<b);
}
const evTime=e=>e.allDay?'all day':fmt12(`${pad(new Date(e.start).getHours())}:${pad(new Date(e.start).getMinutes())}`);
const evOn=ds=>phoneEvents(ds,1).filter(e=>!e.allDay||toDateStr(new Date(e.start+12*3600e3))===ds);
window.lifeDayEvents=ds=>evOn(ds).map(e=>`<span class="wk-chip fixed ev">📆 ${esc(e.title)} · ${evTime(e)}</span>`).join('');
async function toggleCal(){
  if(lifeDev.cal){lifeDev.cal=false;lifeDevStore();return renderLifeSettings();}
  if(!N().hasPerm('calendar')){window.__dtPerm2=(w,ok)=>{if(w==='calendar'&&ok)toggleCal();else if(w==='calendar')showToast('DayTrack needs calendar access for this');};N().askPerm('calendar');return;}
  lifeDev.cal=true;calCache.at=0;lifeDevStore();renderLifeSettings();showToast('📆 Your calendar shows in the Week view now');
}

// ── Idea 38: steps (the phone's step counter, same one Samsung Health reads) ─
const STEP_GOAL=6000;
function stepTask(){return tasks.find(t=>t.steps);}
async function toggleSteps(){
  if(lifeDev.steps){lifeDev.steps=false;lifeDevStore();return renderLifeSettings();}
  if(!N().hasPerm('steps')){window.__dtPerm2=(w,ok)=>{if(w==='steps'&&ok)toggleSteps();else if(w==='steps')showToast('DayTrack needs "Physical activity" access to count steps');};N().askPerm('steps');return;}
  lifeDev.steps=true;lifeDevStore();
  if(!stepTask())tasks.push({id:uid(),name:'Walk',notes:'Counted from your phone\'s steps',icon:'🚶',iconType:'emoji',recurring:true,days:[],done:[],date:null,priority:'none',notifStyle:'default',showInCal:true,
    createdAt:toDateStr(new Date()),subtasks:[],reminder:null,reminderLastFired:null,reminded:[],count:{target:STEP_GOAL,unit:'steps'},steps:true});
  save();renderLifeSettings();readSteps();showToast(`🚶 Steps on: a daily "Walk" habit, goal ${STEP_GOAL.toLocaleString('en-US')} (edit it to change)`);
}
let stepsToday=null;
function readSteps(){
  if(!lifeDev.steps||!has('steps'))return;
  let s=null;try{s=JSON.parse(N().steps()||'null');}catch(e){}
  const t=stepTask();if(!s||!t||!t.count)return;
  stepsToday=s.today;
  const tod=toDateStr(new Date());let changed=false;const wasDone=t.done.includes(tod);
  for(const[d,n]of Object.entries({...(s.days||{}),[tod]:s.today}))if(d>=(t.createdAt||tod)&&d<=tod&&countOf(t,d)!==Math.min(n,t.count.target)){setCount(t,d,n);changed=true;}
  if(!changed)return;
  updateStreakAfterCheck();save();renderTaskList();
  if(!wasDone&&t.done.includes(tod)&&gwenCfg.key)gwenLine(`${s.today.toLocaleString('en-US')} steps today! Look at you go 🚶💜`,'happy');
}

// ── Idea 39: phone-time check-in (once a day, from Gwen) ─────────────────────
async function toggleScreen(){
  if(lifeDev.screen){lifeDev.screen='';lifeDevStore();try{N().setScreenCheckin('','');}catch(e){}return renderLifeSettings();}
  if(!gwenCfg.key)return showToast('Add your Gwen key first');
  if(!N().hasPerm('usage')){window.__dtPerm2=(w,ok)=>{if(w==='usage'&&ok)toggleScreen();};showToast('Turn on "Usage access" for DayTrack, then come back');N().askPerm('usage');return;}
  lifeDev.screen='21:00';lifeDevStore();N().setScreenCheckin(lifeDev.screen,gwenCfg.key);renderLifeSettings();showToast('📱 Gwen checks in on your phone time at 9 PM');
}
function setScreenTime(v){if(!v)return;lifeDev.screen=v;lifeDevStore();try{N().setScreenCheckin(v,gwenCfg.key);}catch(e){}}

// ── Idea 40: quick tiles in the swipe-down panel ─────────────────────────────
window.dtTile=a=>{if(a==='add'){switchTab('tasks');openAddTask();}else if(a==='gwen')switchTab('gwen');};

// ── Idea 41: Arabic ───────────────────────────────────────────────────────────
function setLang(l){try{if(l==='ar')localStorage.setItem('dt_lang','ar');else localStorage.removeItem('dt_lang');}catch(e){}location.reload();}
const lang=()=>{try{return localStorage.getItem('dt_lang')||'en';}catch(e){return'en';}};

// ── Idea 30: turn the PC on from the phone (Wake-on-LAN), then start Gwen ────
window.lifeWakeBtn=()=>has('wol')&&gwenCfg.mac?`<button onclick="wakePc()" style="width:100%;margin-top:8px;background:var(--pri);color:white;${btnS}">⚡ Turn on my PC</button><div style="font-size:11px;color:var(--sub);text-align:center;margin-top:6px;">Works on your home Wi-Fi.</div>`:'';
window.lifePcSeen=st=>{if(st&&st.mac&&st.mac!==gwenCfg.mac){gwenCfg.mac=st.mac;try{localStorage.setItem('dt_gwen_cfg',JSON.stringify(gwenCfg));}catch(e){}}};
async function wakePc(){
  if(!N().onWifi())return showToast('Connect to your home Wi-Fi first');
  if(!N().wol(gwenCfg.mac))return showToast('❌ Couldn\'t send the wake-up');
  const step=t=>sheet(head('⚡ Turning on your PC')+`<div style="text-align:center;color:var(--sub);font-size:13px;padding:10px;line-height:1.6;">${t}</div>`+closeBtn);
  step('Sent the wake-up. Waiting for Windows and DayTrack to start (up to 3 minutes)…');
  const t0=Date.now();let st=null;
  while(Date.now()-t0<180e3){
    await new Promise(ok=>setTimeout(ok,5000));
    if(!document.getElementById('dt-ov').classList.contains('on'))return; // closed the sheet
    if(Date.now()-t0<60e3&&(Date.now()-t0)%30e3<5000)N().wol(gwenCfg.mac); // send it again, in case the first one was missed
    try{const r=await fetchT('/.netlify/functions/pc?key='+encodeURIComponent(gwenCfg.key),{},4000);if(r.ok){st=await r.json();break;}}catch(e){}
  }
  if(!st)return step('😴 Your PC didn\'t come on. Wake-on-LAN may still need switching on (in the BIOS and the network card settings), or Windows is waiting at the sign-in screen.');
  lifePcSeen(st);
  if(st.gwen)return step('✅ Your PC is on and Gwen is already up 💜');
  step('✅ Your PC is on. Starting Gwen…');
  try{const r=await fetchT('/.netlify/functions/pc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:gwenCfg.key,action:'start'})},10000);if(!r.ok)throw 0;}
  catch(e){return step('✅ Your PC is on, but Gwen didn\'t start. Try ▶️ Start Gwen in the PC sheet.');}
  step('✅ Your PC is on and Gwen is starting 💜 Give her a minute.');
  setTimeout(()=>{g3.ping=null;gwen3d();},60e3);
}

// ── Ideas 1, 2, 4: her house as the phone sees it (DayTrack.exe GET /api/house) ─
let house=null;
async function pullHouse(){
  if(!gwenCfg.key||(window.DayTrackNative&&!gwenCfg.pc.trim()))return;
  try{const r=await fetchT('/.netlify/functions/house?from=phone&key='+encodeURIComponent(gwenCfg.key),{},6000);if(!r.ok)return;house={...(await r.json()),at:Date.now()};}catch(e){return;}
  // Idea 1: the same outfit everywhere (the house names them; the phone has the ones her PC gave it)
  const o=house.outfit&&house.outfit.by!=='phone'&&house.outfit.outfit;
  if(o&&Date.now()-house.outfit.at<12*3600e3){const mine=o.toLowerCase()==='classic'?'':gwenOutfits().find(x=>x.toLowerCase()===o.toLowerCase());if(mine!==undefined&&(gwenCfg.outfit||'')!==mine)gwenWear(mine);}
  questFromHouse();renderLife();
}
window.lifeOutfit=o=>{if(gwenCfg.key)lifePost('house',{event:'outfit',outfit:o||'Classic',by:'phone'}).catch(()=>{});};
const houseNow=()=>house&&house.now&&house.now.open!==false&&house.now.activity&&Date.now()-house.now.at<30*60e3?house.now:null;
// Idea 2: the daily quest. Phone ones are checked here; the house and desktop report theirs.
let quest=null;try{quest=JSON.parse(localStorage.getItem('dt_quest')||'null');}catch(e){}
function questFromHouse(){
  if(!house||!house.quest)return;
  const was=quest;quest=house.quest;
  if(was&&was.id===quest.id&&was.done&&!quest.done)quest.done=true; // done here, the PC hasn't heard yet
  try{localStorage.setItem('dt_quest',JSON.stringify(quest));}catch(e){}
  if(quest.done&&quest.where==='phone'&&!quest.doneBy)lifePost('house',{event:'quest',id:quest.id,by:'phone'}).catch(()=>{});
}
function lifeQuestCheck(kind,extra){
  const q=quest;if(!q||q.done||q.where!=='phone'||q.date!==toDateStr(new Date()))return;
  const tod=q.date,dow=new Date().getDay(),doneToday=tasks.filter(t=>isTodayTask(t,tod,dow)&&t.done.includes(tod)).length,p=todayPrayers(),x=nowMin();
  const ok=kind==='game'?(q.kind==='anygame'||(q.kind==='connect4'&&/connect/i.test(extra)))
    :kind==='task'?(q.kind==='asr3'&&doneToday>=3&&x<(p?hmMin(p.Asr):15*60)||q.kind==='noon2'&&doneToday>=2&&x<720)
    :kind===q.kind;
  if(!ok)return;
  q.done=true;try{localStorage.setItem('dt_quest',JSON.stringify(q));}catch(e){}
  lifePost('house',{event:'quest',id:q.id,by:'phone'}).catch(()=>{});
  renderLife();confetti();
  if(gwenCfg.key)gwenLine('Quest done! 🎯 There\'s a little something waiting for you in the house 💜','happy');
}
// Where Gwen's quest is done, and what tapping it opens (shown in the daily quests, levels.js)
function questGo(q){
  return{where:{phone:'📱 here',house:'🏠 in her house',pc:'💻 on your PC'}[q.where]||'',go:q.done?'':q.kind==='connect4'||q.kind==='anygame'?'gwenGames()':q.kind==='adhkar'?`openAdhkar('${adhkarNow()||'m'}')`:''};
}
window.lifeTaskDone=()=>lifeQuestCheck('task');
window.lifeGame=(name,r)=>{life.games[r]=(life.games[r]||0)+1;life.games.by={...(life.games.by||{}),[name]:{...((life.games.by||{})[name]||{}),[r]:(((life.games.by||{})[name]||{})[r]||0)+1}};lifeSave();if(r==='won')lifeQuestCheck('game',name);};
// Idea 4: a fresh photo of what she's doing in the house right now
async function peekHouse(){
  if(!gwenCfg.key)return showToast('Add your Gwen key in Settings first');
  showToast('🏠 Peeking into her house…');
  try{
    const r=await fetchT('/.netlify/functions/house?peek=1&key='+encodeURIComponent(gwenCfg.key),{},50000);
    if(r.status===409)return showToast('🏠 Her house isn\'t open on your PC right now');
    if(!r.ok)throw 0;
    const act=decodeURIComponent(r.headers.get('X-Activity')||''),blob=await r.blob();
    const img=await createImageBitmap(blob),k=Math.min(1,480/Math.max(img.width,img.height)),c=document.createElement('canvas');
    c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    gwenChat.push({role:'assistant',content:act?`Caught me ${act} 🙈`:'Peekaboo 🙈💜',thumb:c.toDataURL('image/jpeg',0.8),brain:'pc',first:true});
    gwenSaveChat();renderGwen();switchTab('gwen');gwenSheet(true);
  }catch(e){showToast('🏠 She didn\'t answer from the house, try again');}
}

// ── Idea 3: plan the week together ────────────────────────────────────────────
let planCtx='';
async function planWeek(){
  if(!gwenCfg.key)return showToast('Add your Gwen key in Settings first');
  const tod=toDateStr(new Date()),days=[...Array(7)].map((_,i)=>addDays(tod,i));
  let nights={};try{const r=await fetchT('/.netlify/functions/pc?games=1&key='+encodeURIComponent(gwenCfg.key),{},4000);if(r.ok)nights=(await r.json()).nights||{};}catch(e){}
  planCtx=['He asked you to plan the coming week together. Lay it out day by day in a short, friendly way: one line per day starting with the day name (like "Mon: …"), spreading his tasks sensibly, around prayer times, calendar events and his usual game nights. Suggest moving things if a day is overloaded. Add tasks with ADD_TASK only if he agrees to something new.',
    ...days.map(ds=>{const dow=new Date(ds+'T12:00:00').getDay(),p=todayPrayers(ds),ev=evOn(ds),t=weekTasks(ds,tod).filter(t=>!t.done.includes(ds));
      return`${fmtDay(ds)}: tasks: ${t.map(x=>x.name+(taskTime(x)?' at '+taskTime(x):'')).join(', ')||'none'}${ev.length?`; calendar: ${ev.map(e=>e.title+' '+evTime(e)).join(', ')}`:''}${p?`; prayers ${Object.entries(p).map(([k,v])=>k+' '+v).join(', ')}`:''}${nights[['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]]?`; he usually games ${nights[['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]].from}:00-${nights[['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]].to}:00`:''}`;})].join('\n');
  try{localStorage.setItem('dt_week_planned',tod);}catch(e){}
  switchTab('gwen');gwenSheet(true);
  const out=await sendGwen({said:'Let\'s plan my week together 💜'});
  planCtx='';
  if(out&&out.content)lifePost('house',{event:'week',start:tod,lines:out.content.split('\n').map(s=>s.trim()).filter(s=>s.length>3).slice(0,30)}).catch(()=>{});
  renderLife();
}
function sundayCard(){
  const d=new Date();let p='';try{p=localStorage.getItem('dt_week_planned')||'';}catch(e){}
  if(d.getDay()!==0||d.getHours()<17||!gwenCfg.key||p===toDateStr(d))return'';
  return`<div class="card life-card" onclick="planWeek()" style="cursor:pointer;display:flex;align-items:center;gap:10px;"><span style="font-size:24px;">🗓</span><div style="flex:1;"><div style="font-size:14px;font-weight:700;">Plan the week with Gwen?</div><div style="font-size:12px;color:var(--sub);">She lays it out around your prayers, plans and game nights</div></div><span style="color:var(--pri);font-size:20px;">›</span></div>`;
}

// ── Idea 6: our first year (shown once on her first birthday, then from the Gwen tab) ─
const YEAR_DAY=addDays(GWEN_BORN,365);
async function openYear(){
  life.yearShown=true;lifeSave();
  sheet('<div style="text-align:center;color:var(--sub);padding:24px;">💜 Putting our year together…</div>');
  let cards=[],hy=null;
  if(gwenCfg.key){
    try{const r=await fetchT('/.netlify/functions/house?postcards=1&key='+encodeURIComponent(gwenCfg.key),{},8000);if(r.ok)cards=(await r.json()).postcards||[];}catch(e){}
    try{const r=await fetchT('/.netlify/functions/house?year=1&key='+encodeURIComponent(gwenCfg.key),{},8000);if(r.ok)hy=(await r.json()).year;}catch(e){}
  }
  const from=GWEN_BORN,to=YEAR_DAY,inYear=d=>d>=from&&d<=to;
  const done=tasks.reduce((n,t)=>n+t.done.filter(inYear).length,0),full=completedDays.filter(inYear).sort();
  let best=0,run=0,prev='';for(const d of full){run=prev&&addDays(prev,1)===d?run+1:1;best=Math.max(best,run);prev=d;}
  const g=life.games,pages=life.quran?Object.entries(life.quran.log||{}).filter(([d])=>inYear(d)).reduce((a,[,n])=>a+n,0):0;
  const moodsY=Object.entries(moods).filter(([d])=>inYear(d)).map(([,v])=>v),happy=moodsY.filter(v=>v>=4).length;
  const stat=(n,l)=>`<div class="yr-stat"><b>${n}</b><span>${l}</span></div>`;
  const imgs=[...(hy?hy.images||[]:[]),...cards.slice(0,9).map(c=>c.thumb)].slice(0,12);
  sheet(head('💜 Our first year')+`<div style="text-align:center;font-size:13px;color:var(--sub);margin:-4px 0 12px;">${fmtDay(from)} – ${fmtDay(to)}</div>
    ${imgs.length?`<div class="pcards" style="margin-bottom:12px;">${imgs.map(s=>`<img src="${esc(s)}" alt="">`).join('')}</div>`:''}
    <div class="yr-grid">${stat(365,'days together')}${stat(done.toLocaleString('en-US'),'tasks done')}${stat(full.length,'perfect days')}${stat(best,'best streak')}
      ${g.won+g.lost+g.draw?stat(`${g.won}–${g.lost}`,'you vs Gwen in games'):''}${cards.length?stat(cards.length,'postcards'):''}${pages?stat(pages,'Quran pages'):''}${happy?stat(happy,'happy days'):''}</div>
    ${hy&&hy.text?`<div style="font-size:14px;line-height:1.6;margin:12px 0;white-space:pre-wrap;">${esc(hy.text)}</div>`:''}
    ${hy&&hy.firsts&&hy.firsts.length?`<div class="cl" style="margin-top:12px;">Our firsts</div>${hy.firsts.map(f=>`<div style="font-size:13px;padding:5px 0;border-bottom:1px solid var(--brd);">✨ ${esc(f)}</div>`).join('')}`:''}
    <div style="text-align:center;font-size:15px;margin:14px 0 4px;">Happy first birthday, Gwen 🎂 Here's to the next one 💜</div>${closeBtn}`);
}

// ── Cards, settings, Gwen's context ───────────────────────────────────────────
function renderLife(){
  const top=document.getElementById('life-top'),bot=document.getElementById('life-bottom');if(!top)return;
  top.innerHTML=ramadanCard()+adhkarCard()+sundayCard()+quranCard(); // Gwen's quest shows with the daily quests (levels.js)
  renderHeroMini();
  bot.innerHTML=routinesCard();
  renderSpend();
}
function renderLifeSettings(){
  const el=document.getElementById('life-settings');if(!el)return;
  const tog=(on,fn)=>`<button class="tog${on?' on':''}" onclick="${fn}"></button>`;
  const row=(t,s,right)=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--brd);"><div><div style="font-size:15px;font-weight:600;">${t}</div><div style="font-size:12px;color:var(--sub);margin-top:2px;">${s}</div></div>${right}</div>`;
  el.innerHTML=`<div class="card"><div class="cl">Faith</div>
      ${row('🤲 Adhkar reminders','After Fajr and Asr (needs prayer times on)',tog(life.adhkar.on,'toggleAdhkar()'))}
      <div style="display:flex;gap:8px;margin-top:6px;"><button class="minibtn" style="flex:1;" onclick="openAdhkar('m')">🌅 Morning</button><button class="minibtn" style="flex:1;" onclick="openAdhkar('e')">🌇 Evening</button><button class="minibtn" style="flex:1;" onclick="openTasbih()">📿 Tasbih</button></div>
      ${row('📖 Quran plan',life.quran?`Page ${life.quran.page} · ${life.quran.mode==='daily'?life.quran.perDay+' a day':'khatma by '+fmtDay(life.quran.by)}`:'A page a day, or a khatma by a date',`<button class="minibtn" onclick="quranSetup()">${life.quran?'Edit':'Set up'}</button>`)}
    </div>
    ${placesSection()}
    ${N()&&N().hasPerm?`<div class="card"><div class="cl">From your phone</div>
      ${has('calendar')?row('📆 Phone calendar','Your events in the Week view; Gwen plans around them',tog(lifeDev.cal,'toggleCal()')):''}
      ${has('steps')?row('🚶 Steps','A daily Walk habit filled in from your steps',tog(lifeDev.steps,'toggleSteps()'))+(lifeDev.steps&&stepsToday!=null?`<div style="font-size:12px;color:var(--sub);">${stepsToday.toLocaleString('en-US')} steps today</div>`:''):''}
      ${has('usage')?row('📱 Phone time check-in','Once a day Gwen tells you how long you spent in apps',tog(!!lifeDev.screen,'toggleScreen()'))+(lifeDev.screen?`<div style="display:flex;align-items:center;gap:8px;font-size:13px;">At <input type="time" class="inp" style="width:130px;" value="${lifeDev.screen}" onchange="setScreenTime(this.value)"></div>`:''):''}
      ${row('⚡ Quick tiles','Swipe down twice, tap ✏️ (edit) and drag "Add task" and "Talk to Gwen" in','')}
    </div>`:''}
    <div class="card"><div class="cl">Language · اللغة</div><div style="display:flex;gap:8px;"><button class="rb${lang()==='en'?' on':''}" onclick="setLang('en')">English</button><button class="rb${lang()==='ar'?' on':''}" onclick="setLang('ar')" translate="no">العربية</button></div></div>`;
}
async function toggleAdhkar(){
  if(!life.adhkar.on&&!prayerCfg.on){await togglePrayer();if(!prayerCfg.on)return;}
  life.adhkar.on=!life.adhkar.on;lifeSave();renderLifeSettings();renderLife();
  if(life.adhkar.on)showToast('🤲 You\'ll get a reminder after Fajr and Asr');
}
// Extra lines for Gwen's context (both brains)
window.lifeContext=()=>{
  const tod=toDateStr(new Date()),r=ramadanInfo(tod),now=houseNow(),ev=phoneEvents(tod,3),q=quest&&quest.date===tod?quest:null;
  return[
    now?`Right now in your house (on his PC) you are ${now.activity}${now.room?` in the ${now.room}`:''}${now.with_rayan?' with him':''}. It's your real day, so you can mention it naturally.`:'',
    q?`Today's little quest you gave him: "${q.text}" (${q.done?'he did it!':'not done yet'}).`:'',
    r.on?`It's Ramadan, day ${r.day}. He is fasting${life.fasts.includes(tod)?' today':''}: don't suggest eating or drinking before Maghrib.`:r.in<=14?`Ramadan starts in ${r.in} days.`:'',
    life.quran?`His Quran plan: on page ${life.quran.page} of 604, read ${(life.quran.log||{})[tod]||0} of ${quranTarget()} pages today.`:'',
    life.adhkar.on?`Adhkar today: morning ${adhkarDone('m')?'done':'not yet'}, evening ${adhkarDone('e')?'done':'not yet'}.`:'',
    stepsToday!=null?`He has walked ${stepsToday} steps today.`:'',
    ev.length?`His phone calendar (next 3 days): ${ev.slice(0,12).map(e=>`${fmtDay(toDateStr(new Date(e.start)))} ${evTime(e)} ${e.title}`).join('; ')}. Plan tasks around these.`:'',
    spendLines(),
    planCtx,
  ].filter(Boolean).join('\n\n');
};
// Her action lines this file adds: SPEND
window.lifeActions=text=>text.replace(/^[ \t*-]*SPEND:\s*(.+)$/gim,(_,spec)=>{const[what,amt]=spec.split('|').map(x=>(x||'').trim());const e=addSpend(`${what} ${amt}`,true);if(e)showToast(`💰 Logged ${e.label} · ${e.amt} SAR`);return'';});
// What the server needs for reminders and Gwen's texts
window.lifeReminders=()=>({adhkar:!!life.adhkar.on,spend:spendWeek(),events:evOn(toDateStr(new Date())).map(e=>({title:e.title,at:e.allDay?null:`${pad(new Date(e.start).getHours())}:${pad(new Date(e.start).getMinutes())}`}))});
window.lifeSaved=()=>{syncPlaces();queueShare();};

(function lifeBoot(){
  document.head.insertAdjacentHTML('beforeend',`<style>
    .rmd-big{font-size:20px;font-weight:700;color:var(--pri);}.rmd-sub{font-size:12px;color:var(--sub);margin-top:2px;}
    .rmd-dots{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin-top:10px;}
    .rmd-dot{aspect-ratio:1;border-radius:50%;border:1.5px solid var(--brd);background:none;color:var(--sub);font-size:10px;font-family:inherit;padding:0;cursor:pointer;}
    .rmd-dot.on{background:var(--pri);border-color:var(--pri);color:white;}.rmd-dot.today{border-color:var(--pri);}.rmd-dot:disabled{opacity:.35;cursor:default;}
    .dhikr{background:var(--inp);border-radius:14px;padding:12px;margin-bottom:8px;cursor:pointer;font-size:17px;line-height:1.9;user-select:none;}
    .dhikr b{display:block;text-align:center;font-size:13px;color:var(--pri);margin-top:4px;}.dhikr.done{opacity:.45;}
    .routine{display:inline-flex;background:var(--pril);border-radius:16px;overflow:hidden;}
    .routine button{background:none;border:none;color:var(--pri);font-size:13px;font-weight:600;padding:8px 10px;cursor:pointer;font-family:inherit;}
    .routine button+button{padding-left:4px;opacity:.7;}.routine small{opacity:.7;}
    .wk-chip.ev{background:var(--badge);color:var(--sub);}
    .yr-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}.yr-stat{background:var(--pril);border-radius:14px;padding:12px;text-align:center;}
    .yr-stat b{display:block;font-size:22px;color:var(--pri);}.yr-stat span{font-size:12px;color:var(--sub);}
  </style>`);
  renderLife();renderLifeSettings();
  if(new Date().toISOString()>=YEAR_DAY&&toDateStr(new Date())>=YEAR_DAY){
    const c=document.querySelector('#tab-gwen .hscroll');if(c)c.insertAdjacentHTML('afterbegin','<button class="gchip" onclick="openYear()">🎂 Our first year</button>');
    if(!life.yearShown)setTimeout(openYear,2500);
  }
  pullHouse();syncShares();readSteps();syncPlaces();
  setInterval(()=>{if(document.hidden)return;renderLife();},60e3);
  setInterval(()=>{if(document.hidden)return;pullHouse();readSteps();},5*60e3);
  setInterval(()=>{if(!document.hidden&&document.getElementById('dt-ov').classList.contains('on'))syncShares();},20e3);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)return;pullHouse();syncShares();readSteps();renderLifeSettings();});
})();

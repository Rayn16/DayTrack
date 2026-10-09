// DayTrack, second round of ideas (2026-10-08): Ramadan, adhkar, Quran plan, spending, places, shared lists, routines,
// phone calendar, steps, phone time, quick tiles, Arabic, waking the PC, and the phone's side of Gwen's day across
// house / desktop / phone (her day, daily quest, planning the week, peeking into the house, our first year).
// Loaded after index.html's own script, so it uses its globals (tasks, lists, gwenCfg, save, sheet, ask, toDateStr…).

// Synced with the rest (sync data `life`); per-phone settings stay in dt_life_dev
let life={spend:[],quran:null,fasts:[],routines:[],places:[],adhkar:{on:false,done:{}},games:{won:0,lost:0,draw:0},yearShown:false,
  water:{on:false,goal:8,remind:true,log:{}},chains:[],bills:[],friends:null,top3On:false,top3:null};
let lifeDev={steps:false,cal:false,screen:'',focus:false,photos:false,photoRemind:false,photoLast:''};
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
  return`<div class="card"><div class="cl">📍 Places</div><div style="font-size:12px;color:var(--sub);margin-bottom:8px;">Save places like Home or the supermarket, then give a task a place: you get the reminder when you get there. At a supermarket you also see your grocery list. Auto-tick ticks a place's tasks once you've been there 15 minutes (the gym, the mosque).</div>
    ${life.places.map(p=>`<div class="row" style="cursor:default;"><span style="flex:1;font-size:14px;">${isShop(p.name)?'🛒':/home|بيت|منزل/i.test(p.name)?'🏠':'📍'} ${esc(p.name)}</span><button class="rb${p.auto?' on':''}" onclick="placeAuto('${p.id}')" title="Tick this place's tasks after 15 minutes there">✅ Auto-tick</button><button onclick="placeDel('${p.id}')" style="background:none;border:none;color:var(--sub);cursor:pointer;" aria-label="Delete">✕</button></div>`).join('')}
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
    return{id:p.id,lat:p.lat,lon:p.lon,radius:150,title:`📍 ${p.name}`,body:[...due.map(t=>t.name),...(items.length?[`🛒 ${items.slice(0,12).join(', ')}`]:[])].join(' · ').slice(0,400),...(p.auto&&due.length?{tick:due.map(t=>t.id),name:p.name}:{})};
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
  if(typeof heroStepsIn==='function')heroStepsIn(s); // every day's real count, for the Level tab
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
window.lifeTaskDone=id=>{lifeQuestCheck('task');chainTick(id);top3Cheer();};
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

// ── App ideas round (2026-10-08): water, focus lock, smart reschedule, habit chains, car and bills, progress photos,
// friends board, Gwen's top 3. (Ticking from the home-screen widget: DayWidget → ActionReceiver → takeActions → applyPendingDone.)
const tod0=()=>toDateStr(new Date());
const PRI_W={high:3,medium:2,low:1};
const dayDiff=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);
const lifeHex=()=>[...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('');
const minibtns=(...b)=>`<span style="display:flex;gap:6px;">${b.join('')}</span>`;

// Idea 4: water, one tap per glass
const waterN=ds=>(life.water.log||{})[ds||tod0()]||0;
function waterSet(n){
  const w=life.water,tod=tod0(),was=waterN();n=Math.max(0,Math.min(30,n));
  w.log=Object.fromEntries(Object.entries({...w.log,[tod]:n}).filter(([d])=>d>=addDays(tod,-120)));lifeSave();renderLife();
  if(navigator.vibrate)navigator.vibrate(8);
  if(was<w.goal&&n>=w.goal&&gwenCfg.key)gwenLine(`${n} glasses today 💧 Fully hydrated, I'm proud of you 💜`,'happy');
}
function waterCard(){
  const w=life.water;if(!w.on)return'';const n=waterN();
  return`<div class="card life-card">${cardHead(`💧 Water · ${n}/${w.goal}`,n?`<button class="minibtn" onclick="waterSet(${n-1})" aria-label="One less">−</button>`:'')}
    <div class="water">${[...Array(Math.max(w.goal,n+1))].map((_,i)=>`<button class="${i<n?'on':''}" onclick="waterSet(${i<n?i:n+1})" aria-label="Glass ${i+1}">💧</button>`).join('')}</div></div>`;
}
async function toggleWater(){
  const w=life.water;
  if(!w.on){const g=parseInt(await ask('How many glasses a day?','8'),10);if(!g)return;w.goal=Math.max(1,Math.min(20,g));}
  w.on=!w.on;lifeSave();renderLifeSettings();renderLife();
}

// Idea 5: focus lock. While a timer runs the phone app watches for distracting apps (FocusService.java); slips go in the session.
const FOCUS_LINES=['Hey! You\'re supposed to be focusing 😤 Close that and get back to it.','Caught you 👀 The timer is still running. Back to work!','Really? Right now? 😒 Put it down, you can scroll after.','I saw that 👀 Focus first, fun later 💜'];
let focusOn=false,focusSlips=0,focusUsed=false,focusSeen=0;
const timerRunning=()=>(typeof sesItems!=='undefined'&&sesItems.some(i=>i.running))||!!gwenCfg.study;
function focusCheck(){
  if(!has('focusStart'))return;
  const run=lifeDev.focus&&timerRunning();
  if(run&&!focusOn){focusOn=focusUsed=true;focusSeen=0;try{N().focusStart(JSON.stringify({lines:FOCUS_LINES}));}catch(e){}}
  else if(!run&&focusOn){focusOn=false;try{focusSlips+=N().focusStop();}catch(e){}}
}
// Called by index.html as a session is saved: {focus: {slips}} when focus lock watched it (levels.js gives the bonus XP)
window.lifeFocusEnd=()=>{focusCheck();if(!focusUsed)return{};const r={focus:{slips:focusSlips}};focusUsed=false;focusSlips=0;return r;};
function focusBack(){
  if(!focusOn)return;let n=0;try{n=N().focusSlips();}catch(e){}
  if(n>focusSeen){focusSeen=n;gwenLine(FOCUS_LINES[Math.floor(Math.random()*FOCUS_LINES.length)],'pout');}
}
async function toggleFocus(){
  if(lifeDev.focus){lifeDev.focus=false;lifeDevStore();focusCheck();return renderLifeSettings();}
  if(!N().hasPerm('usage')){window.__dtPerm2=(w,ok)=>{if(w==='usage'&&ok)toggleFocus();};showToast('Turn on "Usage access" for DayTrack, then come back');N().askPerm('usage');return;}
  lifeDev.focus=true;lifeDevStore();renderLifeSettings();focusCheck();showToast('🎯 Focus lock on: Gwen watches while a timer runs');
}

// Idea 10: smart reschedule. Unfinished one-time tasks (today and overdue) spread over the next 4 days, lightest day first.
// ponytail: greedy by priority with a small "sooner is better" bias; good enough for a few dozen tasks
function spreadPlan(){
  const tod=tod0(),days=[1,2,3,4].map(i=>addDays(tod,i)),w=t=>1+(PRI_W[t.priority]||0)/3;
  const load=Object.fromEntries(days.map(d=>{const dow=new Date(d+'T12:00:00').getDay();return[d,tasks.filter(t=>t.recurring?isTodayTask(t,d,dow):!t.done.length&&t.date===d).reduce((n,t)=>n+w(t),0)];}));
  return tasks.filter(t=>!t.recurring&&!t.done.length&&(!t.date||t.date<=tod)).sort((a,b)=>(PRI_W[b.priority]||0)-(PRI_W[a.priority]||0)||(a.date||tod).localeCompare(b.date||tod))
    .map(t=>{const d=days.reduce((best,d,i)=>load[d]+i*.5<load[best]+days.indexOf(best)*.5?d:best,days[0]);load[d]+=w(t);return{t,d,on:true};});
}
let spreadSel=[];
function openSpread(){spreadSel=spreadPlan();if(!spreadSel.length)return showToast('Nothing left to move 💜');renderSpread();}
function renderSpread(){
  sheet(head('🗓 Spread my unfinished tasks')+`<div style="font-size:13px;color:var(--sub);text-align:center;margin-bottom:10px;">Gwen spreads them over the next days so none gets too full. Tap one to keep it today.</div>
    ${spreadSel.map((x,i)=>`<div class="sub-row" style="padding:8px 0;border-bottom:1px solid var(--brd);cursor:pointer;" onclick="spreadSel[${i}].on=!spreadSel[${i}].on;renderSpread()"><div class="chk${x.on?' on':''}">${x.on?'✓':''}</div><span style="flex:1;font-size:14px;">${esc(x.t.name)}</span><span style="font-size:12px;color:var(--sub);">${x.on?fmtDay(x.d):'Today'}</span></div>`).join('')}
    <button onclick="applySpread()" style="width:100%;margin-top:12px;background:var(--pri);color:white;${btnS}">Move them</button>${closeBtn}`);
}
function applySpread(){
  let n=0;spreadSel.forEach(x=>{if(x.on&&tasks.includes(x.t)&&!x.t.done.length){x.t.date=x.d;n++;}});
  try{localStorage.setItem('dt_spread',tod0());}catch(e){}
  closeOv('dt-ov');if(!n)return renderLife();save();renderTaskList();showToast(`🗓 Moved ${n} task${n>1?'s':''}`);
}
function spreadCard(){
  let seen='';try{seen=localStorage.getItem('dt_spread')||'';}catch(e){}
  if(new Date().getHours()<20||seen===tod0())return'';const n=spreadPlan().length;if(!n)return'';
  return`<div class="card life-card" style="display:flex;align-items:center;gap:10px;"><span style="font-size:24px;">🗓</span><div style="flex:1;cursor:pointer;" onclick="openSpread()"><div style="font-size:14px;font-weight:700;">${n} task${n>1?'s':''} still open</div><div style="font-size:12px;color:var(--sub);">Let Gwen spread them over the next days?</div></div><button class="minibtn" onclick="try{localStorage.setItem('dt_spread',tod0())}catch(e){};renderLife()" aria-label="Dismiss">✕</button></div>`;
}

// Idea 11: habit chains. Done days are worked out from the tasks themselves.
const chainTasks=c=>c.ids.map(id=>tasks.find(t=>t.id===id)).filter(Boolean);
// Every day a whole chain was done (from the day it was made): [{d, name, n}], for the Level tab's bonus XP
function chainDoneDays(){
  const out=[];
  for(const c of life.chains){const ts=chainTasks(c);if(ts.length<2)continue;for(const d of new Set(ts[0].done))if(d>=(c.at||'')&&ts.every(t=>t.done.includes(d)))out.push({d,name:c.name,n:ts.length});}
  return out.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
}
function chainsCard(){
  const tod=tod0();
  return`<div class="card life-card">${cardHead('🔗 Habit chains','<button class="minibtn" onclick="editChain()">+ New</button>')}
    ${life.chains.length?life.chains.map(c=>{const ts=chainTasks(c),nx=ts.find(t=>!t.done.includes(tod));
      return`<div class="chain"><div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><b style="flex:1;font-size:14px;">${esc(c.name)}${nx?'':' ✅'}</b><button class="minibtn" onclick="editChain('${c.id}')" aria-label="Edit ${esc(c.name)}">⋯</button></div>
        <div class="chain-steps">${ts.map(t=>`<button class="${t.done.includes(tod)?'on':t===nx?'nx':''}" onclick="checkTask('${t.id}',1)">${esc(t.name)}</button>`).join('<i>›</i>')}</div></div>`;}).join('')
      :'<div style="font-size:12px;color:var(--sub);">Link habits so one leads into the next, like wake up › water › pray › gym. Finish the whole chain for bonus XP.</div>'}</div>`;
}
let chainSel=[];
function editChain(id){
  const c=life.chains.find(x=>x.id===id)||{id:null,name:'',ids:[]};chainSel=c.ids.filter(i=>tasks.some(t=>t.id===i));
  sheet(head(c.id?'🔗 Edit chain':'🔗 New chain')+`<div class="sl" style="margin-top:0;">Name</div><input class="inp" id="ch-name" maxlength="30" placeholder="Morning" value="${esc(c.name)}">
    <div class="sl">Tap your habits in order</div><div id="ch-pick"></div>
    <button onclick="saveChain(${c.id?`'${c.id}'`:'null'})" style="width:100%;margin-top:12px;background:var(--pri);color:white;${btnS}">Save</button>
    ${c.id?`<button class="mi" style="color:#EF4444;margin-top:4px;" onclick="if(confirm('Delete this chain?')){life.chains=life.chains.filter(x=>x.id!=='${c.id}');lifeSave();renderLife();closeOv('dt-ov');}">🗑️ Delete chain</button>`:''}${closeBtn}`);
  chainPickRender();
}
function chainPickRender(){
  const el=document.getElementById('ch-pick'),hs=tasks.filter(t=>t.recurring);if(!el)return;
  el.innerHTML=hs.length?`<div class="chain-steps">${hs.map(t=>{const k=chainSel.indexOf(t.id);return`<button class="${k>=0?'on':''}" onclick="chainPick('${t.id}')">${k>=0?k+1+'. ':''}${esc(t.name)}</button>`;}).join('')}</div>`:'<div style="font-size:12px;color:var(--sub);">Add a few repeating habits first.</div>';
}
function chainPick(id){chainSel=chainSel.includes(id)?chainSel.filter(x=>x!==id):[...chainSel,id];chainPickRender();}
function saveChain(id){
  const name=document.getElementById('ch-name').value.trim().slice(0,30);
  if(!name||chainSel.length<2)return showToast('Give it a name and pick at least two habits');
  const c=life.chains.find(x=>x.id===id);if(c){c.name=name;c.ids=chainSel;}else life.chains.push({id:uid(),name,ids:chainSel,at:tod0()});
  lifeSave();renderLife();closeOv('dt-ov');
}
// After a tick: nudge to the next link, cheer a finished chain
function chainTick(id){
  const tod=tod0(),t=tasks.find(x=>x.id===id);if(!t||!t.done.includes(tod))return;
  for(const c of life.chains.filter(c=>c.ids.includes(id))){
    const nx=chainTasks(c).find(x=>!x.done.includes(tod));
    if(nx){showToast(`🔗 Next: ${nx.name}`);continue;}
    confetti();if(gwenCfg.key)gwenLine(`Whole ${c.name} chain done 🔗 Bonus XP for you 💜`,'happy');else showToast(`🔗 ${c.name} chain done! Bonus XP`);
  }
}
function chainHighlight(){
  document.querySelectorAll('.task-item.chain-next').forEach(e=>e.classList.remove('chain-next'));
  const tod=tod0();
  for(const c of life.chains){const ts=chainTasks(c),k=ts.findIndex(t=>!t.done.includes(tod));if(k>0){const el=document.querySelector(`.task-item[data-id="${ts[k].id}"]`);if(el)el.classList.add('chain-next');}}
}

// Idea 12: car and bills, repeating every N days or months, with a heads-up a few days early
const addMonths=(ds,n)=>{const d=new Date(ds+'T12:00:00'),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));return toDateStr(d);};
function billsCard(){
  if(!life.bills.length)return'';const tod=tod0();
  return`<div class="card life-card">${cardHead('🚗 Car and bills','<button class="minibtn" onclick="editBill()">+ Add</button>')}
    ${[...life.bills].sort((a,b)=>a.due<b.due?-1:1).map(b=>{const k=dayDiff(tod,b.due),soon=k<=b.warn;
      return`<div class="row"><div style="flex:1;min-width:0;" onclick="editBill('${b.id}')"><div style="font-size:14px;font-weight:600;">${esc(b.name)}</div><div style="font-size:12px;color:${k<0?'#EF4444':soon?'#F97316':'var(--sub)'};">${k<0?`Overdue ${-k}d`:k===0?'Due today':`Due in ${k}d`} · ${fmtDay(b.due)}</div></div><button class="minibtn" onclick="billDone('${b.id}')">✓ Done</button></div>`;}).join('')}</div>`;
}
function editBill(id){
  const b=life.bills.find(x=>x.id===id)||{id:null,name:'',every:1,unit:'m',due:addMonths(tod0(),1),warn:3};
  sheet(head(b.id?'🚗 Edit':'🚗 Car and bills')+`<div class="sl" style="margin-top:0;">What</div><input class="inp" id="bl-name" maxlength="40" placeholder="Oil change, insurance, phone bill…" value="${esc(b.name)}">
    <div class="sl">Repeats every</div><div style="display:flex;gap:8px;"><input class="inp" id="bl-every" type="number" min="1" max="999" value="${b.every}" style="width:90px;"><select class="inp" id="bl-unit" style="flex:1;"><option value="d"${b.unit==='d'?' selected':''}>days (from when it's done)</option><option value="m"${b.unit==='m'?' selected':''}>months (same date)</option></select></div>
    <div class="sl">Next due</div><input class="inp" id="bl-due" type="date" value="${b.due}">
    <div class="sl">Warn me this many days before</div><input class="inp" id="bl-warn" type="number" min="0" max="60" value="${b.warn}">
    <button onclick="saveBill(${b.id?`'${b.id}'`:'null'})" style="width:100%;margin-top:12px;background:var(--pri);color:white;${btnS}">Save</button>
    ${b.id?`<button class="mi" style="color:#EF4444;margin-top:4px;" onclick="if(confirm('Delete this?')){life.bills=life.bills.filter(x=>x.id!=='${b.id}');lifeSave();renderLife();closeOv('dt-ov');}">🗑️ Delete</button>`:''}${closeBtn}`);
}
function saveBill(id){
  const v=k=>document.getElementById('bl-'+k).value,name=v('name').trim().slice(0,40),every=Math.max(1,Math.min(999,parseInt(v('every'),10)||1)),due=v('due');
  if(!name||!/^\d{4}-\d{2}-\d{2}$/.test(due))return showToast('Give it a name and a due date');
  const b={id:id||uid(),name,every,unit:v('unit')==='d'?'d':'m',due,warn:Math.max(0,Math.min(60,parseInt(v('warn'),10)||0))};
  const old=life.bills.find(x=>x.id===id);if(old)Object.assign(old,b);else life.bills.push({...b,log:[]});
  lifeSave();renderLife();renderLifeSettings();closeOv('dt-ov');
}
function billDone(id){
  const b=life.bills.find(x=>x.id===id),tod=tod0();if(!b)return;
  if(b.unit==='d')b.due=addDays(tod,b.every);else{do b.due=addMonths(b.due,b.every);while(b.due<=tod);}
  b.log=[...(b.log||[]),tod].slice(-24);lifeSave();renderLife();showToast(`✅ ${b.name}: next on ${fmtDay(b.due)}`);
}

// Idea 16: progress photos, kept on this device only (IndexedDB, ~512 px JPEG), never synced
const photoDb=()=>new Promise((ok,no)=>{const r=indexedDB.open('dt_photos',1);r.onupgradeneeded=()=>r.result.createObjectStore('p',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
async function photoTx(fn,mode){const db=await photoDb();return new Promise((ok,no)=>{const tx=db.transaction('p',mode||'readonly'),r=fn(tx.objectStore('p'));tx.oncomplete=()=>ok(r.result);tx.onerror=()=>no(tx.error);});}
let photos=null,photosLoading=false;
async function loadPhotos(){if(photosLoading)return;photosLoading=true;try{photos=((await photoTx(s=>s.getAll()))||[]).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);}catch(e){photos=[];}renderLife();}
const PKIND={body:'Body',room:'Room'};
function photosCard(){
  if(!lifeDev.photos)return'';if(!photos){loadPhotos();return'';}
  return`<div class="card life-card">${cardHead('📸 Progress photos',photos.length>1?'<button class="minibtn" onclick="photoCompare()">Compare</button>':'')}
    ${Object.entries(PKIND).map(([k,l])=>`<div class="sl" style="margin-top:4px;">${l}</div><div class="pstrip">${photos.filter(p=>p.kind===k).slice(-5).map(p=>`<img src="${p.img}" alt="${fmtDay(p.d)}" onclick="photoOpen('${p.id}')">`).join('')}<button onclick="photoAdd('${k}')" aria-label="Add a photo">＋</button></div>`).join('')}
    <div style="font-size:11px;color:var(--sub);margin-top:6px;">Kept on this device only.</div></div>`;
}
function photoAdd(kind){
  const i=document.createElement('input');i.type='file';i.accept='image/*';
  i.onchange=async()=>{
    const f=i.files[0];if(!f)return;
    try{
      const img=await createImageBitmap(f),k=Math.min(1,512/Math.max(img.width,img.height)),c=document.createElement('canvas');
      c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      const p={id:uid(),d:tod0(),kind,img:c.toDataURL('image/jpeg',.8)};
      await photoTx(s=>s.put(p),'readwrite');(photos=photos||[]).push(p);lifeDev.photoLast=p.d;lifeDevStore();renderLife();if(lifeDev.photoRemind)syncReminders();showToast('📸 Saved on this device');
    }catch(e){showToast('❌ Couldn\'t save that photo');}
  };
  i.click();
}
function photoOpen(id){
  const p=(photos||[]).find(x=>x.id===id);if(!p)return;
  sheet(head(`📸 ${PKIND[p.kind]} · ${fmtDay(p.d)}`)+`<img src="${p.img}" alt="" style="width:100%;border-radius:14px;display:block;">
    <button class="mi" style="color:#EF4444;margin-top:8px;" onclick="photoDel('${id}')">🗑️ Delete photo</button>${closeBtn}`);
}
async function photoDel(id){
  if(!confirm('Delete this photo?'))return;
  try{await photoTx(s=>s.delete(id),'readwrite');}catch(e){}
  photos=(photos||[]).filter(p=>p.id!==id);closeOv('dt-ov');renderLife();
}
function photoCompare(kind,a,b){
  kind=kind||'body';const l=(photos||[]).filter(p=>p.kind===kind);
  if(l.length<2){if(kind==='body'&&(photos||[]).filter(p=>p.kind==='room').length>1)return photoCompare('room');return showToast('Take at least two photos to compare');}
  a=a||l[0].id;b=b||l[l.length-1].id;
  const im=id=>l.find(p=>p.id===id)||l[0],opt=s=>l.map(p=>`<option value="${p.id}"${p.id===s?' selected':''}>${fmtDay(p.d)}</option>`).join('');
  sheet(head('📸 Before and after')+`<div style="display:flex;gap:6px;justify-content:center;margin-bottom:10px;">${Object.entries(PKIND).map(([k,n])=>`<button class="rb${k===kind?' on':''}" onclick="photoCompare('${k}')">${n}</button>`).join('')}</div>
    <div class="pcmp"><div><img src="${im(a).img}" alt=""><select class="inp" onchange="photoCompare('${kind}',this.value,'${b}')">${opt(a)}</select></div><div><img src="${im(b).img}" alt=""><select class="inp" onchange="photoCompare('${kind}','${a}',this.value)">${opt(b)}</select></div></div>
    <div style="text-align:center;font-size:13px;color:var(--sub);margin-top:8px;">${Math.abs(dayDiff(im(a).d,im(b).d))} days apart</div>${closeBtn}`);
}

// Idea 17: friends board. Everyone's level, this week's XP and a 👑 per week won, kept for good. Same /s/ transport as
// shared lists and the friend duel: one share code, one item per player, text "name|level|week XP|week start|last week XP|last week start".
let friendsData=null,friendsAt=0;
function friendText(){
  if(typeof heroState!=='function')return'';
  const h=heroState(),tod=tod0(),ws=heroWeekStart(tod),lw=addDays(ws,-7),sum=(a,b)=>h.aw.filter(x=>x.d>=a&&x.d<=b).reduce((n,x)=>n+x.xp,0);
  return[(life.friends.name||'Rayan').replace(/\|/g,''),h.L,sum(ws,tod),ws,sum(lw,addDays(ws,-1)),lw].join('|');
}
function friendsPlayers(){
  const F=life.friends,ws=heroWeekStart(tod0()),lw=addDays(ws,-7);
  return((friendsData&&friendsData.items)||[]).map(i=>{const[n,L,x,w,lx,lww]=String(i.text).split('|');return{me:i.id===F.me,n:n||'?',L:+L||1,x:w===ws?+x||0:0,last:w===lw?+x||0:lww===lw?+lx||0:0};});
}
async function friendsPush(force){
  const F=life.friends;if(!F||(!force&&Date.now()-friendsAt<6e4))return;friendsAt=Date.now();
  const opts={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{id:F.me,text:friendText(),done:false,at:Date.now()}]})};
  try{const r=F.host?await lifeApi('share?code='+F.code,opts):await fetch(F.url+'/data',opts);
    friendsData=r.status===404?{gone:1}:r.ok?{items:((await r.json()).items||[]).filter(i=>!i.del)}:{err:1};}catch(e){friendsData={err:1};}
  // Last week's winner gets a crown for good. ponytail: decided on the first look this week; a friend who never opened DayTrack late last week may be short a few XP
  const lw=addDays(heroWeekStart(tod0()),-7),win=friendsData.items?friendsPlayers().filter(p=>p.last>0).sort((a,b)=>b.last-a.last)[0]:null;
  if(win&&life.friends&&!(life.friends.crowns||{})[lw]){life.friends.crowns={...(life.friends.crowns||{}),[lw]:win.n};lifeSave();}
  renderFriends();
}
function friendsHtml(){
  const F=life.friends;
  if(!F)return`<div class="hm-sub" style="margin-bottom:8px;">A board with friends who use DayTrack: everyone's level, this week's XP, and a 👑 for each week someone wins, kept for good. Your PC hosts it, like a shared list.</div><div style="display:flex;gap:8px;"><button class="minibtn" onclick="friendsNew()">🏆 Start a board</button><button class="minibtn" onclick="friendsJoin()">🔗 Join one</button></div>`;
  if(!friendsData){if(Date.now()-friendsAt>15e3)setTimeout(()=>friendsPush(true),0);return'<div class="hm-sub">Loading the board…</div>';}
  if(friendsData.gone)return`<div class="hm-sub" style="margin-bottom:8px;">This board was closed.</div><button class="minibtn" onclick="life.friends=null;friendsData=null;lifeSave();renderFriends();">OK</button>`;
  const cr=Object.values(F.crowns||{}),lastW=(F.crowns||{})[addDays(heroWeekStart(tod0()),-7)],ps=friendsPlayers().sort((a,b)=>b.x-a.x||b.L-a.L),mx=Math.max(1,...ps.map(p=>p.x));
  return(friendsData.err?'<div class="hm-sub" style="margin-bottom:6px;">Couldn\'t reach the board right now (is the host\'s PC on?).</div>':'')
    +ps.map(p=>{const c=cr.filter(n=>n===p.n).length;return`<div class="duel${p.me?' me':''}"><b>${esc(p.n)}${p.me?' (you)':''}</b><small style="font-size:11px;color:var(--sub);white-space:nowrap;">Lv ${p.L}${c?` · 👑${c}`:''}</small><div class="bar"><i style="width:${p.x/mx*100}%"></i></div><span>${p.x.toLocaleString('en-US')}</span></div>`;}).join('')
    +(lastW?`<div class="hm-sub" style="margin-top:6px;">👑 Last week: ${esc(lastW)}</div>`:'')
    +(ps.length<2&&!friendsData.err?'<div class="hm-sub" style="margin:6px 0;">Invite a friend to start the race.</div>':'')
    +`<div style="display:flex;gap:8px;margin-top:8px;">${F.host?'<button class="minibtn" onclick="friendsShare()">📤 Invite</button>':''}<button class="minibtn" onclick="friendsPush(true)">↻ Refresh</button><button class="minibtn" onclick="friendsLeave()">Leave</button></div>`;
}
const renderFriends=()=>{const el=document.getElementById('life-friends');if(el)el.innerHTML=friendsHtml();};
async function friendsNew(){
  if(!gwenCfg.key||!shareLink('x'))return showToast('Add your PC address (https://…ts.net) and Gwen key in Settings first');
  const name=((await ask('Your name on the board','e.g. Rayan'))||'').trim().replace(/\|/g,'').slice(0,20);if(!name)return;
  const code=lifeHex();
  try{const r=await lifeApi('share?code='+code,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'🏆 DayTrack friends',items:[]})});if(!r.ok)throw 0;}
  catch(e){return showToast('❌ Your PC needs to be on to start a board');}
  life.friends={code,url:shareLink(code),me:'f'+uid(),host:true,name,crowns:{}};friendsData=null;lifeSave();await friendsPush(true);friendsShare();
}
function friendsShare(){
  const F=life.friends;if(!F)return;const msg=`Join my DayTrack friends board: levels, weekly XP and a crown for each week's winner. In DayTrack go to Level → Story → Friends board → Join one, and paste this link: ${F.url}`;
  if(navigator.share)navigator.share({title:'DayTrack friends',text:msg}).catch(()=>{});else navigator.clipboard.writeText(msg).then(()=>showToast('📋 Invite copied'),()=>sheet(head('📤 Invite')+`<div style="font-size:13px;user-select:all;word-break:break-all;">${esc(msg)}</div>`+closeBtn));
}
async function friendsJoin(){
  const m=((await ask('Paste the board link your friend sent','https://…/s/…'))||'').trim().match(/https:\/\/[^\s]+?\/s\/([a-f0-9]{32})/);
  if(!m)return showToast('That doesn\'t look like a board link');
  const name=((await ask('Your name on the board','e.g. Sami'))||'').trim().replace(/\|/g,'').slice(0,20);if(!name)return;
  life.friends={code:m[1],url:m[0],me:'f'+uid(),name,crowns:{}};friendsData=null;lifeSave();await friendsPush(true);
}
function friendsLeave(){if(!confirm('Leave this board?'))return;life.friends=null;friendsData=null;lifeSave();renderFriends();}

// Idea 18: Gwen sets your day. Top 3 = what you usually skip (last 4 weeks), high priority and overdue first.
function skipRate(t,ds){
  if(!t.recurring)return 0;let s=0,d=0;
  for(let i=1;i<=28;i++){const x=addDays(ds,-i);if(x<(t.createdAt||''))break;if(isTodayTask(t,x,new Date(x+'T12:00:00').getDay())){s++;if(t.done.includes(x))d++;}}
  return s>=3?1-d/s:0;
}
function top3Picks(ds){
  const dow=new Date(ds+'T12:00:00').getDay();
  return tasks.filter(t=>isTodayTask(t,ds,dow)&&!t.done.includes(ds)&&!t.steps).map(t=>{const sk=skipRate(t,ds),late=!t.recurring&&!!t.date&&t.date<ds;return{t,sk,late,score:sk*4+(PRI_W[t.priority]||0)+(late?2.5:0)};})
    .sort((a,b)=>b.score-a.score).slice(0,3);
}
const top3Why=p=>[p.late&&'overdue',p.sk>=.3&&`you skip it ${Math.round(p.sk*100)}% of the time`,p.t.priority==='high'&&'high priority'].filter(Boolean).join(' · ');
const top3Today=()=>{const s=life.top3&&life.top3.d===tod0()?life.top3:null;return s&&s.pinned?s.ids.map(id=>tasks.find(t=>t.id===id)).filter(Boolean).map(t=>({t})):top3Picks(tod0());};
function top3Card(){
  const tod=tod0(),s=life.top3&&life.top3.d===tod?life.top3:null;if(!life.top3On||(s&&s.hide))return'';
  const list=top3Today();if(!list.length)return'';const pin=s&&s.pinned;
  return`<div class="card life-card">${cardHead(pin?'💜 Your top 3 today':'💜 Gwen\'s top 3 for today',pin?'':minibtns('<button class="minibtn" onclick="top3Set(\'pin\')">📌 Pin</button>','<button class="minibtn" onclick="top3Set(\'hide\')" aria-label="Dismiss">✕</button>'))}
    ${list.map(p=>{const d=p.t.done.includes(tod),why=p.sk!=null&&top3Why(p);return`<div class="sub-row" style="padding:6px 0;"><div class="chk${d?' on':''}" onclick="checkTask('${p.t.id}',1)">${d?'✓':''}</div><div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;${d?'text-decoration:line-through;color:var(--sub);':''}">${esc(p.t.name)}</div>${why?`<div style="font-size:11px;color:var(--sub);">${why}</div>`:''}</div></div>`;}).join('')}</div>`;
}
function top3Set(k){
  const tod=tod0();life.top3=k==='pin'?{d:tod,pinned:true,ids:top3Picks(tod).map(p=>p.t.id)}:{d:tod,hide:true};lifeSave();renderLife();
  if(k==='pin'&&gwenCfg.key)gwenLine('Deal. Those three first, then the rest 💜','nod');
}
function top3Cheer(){
  const s=life.top3,tod=tod0();if(!s||s.d!==tod||!s.pinned||s.cheered)return;
  if(!s.ids.every(id=>{const t=tasks.find(x=>x.id===id);return!t||t.done.includes(tod);}))return;
  s.cheered=true;lifeSave();if(gwenCfg.key)gwenLine('Your top 3 are done! The hard part is over 💜','happy');
}

// Reminders the server fires on the minute (check-reminders "nudges"): water when behind, bills due, top 3, the weekly photo.
// The PC app sends none, so it never pops anything over a game.
function lifeNudges(){
  if(/Electron/.test(navigator.userAgent))return[];
  const out=[],tod=tod0(),w=life.water,wake=gwenCfg.wake||'08:00';
  for(const ds of[tod,addDays(tod,1)]){
    const n=ds===tod?waterN():0;
    if(w.on&&w.remind!==false)[['15:00',.5],['19:00',.83]].forEach(([at,f])=>{if(n<Math.floor(w.goal*f))out.push({id:'water'+at,date:ds,at,title:'💧 Water',text:`You're at ${n} of ${w.goal} glasses. Drink some water for me? 💜`});});
    for(const b of life.bills){const k=dayDiff(ds,b.due);if(k<=b.warn)out.push({id:'bill'+b.id,date:ds,at:'10:00',title:'🚗 '+b.name,text:k>0?`${b.name} is due in ${k} day${k>1?'s':''} (${fmtDay(b.due)}).`:k===0?`${b.name} is due today.`:`${b.name} was due ${fmtDay(b.due)}. Tap ✓ Done in DayTrack once it's sorted.`});}
    const s=life.top3&&life.top3.d===ds?life.top3:null,p=life.top3On&&!s?top3Picks(ds):[];
    if(p.length)out.push({id:'top3',date:ds,at:wake,title:'💜 Your top 3 today',text:`${p.map(x=>x.t.name).join(', ')}. Do these first and the day is yours 💜`});
    if(lifeDev.photos&&lifeDev.photoRemind&&(!lifeDev.photoLast||dayDiff(lifeDev.photoLast,ds)>=7)&&new Date(ds+'T12:00:00').getDay()===(lifeDev.photoLast?new Date(lifeDev.photoLast+'T12:00:00').getDay():5))
      out.push({id:'photo',date:ds,at:'18:00',title:'📸 Progress photo',text:'Time for this week\'s progress photo 📸'});
  }
  return out.slice(0,20);
}

// ── 10-09 round: undo a delete, Gwen knows your history, auto-tick by place, now/next on the lock screen, Qibla,
// PC time log, birthdays, and the app's side of the RPG in her house, her monthly letter and files sent from the PC ──

// Idea 16: deleted tasks wait 30 days in life.trash ({id, t, at}); a task in the bin never comes back with a sync
const trashKeep=()=>(life.trash||[]).filter(x=>Date.now()-x.at<30*864e5);
window.lifeTrash=t=>{life.trash=[{id:t.id,t,at:Date.now()},...trashKeep().filter(x=>x.id!==t.id)].slice(0,100);lifeStore();};
const lifeApply0=window.lifeApply;
window.lifeApply=d=>{lifeApply0(d);const gone=new Set((life.trash||[]).map(x=>x.id));if(gone.size)tasks=tasks.filter(t=>!gone.has(t.id));};
function openTrash(){
  const l=trashKeep();
  sheet(head('🗑️ Recently deleted')+(l.length?l.map(x=>`<div class="row" style="cursor:default;"><div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(x.t.name)}</div><div style="font-size:11px;color:var(--sub);">Deleted ${fmtDay(toDateStr(new Date(x.at)))}</div></div><button class="minibtn" onclick="trashRestore('${x.id}')">↩ Restore</button></div>`).join('')
    :'<div style="text-align:center;color:var(--sub);font-size:13px;padding:10px;">Nothing deleted in the last 30 days.</div>')+'<div style="font-size:11px;color:var(--sub);text-align:center;margin-top:8px;">Deleted tasks stay here for 30 days.</div>'+closeBtn);
}
function trashRestore(id){
  const x=(life.trash||[]).find(y=>y.id===id);if(!x)return;
  life.trash=life.trash.filter(y=>y.id!==id);lifeStore();
  if(!tasks.some(t=>t.id===id))tasks.push(x.t);
  // The XP it earned was kept when it was deleted: take that back so it isn't counted twice
  const what=`${x.t.name} (deleted, XP kept)`,i=(heroP.bank||[]).map(b=>b.what).lastIndexOf(what);if(i>=0)heroP.bank.splice(i,1);
  save();renderTaskList();openTrash();showToast(`↩ ${x.t.name} is back`);
}

// Idea 17: what Gwen knows about his past, so "how many gym days this month?" gets a real answer
function historyLines(){
  const tod=tod0(),month=tod.slice(0,7),since=addDays(tod,-60);
  const rec=tasks.filter(t=>t.recurring&&t.done.length).map(t=>{const d=[...t.done].sort();return`${t.name}: done ${d.filter(x=>x.startsWith(month)).length} times this month, ${d.filter(x=>x>=addDays(tod,-6)).length} in the last 7 days, ${d.length} in all, last on ${fmtDay(d[d.length-1])}`;}).slice(0,40);
  const once=tasks.filter(t=>!t.recurring&&t.done.length&&t.done[0]>=since).sort((a,b)=>a.done[0]<b.done[0]?1:-1).slice(0,30).map(t=>`${t.name} (${fmtDay(t.done[0])})`);
  const sl=Object.keys(sleepLog).length;
  return rec.length||once.length?`His history in DayTrack (use it to answer questions about his past):\nHabits: ${rec.join('; ')||'none'}\nOne-off tasks he finished in the last 60 days: ${once.join('; ')||'none'}${sl?`\nHe has logged sleep on ${sl} nights.`:''}`:'';
}

// Idea 18: a place can tick its tasks by itself once he's been there 15 minutes (the phone does it, even with the app closed)
function placeAuto(id){const p=life.places.find(x=>x.id===id);if(!p)return;p.auto=!p.auto;lastPlaces='';lifeSave();renderLifeSettings();if(p.auto)showToast(`✅ Tasks at ${p.name} will tick after 15 minutes there`);}

// Idea 19: now and next on the lock screen (an ongoing notification; Done moves to the next one)
const tTime=t=>{const r=t.reminder,s=typeof r==='string'?r:r&&r.type==='time'?r.time:null;return/^\d{1,2}:\d{2}$/.test(s||'')?s.padStart(5,'0'):null;};
function todayLeft(){
  const tod=tod0(),dow=new Date().getDay();
  return tasks.filter(t=>isTodayTask(t,tod,dow)&&!t.done.includes(tod)&&!t.steps).sort((a,b)=>(tTime(a)?0:1)-(tTime(b)?0:1)||(tTime(a)||'').localeCompare(tTime(b)||''));
}
let lastNow='';
function syncNowNext(){
  if(!has('nowNext'))return;
  const j=lifeDev.nowNext?JSON.stringify(todayLeft().slice(0,12).map(t=>({id:t.id,name:t.name,time:tTime(t)?fmt12(tTime(t)):''}))):'[]';
  if(j!==lastNow){lastNow=j;try{N().nowNext(j);}catch(e){}}
}
function toggleNowNext(){if(!lifeDev.nowNext&&N().notifOn&&!N().notifOn())N().askNotif();lifeDev.nowNext=!lifeDev.nowNext;lifeDevStore();syncNowNext();renderLifeSettings();}

// Idea 20: Qibla compass, from the prayer-times location
const KAABA=[21.4225,39.8262];
function qiblaBearing(lat,lon){
  const r=Math.PI/180,f1=lat*r,f2=KAABA[0]*r,dl=(KAABA[1]-lon)*r;
  return(Math.atan2(Math.sin(dl)*Math.cos(f2),Math.cos(f1)*Math.sin(f2)-Math.sin(f1)*Math.cos(f2)*Math.cos(dl))/r+360)%360;
}
let qiblaOn=null;
async function openQibla(){
  if(!prayerCfg.loc){await togglePrayer();if(!prayerCfg.loc)return;}
  const b=qiblaBearing(prayerCfg.loc.lat,prayerCfg.loc.lon);
  sheet(head('🕋 Qibla')+`<div class="qibla"><div class="qibla-dial" id="qb-dial"><span>N</span><i id="qb-arrow" style="transform:rotate(${b}deg)">🕋</i></div></div>
    <div style="text-align:center;font-size:15px;font-weight:600;margin-top:10px;">${Math.round(b)}° from north</div>
    <div id="qb-tip" style="text-align:center;font-size:12px;color:var(--sub);margin-top:4px;">Hold your phone flat. If it points wrong, move it in a figure 8.</div>`+closeBtn);
  if(qiblaOn)removeEventListener('deviceorientationabsolute',qiblaOn);
  qiblaOn=e=>{
    const dial=document.getElementById('qb-dial');if(!dial){removeEventListener('deviceorientationabsolute',qiblaOn);qiblaOn=null;return;}
    if(e.alpha==null)return;const hd=(360-e.alpha)%360;
    dial.style.transform=`rotate(${-hd}deg)`;dial.classList.toggle('on',Math.abs(((b-hd+540)%360)-180)<5);
  };
  addEventListener('deviceorientationabsolute',qiblaOn);
}

// Idea 21: PC time log. Desktop Gwen reports the app in front every minute; study and work apps turn into Intellect XP.
const STUDY_APPS=/^(code|code - insiders|devenv|idea64|pycharm64|webstorm64|rider64|clion64|android studio|studio64|sublime_text|notepad\+\+|notepad|winword|excel|powerpnt|onenote|acrobat|acrord32|sumatrapdf|notion|obsidian|anki|matlab|rstudio|blender|unity|unity hub|photoshop|figma|godot.*|wps|xmind|zotero|logseq|teams|zoom)\.exe$/i;
let pcApps=null,pcAppsAt=0;
async function pullPcApps(){
  if(!gwenCfg.key||(window.DayTrackNative&&!gwenCfg.pc.trim())||Date.now()-pcAppsAt<4*60e3)return;pcAppsAt=Date.now();
  try{const r=await lifeApi('pc?apps=1&key='+encodeURIComponent(gwenCfg.key),{},6000);if(!r.ok)return;pcApps=(await r.json()).days||{};}catch(e){return;}
  // Finished days give their XP once: 10 XP per half hour of study or work, up to 80 a day
  const tod=tod0(),have=new Set((heroP.bonus||[]).filter(b=>b.k==='pctime').map(b=>b.d));let n=0;
  for(const[d]of Object.entries(pcApps)){const m=pcStudy(d);if(d<tod&&!have.has(d)&&m>=30){heroBonus(d,Math.min(80,Math.floor(m/30)*10),{intellect:1},`${fmtLeft(m)} of study and work on the PC`,'💻','pctime');n++;}}
  if(n)save();renderLife();
}
const pcStudy=d=>Object.entries((pcApps||{})[d]||{}).filter(([a])=>STUDY_APPS.test(a)).reduce((s,[,m])=>s+m,0);
function pcTimeCard(){
  const d=(pcApps||{})[tod0()];if(!d)return'';
  const top=Object.entries(d).sort((a,b)=>b[1]-a[1]).slice(0,4),all=Object.values(d).reduce((s,m)=>s+m,0),st=pcStudy(tod0());
  return`<div class="card life-card">${cardHead('💻 PC time today','')}<div style="font-size:13px;color:var(--sub);margin-bottom:6px;"><b style="color:var(--pri);">${fmtLeft(st)}</b> study and work of ${fmtLeft(all)} (games not counted)</div>
    ${top.map(([a,m])=>`<div style="display:flex;justify-content:space-between;font-size:13px;padding:2px 0;"><span>${STUDY_APPS.test(a)?'📘':'🖥️'} ${esc(a.replace(/\.exe$/i,''))}</span><span style="color:var(--sub);">${fmtLeft(m)}</span></div>`).join('')}
    <div style="font-size:11px;color:var(--sub);margin-top:6px;">Every half hour of study or work is 10 Intellect XP, added the next day.</div></div>`;
}

// Idea 29: family and friends' birthdays, a reminder the day before and on the day, and Gwen helps write the message
const bdayNext=b=>{const tod=tod0(),y=+tod.slice(0,4);let d=`${y}-${b.date}`;if(b.date==='02-29'&&!(new Date(y,1,29).getDate()===29))d=`${y}-02-28`;if(d<tod)d=`${y+1}-${b.date==='02-29'?'02-28':b.date}`;return d;};
const bdaysSoon=n=>(life.bdays||[]).map(b=>({...b,next:bdayNext(b),in:dayDiff(tod0(),bdayNext(b))})).filter(b=>b.in<=n).sort((a,b)=>a.in-b.in);
function bdayCard(){
  const l=bdaysSoon(7);if(!l.length)return'';
  return`<div class="card life-card">${cardHead('🎂 Birthdays','')}${l.map(b=>`<div class="row" style="cursor:default;"><div style="flex:1;"><div style="font-size:14px;font-weight:600;">${esc(b.name)}${b.year?` turns ${+b.next.slice(0,4)-b.year}`:''}</div><div style="font-size:11px;color:var(--sub);">${b.in===0?'Today!':b.in===1?'Tomorrow':`In ${b.in} days, ${fmtDay(b.next)}`}</div></div><button class="minibtn" onclick="bdayGwen('${b.id}')">✍️ Message</button></div>`).join('')}</div>`;
}
function openBdays(){
  const l=(life.bdays||[]).map(b=>({...b,in:dayDiff(tod0(),bdayNext(b))})).sort((a,b)=>a.in-b.in);
  sheet(head('🎂 Birthdays')+l.map(b=>`<div class="row" style="cursor:default;"><span style="flex:1;font-size:14px;">${esc(b.name)}${b.rel?` <small style="color:var(--sub);">(${esc(b.rel)})</small>`:''}</span><span style="font-size:12px;color:var(--sub);margin-inline-end:8px;">${fmtDay(bdayNext(b)).replace(/^\w+, /,'')}</span><button onclick="bdayDel('${b.id}')" style="background:none;border:none;color:var(--sub);cursor:pointer;" aria-label="Delete">✕</button></div>`).join('')
    +`<div class="sl" style="margin-top:10px;">Add someone</div><input class="inp" id="bd-name" placeholder="Name"><input class="inp" id="bd-rel" placeholder="Who they are (mum, friend…), optional" style="margin-top:6px;">
    <div style="display:flex;gap:8px;margin-top:6px;align-items:center;"><input type="date" class="inp" id="bd-date" style="flex:1;"><label style="font-size:12px;color:var(--sub);display:flex;gap:4px;align-items:center;"><input type="checkbox" id="bd-year"> Year is right</label></div>
    <button onclick="bdayAdd()" style="width:100%;margin-top:8px;background:var(--pri);color:white;${btnS}">Add</button>`+closeBtn);
}
function bdayAdd(){
  const v=id=>document.getElementById(id),name=v('bd-name').value.trim().slice(0,40),d=v('bd-date').value;
  if(!name||!/^\d{4}-\d{2}-\d{2}$/.test(d))return showToast('Add a name and a date');
  life.bdays=[...(life.bdays||[]),{id:uid(),name,rel:v('bd-rel').value.trim().slice(0,30),date:d.slice(5),year:v('bd-year').checked?+d.slice(0,4):null}];
  lifeSave();openBdays();renderLife();
}
function bdayDel(id){if(!confirm('Remove this birthday?'))return;life.bdays=life.bdays.filter(b=>b.id!==id);lifeSave();openBdays();renderLife();}
function bdayGwen(id){
  const b=(life.bdays||[]).find(x=>x.id===id);if(!b)return;
  if(!gwenCfg.key)return showToast('Add your Gwen key in Settings first');
  switchTab('gwen');const age=b.year?` They turn ${+bdayNext(b).slice(0,4)-b.year}.`:'';
  setTimeout(()=>sendGwen({said:`Help me write a short birthday message for ${b.name}${b.rel?` (my ${b.rel})`:''}.${age} Give me one I can send as it is.`}),300);
}
const bdayNudges=()=>{
  const wake=gwenCfg.wake||'09:00',last=addDays(tod0(),1),out=[];
  for(const b of bdaysSoon(2)){
    if(b.in>=1)out.push({id:'bd1'+b.id,date:addDays(b.next,-1),at:'20:00',title:'🎂 '+b.name,text:`${b.name}'s birthday is tomorrow. Want me to help you write something? 💜`});
    out.push({id:'bd0'+b.id,date:b.next,at:wake,title:'🎂 '+b.name,text:`It's ${b.name}'s birthday today! Don't forget to send them something 💜`});
  }
  return out.filter(n=>n.date<=last);
};

// Idea 1: his mount and forged weapon, for her house
function heroForHouse(){
  if(typeof heroMount!=='function')return undefined;
  const m=heroMount().cur,f=(heroP.forged||[]),w=f[f.length-1];
  return{mount:m?m[0]:null,weapon:w&&HERO_WEAPONS[w]?{id:w,name:HERO_WEAPONS[w][0]}:null};
}

// Idea 3: on the first day of a month the app tells DayTrack.exe how his month went and Gwen writes him a letter
const LETTERS_FROM='2026-10'; // her first full month
async function monthLetter(){
  if(!gwenCfg.key||!house)return;
  const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-1);const m=toDateStr(d).slice(0,7);
  if(m<LETTERS_FROM||life.letterSent===m||(house.letter&&house.letter.month>=m))return;
  life.letterSent=m;lifeSave();
  const days=new Set(),count={};tasks.forEach(t=>t.done.filter(x=>x.startsWith(m)).forEach(x=>{days.add(x);count[t.name]=(count[t.name]||0)+1;}));
  const done=Object.values(count).reduce((s,n)=>s+n,0),full=completedDays.filter(x=>x.startsWith(m)).length;
  const top=Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([n,c])=>`${n} (${c}x)`);
  const km=(heroP.walks||[]).filter(w=>(w.d||'').startsWith(m)).reduce((s,w)=>s+(w.m||0),0)/1000;
  const md=Object.entries(moods).filter(([x])=>x.startsWith(m)).map(([,v])=>v),h=typeof heroState==='function'?heroState():null;
  const lines=[`He finished ${done} tasks on ${days.size} days, and every task on ${full} of them.`,top.length&&`What he did most: ${top.join(', ')}.`,
    h&&`He is now Level ${h.L} (${h.rank} ${h.cls}).`,km>=1&&`He walked ${km.toFixed(1)} km.`,md.length&&`His average mood was ${['very low','low','okay','good','great'][Math.round(md.reduce((s,v)=>s+v,0)/md.length)-1]}.`,
    (life.bdays||[]).some(b=>b.date.startsWith(m.slice(5)))&&`Birthdays this month: ${life.bdays.filter(b=>b.date.startsWith(m.slice(5))).map(b=>b.name).join(', ')}.`].filter(Boolean);
  try{const r=await lifePost('house',{event:'month',month:m,lines},60000),j=await r.json();if(j.letter){house.letter=j.letter;renderLife();}}catch(e){life.letterSent=null;lifeSave();}
}
function letterCard(){
  const l=house&&house.letter;if(!l||l.read)return'';
  return`<div class="card life-card" style="cursor:pointer;" onclick="openLetter()">${cardHead('💌 A letter from Gwen','')}<div style="font-size:13px;color:var(--sub);">She wrote you about ${new Date(l.month+'-15T12:00:00').toLocaleDateString('en-US',{month:'long'})}. Tap to read it.</div></div>`;
}
function openLetter(){
  const l=house&&house.letter;if(!l)return;
  sheet(head('💌 '+new Date(l.month+'-15T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'}))+`<div class="letter">${esc(l.text)}</div>`+closeBtn);
  if(!l.read){l.read=Date.now();renderLife();lifePost('house',{event:'letter',id:l.id}).catch(()=>{});}
}

// Idea 24: a file sent from the PC ("Gwen, send this to my phone") downloads into the phone's Downloads
window.lifeFileBtn=f=>/^[a-f0-9]{32}$/.test(f.id)?`<button onclick="event.stopPropagation();lifeGetFile('${f.id}')" class="minibtn" style="display:block;margin-top:6px;">⬇️ ${esc(f.name)}${f.size?` · ${f.size>1e6?(f.size/1e6).toFixed(1)+' MB':Math.ceil(f.size/1e3)+' KB'}`:''}</button>`:'';
function lifeGetFile(id){
  const f=(gwenChat.find(m=>m.file&&m.file.id===id)||{}).file,name=(f&&f.name)||'file',path='/.netlify/functions/pc?file='+id;
  if(has('download')){N().download(path,name);showToast('⬇️ Downloading…');return;}
  const a=document.createElement('a');a.href=path;a.download=name;a.click();
}

// ── Cards, settings, Gwen's context ───────────────────────────────────────────
function renderLife(){
  const top=document.getElementById('life-top'),bot=document.getElementById('life-bottom');if(!top)return;
  top.innerHTML=letterCard()+bdayCard()+top3Card()+waterCard()+ramadanCard()+adhkarCard()+sundayCard()+spreadCard()+quranCard(); // Gwen's quest shows with the daily quests (levels.js)
  renderHeroMini();
  bot.innerHTML=chainsCard()+billsCard()+pcTimeCard()+photosCard()+routinesCard();
  renderSpend();chainHighlight();renderFriends();
}
function renderLifeSettings(){
  const el=document.getElementById('life-settings');if(!el)return;
  const tog=(on,fn)=>`<button class="tog${on?' on':''}" onclick="${fn}"></button>`;
  const row=(t,s,right)=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--brd);"><div><div style="font-size:15px;font-weight:600;">${t}</div><div style="font-size:12px;color:var(--sub);margin-top:2px;">${s}</div></div>${right}</div>`;
  el.innerHTML=`<div class="card"><div class="cl">Faith</div>
      ${row('🤲 Adhkar reminders','After Fajr and Asr (needs prayer times on)',tog(life.adhkar.on,'toggleAdhkar()'))}
      <div style="display:flex;gap:8px;margin-top:6px;"><button class="minibtn" style="flex:1;" onclick="openAdhkar('m')">🌅 Morning</button><button class="minibtn" style="flex:1;" onclick="openAdhkar('e')">🌇 Evening</button><button class="minibtn" style="flex:1;" onclick="openTasbih()">📿 Tasbih</button></div>
      ${row('🕋 Qibla','A compass pointing to the Kaaba, from your prayer-times location','<button class="minibtn" onclick="openQibla()">Open</button>')}
      ${row('📖 Quran plan',life.quran?`Page ${life.quran.page} · ${life.quran.mode==='daily'?life.quran.perDay+' a day':'khatma by '+fmtDay(life.quran.by)}`:'A page a day, or a khatma by a date',`<button class="minibtn" onclick="quranSetup()">${life.quran?'Edit':'Set up'}</button>`)}
    </div>
    <div class="card"><div class="cl">Daily helpers</div>
      ${row('💧 Water','One tap per glass; Gwen nudges you if you fall behind',tog(life.water.on,'toggleWater()'))}
      ${life.water.on?`<div style="display:flex;align-items:center;gap:8px;font-size:13px;flex-wrap:wrap;">Glasses a day <input type="number" class="inp" style="width:80px;" min="1" max="20" value="${life.water.goal}" onchange="life.water.goal=Math.max(1,Math.min(20,parseInt(this.value,10)||8));lifeSave();renderLife();"><button class="rb${life.water.remind!==false?' on':''}" onclick="life.water.remind=life.water.remind===false;lifeSave();renderLifeSettings();">🔔 Reminders</button></div>`:''}
      ${row('💜 Gwen\'s top 3','Each morning she picks the 3 tasks to do first, the ones you usually skip',tog(life.top3On,'life.top3On=!life.top3On;lifeSave();renderLifeSettings();renderLife();'))}
      ${row('🗓 Spread unfinished tasks','Gwen moves what\'s left over the next days (she also offers it at night)','<button class="minibtn" onclick="openSpread()">Spread</button>')}
      ${row('🚗 Car and bills','Oil change, insurance, phone bill: a heads-up a few days before',`<button class="minibtn" onclick="editBill()">+ Add</button>`)}
      ${row('📸 Progress photos','A weekly photo of your body or room, kept on this device only',tog(lifeDev.photos,'lifeDev.photos=!lifeDev.photos;lifeDevStore();renderLifeSettings();renderLife();'))}
      ${lifeDev.photos?row('📅 Weekly photo reminder','Same day each week',tog(lifeDev.photoRemind,'lifeDev.photoRemind=!lifeDev.photoRemind;lifeDevStore();renderLifeSettings();save();')):''}
      ${row('🎂 Birthdays','Family and friends: a reminder the day before, and Gwen helps you write the message',`<button class="minibtn" onclick="openBdays()">${(life.bdays||[]).length?'Edit':'+ Add'}</button>`)}
      ${row('🗑️ Recently deleted','Bring back a task you deleted in the last 30 days',`<button class="minibtn" onclick="openTrash()">Open${trashKeep().length?` (${trashKeep().length})`:''}</button>`)}
      ${has('nowNext')?row('🔒 Now and next on the lock screen','Your current task and the next one, with a Done button',tog(lifeDev.nowNext,'toggleNowNext()')):''}
      ${has('focusStart')?row('🎯 Focus lock','While a timer runs, opening TikTok, YouTube, Instagram, Snapchat or a game gets you told off. Stay focused for bonus XP',tog(lifeDev.focus,'toggleFocus()')):''}
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
    life.water.on?`Water today: ${waterN()} of ${life.water.goal} glasses.`:'',
    life.top3On&&top3Today().length?`Your top 3 picks for him today (do these first): ${top3Today().map(p=>p.t.name+(p.t.done.includes(tod)?' (done)':'')).join(', ')}.`:'',
    life.chains.length?`His habit chains (one leads into the next): ${life.chains.map(c=>`${c.name}: ${chainTasks(c).map(t=>t.name+(t.done.includes(tod)?' ✓':'')).join(' → ')}`).join('; ')}.`:'',
    life.bills.filter(b=>dayDiff(tod,b.due)<=b.warn).map(b=>`${b.name} is due ${fmtDay(b.due)}.`).join(' '),
    planCtx,
    bdaysSoon(14).map(b=>`${b.name}${b.rel?` (his ${b.rel})`:''} has a birthday ${b.in===0?'today':b.in===1?'tomorrow':`in ${b.in} days`}.`).join(' '),
    historyLines(),
  ].filter(Boolean).join('\n\n');
};
// Her action lines this file adds: SPEND
window.lifeActions=text=>text.replace(/^[ \t*-]*SPEND:\s*(.+)$/gim,(_,spec)=>{const[what,amt]=spec.split('|').map(x=>(x||'').trim());const e=addSpend(`${what} ${amt}`,true);if(e)showToast(`💰 Logged ${e.label} · ${e.amt} SAR`);return'';});
// What the server needs for reminders and Gwen's texts
window.lifeReminders=()=>({nudges:[...bdayNudges(),...lifeNudges()].slice(0,20),hero:heroForHouse(),adhkar:!!life.adhkar.on,spend:spendWeek(),events:evOn(toDateStr(new Date())).map(e=>({title:e.title,at:e.allDay?null:`${pad(new Date(e.start).getHours())}:${pad(new Date(e.start).getMinutes())}`}))});
window.lifeSaved=()=>{syncPlaces();queueShare();syncNowNext();};

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
    .water{display:flex;flex-wrap:wrap;gap:4px;}.water button{width:34px;height:34px;border-radius:10px;border:none;background:var(--inp);font-size:18px;cursor:pointer;opacity:.35;padding:0;}.water button.on{background:var(--pril);opacity:1;}
    .chain{padding:6px 0;border-bottom:1px solid var(--brd);}.chain:last-child{border-bottom:none;}
    .chain-steps{display:flex;flex-wrap:wrap;align-items:center;gap:4px;}.chain-steps i{color:var(--sub);font-style:normal;}
    .chain-steps button{background:var(--inp);color:var(--txt);border:1.5px solid transparent;border-radius:14px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
    .chain-steps button.on{background:var(--pril);color:var(--pri);}.chain-steps button.nx{border-color:var(--pri);}
    .task-item.chain-next .task-main{border-inline-start:3px solid var(--pri);padding-inline-start:8px;}
    .pstrip{display:flex;gap:6px;overflow-x:auto;}.pstrip img,.pstrip button{width:64px;height:64px;border-radius:10px;object-fit:cover;flex-shrink:0;cursor:pointer;}
    .pstrip button{border:1.5px dashed var(--brd);background:none;color:var(--pri);font-size:22px;}
    .qibla{display:flex;justify-content:center;}.qibla-dial{width:220px;height:220px;border-radius:50%;border:3px solid var(--brd);position:relative;transition:transform .2s linear;}
    .qibla-dial.on{border-color:var(--grn);box-shadow:0 0 24px var(--grn);}.qibla-dial span{position:absolute;top:6px;left:50%;transform:translateX(-50%);font-weight:700;color:#EF4444;}
    .qibla-dial i{position:absolute;inset:0;display:flex;justify-content:center;font-style:normal;font-size:30px;padding-top:28px;}
    .letter{white-space:pre-wrap;font-size:15px;line-height:1.7;background:var(--pril);border-radius:14px;padding:16px;font-family:Georgia,serif;}
    .pcmp{display:grid;grid-template-columns:1fr 1fr;gap:8px;}.pcmp img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:12px;display:block;margin-bottom:6px;}
  </style>`);
  renderLife();renderLifeSettings();
  if(new Date().toISOString()>=YEAR_DAY&&toDateStr(new Date())>=YEAR_DAY){
    const c=document.querySelector('#tab-gwen .hscroll');if(c)c.insertAdjacentHTML('afterbegin','<button class="gchip" onclick="openYear()">🎂 Our first year</button>');
    if(!life.yearShown)setTimeout(openYear,2500);
  }
  pullHouse().then(monthLetter);syncShares();readSteps();syncPlaces();syncNowNext();setTimeout(pullPcApps,3000);
  setInterval(focusCheck,2000);document.addEventListener('click',()=>setTimeout(focusCheck,0),true);
  setInterval(()=>{if(!document.hidden&&window.__dtResume)__dtResume();},30e3); // ticks from the home-screen widget
  setInterval(()=>{syncNowNext();if(document.hidden)return;renderLife();},60e3);
  setInterval(()=>{if(document.hidden)return;pullHouse().then(monthLetter);readSteps();friendsPush();pullPcApps();},5*60e3);
  setInterval(()=>{if(!document.hidden&&document.getElementById('dt-ov').classList.contains('on'))syncShares();},20e3);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)return;pullPcApps();pullHouse();syncShares();readSteps();renderLifeSettings();focusBack();});
})();

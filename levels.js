// Levels: Rayan as a game character. XP is worked out from what DayTrack already saves (ticked tasks,
// counts, finished days, goal steps, timer sessions) plus mastered skill steps, so it syncs, counts the
// past, and goes back down if a tick is undone. Loaded before the main script; everything here is called from it.

const HERO_STATS=[
  {id:'arms',name:'Arms',ic:'💪',g:'Body'},{id:'chest',name:'Chest',ic:'🛡️',g:'Body'},{id:'back',name:'Back',ic:'🦅',g:'Body'},
  {id:'core',name:'Core',ic:'🔥',g:'Body'},{id:'legs',name:'Legs',ic:'🦵',g:'Body'},{id:'endurance',name:'Endurance',ic:'🫀',g:'Body'},
  {id:'intellect',name:'Intellect',ic:'🧠',g:'Mind'},{id:'focus',name:'Focus',ic:'🎯',g:'Mind'},{id:'creativity',name:'Creativity',ic:'🎨',g:'Mind'},
  {id:'faith',name:'Faith',ic:'🕌',g:'Spirit'},{id:'discipline',name:'Discipline',ic:'⚔️',g:'Spirit'},
  {id:'vitality',name:'Vitality',ic:'🍎',g:'Life'},{id:'charisma',name:'Charisma',ic:'🗣️',g:'Life'},{id:'wealth',name:'Wealth',ic:'💰',g:'Life'},
];
const HERO_BY=Object.fromEntries(HERO_STATS.map(s=>[s.id,s]));
const HERO_GROUPS={Body:'Fighter',Mind:'Scholar',Spirit:'Monk',Life:'Adventurer'}; // class = strongest group
const HERO_RANKS=[[75,'Legend'],[50,'Grandmaster'],[40,'Master'],[30,'Elite'],[20,'Veteran'],[15,'Warrior'],[10,'Adept'],[5,'Apprentice'],[1,'Novice']];
// What a task trains, from words in its name (first match wins per rule; several rules can match)
const HERO_RULES=[
  [/push.?ups?|press.?ups?|ضغط|bench/i,{chest:1,arms:1,core:.3}],
  [/\bdips?\b/i,{chest:1,arms:1}],
  [/pull.?ups?|chin.?ups?|\brows?\b|deadlift|muscle.?up|عقلة/i,{back:1,arms:1}],
  [/curls?|biceps?|triceps?|\barms?\b|shoulder|handstand/i,{arms:1,core:.3}],
  [/plank|sit.?ups?|crunch|\babs\b|\bcore\b|leg raise|l.?sit|hollow/i,{core:1}],
  [/squats?|lunges?|\blegs?\b|calf|calves|pistol|jump/i,{legs:1,core:.2}],
  [/\brun|jog|walk|steps\b|cardio|bike|cycl|swim|hike|skipping|jump rope|burpee|مشي|جري/i,{endurance:1,legs:.5}],
  [/gym|workout|work out|exercise|train|calisthenic|sport|football|soccer|basketball|padel|fitness|رياضة|تمرين/i,{arms:.5,chest:.5,back:.5,core:.5,legs:.5,endurance:.5}],
  [/stretch|yoga|mobility/i,{vitality:.6,core:.3}],
  [/study|homework|course|class|lesson|exam|revis|research|learn|lecture|مذاكرة|دراسة/i,{intellect:1,focus:.5}],
  [/^(?!.*qur'?an|.*قرآن).*(\bread|book|pages?\b|chapter|قراءة)/i,{intellect:1,focus:.3}],
  [/\bcode|coding|program|python|javascript|unity|github/i,{intellect:1,creativity:.3,wealth:.3}],
  [/english|arabic|japanese|spanish|french|korean|language|duolingo|vocab/i,{intellect:1,charisma:.5}],
  [/focus|deep work|pomodoro|no phone|meditat|journal/i,{focus:1}],
  [/draw|paint|sketch|music|guitar|piano|sing|\bwrit|design|\bart\b|edit|video|photo|blender|vroid/i,{creativity:1}],
  [/pray|salah|salat|prayer|quran|qur'?an|dhikr|adhkar|azkar|mosque|masjid|fajr|dhuhr|asr|maghrib|isha|dua|fasting|\bfast\b|صلاة|قرآن|اذكار|أذكار/i,{faith:1,discipline:.3}],
  [/clean|tidy|laundry|dishes|make (the |my )?bed|chores|organi[sz]e|wake up|alarm|routine|vacuum|trash/i,{discipline:1}],
  [/water|drink|vitamin|meds|medicine|pill|sleep|\bnap\b|diet|\beat|meal|fruit|veg|protein|cook|healthy|skincare|shower|teeth|floss|sun ?light/i,{vitality:1}],
  [/\bcall|friend|family|\bmom|\bdad|mother|father|brother|sister|text |meet|social|visit|guests?|gift|people/i,{charisma:1}],
  [/\bwork\b|\bjob\b|money|sav(e|ing)|budget|invest|\bbills?\b|\bpay\b|business|client|email|meeting|apply|interview|resume|cv\b|sell|haraj/i,{wealth:1}],
];
function heroDetect(text){
  const st={};
  HERO_RULES.forEach(([re,w])=>{if(re.test(text))for(const k in w)st[k]=Math.max(st[k]||0,w[k]);});
  return st;
}

// ── Skills: steps from easy to hard; each mastered step gives XP to the skill's stats ──
// [name, goal, how]
const HERO_SKILLS=[
  {id:'pushup',cat:'Calisthenics',name:'Push-up path',ic:'💪',st:{chest:1,arms:1,core:.3},days:[0,2,4],steps:[
    ['Wall push-ups','3 sets of 15','Hands on a wall at shoulder height, body straight. Bring your chest to the wall and push back.'],
    ['Incline push-ups','3 sets of 12 on a table or bench','Hands on a sturdy table edge. The lower the surface, the harder it gets.'],
    ['Knee push-ups','3 sets of 15','Knees on the floor, hips in line with your shoulders, chest close to the floor on every rep.'],
    ['Full push-ups','3 sets of 10','Hands under your shoulders, elbows about 45° from your body, squeeze your glutes so your hips don\'t sag.'],
    ['Diamond push-ups','3 sets of 10','Thumbs and index fingers make a diamond under your chest. Works the triceps much harder.'],
    ['Archer push-ups','3 sets of 6 each side','Hands wide. Shift your weight onto one arm while the other stays straight out to the side.'],
    ['One-arm push-up','3 reps each side','Feet wide, hand under your chest. Start on an incline and lower it over the weeks.']]},
  {id:'pullup',cat:'Calisthenics',name:'Pull-up path',ic:'🦅',st:{back:1,arms:1},days:[1,3,5],steps:[
    ['Dead hang','Hold 30 seconds','Hang from a bar with straight arms and active shoulders. Builds the grip everything else needs.'],
    ['Scapular pulls','3 sets of 10','While hanging, pull your shoulders down and back without bending your arms.'],
    ['Australian rows','3 sets of 12','Under a low bar or sturdy table, body straight, pull your chest up to it.'],
    ['Negative pull-ups','3 sets of 5, 5 seconds down','Jump or step to the top, then lower yourself as slowly as you can.'],
    ['First pull-up','1 clean rep','From a full hang to chin over the bar, no kicking or swinging.'],
    ['Pull-ups','3 sets of 8','Same clean form. Rest two minutes between sets.'],
    ['Muscle-up','1 rep','An explosive chest-to-bar pull, then lean over the bar and press up. Practise high pull-ups first.']]},
  {id:'legs',cat:'Calisthenics',name:'Leg path',ic:'🦵',st:{legs:1,core:.3},days:[1,3,5],steps:[
    ['Bodyweight squats','3 sets of 20','Feet shoulder width, sit back and down until your thighs are level, knees follow your toes.'],
    ['Lunges','3 sets of 12 each leg','A long step forward, back knee almost touches the floor, chest up.'],
    ['Bulgarian split squats','3 sets of 10 each leg','Back foot on a chair, lower straight down on the front leg.'],
    ['Assisted pistol squat','3 sets of 5 each leg','Hold a door frame and squat on one leg with the other straight out in front.'],
    ['Pistol squat','5 each leg','The same with no help. Reach your arms forward for balance.'],
    ['Shrimp squat','5 each leg','Hold your back foot behind you and lower that knee to the floor.']]},
  {id:'core',cat:'Calisthenics',name:'Core path',ic:'🔥',st:{core:1},days:[],steps:[
    ['Plank','Hold 60 seconds','Elbows under shoulders, body one straight line, squeeze your glutes.'],
    ['Hollow body hold','Hold 30 seconds','Lower back pressed into the floor, arms and legs a little off the ground.'],
    ['Hanging knee raises','3 sets of 12','Hang from a bar and bring your knees to your chest without swinging.'],
    ['Hanging leg raises','3 sets of 10','Straight legs up to hip height or higher.'],
    ['L-sit','Hold 10 seconds','On parallel bars, two chairs or the floor, press up and hold your legs straight out.'],
    ['Dragon flag','3 sets of 3','Lying on a bench, hold behind your head, lift your whole straight body and lower it slowly.']]},
  {id:'handstand',cat:'Calisthenics',name:'Handstand path',ic:'🤸',st:{arms:1,core:.5,focus:.3},days:[0,2,4],steps:[
    ['Pike hold','Hold 30 seconds','Hands on the floor, hips high, weight leaning into your shoulders.'],
    ['Wall walk','3 reps','Feet on the wall, walk your hands in until your chest is close to it, then walk back out.'],
    ['Chest-to-wall handstand','Hold 45 seconds','Belly facing the wall, body straight, push the floor away.'],
    ['Kick-up to the wall','10 soft kick-ups','Back to the wall, kick up gently with one leg and let the other follow.'],
    ['Freestanding handstand','Hold 10 seconds','Balance with your fingertips. Learn to bail out by stepping or cartwheeling to the side first.'],
    ['Handstand push-up (wall)','3 sets of 3','Lower your head to the floor between your hands and press back up.']]},
  {id:'dips',cat:'Calisthenics',name:'Dip path',ic:'🛡️',st:{chest:1,arms:1},days:[0,2,4],steps:[
    ['Bench dips','3 sets of 12','Hands on a chair behind you, bend your elbows to 90° and push back up.'],
    ['Support hold','Hold 30 seconds','On parallel bars or two sturdy chairs, arms locked, shoulders down.'],
    ['Negative dips','3 sets of 5, 5 seconds down','Start at the top and lower yourself slowly.'],
    ['Parallel bar dips','3 sets of 10','Lean a little forward and go down until your shoulders are below your elbows.'],
    ['Straight bar dips','3 sets of 5','On a single bar: harder balance, and the first step to a muscle-up.']]},
  {id:'run',cat:'Calisthenics',name:'Running',ic:'🏃',st:{endurance:1,legs:.5},days:[0,2,4],steps:[
    ['Brisk walk','30 minutes','Walk fast enough that talking takes a little effort.'],
    ['Run and walk','1 min run, 1 min walk, 10 times','Run slowly enough to talk. Speed comes later.'],
    ['Run 2 km','Without stopping','Same easy pace. If you have to stop, slow down next time.'],
    ['Run 5 km','Without stopping','Add about 10% distance a week, not more.'],
    ['5 km under 30 minutes','One timed run','One faster day a week, everything else easy.'],
    ['Run 10 km','Without stopping','A long slow run once a week builds it.']]},
  {id:'cook',cat:'Life skills',name:'Cooking',ic:'🍳',st:{vitality:1,creativity:.3},days:[5],steps:[
    ['Perfect eggs','Boiled, scrambled and fried','Boiled: 7 minutes in boiling water then cold water. Scrambled: low heat, keep stirring, take off a little early.'],
    ['Rice that isn\'t sticky','3 good pots','Rinse until the water runs clear, about 1 cup rice to 1.5 water, lid on, lowest heat 15 minutes, rest 10.'],
    ['Juicy chicken','Pan-cooked chicken breast','Even thickness, hot pan, don\'t move it for the first 5 minutes, rest it 5 minutes before cutting.'],
    ['One family dish','Kabsa or any dish from home','Ask someone at home to cook it with you once, then make it alone.'],
    ['Meal prep','3 days of lunches in one go','Pick one protein, one carb and one vegetable, cook them together, split into boxes.'],
    ['10 dishes from memory','No recipe needed','Write the list on a DayTrack list and tick them off.']]},
  {id:'money',cat:'Life skills',name:'Money',ic:'💰',st:{wealth:1,discipline:.3},days:[5],steps:[
    ['Track every riyal','7 days','Write down everything you spend for a week. Just looking at it changes habits.'],
    ['Monthly budget','A plan for one month','Split income into needs, wants and savings (a common start is 50/30/20).'],
    ['Pay yourself first','Save 10% of every income for a month','Move it out the day the money arrives, before spending anything.'],
    ['Emergency fund','1 month of expenses saved','Keep it separate from your spending account.'],
    ['Learn halal investing','Understand how funds and sukuk work','Read how index funds and sukuk work and what fees mean. Learn before you put money in.'],
    ['Emergency fund','3 months of expenses saved','Now money surprises stop being emergencies.']]},
  {id:'focus',cat:'Life skills',name:'Deep focus',ic:'🎯',st:{focus:1,discipline:.3},days:[],steps:[
    ['One pomodoro','25 minutes, phone in another room','One task, a timer, no switching. Use the Timer tab.'],
    ['Four pomodoros','In one day','25 minutes on, 5 minutes off, four times.'],
    ['Deep work block','90 minutes in one go','Plan what you\'ll do before you start, close everything else.'],
    ['Deep work week','A 90-minute block every day for 7 days','Same time every day makes it automatic.'],
    ['Double block','Two 90-minute blocks in one day','A real break between them: walk, eat, no screens.']]},
  {id:'prayer',cat:'Life skills',name:'Prayer on time',ic:'🕌',st:{faith:1,discipline:.5},days:[],steps:[
    ['One full day','All five prayers on time','Turn on prayer times in Settings so DayTrack reminds you.'],
    ['Seven days','All five on time for a week','If you miss one, just restart the count.'],
    ['Fajr streak','Fajr on time for 14 days','Sleep earlier the night before; it\'s the hardest one.'],
    ['Thirty days','All five on time for a month','By now it\'s a habit, not an effort.']]},
  {id:'quran',cat:'Life skills',name:'Quran memorization',ic:'📖',st:{faith:1,focus:.3},days:[],steps:[
    ['The last ten surahs','From Al-Fil to An-Nas','A few verses a day: read, repeat ten times, recite them in your prayers.'],
    ['Half of Juz Amma','Up to Al-A\'la','Review old surahs every day before adding new ones.'],
    ['Juz Amma','All of juz 30','Recite to someone who can correct you.'],
    ['Juz Tabarak','All of juz 29','Same method: little by little, with daily review.'],
    ['Surah Al-Kahf','By heart','Many read it every Friday; that\'s weekly review built in.']]},
  {id:'speak',cat:'Life skills',name:'Public speaking',ic:'🗣️',st:{charisma:1,creativity:.3},days:[3],steps:[
    ['Watch yourself','Record a 1-minute talk and watch it','Any topic. Watching it back is uncomfortable, and that\'s how you improve.'],
    ['Tell a story','To friends, without notes','Beginning, problem, ending. Keep it under two minutes.'],
    ['No filler words','A 3-minute talk with no "umm"','Pause instead of saying "umm". Pauses sound confident.'],
    ['Speak up','Share an idea in a group or class','Say it in the first ten minutes before nerves build.'],
    ['Presentation','A 5-minute talk in front of people','Practise it out loud three times the day before.']]},
  {id:'firstaid',cat:'Life skills',name:'First aid',ic:'⛑️',st:{vitality:.5,intellect:.5,charisma:.3},days:[],steps:[
    ['Call for help','Know 997 and the recovery position','In Saudi Arabia 997 is the ambulance. Practise rolling someone onto their side with a friend.'],
    ['Bleeding','Know how to stop it','Firm pressure with a clean cloth and keep pressing. Raise the limb if you can.'],
    ['Burns','Know what to do','Cool running water for 20 minutes. No ice, no toothpaste.'],
    ['Choking','Know the steps','Five firm back blows between the shoulder blades, then five abdominal thrusts.'],
    ['CPR','Take a certified course','30 hard, fast chest pushes (100-120 a minute) and 2 breaths. A real course is the only proper way to learn it.']]},
  {id:'sleep',cat:'Life skills',name:'Sleep routine',ic:'😴',st:{vitality:1,discipline:.5},days:[],steps:[
    ['Same wake-up time','7 days in a row','Even on weekends. Set it in Settings so Gwen wakes you.'],
    ['Screens off','No screens 30 minutes before bed for 7 days','Read, pray or stretch instead.'],
    ['Seven hours','7+ hours sleep for 7 nights','Log it on the Tasks tab each morning.'],
    ['Before midnight','Asleep before 12 for 14 nights','Move bedtime earlier 15 minutes at a time.']]},
  {id:'typing',cat:'Life skills',name:'Touch typing',ic:'⌨️',st:{intellect:.5,focus:.5,wealth:.3},days:[],steps:[
    ['Home row','Type without looking at the keys','Fingers on ASDF and JKL;. Cover your hands if you have to.'],
    ['30 words a minute','Without looking','Try monkeytype.com, 10 minutes a day.'],
    ['50 words a minute','With 95% accuracy','Accuracy first, speed follows.'],
    ['70 words a minute','With 95% accuracy','Practise real sentences, not just words.'],
    ['90 words a minute','With 95% accuracy','You now type faster than most people think.']]},
  {id:'code',cat:'Life skills',name:'Coding',ic:'💻',st:{intellect:1,creativity:.3,wealth:.5},days:[],steps:[
    ['Python basics','Variables, loops and functions','Any free beginner course. Type every example yourself.'],
    ['A small program','A calculator or quiz game','Finishing something small teaches more than another tutorial.'],
    ['Git and GitHub','Push a project to GitHub','Learn commit, push and pull.'],
    ['A real tool','Build something you\'ll actually use','Automate something boring in your own life.'],
    ['Share it','Someone else uses your code','Help a friend, or fix a small issue in an open project.']]},
  {id:'lang',cat:'Life skills',name:'A new language',ic:'🌍',st:{intellect:1,charisma:.5},days:[],steps:[
    ['First 100 words','The most common 100 words','Flashcards, 10 minutes a day.'],
    ['30-day streak','A lesson every day for a month','Small and daily beats long and rare.'],
    ['First conversation','5 minutes with a real person','Online exchange partners or a friend who speaks it.'],
    ['A show without subtitles','One episode','Pick something you\'ve already seen in your own language.']]},
];
const heroSkills=()=>HERO_SKILLS.concat((heroP.custom||[]).map(c=>({...c,cat:'My skills',custom:true})));
const heroSkill=id=>heroSkills().find(s=>s.id===id);

// Saved per device and synced: XP kept from deleted tasks, skill progress, own skills, avatar
let heroP={bank:[],skills:{},custom:[],av:'🧑'};
function heroLoad(){try{heroP={...heroP,...JSON.parse(localStorage.getItem('dt_player')||'{}')};}catch(e){}}
function heroWrite(){try{localStorage.setItem('dt_player',JSON.stringify(heroP));}catch(e){}}

// ── XP ──
const heroLvl=(xp,b)=>Math.floor((1+Math.sqrt(1+4*Math.max(0,xp)/b))/2); // XP to reach level L is b·L·(L-1)
const heroAt=(L,b)=>b*L*(L-1);
const HERO_B=50,HERO_SB=25; // overall, per stat
function taskStats(t){
  if(t.stats&&t.stats.length)return Object.fromEntries(t.stats.map(k=>[k,1]));
  const sk=t.skill&&heroSkill(t.skill);if(sk)return sk.st;
  const st=heroDetect(`${t.name} ${t.count&&t.count.unit||''}`);
  return Object.keys(st).length?st:{discipline:1};
}
function taskXP(t){return 20+(t.priority==='high'?10:t.priority==='medium'?5:0)+(t.count?Math.min(30,Math.round(t.count.target/2)):0);}
const sx=(xp,st)=>Object.fromEntries(Object.entries(st).map(([k,w])=>[k,Math.round(xp*w)]));
const tIcon=t=>t.iconType==='image'?'✅':t.icon||'✅';
// Every XP award, oldest first: {d: date, xp, sx: {stat: xp}, what, ic}
function heroTaskAwards(t){
  const out=[],st=taskStats(t),xp=taskXP(t),ic=tIcon(t),add=(d,x,what)=>d&&x>0&&out.push({d,xp:x,sx:sx(x,st),what,ic});
  t.done.forEach(d=>add(d,xp,t.name));
  if(t.count)Object.entries(t.counts||{}).forEach(([d,n])=>{if(!t.done.includes(d))add(d,Math.round(xp*n/t.count.target),`${t.name} (${n}/${t.count.target})`);});
  (t.subtasks||[]).forEach(s=>(s.done||[]).forEach(d=>add(d,5,s.name)));
  return out;
}
function heroAwards(){
  const out=tasks.flatMap(heroTaskAwards),add=(d,xp,st,what,ic)=>d&&xp>0&&out.push({d,xp,sx:sx(xp,st),what,ic});
  completedDays.forEach(d=>add(d,30,{discipline:1},'Finished every task','🏆'));
  goals.forEach(g=>{const st={...heroDetect(g.name),discipline:.5};g.steps.forEach(s=>add(s.done,25,st,s.name,'🎯'));});
  savedSessions.forEach(s=>add(sessDate(s),Math.min(120,Math.round(s.total/120000)),{...heroDetect(s.name),focus:1},s.name,'⏱️'));
  Object.entries(heroP.skills||{}).forEach(([id,p])=>{const sk=heroSkill(id);if(sk)(p.at||[]).forEach((d,i)=>sk.steps[i]&&add(d,60*(i+1),sk.st,stepName(sk,i),sk.ic));});
  (heroP.bank||[]).forEach(b=>out.push(b));
  return out.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
}
// Sessions only keep "Wed, Oct 8": that date in the last 12 months
function sessDate(s){
  if(s.day)return s.day;
  const now=new Date(),d=new Date(`${s.date} ${now.getFullYear()} 12:00`);if(isNaN(d))return null;
  if(d>now)d.setFullYear(d.getFullYear()-1);return toDateStr(d);
}
function heroSum(awards){
  const s={total:0,st:Object.fromEntries(HERO_STATS.map(x=>[x.id,0]))};
  awards.forEach(a=>{s.total+=a.xp;for(const k in a.sx)if(k in s.st)s.st[k]+=a.sx[k];});
  return s;
}
function heroState(){
  const aw=heroAwards(),s=heroSum(aw),L=heroLvl(s.total,HERO_B),tod=toDateStr(new Date());
  const groups={};HERO_STATS.forEach(x=>groups[x.g]=(groups[x.g]||0)+s.st[x.id]);
  const top=Object.entries(groups).sort((a,b)=>b[1]-a[1])[0];
  return{aw,s,L,rank:HERO_RANKS.find(r=>L>=r[0])[1],cls:top[1]?HERO_GROUPS[top[0]]:'Beginner',
    today:aw.filter(a=>a.d===tod).reduce((n,a)=>n+a.xp,0)};
}
// Each time something reached a new level, replayed from the start: [{d, what, ic, L, via}]
function heroLevelUps(aw){
  const xp={total:0},lv={total:1},out=[];
  aw.forEach(a=>{
    const step=(k,add,b,name,ic)=>{xp[k]=(xp[k]||0)+add;const L=heroLvl(xp[k],b);if(L>(lv[k]||1)){lv[k]=L;out.push({d:a.d,name,ic,L,via:a.what});}};
    step('total',a.xp,HERO_B,'Level','⭐');
    for(const k in a.sx)if(HERO_BY[k])step(k,a.sx[k],HERO_SB,HERO_BY[k].name,HERO_BY[k].ic);
  });
  return out.reverse();
}

// ── After every save: show what just went up ──
let heroLast=null;
function heroTick(silent){
  const s=heroSum(heroAwards()),prev=heroLast;heroLast=s;
  if(silent||!prev||s.total<=prev.total)return;
  const gains=HERO_STATS.filter(x=>s.st[x.id]>prev.st[x.id]).map(x=>({...x,add:s.st[x.id]-prev.st[x.id],L0:heroLvl(prev.st[x.id],HERO_SB),L:heroLvl(s.st[x.id],HERO_SB)})).sort((a,b)=>b.add-a.add);
  const L0=heroLvl(prev.total,HERO_B),L=heroLvl(s.total,HERO_B);
  heroPop(s.total-prev.total,gains);
  const ups=gains.filter(g=>g.L>g.L0);
  if(L>L0||ups.length)setTimeout(()=>heroLevelUp(L>L0?L:0,ups),900);
}
function heroPop(xp,gains){
  const el=document.getElementById('hero-pop');if(!el)return;
  el.innerHTML=`<b>+${xp} XP</b>${gains.slice(0,4).map(g=>`<span>${g.ic} ${g.name} +${g.add}</span>`).join('')}`;
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
  clearTimeout(heroPop.t);heroPop.t=setTimeout(()=>el.classList.remove('on'),2800);
}
function heroLevelUp(L,ups){
  const el=document.getElementById('hero-lvl');if(!el)return;
  el.innerHTML=`<div class="hl-box"><div class="hl-t">LEVEL UP!</div>${L?`<div class="hl-big">⭐ Level ${L}</div><div class="hl-rank">${HERO_RANKS.find(r=>L>=r[0])[1]}</div>`:''}${ups.map(g=>`<div class="hl-row">${g.ic} ${g.name} <b>Lv ${g.L0} → ${g.L}</b></div>`).join('')}<div class="hl-tap">tap to close</div></div>`;
  el.classList.add('on');confetti();if(navigator.vibrate)navigator.vibrate([30,60,30]);
  clearTimeout(heroLevelUp.t);heroLevelUp.t=setTimeout(()=>el.classList.remove('on'),4500);
  if(L&&typeof gwenCfg!=='undefined'&&gwenCfg.key&&typeof gwenLine==='function')gwenLine(`Level ${L}! Look at you getting stronger every day 💜`,'happy');
}
// Deleting a task keeps the XP it earned
function heroBank(t){
  const aw=heroTaskAwards(t);if(!aw.length)return;
  const sum=heroSum(aw);
  heroP.bank=(heroP.bank||[]).concat({d:toDateStr(new Date()),xp:sum.total,sx:Object.fromEntries(Object.entries(sum.st).filter(([,v])=>v)),what:`${t.name} (deleted, XP kept)`,ic:tIcon(t)});
}

// ── For Gwen ──
function heroLine(){
  const h=heroState();if(!h.s.total)return'';
  const best=HERO_STATS.map(x=>[x,heroLvl(h.s.st[x.id],HERO_SB)]).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([x,l])=>`${x.name} ${l}`).join(', ');
  const learning=Object.entries(heroP.skills||{}).filter(([,p])=>p.on).map(([id,p])=>{const sk=heroSkill(id);return sk&&sk.steps[(p.at||[]).length]?`${sk.name} (next: ${sk.steps[(p.at||[]).length][0]})`:null;}).filter(Boolean);
  return`DayTrack turns his life into a game: he is Level ${h.L} (${h.rank} ${h.cls}), ${h.today} XP today. Strongest stats: ${best}.${learning.length?` Skills he's learning: ${learning.join('; ')}.`:''} Cheer his level-ups.`;
}

// ── UI ──
const heroBar=(xp,b)=>{const L=heroLvl(xp,b),lo=heroAt(L,b),hi=heroAt(L+1,b);return{L,pct:Math.round((xp-lo)/(hi-lo)*100),left:hi-xp};};
function renderHeroChip(h){
  const el=document.getElementById('hero-chip');if(!el)return;
  const b=heroBar(h.s.total,HERO_B);el.innerHTML=`⭐ Lv ${h.L}<i style="width:${b.pct}%"></i>`;el.title=`${b.left} XP to level ${h.L+1}`;
}
// Small character card on the Tasks tab / dashboard
function renderHeroMini(){
  const h=heroState();renderHeroChip(h);
  const el=document.getElementById('hero-mini');if(!el)return;
  const b=heroBar(h.s.total,HERO_B);
  const top=HERO_STATS.map(x=>({...x,L:heroLvl(h.s.st[x.id],HERO_SB)})).filter(x=>h.s.st[x.id]).sort((a,c)=>c.L-a.L||h.s.st[c.id]-h.s.st[a.id]).slice(0,4);
  el.innerHTML=`<div class="hm-top"><div class="hm-av">${esc(heroP.av)}</div><div style="flex:1;min-width:0;"><div class="hm-name">Lv ${h.L} · ${h.rank} ${h.cls}</div><div class="bar hm-bar"><i style="width:${b.pct}%"></i></div><div class="hm-sub">${b.left} XP to level ${h.L+1}${h.today?` · <b>+${h.today} today</b>`:''}</div></div><div style="color:var(--pri);font-size:20px;">›</div></div>`
    +(top.length?`<div class="hm-stats">${top.map(x=>`<span>${x.ic} ${x.name} <b>${x.L}</b></span>`).join('')}</div>`:'<div class="hm-sub" style="margin-top:8px;">Tick a task to earn your first XP.</div>');
}
let heroSeg='stats';
function heroSetSeg(s){heroSeg=s;document.getElementById('tab-hero').dataset.seg=s;document.querySelectorAll('#hero-seg button').forEach(b=>b.classList.toggle('on',b.dataset.s===s));}
function renderHero(){
  const h=heroState(),b=heroBar(h.s.total,HERO_B),tab=document.getElementById('tab-hero');if(!tab)return;
  tab.dataset.seg=heroSeg;renderHeroChip(h);
  document.getElementById('hero-card').innerHTML=`
    <div class="hc-top"><button class="hc-av" onclick="heroAvatar()" title="Change">${esc(heroP.av)}</button>
      <div style="flex:1;min-width:0;"><div class="hc-name">Rayan</div><div class="hc-cls">${h.rank} ${h.cls}</div></div>
      <div class="hc-lv"><small>LEVEL</small>${h.L}</div></div>
    <div class="bar hc-bar"><i style="width:${b.pct}%"></i></div>
    <div class="hc-xp"><span>${h.s.total.toLocaleString()} XP</span><span>${b.left} to level ${h.L+1}</span></div>
    <div class="hc-today">${h.today?`+${h.today} XP today`:'No XP yet today'}</div>`;
  document.getElementById('hero-radar').innerHTML=heroRadar(h);
  document.getElementById('hero-stats').innerHTML=Object.keys(HERO_GROUPS).map(g=>`<div class="hs-g">${g}</div>`+HERO_STATS.filter(x=>x.g===g).map(x=>{const sb=heroBar(h.s.st[x.id],HERO_SB);return`<div class="hs-row" onclick="heroStat('${x.id}')"><span class="hs-ic">${x.ic}</span><span class="hs-n">${x.name}</span><div class="bar"><i style="width:${sb.pct}%"></i></div><span class="hs-l">Lv ${sb.L}</span></div>`;}).join('')).join('');
  const ups=heroLevelUps(h.aw).slice(0,15),tod=toDateStr(new Date());
  const days=[...new Set(h.aw.map(a=>a.d))].sort().reverse().slice(0,7);
  document.getElementById('hero-log').innerHTML=
    (ups.length?`<div class="hs-g" style="margin-top:0;">Level-ups</div>`+ups.map(u=>`<div class="hl-item"><span class="hs-ic">${u.ic}</span><div style="flex:1;min-width:0;"><b>${u.name==='Level'?'You reached Level '+u.L:u.name+' reached Lv '+u.L}</b><div class="hm-sub">${u.d===tod?'Today':fmtDay(u.d)} · from ${esc(u.via)}</div></div></div>`).join(''):'')
    +(days.length?`<div class="hs-g">XP by day</div>`+days.map(d=>{const a=h.aw.filter(x=>x.d===d);return`<div class="hl-day"><div class="hl-dh"><b>${d===tod?'Today':fmtDay(d)}</b><span>+${a.reduce((n,x)=>n+x.xp,0)} XP</span></div>${a.map(x=>`<div class="hl-g"><span>${x.ic} ${esc(x.what)}</span><span>+${x.xp} ${Object.keys(x.sx).filter(k=>HERO_BY[k]).map(k=>HERO_BY[k].ic).join('')}</span></div>`).join('')}</div>`;}).join(''):'<div class="hm-sub">Your XP history shows up here once you tick a task.</div>');
  renderHeroSkills();
}
// Six-sided stat shape, like a game character sheet
function heroRadar(h){
  const ax=[['Strength',['arms','chest','back']],['Athletics',['core','legs','endurance']],['Mind',['intellect','focus']],['Creativity',['creativity']],['Spirit',['faith','discipline']],['Life',['vitality','charisma','wealth']]];
  const v=ax.map(([,ks])=>ks.reduce((n,k)=>n+heroLvl(h.s.st[k],HERO_SB),0)/ks.length),max=Math.max(5,...v);
  const pt=(i,r)=>{const a=-Math.PI/2+i*Math.PI/3;return[(100+r*Math.cos(a)).toFixed(1),(100+r*Math.sin(a)).toFixed(1)];};
  const ring=r=>ax.map((_,i)=>pt(i,r).join(',')).join(' ');
  return`<svg viewBox="-30 -8 260 216" class="radar">${[.25,.5,.75,1].map(f=>`<polygon points="${ring(78*f)}" class="rg"/>`).join('')}
    ${ax.map((_,i)=>`<line x1="100" y1="100" x2="${pt(i,78)[0]}" y2="${pt(i,78)[1]}" class="rg"/>`).join('')}
    <polygon points="${ax.map((_,i)=>pt(i,78*v[i]/max).join(',')).join(' ')}" class="rv"/>
    ${ax.map(([n],i)=>{const[x,y]=pt(i,96);return`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${n} ${v[i].toFixed(0)}</text>`;}).join('')}</svg>`;
}
// One stat: where its XP comes from
function heroStat(id){
  const x=HERO_BY[id],h=heroState(),b=heroBar(h.s.st[id],HERO_SB);
  const from={};h.aw.forEach(a=>{if(a.sx[id]){const k=a.what.replace(/ \(\d+\/\d+\)$/,'');from[k]=from[k]||{ic:a.ic,xp:0,n:0};from[k].xp+=a.sx[id];from[k].n++;}});
  const list=Object.entries(from).sort((a,c)=>c[1].xp-a[1].xp).slice(0,12);
  const sk=heroSkills().filter(s=>s.st[id]>=.5);
  sheet(`<div style="text-align:center;font-size:40px;">${x.ic}</div><div style="font-size:18px;font-weight:700;text-align:center;color:var(--txt);">${x.name} · Lv ${b.L}</div>
    <div class="bar" style="height:8px;margin:10px 0 4px;"><i style="width:${b.pct}%"></i></div><div class="hm-sub" style="text-align:right;">${h.s.st[id]} XP · ${b.left} to Lv ${b.L+1}</div>
    <div class="sl">What trained it</div>${list.length?list.map(([k,v])=>`<div class="hl-g" style="padding:7px 0;border-bottom:1px solid var(--brd);"><span>${v.ic} ${esc(k)} <small style="color:var(--sub)">×${v.n}</small></span><b>+${v.xp}</b></div>`).join(''):`<div class="hm-sub">Nothing yet. Add a task with a word like "${{arms:'push-ups',chest:'push-ups',back:'pull-ups',core:'plank',legs:'squats',endurance:'run',intellect:'study',focus:'deep work',creativity:'draw',faith:'Quran',discipline:'clean room',vitality:'drink water',charisma:'call a friend',wealth:'budget'}[id]}" in its name, or pick ${x.name} under "Levels up" when you add one.</div>`}
    ${sk.length?`<div class="sl">Skills that train it</div><div class="hk-chips">${sk.map(s=>`<button class="gchip" onclick="heroOpenSkill('${s.id}')">${s.ic} ${esc(s.name)}</button>`).join('')}</div>`:''}${closeBtn}`);
}
async function heroAvatar(){
  const v=(await ask('Pick an emoji for your character','e.g. 🥷 🧙 🦸 🐺')||'').trim();if(!v)return;
  heroP.av=[...v].slice(0,2).join('');save();renderHero();renderHeroMini();
}

// Skills list and one skill's steps
function renderHeroSkills(){
  const el=document.getElementById('hero-skills');if(!el)return;
  const all=heroSkills(),cats=[...new Set(all.map(s=>s.cat))];
  const card=s=>{const p=heroP.skills[s.id]||{},n=(p.at||[]).length,t=s.steps.length,next=s.steps[n];
    return`<button class="hk${p.on?' on':''}${n===t?' done':''}" onclick="heroOpenSkill('${s.id}')"><span class="hk-ic">${s.ic}</span><span class="hk-b"><b>${esc(s.name)}</b><small>${n===t?'🏆 Mastered':next?(p.on?'Now: ':'Start: ')+esc(next[0]):''}</small><span class="bar"><i style="width:${n/t*100}%"></i></span></span><span class="hk-n">${n}/${t}</span></button>`;};
  const learning=all.filter(s=>(heroP.skills[s.id]||{}).on&&(heroP.skills[s.id].at||[]).length<s.steps.length);
  el.innerHTML=(learning.length?`<div class="hs-g" style="margin-top:0;">Learning now</div><div class="hk-grid">${learning.map(card).join('')}</div>`:'')
    +cats.map(c=>`<div class="hs-g">${c}</div><div class="hk-grid">${all.filter(s=>s.cat===c).map(card).join('')}</div>`).join('')
    +`<button class="minibtn" style="margin-top:12px;width:100%;padding:10px;" onclick="heroNewSkill()">+ Add my own skill</button>`;
}
function heroOpenSkill(id){
  const s=heroSkill(id);if(!s)return;const p=heroP.skills[id]||{},n=(p.at||[]).length,tod=toDateStr(new Date());
  const st=Object.keys(s.st).map(k=>HERO_BY[k]&&`${HERO_BY[k].ic} ${HERO_BY[k].name}`).filter(Boolean).join(' · ');
  sheet(`<div style="text-align:center;font-size:40px;">${s.ic}</div><div style="font-size:18px;font-weight:700;text-align:center;color:var(--txt);">${esc(s.name)}</div>
    <div class="hm-sub" style="text-align:center;margin:2px 0 10px;">Trains ${st} · ${n}/${s.steps.length} mastered</div>
    ${s.steps.map((x,i)=>{const[nm,goal,how]=Array.isArray(x)?x:[x.name||x,'',''];const state=i<n?'done':i===n?'now':'lock';
      return`<div class="hk-step ${state}"><div class="hk-dot">${i<n?'✓':i+1}</div><div style="flex:1;min-width:0;"><b>${esc(nm)}</b>${goal?`<div class="hk-goal">🎯 ${esc(goal)}</div>`:''}${state==='now'&&how?`<div class="hk-how">${esc(how)}</div>`:''}${i<n&&p.at[i]?`<div class="hm-sub">Mastered ${p.at[i]===tod?'today':fmtDay(p.at[i])} · +${60*(i+1)} XP</div>`:state!=='done'?`<div class="hm-sub">+${60*(i+1)} XP</div>`:''}</div></div>`;}).join('')}
    ${n<s.steps.length?`<div style="display:flex;gap:8px;margin-top:12px;">${p.on?'':`<button class="hk-btn" onclick="heroLearn('${id}')">▶ Start learning</button>`}<button class="hk-btn pri" onclick="heroMaster('${id}')">✓ I can do it</button></div>`:'<div style="text-align:center;font-size:15px;font-weight:700;color:var(--grntxt);margin-top:12px;">🏆 Skill mastered!</div>'}
    ${n<s.steps.length&&typeof gwenCfg!=='undefined'&&gwenCfg.key?`<button class="hk-btn" style="width:100%;margin-top:8px;" onclick="heroAskGwen('${id}')">💜 Ask Gwen to coach me</button>`:''}
    ${n?`<button class="mi" style="color:var(--sub);justify-content:center;" onclick="heroUndo('${id}')">↺ Undo last step</button>`:''}
    ${s.custom?`<button class="mi" style="color:#EF4444;justify-content:center;" onclick="heroDelSkill('${id}')">🗑️ Delete this skill</button>`:''}${closeBtn}`);
}
const stepName=(s,i)=>{const x=s.steps[i];return Array.isArray(x)?x[0]:x;};
// Start learning: a practice task joins Tasks and trains the skill's stats
function heroLearn(id){
  const s=heroSkill(id),p=heroP.skills[id]=heroP.skills[id]||{at:[]};p.on=true;
  const n=(p.at||[]).length,name=`${stepName(s,n)} practice`;
  if(!tasks.some(t=>t.skill===id))tasks.push({id:uid(),name,notes:Array.isArray(s.steps[n])?s.steps[n][1]:'',icon:s.ic,iconType:'emoji',recurring:true,days:[...(s.days||[])],done:[],date:null,
    priority:'none',notifStyle:'default',showInCal:true,createdAt:toDateStr(new Date()),subtasks:[],reminder:null,reminderLastFired:null,reminded:[],count:null,skill:id});
  save();renderTaskList();heroOpenSkill(id);renderHero();
  showToast(`✅ "${name}" added to your tasks${s.days&&s.days.length?' on '+s.days.map(d=>DNAMES[d]).join('·'):''}`);
}
function heroMaster(id){
  const s=heroSkill(id),p=heroP.skills[id]=heroP.skills[id]||{at:[]};p.at=p.at||[];
  if(p.at.length>=s.steps.length)return;
  p.at.push(toDateStr(new Date()));
  const n=p.at.length,t=tasks.find(x=>x.skill===id);
  if(t&&n<s.steps.length){t.name=`${stepName(s,n)} practice`;t.notes=Array.isArray(s.steps[n])?s.steps[n][1]:'';} // the practice task moves on to the next step
  if(n>=s.steps.length)p.on=false;
  save();renderTaskList();heroOpenSkill(id);renderHero();
}
function heroUndo(id){const p=heroP.skills[id];if(!p||!p.at||!p.at.length)return;p.at.pop();const s=heroSkill(id),t=tasks.find(x=>x.skill===id);if(t)t.name=`${stepName(s,p.at.length)} practice`;save();renderTaskList();heroOpenSkill(id);renderHero();}
function heroAskGwen(id){
  const s=heroSkill(id),n=((heroP.skills[id]||{}).at||[]).length,x=s.steps[n];
  closeOv('dt-ov');switchTab('gwen');
  const inp=document.getElementById('gwen-in');inp.value=`Coach me on ${s.name}: I'm on "${stepName(s,n)}"${Array.isArray(x)?` (goal: ${x[1]})`:''}. How do I get there?`;inp.focus();
}
async function heroNewSkill(){
  const name=(await ask('What skill do you want to learn?','e.g. Chess, Drawing, Driving')||'').trim().slice(0,40);if(!name)return;
  const steps=(await ask('Its steps, easiest first, separated by commas','e.g. Learn the moves, Win a game, Beat Gwen')||'').split(',').map(x=>x.trim().slice(0,60)).filter(Boolean).slice(0,10);
  if(!steps.length)return;
  const st=heroDetect(name),id='c'+uid();
  heroP.custom=(heroP.custom||[]).concat({id,name,ic:'⭐',st:Object.keys(st).length?st:{discipline:.5,intellect:.5},days:[],steps:steps.map(n=>[n,'',''])});
  save();renderHero();heroOpenSkill(id);
}
function heroDelSkill(id){
  if(!confirm('Delete this skill? Its XP goes too.'))return;
  heroP.custom=(heroP.custom||[]).filter(c=>c.id!==id);delete heroP.skills[id];tasks.forEach(t=>{if(t.skill===id)delete t.skill;});
  save();closeOv('dt-ov');renderHero();
}

// Task sheet: "Levels up" chips. null = picked from the name automatically.
let heroPick=null;
function heroPickInit(stats){heroPick=stats&&stats.length?[...stats]:null;heroPickRender();}
function heroPickRender(){
  const el=document.getElementById('hero-pick');if(!el)return;
  const on=heroPick||Object.keys(taskStats({name:document.getElementById('new-name').value,count:{unit:document.getElementById('cnt-unit').value}}));
  el.innerHTML=HERO_STATS.map(x=>`<button type="button" class="rb${on.includes(x.id)?' on':''}" onclick="heroPickTog('${x.id}')">${x.ic} ${x.name}</button>`).join('')
    +`<div style="font-size:11px;color:var(--sub);width:100%;margin-top:2px;">${heroPick?'Picked by you. <a href="#" onclick="heroPickInit(null);return false;" style="color:var(--pri);">Use automatic</a>':'Picked from the task name. Tap to change.'}</div>`;
}
function heroPickTog(id){
  const on=heroPick||Object.keys(taskStats({name:document.getElementById('new-name').value,count:{unit:document.getElementById('cnt-unit').value}}));
  heroPick=on.includes(id)?on.filter(x=>x!==id):on.concat(id);if(!heroPick.length)heroPick=null;heroPickRender();
}

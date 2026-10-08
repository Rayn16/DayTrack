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
const HERO_GL={arms:'dumbbell',chest:'shield',back:'wings',core:'flame',legs:'bolt',endurance:'heart',intellect:'book',focus:'target',creativity:'spark',faith:'moon',discipline:'swords',vitality:'leaf',charisma:'chat',wealth:'gem'};
const HERO_GCOL={Body:'red',Mind:'blue',Spirit:'purple',Life:'green'};
HERO_STATS.forEach(s=>{s.gl=HERO_GL[s.id];s.col=HERO_GCOL[s.g];});
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
  {id:'handstand',cat:'Calisthenics',name:'Handstand path',ic:'🤸',st:{arms:1,core:.5,focus:.3},days:[0,2,4],req:['pushup',4],steps:[
    ['Pike hold','Hold 30 seconds','Hands on the floor, hips high, weight leaning into your shoulders.'],
    ['Wall walk','3 reps','Feet on the wall, walk your hands in until your chest is close to it, then walk back out.'],
    ['Chest-to-wall handstand','Hold 45 seconds','Belly facing the wall, body straight, push the floor away.'],
    ['Kick-up to the wall','10 soft kick-ups','Back to the wall, kick up gently with one leg and let the other follow.'],
    ['Freestanding handstand','Hold 10 seconds','Balance with your fingertips. Learn to bail out by stepping or cartwheeling to the side first.'],
    ['Handstand push-up (wall)','3 sets of 3','Lower your head to the floor between your hands and press back up.']]},
  {id:'dips',cat:'Calisthenics',name:'Dip path',ic:'🛡️',st:{chest:1,arms:1},days:[0,2,4],req:['pushup',4],steps:[
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
  {id:'quran',cat:'Life skills',name:'Quran memorization',ic:'📖',st:{faith:1,focus:.3},days:[],req:['prayer',1],steps:[
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
  {id:'code',cat:'Life skills',name:'Coding',ic:'💻',st:{intellect:1,creativity:.3,wealth:.5},days:[],req:['focus',1],steps:[
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
let heroP={bank:[],skills:{},custom:[],av:'🧑',q:{},claims:{},bonus:[],inv:{},used:{},perks:[],daily:{},bosses:{},rec:{},journal:{}};
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
// Every XP award, oldest first: {d: date, xp, sx: {stat: xp}, what, ic, k: kind}. Task XP is scaled by that day's buffs (m).
function heroTaskAwards(t,m=()=>1){
  const out=[],st=taskStats(t),base=taskXP(t),ic=tIcon(t),add=(d,x,what,k)=>{x=Math.round(x*m(d));if(d&&x>0)out.push({d,xp:x,sx:sx(x,st),what,ic,k});};
  const hb=d=>t.hard&&d>=(t.hardFrom||'')?2:1;
  t.done.forEach(d=>add(d,base*hb(d),t.name,'task'));
  if(t.boss&&!t.recurring&&t.done[0]){const w=Math.max(0,Math.round((new Date(t.done[0]+'T12:00:00')-new Date((t.createdAt||t.done[0])+'T12:00:00'))/864e5));add(t.done[0],Math.min(300,base*2+10*w),`Mini boss slain: ${t.name}${w?` (waited ${w} day${w>1?'s':''})`:''}`,'mboss');}
  if(t.count)Object.entries(t.counts||{}).forEach(([d,n])=>{if(!t.done.includes(d))add(d,base*hb(d)*n/t.count.target,`${t.name} (${n}/${t.count.target})`,'count');});
  // Hardcore: a scheduled day missed costs what it would have earned
  if(t.hard&&t.recurring&&t.hardFrom){const y=dAdd(toDateStr(new Date()),-1),a=[t.hardFrom,t.createdAt||'',dAdd(y,-365)].sort().pop();for(let d=a;d<=y;d=dAdd(d,1))
    if(isTodayTask(t,d,new Date(d+'T12:00:00').getDay())&&!t.done.includes(d))out.push({d,xp:-base,sx:sx(-base,st),what:`Missed hardcore: ${t.name}`,ic:'💀',k:'hard'});}
  (t.subtasks||[]).forEach(s=>(s.done||[]).forEach(d=>add(d,5,s.name,'sub')));
  return out;
}
function heroAwards(){
  const mm={},m=d=>mm[d]??=heroMult(d);
  const out=tasks.flatMap(t=>heroTaskAwards(t,m)),add=(d,xp,st,what,ic,k,x)=>d&&xp>0&&out.push({d,xp,sx:sx(xp,st),what,ic,k,...x});
  completedDays.forEach(d=>add(d,30,{discipline:1},'Finished every task','🏆','day'));
  goals.forEach(g=>{const st={...heroDetect(g.name),discipline:.5};g.steps.forEach(s=>add(s.done,25,st,s.name,'🎯','goal'));});
  savedSessions.forEach(s=>add(sessDate(s),Math.min(120,Math.round(s.total/120000)),{...heroDetect(s.name),focus:1},s.name,'⏱️','focus',{min:Math.round(s.total/60000)}));
  Object.entries(heroP.skills||{}).forEach(([id,p])=>{const sk=heroSkill(id);if(sk)(p.at||[]).forEach((d,i)=>sk.steps[i]&&add(d,60*(i+1),sk.st,stepName(sk,i),sk.ic,'skill'));});
  Object.entries(heroP.claims||{}).forEach(([key,c])=>add(c.d,c.xp,c.st||{discipline:1},c.what,c.ic||'🎁','quest'));
  heroStepAwards(add);heroWalkAwards(add);
  heroSkills().forEach(sk=>{const ds=heroStarDays(sk);if(ds)HERO_STARS.forEach((n,i)=>ds[n-1]&&add(ds[n-1],100*(i+1),sk.st,`${sk.name} mastery ★${i+1}`,'⭐','star'));});
  (heroP.bank||[]).forEach(b=>out.push(b));
  (heroP.bonus||[]).forEach(b=>out.push(b));
  Object.entries(heroP.journal||{}).forEach(([d,t])=>t&&add(d,10,{intellect:1},'Journal: '+String(t).slice(0,40),'📝','journal'));
  (heroP.bounties||[]).forEach(b=>b.done&&add(b.done,b.xp,b.st||{discipline:1},'Bounty: '+b.text,'📌','bounty'));
  const y=dAdd(toDateStr(new Date()),-1);
  (heroP.quits||[]).forEach(q=>{const sl=new Set(q.slips||[]);let d=q.from;const lim=dAdd(y,-365);if(d<lim)d=lim;for(;d<=y;d=dAdd(d,1))if(!sl.has(d))add(d,15,{discipline:1,vitality:.3},`Clean day: ${q.name}`,'🛡️','quit');});
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
  const aw=heroAwards(),s=heroSum(aw),xp=Math.max(0,s.total-heroPrestigeXP()),L=heroLvl(xp,HERO_B),tod=toDateStr(new Date());
  const groups={};HERO_STATS.forEach(x=>groups[x.g]=(groups[x.g]||0)+s.st[x.id]);
  const top=Object.entries(groups).sort((a,b)=>b[1]-a[1])[0];
  const best=top[1]?HERO_STATS.filter(x=>x.g===top[0]).sort((a,b)=>s.st[b.id]-s.st[a.id])[0]:null,evo=L>=20&&best?HERO_EVOLVE[best.id]:'';
  return{aw,s,xp,L,P:(heroP.prestige||[]).length,rank:HERO_RANKS.find(r=>L>=r[0])[1],base:top[1]?HERO_GROUPS[top[0]]:'Beginner',cls:evo||(top[1]?HERO_GROUPS[top[0]]:'Beginner'),evo,
    today:aw.filter(a=>a.d===tod).reduce((n,a)=>n+a.xp,0)};
}
// Each time something reached a new level, replayed from the start: [{d, what, ic, L, via}]
function heroLevelUps(aw){
  const xp={total:0},lv={total:1},out=[];
  aw.forEach(a=>{
    const step=(k,add,b,name,ic)=>{xp[k]=(xp[k]||0)+add;const L=heroLvl(xp[k],b);if(L>(lv[k]||1)){lv[k]=L;out.push({d:a.d,name,ic,L,via:a.what});}};
    step('total',a.xp,HERO_B,'Level','⭐');
    for(const k in a.sx)if(HERO_BY[k]&&a.sx[k]>0)step(k,a.sx[k],HERO_SB,HERO_BY[k].name,HERO_BY[k].ic);
  });
  return out.reverse();
}

// ── After every save: show what just went up ──
let heroLast=null;
function heroTick(silent){
  const combo=heroCombo(silent);heroDgTick(silent);heroBetTick(silent);heroLoginCheck();
  heroAchCheck(silent);heroDaily();heroStepWeekCheck();heroYearCheck();heroRecCheck(silent);heroBossSync();heroWrite();
  const s=heroSum(heroAwards()),prev=heroLast;heroLast=s;
  if(silent||!prev||s.total<=prev.total)return;
  s.total-=heroPrestigeXP();prev.total-=heroPrestigeXP();
  const gains=HERO_STATS.filter(x=>s.st[x.id]>prev.st[x.id]).map(x=>({...x,add:s.st[x.id]-prev.st[x.id],L0:heroLvl(prev.st[x.id],HERO_SB),L:heroLvl(s.st[x.id],HERO_SB)})).sort((a,b)=>b.add-a.add);
  const L0=heroLvl(prev.total,HERO_B),L=heroLvl(s.total,HERO_B);
  heroPop(s.total-prev.total,gains,heroMult(toDateStr(new Date())),combo);
  s.total+=heroPrestigeXP();
  const ups=gains.filter(g=>g.L>g.L0);
  if(L>L0||ups.length)setTimeout(()=>heroLevelUp(L>L0?L:0,ups),900);
}
function heroPop(xp,gains,m=1,combo=0){
  const el=document.getElementById('hero-pop');if(!el)return;
  el.innerHTML=`<b>+${xp} XP</b>${combo>1?`<span class="hp-combo">COMBO ×${combo}</span>`:''}${m!==1?`<span>${m>1?'⚡':'🔻'} ×${m.toFixed(2).replace(/0$/,'')}</span>`:''}${gains.slice(0,4).map(g=>`<span>${g.ic} ${g.name} +${g.add}</span>`).join('')}`;
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');heroSfx('coin');
  clearTimeout(heroPop.t);heroPop.t=setTimeout(()=>el.classList.remove('on'),2800);
}
function heroLevelUp(L,ups){
  heroShow(`<div class="hl-t">LEVEL UP!</div>${L?`<div class="hl-em">${heroRankIc(L,96)}</div><div class="hl-big">Level ${L}</div><div class="hl-rank">${HERO_RANKS.find(r=>L>=r[0])[1]}</div>`:''}${ups.map(g=>`<div class="hl-row">${hIc(g.gl,g.col,'circle',22)} ${g.name} <b>Lv ${g.L0} → ${g.L}</b></div>`).join('')}`,4500,true);
  if(navigator.vibrate)navigator.vibrate([30,60,30]);heroSfx('fanfare');
  if(L&&typeof gwenCfg!=='undefined'&&gwenCfg.key&&typeof gwenLine==='function')gwenLine(`Level ${L}! Look at you getting stronger every day 💜`,'happy');
}
// Deleting a task keeps the XP it earned
function heroBank(t){
  const aw=heroTaskAwards(t,heroMult);if(!aw.length)return;
  const sum=heroSum(aw);
  heroP.bank=(heroP.bank||[]).concat({d:toDateStr(new Date()),xp:sum.total,sx:Object.fromEntries(Object.entries(sum.st).filter(([,v])=>v)),what:`${t.name} (deleted, XP kept)`,ic:tIcon(t)});
}

// ── For Gwen ──
function heroLine(){
  const h=heroState();if(!h.s.total)return'';
  const best=HERO_STATS.map(x=>[x,heroLvl(h.s.st[x.id],HERO_SB)]).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([x,l])=>`${x.name} ${l}`).join(', ');
  const learning=Object.entries(heroP.skills||{}).filter(([,p])=>p.on).map(([id,p])=>{const sk=heroSkill(id);return sk&&sk.steps[(p.at||[]).length]?`${sk.name} (next: ${sk.steps[(p.at||[]).length][0]})`:null;}).filter(Boolean);
  const bf=heroBuffs(toDateStr(new Date())).map(b=>`${b.name} (${b.why})`),qs=heroQuests(h).d.filter(q=>!q.claimed).map(q=>q.text);
  return`DayTrack turns his life into a game: he is Level ${h.L} (${h.rank} ${h.cls}), ${h.today} XP today. Strongest stats: ${best}.${learning.length?` Skills he's learning: ${learning.join('; ')}.`:''}${bf.length?` Today's buffs and debuffs: ${bf.join(', ')}.`:''}${qs.length?` Daily quests still open: ${qs.join('; ')}.`:''} ${(()=>{const b=heroDBoss(heroTod());return b&&b.state!=='soon'?` Today's surprise boss: ${b.name} (${b.state==='on'?'here now, he has to: '+b.task:b.state==='won'?'he beat it':'it escaped'}).`:'';})()}${(()=>{const j=Object.entries(heroP.journal||{}).sort().slice(-3);return j.length?` His recent journal lines: ${j.map(([d,t])=>`${d}: "${t}"`).join('; ')}.`:'';})()}${heroP.pet?` His pet ${HERO_PETS[heroP.pet.kind][0].toLowerCase()} is called ${heroP.pet.name}.`:''} Cheer his level-ups.`;
}

// ── UI ──
const heroBar=(xp,b)=>{const L=heroLvl(xp,b),lo=heroAt(L,b),hi=heroAt(L+1,b);return{L,pct:Math.round((xp-lo)/(hi-lo)*100),left:hi-xp};};
function renderHeroChip(h){
  const el=document.getElementById('hero-chip');if(!el)return;
  const b=heroBar(h.xp,HERO_B);el.innerHTML=`⭐ Lv ${h.L}<i style="width:${b.pct}%"></i>`;el.title=`${b.left} XP to level ${h.L+1}`;
}
// Small character card on the Tasks tab / dashboard
function renderHeroMini(){
  const h=heroState();renderHeroChip(h);
  const el=document.getElementById('hero-mini');if(!el)return;heroDefs();
  const b=heroBar(h.xp,HERO_B);
  const top=HERO_STATS.map(x=>({...x,L:heroLvl(h.s.st[x.id],HERO_SB)})).filter(x=>h.s.st[x.id]).sort((a,c)=>c.L-a.L||h.s.st[c.id]-h.s.st[a.id]).slice(0,4);
  el.innerHTML=`<div class="hm-top"><div class="hm-av ${heroFrame(h)}">${heroAvHtml()}</div>${heroP.pet?`<span class="hm-pet">${heroPetSvg(heroP.pet.kind,heroPetInfo(h).st,heroPetInfo(h).mood,34)}</span>`:''}<div style="flex:1;min-width:0;"><div class="hm-name">Lv ${h.L} · ${h.rank} ${h.cls}</div><div class="bar hm-bar"><i style="width:${b.pct}%"></i></div><div class="hm-sub">${b.left} XP to level ${h.L+1}${h.today?` · <b>+${h.today} today</b>`:''}</div></div>${heroRankIc(h.L,40)}</div>`
    +(top.length?`<div class="hm-stats">${top.map(x=>`<span>${x.ic} ${x.name} <b>${x.L}</b></span>`).join('')}</div>`:'<div class="hm-sub" style="margin-top:8px;">Tick a task to earn your first XP.</div>')
    +heroHPHtml()+heroBuffChips(toDateStr(new Date()))+heroExtrasLine()+heroPinHtml(h);
  const qm=document.getElementById('hero-quests-mini');if(qm)qm.innerHTML=heroBossCard(true)+heroBetHtml()+`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><div class="cl" style="margin:0;">⚔️ Daily quests</div><button class="minibtn" onclick="heroSetSeg('quests');switchTab('hero')">All quests</button></div>`+heroQuestRows(heroQuests(h).d,'d')
    +(new Date().getHours()>=18&&!(heroP.journal||{})[heroTod()]?`<div class="cl" style="margin:12px 0 6px;">📝 Tonight's line</div>`+heroJournalHtml(true):'');
}
let heroSeg='stats';
function heroSetSeg(s){heroSeg=s;document.getElementById('tab-hero').dataset.seg=s;if(s==='skills')setTimeout(heroTreeFit,0);document.querySelectorAll('#hero-seg button').forEach(b=>b.classList.toggle('on',b.dataset.s===s));}
function renderHero(){
  const h=heroState(),b=heroBar(h.xp,HERO_B),tab=document.getElementById('tab-hero');if(!tab)return;heroDefs();
  tab.dataset.seg=heroSeg;renderHeroChip(h);
  document.getElementById('hero-card').innerHTML=`
    <div class="hc-top"><button class="hc-av ${heroFrame(h)}" onclick="heroAvatar()" title="Change">${heroAvHtml()}</button>
      <div style="flex:1;min-width:0;"><div class="hc-name">${esc(heroP.name||'Rayan')}</div><div class="hc-cls">${heroTitle(heroAchievements(h))?`<b class="hc-title">「${esc(heroTitle(heroAchievements(h)))}」</b> `:''}${h.rank} ${h.cls}</div></div>
      <div class="hc-rk">${heroRankIc(h.L,58)}<div class="hc-lv"><small>LEVEL</small>${h.L}</div></div></div>
    <div class="bar hc-bar"><i style="width:${b.pct}%"></i></div>
    <div class="hc-xp"><span>${h.s.total.toLocaleString()} XP</span><span>${b.left} to level ${h.L+1}</span></div>${heroHPHtml()}
    <div class="hc-today">${h.today?`+${h.today} XP today`:'No XP yet today'}${h.P?` · ${'★'.repeat(Math.min(10,h.P))}`:''}</div>${heroExtrasLine()}
    <div class="hc-btns"><button onclick="heroShare()">📤 Share card</button><span>🪙 ${heroCoins(h).toLocaleString()}</span></div>`;
  document.getElementById('hero-card').insertAdjacentHTML('beforeend',heroBuffChips(toDateStr(new Date()),true));
  document.getElementById('hero-radar').innerHTML=heroRadar(h);
  document.getElementById('hero-body').innerHTML=heroBody(h);
  const Q=heroQuests(h),left=b=>{const ms=new Date(b+'T23:59:59')-new Date(),dd=Math.ceil(ms/864e5);return dd<=1?`resets in ${Math.max(1,Math.ceil(ms/36e5))} h`:`${dd} days left`;};
  const set=(id,html)=>{const e=document.getElementById(id);if(e)e.innerHTML=html;};
  set('hero-dboss',heroBossCard());set('hero-story',heroStoryHtml(h));set('hero-bounty',heroBountyHtml());set('hero-mboss',heroMiniBossHtml());set('hero-quit',heroQuitHtml());
  set('hero-perks',heroPerksHtml(h));set('hero-recs',heroRecsHtml(h));set('hero-ft',heroTestHtml());set('hero-bag',heroBagHtml(h));set('hero-gear',heroGearHtml());set('hero-party',heroPartyHtml(h));
  set('hero-steps',heroStepsHtml());set('hero-walks',heroWalksHtml());set('hero-book',heroBookHtml());set('hero-pass',heroPassHtml(h));set('hero-ghost',heroGhostHtml(h));set('hero-ranked',heroRankedHtml(h));set('hero-dg',heroDgHtml());set('hero-duel',heroDuelHtml());
  set('hero-bet',heroBetHtml(true));
  set('hero-report',heroReportHtml(h));set('hero-vs',heroVsHtml(h));set('hero-season',heroSeasonHtml(h));set('hero-heat',heroHeatmap(h));set('hero-journal',heroJournalHtml());
  document.getElementById('hero-quests').innerHTML=[['d','☀️ Daily'],['w','📅 Weekly'],['m','🌙 Monthly']].map(([k,n])=>`<div class="hs-g hq-h"><span>${n}</span><small>${left(Q.p[k].b)}</small></div>`+(k==='w'?heroBoss(Q.w,Q.p.w):'')+heroQuestRows(Q[k],k)).join('');
  document.getElementById('hero-stats').innerHTML=Object.keys(HERO_GROUPS).map(g=>`<div class="hs-g">${g}</div>`+HERO_STATS.filter(x=>x.g===g).map(x=>{const sb=heroBar(h.s.st[x.id],HERO_SB);return`<div class="hs-row" onclick="heroStat('${x.id}')"><span class="hs-ic">${sIc(x,24,'hex')}</span><span class="hs-n">${x.name}</span><div class="bar"><i style="width:${sb.pct}%"></i></div><span class="hs-l">Lv ${sb.L}</span></div>`;}).join('')).join('');
  const ups=heroLevelUps(h.aw).slice(0,15),tod=toDateStr(new Date());
  const days=[...new Set(h.aw.map(a=>a.d))].sort().reverse().slice(0,7);
  document.getElementById('hero-log').innerHTML=
    (ups.length?`<div class="hs-g" style="margin-top:0;">Level-ups</div>`+ups.map(u=>`<div class="hl-item"><span class="hs-ic">${u.ic}</span><div style="flex:1;min-width:0;"><b>${u.name==='Level'?'You reached Level '+u.L:u.name+' reached Lv '+u.L}</b><div class="hm-sub">${u.d===tod?'Today':fmtDay(u.d)} · from ${esc(u.via)}</div></div></div>`).join(''):'')
    +(days.length?`<div class="hs-g">XP by day</div>`+days.map(d=>{const a=h.aw.filter(x=>x.d===d);return`<div class="hl-day"><div class="hl-dh"><b>${d===tod?'Today':fmtDay(d)}</b><span>+${a.reduce((n,x)=>n+x.xp,0)} XP</span></div>${a.map(x=>`<div class="hl-g"><span>${x.ic} ${esc(x.what)}</span><span>+${x.xp} ${Object.keys(x.sx).filter(k=>HERO_BY[k]).map(k=>HERO_BY[k].ic).join('')}</span></div>`).join('')}</div>`;}).join(''):'<div class="hm-sub">Your XP history shows up here once you tick a task.</div>');
  renderHeroTree(h);renderHeroAch(h);
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
  sheet(`<div style="text-align:center;">${sIc(x,64,'hex')}</div><div style="font-size:18px;font-weight:700;text-align:center;color:var(--txt);">${x.name} · Lv ${b.L}</div>
    <div class="bar" style="height:8px;margin:10px 0 4px;"><i style="width:${b.pct}%"></i></div><div class="hm-sub" style="text-align:right;">${h.s.st[id]} XP · ${b.left} to Lv ${b.L+1}</div>
    <div class="sl">What trained it</div>${list.length?list.map(([k,v])=>`<div class="hl-g" style="padding:7px 0;border-bottom:1px solid var(--brd);"><span>${v.ic} ${esc(k)} <small style="color:var(--sub)">×${v.n}</small></span><b>+${v.xp}</b></div>`).join(''):`<div class="hm-sub">Nothing yet. Add a task with a word like "${{arms:'push-ups',chest:'push-ups',back:'pull-ups',core:'plank',legs:'squats',endurance:'run',intellect:'study',focus:'deep work',creativity:'draw',faith:'Quran',discipline:'clean room',vitality:'drink water',charisma:'call a friend',wealth:'budget'}[id]}" in its name, or pick ${x.name} under "Levels up" when you add one.</div>`}
    ${sk.length?`<div class="sl">Skills that train it</div><div class="hk-chips">${sk.map(s=>`<button class="gchip" onclick="heroOpenSkill('${s.id}')">${s.ic} ${esc(s.name)}</button>`).join('')}</div>`:''}${closeBtn}`);
}
// Character picture: a photo (cropped square, kept small so it syncs) or an emoji
const heroAvHtml=()=>heroP.avImg?`<img class="av-img" src="${heroP.avImg}" alt="">`:esc(heroP.av);
function heroAvatar(){
  sheet(`<div style="text-align:center;"><div class="hc-av av-big">${heroAvHtml()}</div></div><div style="font-size:18px;font-weight:700;text-align:center;color:var(--txt);margin:8px 0 12px;">Your character picture</div>
    <label class="hk-btn pri" style="display:block;text-align:center;margin-bottom:8px;">📷 Pick a photo<input type="file" accept="image/*" style="display:none" onchange="heroAvPhoto(this.files[0])"></label>
    <button class="hk-btn" style="width:100%;margin-bottom:8px;" onclick="heroAvEmoji()">😀 Use an emoji</button>${heroP.avImg?'<button class="mi" style="color:#EF4444;justify-content:center;" onclick="heroP.avImg=null;save();closeOv(\'dt-ov\');renderHero();renderHeroMini();">🗑️ Remove the photo</button>':''}${closeBtn}`);
}
function heroAvPhoto(f){
  if(!f)return;const img=new Image(),url=URL.createObjectURL(f);
  img.onload=()=>{const c=document.createElement('canvas'),n=256,s=Math.min(img.width,img.height);c.width=c.height=n;
    c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,n,n);URL.revokeObjectURL(url);
    heroP.avImg=c.toDataURL('image/jpeg',.85);save();closeOv('dt-ov');renderHero();renderHeroMini();showToast('📷 New character picture');};
  img.onerror=()=>showToast('Couldn\'t open that picture');img.src=url;
}
async function heroAvEmoji(){
  const v=(await ask('Pick an emoji for your character','e.g. 🥷 🧙 🦸 🐺')||'').trim();if(!v)return;
  heroP.av=[...v].slice(0,2).join('');heroP.avImg=null;save();renderHero();renderHeroMini();
}

// One skill's steps
function heroOpenSkill(id){
  const s=heroSkill(id);if(!s)return;const p=heroP.skills[id]||{},n=(p.at||[]).length,tod=toDateStr(new Date());
  const st=Object.keys(s.st).map(k=>HERO_BY[k]&&`${HERO_BY[k].ic} ${HERO_BY[k].name}`).filter(Boolean).join(' · ');
  sheet(`<div style="text-align:center;">${hIc(skGl(s),HERO_CAT_COL[s.cat]==='#F97316'?'orange':s.custom?'purple':'teal','burst',64)}</div><div style="font-size:18px;font-weight:700;text-align:center;color:var(--txt);">${esc(s.name)}</div>
    <div class="hm-sub" style="text-align:center;margin:2px 0 10px;">Trains ${st} · ${n}/${s.steps.length} mastered</div>
    ${s.steps.map((x,i)=>{const[nm,goal,how]=Array.isArray(x)?x:[x.name||x,'',''];const state=i<n?'done':i===n?'now':'lock';
      return`<div class="hk-step ${state}"><div class="hk-dot">${i<n?'✓':i+1}</div><div style="flex:1;min-width:0;"><b>${esc(nm)}</b>${goal?`<div class="hk-goal">🎯 ${esc(goal)}</div>`:''}${state==='now'&&how?`<div class="hk-how">${esc(how)}</div>`:''}${i<n&&p.at[i]?`<div class="hm-sub">Mastered ${p.at[i]===tod?'today':fmtDay(p.at[i])} · +${60*(i+1)} XP</div>`:state!=='done'?`<div class="hm-sub">+${60*(i+1)} XP</div>`:''}</div></div>`;}).join('')}
    ${heroLocked(s)?`<div class="hk-lock">🔒 Unlocks when you master <b>${esc(stepName(heroSkill(s.req[0]),s.req[1]-1))}</b> in ${esc(heroSkill(s.req[0]).name)}</div>`:n<s.steps.length?`<div style="display:flex;gap:8px;margin-top:12px;">${p.on?'':`<button class="hk-btn" onclick="heroLearn('${id}')">▶ Start learning</button>`}<button class="hk-btn pri" onclick="heroMaster('${id}')">✓ I can do it</button></div>`:heroStarsHtml(s)}
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
  if(p.at.length>=s.steps.length||heroLocked(s))return;
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

// ── Buffs and debuffs ──
// Worked out for each day from the days before it plus that day's sleep and mood, so XP already earned never shifts later.
const dAdd=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return toDateStr(x);};
function heroBuffs(d){
  const out=[],cd=heroDoneDays(),y=dAdd(d,-1),fx=(ic,name,f,why)=>out.push({ic,name,fx:f,why,bad:f<0}),pk=id=>heroPerk(id,d);
  let st=0;for(let x=y;cd.has(x)&&st<400;x=dAdd(x,-1))st++;
  const sb=pk('streak')?.1:0;
  if(st>=7)fx('🔥','Blazing',.2+sb,`${st}-day streak`);else if(st>=3)fx('🔥','On fire',.1+sb,`${st}-day streak`);
  else if(!cd.has(y)&&cd.has(dAdd(y,-1))&&cd.has(dAdd(y,-2))&&cd.has(dAdd(y,-3)))fx('💔','Streak broken',-.05,'Yesterday wasn\'t finished. Finish today to start again');
  const sl=sleepLog[d];
  if(sl&&typeof sleepHours==='function'){const h=sleepHours(sl);
    if(h>=7)fx('😴','Well rested',pk('rest')?.2:.1,`Slept ${h.toFixed(1)} h`);else if(h<6)fx('🥱','Tired',-.1,`Only ${h.toFixed(1)} h of sleep`);
    if(String(sl.wake).padStart(5,'0')<'07:00')fx('🌅','Early bird',pk('dawn')?.15:.05,`Up at ${sl.wake}`);}
  const md=moods[d];if(md&&md<=2)fx('🦁','Brave',.1,'Getting things done on a hard day');else if(md>=4)fx('✨','Good vibes',.05,'Feeling good today');
  const od=tasks.filter(t=>!t.recurring&&t.date&&t.date<d&&!(t.done[0]&&t.done[0]<=d)).length;
  if(od)fx('⏳','Overdue',-Math.min(.15,.05*od),`${od} task${od>1?'s':''} past ${od>1?'their':'its'} day`);
  if(Object.entries(heroP.claims||{}).some(([k,c])=>k[0]==='w'&&c.d<d&&c.d>=dAdd(d,-3)))fx('⚡','Quest momentum',.15,'You finished a weekly quest');
  if(pk('xp'))fx('✨','Fast learner',.05,'Your perk');
  const pr=(heroP.prestige||[]).filter(p=>p.d<=d).length;if(pr)fx('★','Prestige',.05*pr,`${pr} prestige star${pr>1?'s':''}`);
  if(heroP.evolved&&heroP.evolved.d<=d)fx('🦋','Evolved',.05,`${heroP.evolved.cls} class`);
  const dl=(heroP.daily||{})[d]||{};if(dl.party)fx('💜','Party: Gwen',dl.party,'Your bond with Gwen');if(dl.gear)fx('🛡️','Gear',dl.gear,'What you have equipped');
  if(((heroP.used||{}).potion||[]).includes(d))fx('🧪','XP potion',1,'Double XP today');
  if(((heroP.used||{}).mega||[]).includes(d))fx('🧪','Mega potion',2,'Triple XP today');
  const hp=heroHP();if(hp&&hp.fall[d])fx('💀','Fallen',-.5,'Your HP hit 0. Finish 3 tasks in a day to revive');
  const ev=heroEvent(d);if(ev&&ev.id==='golden')fx('🌟','Golden day',.5,'A rare event: +50% XP all day');
  const b=heroDBoss(d);if(b&&b.state==='gone')fx('💀','Boss curse',-.1,`${b.name} escaped`);
  if((heroP.quits||[]).some(q=>(q.slips||[]).includes(d)))fx('🩹','Slipped',-.05,'A slip on a habit you\'re quitting. Back on track tomorrow');
  if(pk('iron'))out.forEach(b=>{if(b.fx<0)b.fx/=2;});
  return out;
}
const heroMult=d=>Math.max(.5,1+heroBuffs(d).reduce((n,b)=>n+b.fx,0));
// Stats you trained before but not this week (a reminder, no XP lost)
function heroRusty(aw){
  const last={},lim=dAdd(toDateStr(new Date()),-7);aw.forEach(a=>{for(const k in a.sx)if(a.sx[k]>=5)last[k]=a.d;});
  return HERO_STATS.filter(x=>last[x.id]&&last[x.id]<lim).map(x=>({ic:'🕸️',name:`Rusty ${x.name}`,fx:0,bad:true,why:`No ${x.name} training since ${fmtDay(last[x.id])}. Train it to clear this`}));
}
function heroBuffChips(d,all){
  const b=heroBuffs(d).concat(all?heroRusty(heroAwards()):[]);if(!b.length)return all?'<div class="hb-row"><span class="hb none">No buffs yet today. Sleep 7 h, keep a streak or log your mood</span></div>':'';
  return`<div class="hb-row">${b.map(x=>`<button class="hb${x.bad?' bad':''}" data-w="${esc(x.ic+' '+x.name+': '+x.why)}" onclick="event.stopPropagation();showToast(this.dataset.w)">${x.ic} ${x.name}${x.fx?` <b>${x.fx>0?'+':''}${Math.round(x.fx*100)}%</b>`:''}</button>`).join('')}</div>`;
}

// ── Quests: daily, weekly (Sunday to Saturday) and monthly, picked once per period and kept in heroP.q ──
const QUEST_XP={d:40,w:150,m:500};
function heroPeriods(){
  const now=new Date(),tod=toDateStr(now),w=new Date(now);w.setDate(w.getDate()-w.getDay());
  const wa=toDateStr(w),ma=tod.slice(0,8)+'01';
  return{d:{id:'d'+tod,a:tod,b:tod},w:{id:'w'+wa,a:wa,b:dAdd(wa,6)},m:{id:'m'+ma,a:ma,b:toDateStr(new Date(now.getFullYear(),now.getMonth()+1,0))}};
}
function heroRng(seed){let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h=Math.imul(h^h>>>15,2246822507)^Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296;};}
function heroMakeQuests(k,p,h){
  const r=heroRng(p.id),pick=a=>a[Math.floor(r()*a.length)],L=h.L;
  const trained=HERO_STATS.filter(x=>h.s.st[x.id]>0).sort((a,b)=>h.s.st[a.id]-h.s.st[b.id]);
  const st=(trained.length?pick(trained.slice(0,4)):pick(HERO_STATS)).id; // one of your weaker stats
  const dow=new Date(p.a+'T12:00:00').getDay(),today=tasks.filter(t=>isTodayTask(t,p.a,dow)).length;
  if(k==='d')return[{t:'tasks',n:Math.max(1,Math.min(5,today||3))},{t:'stat',stat:st,n:20+L*2},pick([{t:'perfect',n:1},{t:'mood',n:1},{t:'focus',n:25},{t:'xp',n:60+L*10}])];
  if(k==='w')return[{t:'xp',n:400+L*40},{t:'perfect',n:3},pick([{t:'skill',n:1},{t:'goal',n:2},{t:'focus',n:120},{t:'sleep',n:5}]),{t:'stat',stat:st,n:120+L*10}];
  return[{t:'xp',n:2000+L*150},{t:'perfect',n:12},pick([{t:'skill',n:3},{t:'goal',n:6},{t:'focus',n:600}]),{t:'stat',stat:st,n:Math.max(100,heroAt(heroLvl(h.s.st[st],HERO_SB)+1,HERO_SB)-h.s.st[st])}];
}
function heroQText(q){
  const s=q.n>1?'s':'',x=HERO_BY[q.stat];
  return{tasks:`Complete ${q.n} task${s}`,stat:x&&`Earn ${q.n} ${x.ic} ${x.name} XP`,xp:`Earn ${q.n} XP`,perfect:q.n>1?`Finish every task on ${q.n} days`:'Finish every task today',
    mood:'Log how you feel today',focus:`Focus ${q.n} minutes with the Timer`,skill:`Master ${q.n} skill step${s}`,goal:`Complete ${q.n} goal step${s}`,sleep:`Log your sleep ${q.n} nights`,gwen:q.text}[q.t]||'';
}
function heroQProg(q,p,aw){
  const inP=aw.filter(a=>a.d>=p.a&&a.d<=p.b&&a.k!=='quest'),cnt=k=>inP.filter(a=>a.k===k).length,inRange=o=>Object.keys(o||{}).filter(d=>d>=p.a&&d<=p.b).length;
  switch(q.t){
    case'tasks':return cnt('task');case'perfect':return cnt('day');case'skill':return cnt('skill');case'goal':return cnt('goal');
    case'xp':return inP.reduce((n,a)=>n+a.xp,0);case'stat':return inP.reduce((n,a)=>n+(a.sx[q.stat]||0),0);
    case'focus':return inP.reduce((n,a)=>n+(a.min||0),0);case'mood':return inRange(moods);case'sleep':return inRange(sleepLog);
    case'gwen':return q.done?1:0;
  }return 0;
}
// Quests for now, with progress: {d:[], w:[], m:[], p: periods}
function heroQuests(h=heroState()){
  const P=heroPeriods(),out={p:P};heroP.q=heroP.q||{};
  for(const k of['d','w','m']){
    const p=P[k];if(!heroP.q[p.id])heroP.q[p.id]=heroMakeQuests(k,p,h);
    const list=heroP.q[p.id].map((q,i)=>({...q,key:`${p.id}:${i}`}));
    // Gwen's daily quest (from her house) joins the daily ones
    if(k==='d'&&typeof quest!=='undefined'&&quest&&quest.date===p.a){const g=typeof questGo==='function'?questGo(quest):{};list.push({t:'gwen',n:1,text:`💜 Gwen's quest${g.where?' ('+g.where+')':''}: ${quest.text}`,done:quest.done,go:g.go,key:`${p.id}:gwen`,st:{charisma:1}});}
    out[k]=list.map(q=>{const c=Math.min(q.n,heroQProg(q,p,h.aw));return{...q,text:heroQText(q),prog:c,ready:c>=q.n,claimed:!!(heroP.claims||{})[q.key],xp:QUEST_XP[k]};});
  }
  for(const id of Object.keys(heroP.q))if(![P.d.id,P.w.id,P.m.id].includes(id))delete heroP.q[id];
  return out;
}
function heroQuestRows(list,k){
  const all=list.length&&list.every(q=>q.claimed),chest=`${heroPeriods()[k].id}:chest`,got=(heroP.claims||{})[chest];
  const QG={tasks:'check',xp:'bolt',perfect:'trophy',mood:'sun',focus:'target',skill:'star',goal:'flag',sleep:'moon',gwen:'heart'},QC={d:'teal',w:'blue',m:'purple'};
  return list.map(q=>`<div class="hq${q.claimed?' got':''}"${q.go&&!q.ready?` onclick="${q.go}" style="cursor:pointer;"`:''}>${q.t==='stat'&&HERO_BY[q.stat]?sIc(HERO_BY[q.stat],28,'hex'):hIc(QG[q.t]||'scroll',q.t==='gwen'?'pink':QC[k],'hex',28)}<div style="flex:1;min-width:0;"><div class="hq-t">${esc(q.text)}</div><div class="hq-b"><span class="bar"><i style="width:${q.prog/q.n*100}%"></i></span><small>${q.prog}/${q.n}</small></div></div>`
    +(q.claimed?'<span class="hq-ok">✓</span>':q.ready?`<button class="hq-claim" onclick="event.stopPropagation();heroClaim('${q.key}','${k}')">Claim +${q.xp}</button>`:`<span class="hq-xp">+${q.xp} XP</span>`)+'</div>').join('')
    +(all&&k==='d'?got?'<div class="hq-chest done">🎁 Daily chest opened</div>':`<button class="hq-chest" onclick="event.stopPropagation();heroClaim('${chest}','d')">🎁 All done! Open the daily chest (+60 XP and loot)</button>`:'');
}
function heroClaim(key,k){
  heroP.claims=heroP.claims||{};if(heroP.claims[key])return;
  const h=heroState(),Q=heroQuests(h),q=key.endsWith(':chest')?{text:'Daily chest',ready:Q.d.every(x=>x.claimed),xp:60}:Q[k].find(x=>x.key===key);
  if(!q||!q.ready)return;
  const st=q.stat?{[q.stat]:1}:q.st||{discipline:1},tod=heroTod(),xp=Math.round(q.xp*(heroPerk('quest',tod)?1.25:1)*((heroEvent(tod)||{}).id==='lucky'?2:1));
  heroP.claims[key]={d:tod,xp,st,what:`Quest: ${q.text}`,ic:key.endsWith(':chest')?'🎁':k==='m'?'🌙':k==='w'?'📅':'⚔️'};
  const loot=key.endsWith(':chest')?heroLoot(tod):[];
  save();renderTaskList();if(document.body.dataset.tab==='hero')renderHero();
  if(loot.length)heroShow(`<div class="hl-t">CHEST OPENED</div><div class="hl-em">${hIc('chest','gold','burst',90)}</div><div class="hl-row">+${xp} XP</div>${loot.map(heroItemLine).join('')}`,4500,true);
  if(k==='w')setTimeout(()=>showToast('⚡ Quest momentum: +15% XP for the next 3 days'),2900);
}

// ── Skill tree: every skill is a branch out from you; arrows show which skill unlocks which ──
const HERO_TREE=['core','pushup','dips','handstand','pullup','legs','run','sleep','cook','firstaid','money','focus','code','typing','lang','speak','prayer','quran'];
const heroDone=id=>(((heroP.skills||{})[id]||{}).at||[]).length;
const heroLocked=s=>!!(s.req&&heroDone(s.req[0])<s.req[1]);
const HERO_CAT_COL={Calisthenics:'#F97316','Life skills':'#14B8A6','My skills':'#A855F7'};
let heroZoom=0;
function heroTree(h){
  const all=heroSkills(),order=HERO_TREE.map(heroSkill).filter(Boolean).concat(all.filter(s=>!HERO_TREE.includes(s.id)));
  const N=order.length,R0=96,G=46,pos={},pt=(k,i)=>{const a=-Math.PI/2+2*Math.PI*k/N,r=R0+i*G;return[r*Math.cos(a),r*Math.sin(a),a];};
  order.forEach((s,k)=>s.steps.forEach((_,i)=>pos[s.id+i]=pt(k,i)));
  let edges='',nodes='',labels='';
  order.forEach((s,k)=>{
    const col=HERO_CAT_COL[s.cat]||'#A855F7',n=heroDone(s.id),lock=heroLocked(s),on=((heroP.skills||{})[s.id]||{}).on;
    const[x0,y0]=pos[s.id+0];
    if(s.req&&pos[s.req[0]+(s.req[1]-1)]){const[rx,ry]=pos[s.req[0]+(s.req[1]-1)];edges+=`<path d="M${rx.toFixed(1)},${ry.toFixed(1)} Q${((rx+x0)*.35).toFixed(1)},${((ry+y0)*.35).toFixed(1)} ${x0.toFixed(1)},${y0.toFixed(1)}" class="te req${lock?'':' open'}" style="--c:${col}"/>`;}
    else edges+=`<line x1="0" y1="0" x2="${x0.toFixed(1)}" y2="${y0.toFixed(1)}" class="te${n?' lit':''}" style="--c:${col}"/>`;
    s.steps.forEach((_,i)=>{
      const[x,y]=pos[s.id+i],st=i<n?'done':i===n&&!lock?'now':'lock';
      if(i)edges+=`<line x1="${pos[s.id+(i-1)][0].toFixed(1)}" y1="${pos[s.id+(i-1)][1].toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="te${i<=n?' lit':''}" style="--c:${col}"/>`;
      nodes+=`<g class="tn ${st}${on&&st==='now'?' on':''}" style="--c:${col}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})" onclick="heroOpenSkill('${s.id}')"><title>${esc(s.name)}: ${esc(stepName(s,i))}</title><circle r="${i?14:18}"/>${i?`<text>${st==='done'?'✓':st==='lock'&&lock?'🔒':i+1}</text>`:`<g transform="translate(-10.8 -10.8) scale(.9)">${hGlyph(lock?'lock':skGl(s))}</g>`}</g>`;
    });
    const[lx,ly,a]=pt(k,s.steps.length-1),c=Math.cos(a),r=R0+(s.steps.length-1)*G+26,tx=r*c,ty=r*Math.sin(a);
    labels+=`<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="tl" text-anchor="${c>.3?'start':c<-.3?'end':'middle'}" onclick="heroOpenSkill('${s.id}')">${esc(s.name)} ${n}/${s.steps.length}${(heroStars(s)||{}).n?' '+'★'.repeat(heroStars(s).n):''}</text>`;
  });
  const S=R0+7*G+150;
  return`<svg viewBox="${-S} ${-S} ${2*S} ${2*S}" id="hero-tree-svg">${edges}${nodes}${labels}<g class="tc" onclick="heroSetSeg('stats')"><circle r="44"/>${heroP.avImg?`<clipPath id="tc-clip"><circle cy="-8" r="26"/></clipPath><image href="${heroP.avImg}" x="-26" y="-34" width="52" height="52" clip-path="url(#tc-clip)"/>`:`<text y="-8" class="tc-av">${esc(heroP.av)}</text>`}<text y="22" class="tc-lv">Lv ${h.L}</text></g></svg>`;
}
function renderHeroTree(h){
  const el=document.getElementById('hero-skills');if(!el)return;
  const learning=heroSkills().filter(s=>((heroP.skills||{})[s.id]||{}).on&&heroDone(s.id)<s.steps.length);
  el.innerHTML=(learning.length?`<div class="hk-chips" style="margin-bottom:8px;">${learning.map(s=>`<button class="gchip" onclick="heroOpenSkill('${s.id}')">${s.ic} ${esc(stepName(s,heroDone(s.id)))}</button>`).join('')}</div>`:'')
    +`<div class="tree-wrap"><div id="hero-tree">${heroTree(h)}</div><div class="tree-zoom"><button onclick="heroTreeZoom(1.25)">+</button><button onclick="heroTreeZoom(.8)">−</button><button onclick="heroTreeFit(true)">⤢</button></div></div>`
    +`<div class="tree-key"><span><i style="background:#F97316"></i>Calisthenics</span><span><i style="background:#14B8A6"></i>Life skills</span><span><i class="k-now"></i>Next step</span><span>🔒 Locked</span></div>`
    +`<button class="minibtn" style="margin-top:10px;width:100%;padding:10px;" onclick="heroNewSkill()">+ Add my own skill</button>`;
  heroTreeFit();
}
function heroTreeFit(reset){
  const box=document.getElementById('hero-tree'),svg=document.getElementById('hero-tree-svg');if(!box||!svg||!box.clientWidth)return;
  if(reset||!heroZoom)heroZoom=Math.max(box.clientWidth/1300,.8);
  const w=Math.round(1300*heroZoom);svg.style.width=svg.style.height=w+'px';
  if(reset||!box.dataset.c){box.scrollLeft=(w-box.clientWidth)/2;box.scrollTop=(w-box.clientHeight)/2;box.dataset.c=1;}
}
function heroTreeZoom(f){
  const box=document.getElementById('hero-tree'),cx=(box.scrollLeft+box.clientWidth/2)/box.scrollWidth,cy=(box.scrollTop+box.clientHeight/2)/box.scrollHeight;
  heroZoom=Math.min(2.5,Math.max(.3,heroZoom*f));heroTreeFit();
  box.scrollLeft=cx*box.scrollWidth-box.clientWidth/2;box.scrollTop=cy*box.scrollHeight-box.clientHeight/2;
}

// ── Body map: front and back, each part glows with its stat's level ──
function heroBody(h){
  const L=id=>heroLvl(h.s.st[id],HERO_SB),xp=id=>h.s.st[id];
  const col=id=>{if(!xp(id))return'var(--hb-off)';const t=Math.min(1,(L(id)-1)/14);return`hsl(${Math.round(175-t*130)} 80% ${Math.round(42+t*12)}%)`;};
  const mind=h.s.st.intellect>=h.s.st.focus?'intellect':'focus';
  const R=(id,x,y,w,hh,rx,extra='')=>`<rect class="bp" data-s="${id}" x="${x}" y="${y}" width="${w}" height="${hh}" rx="${rx}" fill="${col(id)}" style="--g:${col(id)}"${extra} onclick="heroStat('${id}')"/>`;
  const fig=(cx,back)=>{
    const torso=back?'back':'chest';
    return`<circle class="bp" cx="${cx}" cy="20" r="15" fill="${col(mind)}" style="--g:${col(mind)}" onclick="heroStat('${mind}')"/>`
      +R('vitality',cx-5,34,10,8,3)
      +R('arms',cx-41,44,14,46,7,` transform="rotate(8 ${cx-34} 44)"`)+R('arms',cx+27,44,14,46,7,` transform="rotate(-8 ${cx+34} 44)"`)
      +R('arms',cx-47,92,12,42,6,` transform="rotate(6 ${cx-41} 92)"`)+R('arms',cx+35,92,12,42,6,` transform="rotate(-6 ${cx+41} 92)"`)
      +(back?R('back',cx-25,42,50,52,12):R('chest',cx-25,42,24,32,10)+R('chest',cx+1,42,24,32,10))
      +R('core',cx-20,back?96:76,40,back?30:50,8)
      +R('legs',cx-21,back?128:128,42,16,8)
      +R('legs',cx-21,146,19,58,9)+R('legs',cx+2,146,19,58,9)+R('legs',cx-19,206,15,46,7)+R('legs',cx+4,206,15,46,7)
      +(back?'':`<path class="bp heart" d="M${cx-12} 56c-4-5-12-2-10 4 1 4 10 9 10 9s9-5 10-9c2-6-6-9-10-4z" fill="${xp('endurance')?'#EF4444':'var(--hb-off)'}" style="--g:#EF4444;opacity:${xp('endurance')?.45+.55*Math.min(1,L('endurance')/10):.6}" onclick="heroStat('endurance')"/>`)
      +(back?'':`<g class="bl">${[['chest',cx+13,60],['core',cx,104],['arms',cx-44,74],['legs',cx-11,176]].map(([id,x,y])=>`<text x="${x}" y="${y}">${L(id)}</text>`).join('')}</g>`)
      +(back?`<g class="bl">${[['back',cx,70],['core',cx,114],['legs',cx-11,176]].map(([id,x,y])=>`<text x="${x}" y="${y}">${L(id)}</text>`).join('')}</g>`:'')
      +`<text x="${cx}" y="272" class="bcap">${back?'BACK':'FRONT'}</text>`;
  };
  const tag=id=>`<button class="bt" onclick="heroStat('${id}')"><i style="background:${col(id)}"></i>${HERO_BY[id].name} <b>Lv ${L(id)}</b></button>`;
  return`<svg viewBox="0 0 320 280" class="body-svg">${fig(80,false)}${fig(240,true)}</svg><div class="bt-row">${['arms','chest','back','core','legs','endurance',mind,'vitality'].map(tag).join('')}</div>`;
}

// ── Achievements: worked out from everything above; each can carry a title you can wear under your name ──
const HERO_TITLES={arms:'Iron Arms',chest:'Steel Chest',back:'Eagle Back',core:'Stone Core',legs:'Swift Legs',endurance:'Tireless',intellect:'Sage',focus:'Laser Focus',creativity:'Artist',faith:'Devout',discipline:'Unbreakable',vitality:'Vital',charisma:'Charmer',wealth:'Merchant'};
function heroBestStreak(){const s=[...heroDoneDays()].sort();let best=0,run=0,prev='';s.forEach(d=>{run=prev&&dAdd(prev,1)===d?run+1:1;best=Math.max(best,run);prev=d;});return best;}
function heroAchievements(h=heroState()){
  const tk=h.aw.filter(a=>a.k==='task').length,str=heroBestStreak(),cl=Object.keys(heroP.claims||{}),mastered=heroSkills().filter(s=>heroDone(s.id)>=s.steps.length);
  const gl=g=>HERO_STATS.filter(x=>x.g===g).reduce((n,x)=>n+heroLvl(h.s.st[x.id],HERO_SB),0)/HERO_STATS.filter(x=>x.g===g).length;
  const list=[
    ['first','🌱','First step','Complete your first task',tk,1],['t100','✅','Centurion','Complete 100 tasks',tk,100,'Centurion'],['t500','💯','Relentless','Complete 500 tasks',tk,500,'Relentless'],
    ['s7','🔥','On a roll','Finish every task 7 days in a row',str,7],['s30','☄️','Unstoppable','Finish every task 30 days in a row',str,30,'Unstoppable'],
    ['l10','⭐','Adept','Reach level 10',h.L,10],['l25','🌟','Hero','Reach level 25',h.L,25,'Hero'],['l50','👑','Legend','Reach level 50',h.L,50,'Legend'],
    ['q10','⚔️','Quester','Claim 10 quests',cl.length,10,'Quester'],['qm','🌙','Moon hunter','Claim a monthly quest',cl.filter(k=>k[0]==='m').length,1,'Moon Hunter'],
    ['sk','🏆','Master','Master a whole skill path',mastered.length,1],
    ['bal','⚖️','All-rounder','Body, Mind, Spirit and Life all average Lv 5',Math.min(...Object.keys(HERO_GROUPS).map(gl)),5,'All-Rounder'],
    ['db1','⚔️','Boss slayer','Beat a daily boss',heroBossWins(),1,'Slayer'],['db10','⚔️','Boss hunter','Beat 10 daily bosses',heroBossWins(),10,'Boss Hunter'],['db50','💀','Bane of bosses','Beat 50 daily bosses',heroBossWins(),50,'Bane of Bosses'],
    ['cb5','⚡','Combo master','Reach a ×5 combo',heroP.comboBest||0,5,'Combo Master'],['jr30','📝','Chronicler','Write 30 journal lines',Object.keys(heroP.journal||{}).length,30,'Chronicler'],
    ['ch3','📜','Storyteller','Finish 3 story chapters',heroP.ch||0,3,'Storyteller'],['quit30','🛡️','Free','30 clean days from a habit',Math.max(0,...(heroP.quits||[]).map(heroClean)),30,'Free Spirit'],
    ['pet','🐾','Tamer','Raise your pet to Adult',heroP.pet?heroPetInfo(h).st:0,3,'Tamer'],['pr','★','Reborn','Prestige once',h.P,1,'Reborn'],
    ...HERO_STATS.map(x=>['st-'+x.id,x.ic,HERO_TITLES[x.id],`${x.name} level 10`,heroLvl(h.s.st[x.id],HERO_SB),10,HERO_TITLES[x.id]]),
    ...mastered.map(s=>['m-'+s.id,s.ic,`Master of ${s.name}`,'Mastered every step',1,1,`${s.name} Master`]),
    ...Object.entries(heroP.pass||{}).filter(([,p])=>(p.got||[]).includes(30)).map(([m])=>['pass-'+m,'👑',heroPassTitle(m),'Finished a monthly pass',1,1,heroPassTitle(m)]),
  ];
  const AG={first:['check','green'],t100:['check','silver'],t500:['check','gold'],s7:['flame','orange'],s30:['flame','red'],l10:['star','silver'],l25:['star','gold'],l50:['crown','gold'],q10:['swords','blue'],qm:['moon','purple'],
    sk:['trophy','gold'],bal:['gem','teal'],db1:['skull','bronze'],db10:['skull','silver'],db50:['skull','gold'],cb5:['bolt','orange'],jr30:['pen','blue'],ch3:['scroll','purple'],quit30:['shield','teal'],pet:['paw','orange'],pr:['star','legend']};
  return list.map(([id,ic,name,desc,v,n,title])=>{const st=HERO_BY[id.slice(3)],sk=id.startsWith('m-')&&heroSkill(id.slice(2)),[gl,col]=AG[id]||(st?[st.gl,'gold']:sk?[skGl(sk),'purple']:['star','gold']);
    return{id,ic,gl,col,f:st?'hex':sk?'burst':'shield',name,desc,v:Math.min(v,n),n,title,got:v>=n};});
}
function heroTitle(ach){const t=heroP.title&&ach.find(a=>a.got&&a.title===heroP.title);return t?t.title:'';}
let heroGot=null;
function heroAchCheck(silent){
  const ach=heroAchievements(),got=ach.filter(a=>a.got).map(a=>a.id),prev=heroGot;heroGot=got;heroGotCache=got;
  if(silent||!prev)return;
  const fresh=ach.filter(a=>a.got&&!prev.includes(a.id));
  if(fresh.length)setTimeout(()=>heroShow(`<div class="hl-t">ACHIEVEMENT</div>${fresh.map(a=>`<div class="hl-em">${hIc(a.gl,a.col,a.f,72)}</div><div class="hl-big" style="font-size:26px;">${esc(a.name)}</div><div class="hl-rank">${esc(a.desc)}</div>${a.title?`<div class="hl-row">New title: <b>${esc(a.title)}</b></div>`:''}${HERO_GEAR.filter(g=>g[6]===a.id).map(g=>`<div class="hl-row">New gear: <b>${g[2]}</b></div>`).join('')}`).join('')}`,5000,true),2000);
}
function renderHeroAch(h){
  const el=document.getElementById('hero-ach');if(!el)return;
  const ach=heroAchievements(h),got=ach.filter(a=>a.got),titles=got.filter(a=>a.title);
  el.innerHTML=`<div class="hm-sub" style="margin-bottom:8px;">${got.length} of ${ach.length} unlocked${titles.length?' · tap a title to wear it':''}</div><div class="ha-grid">`
    +ach.map(a=>`<button class="ha${a.got?' got':''}${a.got&&a.title&&heroP.title===a.title?' worn':''}" ${a.got&&a.title?`onclick="heroWear('${esc(a.title)}')"`:''} title="${esc(a.desc)}"><span class="ha-ic">${a.got?hIc(a.gl,a.col,a.f,40):hIc('lock','dark',a.f,40)}</span><b>${esc(a.name)}</b><small>${a.got?(a.title?`Title: ${esc(a.title)}`:esc(a.desc)):`${esc(a.desc)} · ${Math.floor(a.v)}/${a.n}`}</small></button>`).join('')+'</div>';
}
function heroWear(t){heroP.title=heroP.title===t?'':t;save();renderHero();renderHeroMini();}

// Weekly boss: the weekly XP quest as a monster whose HP your XP knocks down
const HERO_BOSSES=[['👹','The Procrastinator'],['🐉','Doomscroll Dragon'],['🧟','The Couch Zombie'],['👻','Ghost of Excuses'],['🦑','The Distraction Kraken'],['🐺','Lazy Wolf'],['🗿','Stone of Sloth']];
function heroBoss(list,p){
  const q=list.find(x=>x.t==='xp');if(!q)return'';
  const [ic,name]=HERO_BOSSES[Math.floor(heroRng(p.id+'boss')()*HERO_BOSSES.length)],hp=Math.max(0,q.n-q.prog);
  const bg=['skull','flame','skull','moon','target','wings','shield'][HERO_BOSSES.findIndex(b=>b[1]===name)]||'skull';
  return`<div class="boss${hp?'':' dead'}"><span class="boss-ic">${hp?hIc(bg,'red','burst',44):hIc('trophy','gold','burst',44)}</span><div style="flex:1;min-width:0;"><b>${hp?name:`${name} defeated!`}</b><div class="boss-hp"><i style="width:${hp/q.n*100}%"></i></div><small>${hp?`${hp} HP left · every XP you earn this week hits it`:'Claim the reward below'}</small></div></div>`;
}

// ════════ Round 3 ════════

// ── Emblems instead of emoji: a metal badge (shape + colour) with a white symbol, drawn as SVG ──
const HG={
  dumbbell:'M2 10h2v4H2zM5 7h3v10H5zM16 7h3v10h-3zM20 10h2v4h-2zM8 11h8v2H8z',
  shield:'M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z',
  wings:'M11 9C8 5 4 4 1 5c1 3 3 5 6 6-2 .5-3.5 1.5-4 3 3 .5 6 0 8-2zM13 9c3-4 7-5 10-4-1 3-3 5-6 6 2 .5 3.5 1.5 4 3-3 .5-6 0-8-2zM10 9h4v9l-2 3-2-3z',
  flame:'M12 2c.5 4 6 6.5 6 12.5A6 6 0 016 14.5c0-3 1.5-4.8 3-6 0 2 .8 3.2 2 3.5-.5-3.5 0-7 1-10z',
  bolt:'M13 2L4 14h7l-1 8 9-12h-7z',
  heart:'M12 21C5.5 15.5 2 12.3 2 8.3 2 5.4 4.3 3 7.2 3c1.9 0 3.6 1 4.8 2.6C13.2 4 14.9 3 16.8 3 19.7 3 22 5.4 22 8.3c0 4-3.5 7.2-10 12.7z',
  book:'M2 5c3.5-1.3 7-1 9.3 1v14C9 18.2 5.5 18 2 19.2zM22 5c-3.5-1.3-7-1-9.3 1v14c2.3-1.8 5.8-2 9.3-.8z',
  target:'M12 2a10 10 0 110 20 10 10 0 010-20zm0 3.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 3a3.5 3.5 0 110 7 3.5 3.5 0 010-7z',
  spark:'M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z',
  moon:'M16 3.5a9 9 0 1 0 0 17 10 10 0 0 1 0-17z',
  swords:'M3 3h3l11 11-3 3L3 6zM13 19l6-6 1.5 1.5-6 6zM18 18l3 3-1.5 1.5-3-3zM21 3v3L10 17l-3-3L18 3zM11 19l-6-6-1.5 1.5 6 6zM6 18l-3 3 1.5 1.5 3-3z',
  leaf:'M21 3C10 3 4 8 4 15c0 2 .4 3.7 1 5 1.5-5 5-8.5 10-10.5-4 3-6.6 6.5-7.6 11C17 20 21 13 21 3z',
  chat:'M3 4h18v12H10l-5 4v-4H3z',
  gem:'M7 3h10l5 6-10 12L2 9z',
  star:'M12 2l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.6l-6.4 3.7 1.6-7.1L1.8 9.3 9 8.6z',
  crown:'M3 17h18v3H3zM2 6l5.5 4.5L12 3l4.5 7.5L22 6l-2 9.5H4z',
  skull:'M12 2a9 9 0 00-9 9c0 3.2 1.5 5.3 3.5 6.6V21h11v-3.4c2-1.3 3.5-3.4 3.5-6.6a9 9 0 00-9-9zM8.5 9.5a2.2 2.2 0 110 4.4 2.2 2.2 0 010-4.4zm7 0a2.2 2.2 0 110 4.4 2.2 2.2 0 010-4.4z',
  chest:'M3 11h18v9H3zM3 10a9 5 0 0118 0zM10.5 12.5h3v4h-3z',
  flask:'M9 2h6v2h-1v5.5l6 9.5a2 2 0 01-1.7 3H5.7A2 2 0 014 19l6-9.5V4H9z',
  snow:'S:M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5',
  dice:'M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zM8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm8 8a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-4-4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
  trophy:'M7 3h10v6a5 5 0 01-10 0zM2.5 4H7v2H4.5c.2 2 1.2 3.3 2.7 3.6l-.4 2C4.3 11.1 2.6 8.8 2.5 4zM21.5 4H17v2h2.5c-.2 2-1.2 3.3-2.7 3.6l.4 2c2.5-.5 4.2-2.8 4.3-7.6zM10.5 14h3v4h3.5v3H7v-3h3.5z',
  scroll:'M6 3h13a2 2 0 012 2v1h-3v12a3 3 0 01-3 3H5a3 3 0 01-3-3v-1h4zM9 8h6v1.6H9zm0 4h6v1.6H9z',
  paw:'M12 12c3 0 6 3.5 6 6 0 2-2 2.5-3 2.5s-2-.6-3-.6-2 .6-3 .6-3-.5-3-2.5c0-2.5 3-6 6-6zM5.5 7a2 2.5 0 110 5 2 2.5 0 010-5zM18.5 7a2 2.5 0 110 5 2 2.5 0 010-5zM9 2.5a2 2.5 0 110 5 2 2.5 0 010-5zM15 2.5a2 2.5 0 110 5 2 2.5 0 010-5z',
  clock:'M12 2a10 10 0 110 20 10 10 0 010-20zm-1.2 4v7.2l5.4 3.2 1.1-1.8-4.1-2.4V6z',
  sun:'M12 7a5 5 0 110 10 5 5 0 010-10zM11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM4.2 5.6l1.4-1.4 2.8 2.8-1.4 1.4zM15.6 17l1.4-1.4 2.8 2.8-1.4 1.4zM4.2 18.4l2.8-2.8 1.4 1.4-2.8 2.8zM15.6 7l2.8-2.8 1.4 1.4L17 8.4z',
  lock:'M6 10V7a6 6 0 0112 0v3h1v11H5V10zm2.5 0h7V7a3.5 3.5 0 00-7 0z',
  check:'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  flag:'M5 2h2v20H5zM8 3h11l-2.5 4L19 11H8z',
  helm:'M12 2C7 2 3 6 3 11v6l3 4h4v-6H6v-2h12v2h-4v6h4l3-4v-6c0-5-4-9-9-9z',
  hand:'M8 21v-3l-4-5c-.7-.9-.5-2 .4-2.6.8-.5 1.8-.3 2.4.4L8 12V4.5a1.5 1.5 0 013 0V10h.5V3a1.5 1.5 0 013 0v7h.5V4.5a1.5 1.5 0 013 0V11h.5V7.5a1.5 1.5 0 013 0V15c0 3-2 6-5 6z',
  cloak:'M12 3l3 2h4l2 5-3 2v9H6v-9l-3-2 2-5h4z',
  medal:'M7 2h4l2 5-2 1zM17 2h-4l-2 5 2 1zM12 8a7 7 0 110 14 7 7 0 010-14zm0 3l1.5 3 3.3.5-2.4 2.3.6 3.2-3-1.6-3 1.6.6-3.2-2.4-2.3 3.3-.5z',
  pen:'M3 21l1.2-5.2L15.5 4.5l4 4L8.2 19.8zM17 3l1.5-1.5 4 4L21 7z',
  bag:'M5 8h14l-1 13H6zM8.5 8V6.5a3.5 3.5 0 017 0V8h-2V6.5a1.5 1.5 0 00-3 0V8z',
  chart:'M3 21V3h2v16h16v2zM7 17v-6h3v6zm5 0V7h3v10zm5 0v-4h3v4z',
  plus:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  code:'M8 6l-6 6 6 6 1.5-1.5L5 12l4.5-4.5zM16 6l6 6-6 6-1.5-1.5L19 12l-4.5-4.5zM13 4h2l-4 16H9z',
  globe:'S:M12 2a10 10 0 110 20 10 10 0 010-20zM2 12h20M12 2c3 3 4 7 4 10s-1 7-4 10c-3-3-4-7-4-10s1-7 4-10z',
  coin:'M12 2a10 10 0 110 20 10 10 0 010-20zm0 3a7 7 0 100 14 7 7 0 000-14zm-1 1.5h2v2c1.4.3 2.3 1.2 2.4 2.5h-2c-.1-.6-.6-1-1.4-1s-1.3.4-1.3.9.5.8 1.8 1.1c1.8.4 3 1 3 2.6 0 1.3-.9 2.2-2.5 2.5v1.9h-2v-1.9c-1.5-.3-2.5-1.2-2.6-2.6h2c.1.7.7 1.1 1.6 1.1s1.5-.4 1.5-1-.5-.8-1.9-1.1c-1.6-.4-2.8-1-2.8-2.5 0-1.3.9-2.1 2.2-2.4z',
};
const HCOL={bronze:['#F3C08B','#C27A3A','#6B3A12'],silver:['#FFFFFF','#B6C2D1','#4B5563'],gold:['#FFF3B0','#F5B82E','#8A5300'],red:['#FCA5A5','#E0383E','#7F1D1D'],
  blue:['#BFDBFE','#3B82F6','#1E3A8A'],purple:['#E9D5FF','#9B5CF6','#4C1D95'],green:['#BBF7D0','#22C55E','#14532D'],teal:['#99F6E4','#14B8A6','#134E4A'],
  orange:['#FED7AA','#F97316','#7C2D12'],pink:['#FBCFE8','#EC4899','#831843'],dark:['#9CA3AF','#4B5563','#111827'],legend:['#FFF7CC','#F472B6','#5B21B6']};
const HFR={shield:'M20 1.5l16 5v11.5c0 10.5-7 17.5-16 20.5C11 35.5 4 28.5 4 18V6.5z',hex:'M20 1l17 9.5v19L20 39 3 29.5v-19z',circle:'M20 1a19 19 0 110 38 19 19 0 010-38z',
  diamond:'M20 0l20 20-20 20L0 20z',burst:Array.from({length:24},(_,i)=>{const r=i%2?15.5:19.5,a=Math.PI*i/12-Math.PI/2;return(i?'L':'M')+(20+r*Math.cos(a)).toFixed(1)+' '+(20+r*Math.sin(a)).toFixed(1);}).join('')+'z'};
const hGrad=(c,id)=>{const[a,b,d]=HCOL[c]||HCOL.gold;return`<linearGradient id="${id}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${d}"/></linearGradient>`;};
function heroDefs(){
  if(document.getElementById('hg-defs')||!document.body)return;
  document.body.insertAdjacentHTML('beforeend',`<svg id="hg-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${Object.keys(HCOL).map(c=>hGrad(c,'hg-'+c)).join('')}</defs></svg>`);
}
function hGlyph(g,fill='#fff'){
  const d=HG[g]||HG.star,st=d.startsWith('S:');
  return st?`<path d="${d.slice(2)}" fill="none" stroke="${fill}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`:`<path d="${d}" fill="${fill}" fill-rule="evenodd"/>`;
}
// g: symbol, c: colour, f: badge shape, s: size in px. solo: carries its own colours (for pictures)
function hIc(g,c='gold',f='shield',s=28,solo){
  const id=solo?'hs-'+c+Math.random().toString(36).slice(2,6):'hg-'+c,fr=HFR[f]||HFR.shield;
  return`<svg class="hi" viewBox="0 0 40 40" width="${s}" height="${s}"${solo?' xmlns="http://www.w3.org/2000/svg"':''}>${solo?`<defs>${hGrad(c,id)}</defs>`:''}<path d="${fr}" fill="url(#${id})" stroke="rgba(0,0,0,.45)" stroke-width="1"/><path d="${fr}" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.6" transform="translate(20 20) scale(.84) translate(-20 -20)"/><g transform="translate(9.6 9.2) scale(.86)"><g transform="translate(.7 1.1)" opacity=".4">${hGlyph(g,'#000')}</g>${hGlyph(g)}</g></svg>`;
}
const sIc=(x,s=22,f='circle')=>hIc(x.gl,x.col,f,s);
// Rank badges get grander as you climb, like prestige emblems
const HERO_RANK_IC={Novice:['star','bronze','circle'],Apprentice:['swords','bronze','shield'],Adept:['star','silver','shield'],Warrior:['swords','silver','hex'],Veteran:['shield','gold','hex'],
  Elite:['wings','gold','burst'],Master:['crown','purple','burst'],Grandmaster:['crown','red','burst'],Legend:['crown','legend','burst']};
function heroRankIc(L,s=40,solo){const r=HERO_RANKS.find(x=>L>=x[0])[1],[g,c,f]=HERO_RANK_IC[r];return hIc(g,c,f,s,solo);}
const HERO_SKILL_GL={pushup:'dumbbell',pullup:'wings',legs:'bolt',core:'flame',handstand:'hand',dips:'shield',run:'heart',cook:'flask',money:'coin',focus:'target',prayer:'moon',quran:'book',speak:'chat',firstaid:'plus',sleep:'clock',typing:'pen',code:'code',lang:'globe'};
const skGl=s=>HERO_SKILL_GL[s.id]||'star';

// ── Popups one after another (level-ups, achievements, records, rewards) ──
const heroQ=[];
function heroShow(html,ms=4500,burst){heroQ.push({html,ms,burst});if(heroQ.length===1)heroNext();}
function heroNext(){
  const el=document.getElementById('hero-lvl'),x=heroQ[0];if(!el||!x)return;
  el.innerHTML=`<div class="hl-box${x.burst?' burst':''}">${x.html}<div class="hl-tap">tap to close</div></div>`;el.classList.add('on');if(x.burst)confetti();
  const done=()=>{if(heroQ[0]!==x)return;clearTimeout(heroNext.t);heroQ.shift();el.classList.remove('on');if(heroQ.length)setTimeout(heroNext,250);};
  el.onclick=done;clearTimeout(heroNext.t);heroNext.t=setTimeout(done,x.ms);
}

// ── Small helpers ──
const heroTod=()=>toDateStr(new Date());
const heroWeekStart=d=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()-x.getDay());return toDateStr(x);};
function heroBonus(d,xp,st,what,ic,k,x){heroP.bonus=(heroP.bonus||[]).concat({d,xp,sx:sx(xp,st),what,ic,k,...x});}
const heroDoneDays=()=>new Set([...completedDays,...((heroP.used||{}).freeze||[])]);
const heroPrestigeXP=()=>{const p=heroP.prestige||[];return p.length?p[p.length-1].xp:0;};
const heroInv=()=>heroP.inv=heroP.inv||{};

// ── Perks: a point every 5 levels ──
const HERO_PERKS=[['xp','Fast learner','+5% XP on everything','bolt','gold'],['rest','Deep sleeper','Well rested gives +20% instead of +10%','moon','blue'],
  ['dawn','Dawn warrior','Early bird gives +15% instead of +5%','sun','orange'],['streak','Momentum','Streak buffs give +10% more','flame','red'],
  ['iron','Iron mind','Debuffs and curses hurt half as much','shield','silver'],['hunter','Boss hunter','+50% XP from daily bosses','skull','red'],
  ['quest','Quest master','+25% XP from quests','scroll','purple'],['lucky','Lucky','Chests and bosses drop two items','dice','green'],
  ['combo','Combo king','Combo bonus goes up to +50 XP','bolt','orange'],['ice','Ice heart','A free streak freeze every month','snow','teal']];
const heroPerk=(id,d)=>(heroP.perks||[]).some(p=>p.id===id&&(!d||p.d<=d));
const heroPerkPts=h=>Math.floor(h.L/5)+15*h.P-(heroP.perks||[]).length;
function heroPickPerk(id){
  const h=heroState();if(heroPerkPts(h)<1||heroPerk(id))return;
  const p=HERO_PERKS.find(x=>x[0]===id);if(!confirm(`Pick ${p[1]}? ${p[2]}. Perks are forever.`))return;
  heroP.perks=(heroP.perks||[]).concat({id,d:heroTod()});save();renderHero();showToast(`✨ Perk unlocked: ${p[1]}`);
}

// ── Rare events: some days are special (the same on every device) ──
const HERO_EVENTS=[['golden','Golden day','+50% XP all day','sun','gold'],['meteor','Meteor day','Chests and bosses drop an extra item','spark','purple'],['lucky','Lucky day','Quest rewards are doubled','dice','green']];
function heroEvent(d){const r=heroRng(((heroP.bossCfg||{}).seed||'dt')+'ev'+d);if(r()>.12)return null;const e=HERO_EVENTS[Math.floor(r()*HERO_EVENTS.length)];return{id:e[0],name:e[1],what:e[2],gl:e[3],col:e[4]};}

// ── Today's record of things that change over time (Gwen's bond, gear), so past days keep their XP ──
function heroDaily(){
  const tod=heroTod(),dl=heroP.daily=heroP.daily||{};
  const lv=typeof gwenCfg!=='undefined'&&gwenCfg.key&&typeof gwenLevel==='function'?gwenLevel(gwenBondPts()):0;
  dl[tod]={party:Math.min(.1,lv*.01),gear:Math.round(heroGearFx()*100)/100};
  const lim=dAdd(tod,-400);for(const d in dl)if(d<lim)delete dl[d];
  const m=tod.slice(0,7);if(heroPerk('ice')&&heroP.iceM!==m){heroP.iceM=m;heroInv().freeze=(heroInv().freeze||0)+1;}
}

// ── Combo: tasks finished within an hour of each other ──
function heroCombo(silent){
  const tod=heroTod(),n=tasks.filter(t=>t.done.includes(tod)).length;let c=heroP.combo;
  if(!c||c.d!==tod)c=heroP.combo={d:tod,max:n,n:0,last:0};
  if(silent)c.max=Math.max(c.max,n); // ticks that came in by sync don't count
  if(n<=c.max)return 0;
  const now=Date.now();c.n=now-c.last<=36e5?c.n+(n-c.max):1;c.last=now;c.max=n;
  heroP.comboBest=Math.max(heroP.comboBest||0,c.n);
  if(c.n<2)return 0;
  heroBonus(tod,Math.min(heroPerk('combo')?50:25,5*(c.n-1)),{discipline:1},`Combo ×${c.n}`,'⚡','combo');
  return c.n;
}
const heroComboLeft=()=>{const c=heroP.combo;if(!c||c.d!==heroTod()||c.n<1)return 0;return Math.max(0,Math.round((c.last+36e5-Date.now())/6e4));};

// ── Daily login reward: a 7-day calendar ──
function heroLoginCheck(){
  const tod=heroTod(),l=heroP.login;if(l&&l.d===tod)return;
  const n=l&&l.d===dAdd(tod,-1)?l.n%7+1:1;heroP.login={d:tod,n};
  const xp=n===7?50:10*n;heroBonus(tod,xp,{discipline:1},`Day ${n} login reward`,'📅','login');
  const loot=n===7?heroLoot(tod):[];
  setTimeout(()=>heroShow(`<div class="hl-t">DAILY REWARD</div><div class="hl-week">${[1,2,3,4,5,6,7].map(i=>`<div class="${i<n?'got':i===n?'now':''}">${hIc(i===7?'chest':'coin',i<=n?'gold':'dark','circle',30)}<small>Day ${i}</small></div>`).join('')}</div><div class="hl-big" style="font-size:24px;">+${xp} XP</div>${loot.map(heroItemLine).join('')}${new Date().getDay()===0?'<div class="hl-row">📜 Your weekly report card is ready in Level → Story</div>':''}<div class="hl-rank">Come back tomorrow for day ${n%7+1}</div>`,4000),1500);
}

// ── Items and loot ──
const HERO_ITEMS={freeze:['Streak freeze','Saves a missed day so your streak lives on','snow','teal',150],potion:['XP potion','Double XP for everything today','flask','purple',120],reroll:['Quest reroll','Swap a daily quest for a new one','dice','blue',60],mega:['Mega potion','Triple XP for everything today (crafted only)','flask','legend',0]};
const heroItemLine=k=>`<div class="hl-row">${hIc(HERO_ITEMS[k][2],HERO_ITEMS[k][3],'hex',26)} <b>${HERO_ITEMS[k][0]}</b> found!</div>`;
function heroLoot(d=heroTod()){
  const n=(heroPerk('lucky')?2:1)+((heroEvent(d)||{}).id==='meteor'?1:0),inv=heroInv(),got=[];
  for(let i=0;i<n;i++){const r=Math.random(),k=r<.3?'freeze':r<.65?'potion':'reroll';inv[k]=(inv[k]||0)+1;got.push(k);}
  return got;
}
function heroUse(k){
  const inv=heroInv(),used=heroP.used=heroP.used||{},tod=heroTod();if(!(inv[k]>0))return;
  if(k==='potion'||k==='mega'){if([...(used.potion||[]),...(used.mega||[])].includes(tod))return showToast('🧪 A potion is already working today');used[k]=(used[k]||[]).concat(tod);}
  else if(k==='freeze'){
    const dn=heroDoneDays();let d=null;for(let i=1;i<=14;i++){const x=dAdd(tod,-i);if(!dn.has(x)&&dn.has(dAdd(x,-1))){d=x;break;}}
    if(!d)return showToast('🧊 No broken streak to save right now');
    if(!confirm(`Freeze ${fmtDay(d)} so your streak carries on?`))return;used.freeze=(used.freeze||[]).concat(d);
  }else if(k==='reroll'){
    const Q=heroQuests(),open=Q.d.map((q,i)=>({q,i})).filter(x=>!x.q.claimed&&!x.q.ready&&x.q.t!=='gwen');
    if(!open.length)return showToast('🎲 No open daily quest to reroll');
    return sheet(`<div style="text-align:center;">${hIc('dice','blue','hex',56)}</div><div class="sl">Which quest?</div>${open.map(x=>`<button class="mi" onclick="heroReroll(${x.i})">${esc(x.q.text)}</button>`).join('')}${closeBtn}`);
  }
  inv[k]--;save();renderHero();renderHeroMini();showToast(`${HERO_ITEMS[k][0]} used`);
}
function heroReroll(i){
  const inv=heroInv(),pid=heroPeriods().d.id,list=heroP.q[pid];if(!list||!list[i]||!(inv.reroll>0))return;
  const h=heroState(),L=h.L,pool=[{t:'perfect',n:1},{t:'mood',n:1},{t:'focus',n:25},{t:'xp',n:60+L*10},{t:'tasks',n:3},{t:'stat',stat:HERO_STATS[Math.floor(Math.random()*14)].id,n:20+L*2}].filter(q=>q.t!==list[i].t);
  list[i]=pool[Math.floor(Math.random()*pool.length)];inv.reroll--;save();closeOv('dt-ov');renderHero();renderHeroMini();showToast('🎲 New quest!');
}

// ── Coins and the shop: 1 coin for every 10 XP, spent on items and real-life rewards you set ──
const heroCoins=h=>Math.max(0,Math.floor(h.s.total/10))-(heroP.spent||0);
const heroShop=()=>heroP.shop=heroP.shop||[{id:'r1',name:'1 hour of gaming',cost:100},{id:'r2',name:'Movie night',cost:200},{id:'r3',name:'Order food',cost:300}];
function heroBuy(kind,id){
  const h=heroState(),c=heroCoins(h),r=kind==='item'?{name:HERO_ITEMS[id][0],cost:HERO_ITEMS[id][4]}:heroShop().find(x=>x.id===id);if(!r)return;
  if(c<r.cost)return showToast(`🪙 You need ${r.cost-c} more coins`);
  if(!confirm(`Buy ${r.name} for ${r.cost} coins?`))return;
  heroP.spent=(heroP.spent||0)+r.cost;heroP.buys=(heroP.buys||[]).concat({d:heroTod(),name:r.name,cost:r.cost}).slice(-50);
  if(kind==='item')heroInv()[id]=(heroInv()[id]||0)+1;
  save();renderHero();
  if(kind!=='item')heroShow(`<div class="hl-t">REWARD UNLOCKED</div><div class="hl-em">${hIc('trophy','gold','burst',80)}</div><div class="hl-big" style="font-size:24px;">${esc(r.name)}</div><div class="hl-rank">You earned it. Enjoy!</div>`,4000,true);
}
async function heroAddReward(){
  const name=(await ask('A real-life reward','e.g. New game, Shawarma, A day off')||'').trim().slice(0,40);if(!name)return;
  const cost=Math.max(10,Math.min(100000,parseInt(await ask('How many coins? (you earn 1 per 10 XP)','e.g. 250'),10)||0));if(!cost)return;
  heroShop().push({id:'r'+uid(),name,cost});save();renderHero();
}
function heroDelReward(id){if(!confirm('Remove this reward?'))return;heroP.shop=heroShop().filter(x=>x.id!==id);save();renderHero();}

// ── Gear: achievements unlock it, each piece adds a little XP ──
const HERO_GEAR=[['gloves','hands','Training gloves','hand','bronze',.01,'first'],['gaunt','hands','Gauntlets of will','hand','gold',.04,'s30'],
  ['helm','head','Iron helm','helm','silver',.02,'t100'],['crown','head','Crown of focus','crown','gold',.04,'l25'],
  ['cloak','body','Cloak of dawn','cloak','orange',.02,'s7'],['armor','body','Legend armor','cloak','purple',.05,'l50'],
  ['qbadge','badge','Quester badge','medal','blue',.02,'q10'],['seal','badge','Master seal','medal','gold',.03,'sk'],
  ['balance','badge','Balance medal','medal','teal',.03,'bal'],['slayer','badge','Slayer medal','medal','red',.03,'db10']];
const HERO_SLOTS={head:'Head',body:'Body',hands:'Hands',badge:'Badge'};
let heroGotCache=[];
const heroGearOk=g=>heroGotCache.includes(g[6]);
function heroGearFx(){const eq=heroP.gear||{};return Object.values(eq).reduce((n,id)=>{const g=HERO_GEAR.find(x=>x[0]===id);return n+(g&&heroGearOk(g)?g[5]:0);},0);}
function heroEquip(id){const g=HERO_GEAR.find(x=>x[0]===id);if(!g||!heroGearOk(g))return;const eq=heroP.gear=heroP.gear||{};eq[g[1]]=eq[g[1]]===id?'':id;heroDaily();save();renderHero();}

// ── Prestige: at Legend you can start again from level 1 with a star and +5% XP for good ──
function heroPrestige(){
  const h=heroState();if(h.L<75)return;
  if(!confirm('Prestige? You go back to level 1 (stats, skills and items stay) and get a prestige star with +5% XP forever.'))return;
  heroP.prestige=(heroP.prestige||[]).concat({d:heroTod(),xp:h.s.total});save();renderHero();
  heroShow(`<div class="hl-t">PRESTIGE ${h.P+1}</div><div class="hl-em">${hIc('star','legend','burst',96)}</div><div class="hl-big">Reborn</div>`,5000,true);
}

// ── Bosses: a daily one at a random time (sometimes an elite), a world boss on Friday nights and a rare nightmare
// late at night. Each rings the phone and has to be beaten in time. Saved per key: date (daily), date+'w', date+'n'. ──
const HERO_DB_MIN=30;
// [name, symbol, colour, challenge, stat, elite challenge]
const HERO_DBOSS=[['Sloth Golem','skull','dark','Do 25 push-ups','chest','Do 60 push-ups, any sets'],['Plank Wraith','flame','red','Hold a plank for 90 seconds','core','Hold a plank for 3 minutes, breaks allowed'],
  ['Squat Goblin','bolt','green','Do 40 squats','legs','Do 100 squats'],['Clutter Hydra','swords','purple','Tidy your room or desk for 10 minutes','discipline','Clean your whole room, floor included'],
  ['Thirst Djinn','leaf','teal','Drink 2 glasses of water','vitality','Drink 3 glasses of water and eat a piece of fruit'],['Scroll Specter','book','blue','Read 10 pages of a book','intellect','Read 20 pages of a book'],
  ['Phantom of Silence','chat','pink','Text or call a friend or someone in your family','charisma','Call someone you haven\'t talked to in a while'],['Doomscroll Dragon','target','orange','Put your phone face down for 15 minutes','focus','Phone in another room for 18 minutes, then come back and strike'],
  ['Dust Titan','shield','bronze','Do 20 burpees','endurance','Do 50 burpees'],['Wallet Leech','gem','gold','Skip one thing you were going to buy today','wealth','Write down every riyal you spent this week'],
  ['Shade of Heedlessness','moon','purple','Read a page of Quran or say your adhkar','faith','Read 2 pages of Quran and say your adhkar'],['Blank Page Imp','spark','pink','Draw, write or make something for 10 minutes','creativity','Draw, write or make something for 18 minutes'],
  ['Stiff Ogre','heart','red','Stretch for 5 minutes','vitality','Stretch for 12 minutes, whole body'],['Pull-up Harpy','wings','blue','Do as many pull-ups or rows as you can, 3 sets','back','5 sets of pull-ups or rows, as many as you can']];
const HERO_WBOSS=[['The World Eater','skull','legend'],['Titan of Tomorrow','shield','red'],['The Endless Scroll','target','purple'],['Colossus of Comfort','crown','orange']];
const HERO_NBOSS=[['Insomnia Lich','moon','purple','Phone on charge across the room and lights off'],['The Midnight Scroller','target','dark','Close every app and put the phone face down for 20 minutes'],
  ['Bedtime Banshee','skull','red','Brush your teeth, wash your face and set tomorrow\'s alarm'],['Shade of Tomorrow','scroll','blue','Write tomorrow\'s top 3 tasks in DayTrack'],['Restless Revenant','heart','teal','Stretch or breathe slowly for 5 minutes']];
function heroBossCfg(){const c=heroP.bossCfg=heroP.bossCfg||{};if(c.on===undefined)c.on=true;if(!c.onAt)c.onAt=Date.now();c.from=c.from||'10:00';c.to=c.to||'22:00';if(!c.seed)c.seed=Math.random().toString(36).slice(2,10);return c;}
const heroHM=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
// Shared tail: when, how long (plus Gwen's extra minutes), state
function heroBossAt(b,d,min,len){
  const rec=(heroP.bosses||{})[b.key]||{},t=new Date(d+'T00:00:00');t.setMinutes(min);
  const at=t.getTime(),until=at+(len+(rec.ext||0))*6e4,now=Date.now(),won=rec.won;
  if(at<heroBossCfg().onAt&&!won)return null; // no boss (and no curse) before bosses were switched on
  return{...b,d,at,until,won,ext:rec.ext||0,hits:rec.hits||[],state:won?'won':now<at?'soon':now<until?'on':'gone'};
}
function heroDBoss(d){
  const c=heroBossCfg();if(!c.on)return null;
  const r=heroRng(c.seed+d),a=heroHM(c.from),b=Math.max(a+31,heroHM(c.to))-HERO_DB_MIN;
  const min=a+Math.floor(r()*(b-a)),[name,g,col,task,stat,etask]=HERO_DBOSS[Math.floor(r()*HERO_DBOSS.length)],elite=r()<.15;
  return heroBossAt({key:d,kind:'d',name:elite?'Elite '+name:name,base:name,g,col:elite?'legend':col,task:elite?etask:task,stat,elite},d,min,elite?20:HERO_DB_MIN);
}
// World boss: every Friday at 9 PM (earlier if your boss hours end sooner), an hour to land three strikes
function heroWBoss(d){
  const c=heroBossCfg();if(!c.on||new Date(d+'T12:00:00').getDay()!==5)return null;
  const r=heroRng(c.seed+d+'w'),[name,g,col]=HERO_WBOSS[Math.floor(r()*HERO_WBOSS.length)],pool=[...HERO_DBOSS],tasks=[];
  while(tasks.length<3)tasks.push(pool.splice(Math.floor(r()*pool.length),1)[0][3]);
  const min=Math.max(heroHM(c.from),Math.min(21*60,heroHM(c.to)-60));
  return heroBossAt({key:d+'w',kind:'w',name,base:name,g,col,task:tasks.join(' · '),tasks,stat:'discipline'},d,min,60);
}
// Nightmare: on about one night in seven, late (after 10 PM, inside your boss hours); no curse, double loot
function heroNBoss(d){
  const c=heroBossCfg();if(!c.on||c.night===false)return null;
  const r=heroRng(c.seed+d+'n');if(r()>.15)return null;
  const a=Math.max(22*60,heroHM(c.from)),b=heroHM(c.to)-HERO_DB_MIN;if(b<a)return null;
  const min=a+Math.floor(r()*(b-a+1)),[name,g,col,task]=HERO_NBOSS[Math.floor(r()*HERO_NBOSS.length)];
  return heroBossAt({key:d+'n',kind:'n',name,base:name,g,col,task,stat:'vitality'},d,min,HERO_DB_MIN);
}
const heroBossList=d=>[heroDBoss(d),heroWBoss(d),heroNBoss(d)].filter(Boolean);
const heroBossGet=key=>({d:heroDBoss,w:heroWBoss,n:heroNBoss}[key[10]||'d'])(key.slice(0,10));
const heroBossWins=()=>Object.values(heroP.bosses||{}).filter(b=>b.won).length;
const heroBossXP=(b,L)=>Math.round((80+5*L)*(heroPerk('hunter',b.d)?1.5:1)*(b.kind==='w'?3:b.kind==='n'?1.5:b.elite?2:1));
const heroBossLoot=b=>b.kind==='w'?3:b.kind==='n'||b.elite?2:1;
let heroBossSent='',heroBossTest=0;
function heroBossSync(){
  const N=window.DayTrackNative;if(!N||!N.bosses)return;
  const now=Date.now(),list=[0,1,2].flatMap(i=>heroBossList(dAdd(heroTod(),i))).filter(b=>!b.won&&b.until>now&&b.key!==heroBossShown)
    .map(b=>({at:b.at,until:b.until,title:`${b.kind==='w'?'🌍 World boss':b.kind==='n'?'🌙 Nightmare':'⚔️'} ${b.name} appeared!`,body:`${b.task}. You have ${Math.round((b.until-b.at)/6e4)} minutes. Open DayTrack to fight!`}));
  if(heroBossTest>now)list.unshift({at:heroBossTest-25*6e4,until:heroBossTest,title:'⚔️ Test boss appeared!',body:'This is how a daily boss rings. Open DayTrack to stop it.'});
  const j=JSON.stringify(list);if(j!==heroBossSent){heroBossSent=j;try{N.bosses(j);}catch(e){}}
}
function heroBossTestRing(){
  const N=window.DayTrackNative;
  if(!N||!N.bosses)return showToast('The ringing alarm works in the phone app. Here the boss screen and a sound show up.');
  heroBossTest=Date.now()+5000+25*6e4;heroBossSent='';heroBossSync();showToast('📳 Lock your phone: the test boss rings in 5 seconds');
}
let heroBossShown='',heroAlarm=null;
function heroBossWatch(){
  const b=heroBossList(heroTod()).find(x=>x.state==='on'&&heroBossShown!==x.key);if(!b)return;
  if(document.visibilityState==='visible')heroBossOpen(true,b.key);
  else if(!window.DayTrackNative&&window.Notification&&Notification.permission==='granted'&&heroBossShown!=='n'+b.key){heroBossShown='n'+b.key;try{new Notification(`⚔️ ${b.name} appeared!`,{body:`${b.task}. Beat it in time!`});}catch(e){}}
}
if(typeof document!=='undefined'){
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(heroBossWatch,500);});
  setInterval(()=>{try{heroBossWatch();}catch(e){}},15000);
}
function heroBossOpen(alarm,key){
  const N=window.DayTrackNative;if(N&&N.stopBoss)try{N.stopBoss();}catch(e){}
  const list=heroBossList(heroTod()),b=key?list.find(x=>x.key===key):list.find(x=>x.state==='on');
  if(typeof switchTab==='function'&&document.body.dataset.tab!=='hero'){heroSeg='quests';switchTab('hero');}else heroSetSeg('quests');
  if(!b||b.state!=='on')return;
  const fresh=heroBossShown!==b.key;heroBossShown=b.key;heroBossSync();heroDefs(); // seen in the app: the phone doesn't need to ring for it
  let el=document.getElementById('hero-boss');if(!el){el=document.createElement('div');el.id='hero-boss';document.body.appendChild(el);}
  const help=typeof gwenCfg!=='undefined'&&gwenCfg.key&&heroP.gwenHelp!==heroTod(),line=heroBossLine(b,'taunt');
  const strike=b.kind==='w'?`<div class="hbx-ws">${b.tasks.map((t,i)=>b.hits.includes(i)?`<div class="hbx-w got">✓ ${esc(t)}</div>`:`<button class="hbx-w" onclick="heroBossWin('${b.key}',${i})">⚔️ ${esc(t)}</button>`).join('')}</div>`
    :`<div class="hbx-task">${esc(b.task)}</div>`;
  el.innerHTML=`<div class="hbx${b.kind==='n'?' night':b.kind==='w'?' world':b.elite?' elite':''}"><div class="hbx-t">${b.kind==='w'?'🌍 WORLD BOSS 🌍':b.kind==='n'?'🌙 A NIGHTMARE CRAWLS IN 🌙':b.elite?'⚠ AN ELITE BOSS APPEARED ⚠':'⚠ A BOSS APPEARED ⚠'}</div><div class="hbx-em">${hIc(b.g,b.col,'burst',120)}</div><div class="hbx-n">${esc(b.name)}</div>
    <div class="hbx-q">“${esc(line)}”</div>
    <div class="boss-hp hbx-hp"><i id="hbx-hp" style="width:${b.kind==='w'?100-b.hits.length/3*100:100}%"></i></div>${strike}<div class="hbx-time" id="hbx-time"></div>
    ${b.kind==='w'?'':`<button class="hbx-go" onclick="heroBossWin('${b.key}')">⚔️ I did it! Strike!</button>`}${help?`<button class="hbx-later hbx-gwen" onclick="heroGwenHelp('${b.key}')">💜 Gwen, help! (+5 minutes, once a day)</button>`:''}<button class="hbx-later" onclick="heroBossClose()">Not yet</button>
    <div class="hbx-r">Win: +${heroBossXP(b,heroState().L)} XP and ${heroBossLoot(b)>1?heroBossLoot(b)+' loot':'loot'}${b.kind==='d'?` · Run out of time: −10% XP today`:' · No curse if it gets away'}</div></div>`;
  el.classList.add('on');
  const tick=()=>{const t=document.getElementById('hbx-time');if(!t)return clearInterval(heroBossOpen.t);const ms=b.until-Date.now();if(ms<=0){heroBossClose();renderHero();return;}t.textContent=`${Math.floor(ms/6e4)}:${String(Math.floor(ms/1e3)%60).padStart(2,'0')} left`;};
  clearInterval(heroBossOpen.t);heroBossOpen.t=setInterval(tick,1000);tick();
  if(alarm)heroAlarmOn();
  if(fresh){heroSfx('roar');setTimeout(()=>heroSay(line),900);}
}
// Gwen buys you five more minutes, once a day
function heroGwenHelp(key){
  const tod=heroTod();if(heroP.gwenHelp===tod)return;const b=heroBossGet(key);if(!b||b.state!=='on')return;
  heroP.bosses=heroP.bosses||{};const rec=heroP.bosses[key]=heroP.bosses[key]||{};rec.ext=(rec.ext||0)+5;heroP.gwenHelp=tod;
  if(typeof gwenBond==='function')gwenBond(2);save();heroBossSent='';heroBossSync();heroBossOpen(false,key);
  showToast('💜 Gwen: I bought you 5 more minutes. Go go go!');
}
// A siren from the app itself (the phone app also rings like an alarm)
function heroAlarmOn(){
  heroAlarmOff();if(navigator.vibrate)navigator.vibrate([500,200,500,200,500,200,800]);
  const a=new Audio('boss.ogg');a.loop=true;a.volume=1;heroAlarm={a};
  setTimeout(()=>{if(heroAlarm&&heroAlarm.a===a)heroAlarmOff();},60000);
  document.addEventListener('pointerdown',heroAlarmOff,{once:true});
  a.play().catch(()=>{if(heroAlarm&&heroAlarm.a===a){heroAlarm=null;heroSiren();}});
}
function heroSiren(){const ctx=typeof gwenAudioCtx==='function'?gwenAudioCtx():null;if(navigator.vibrate)navigator.vibrate([500,200,500,200,500,200,800]);if(!ctx)return;
  const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';g.gain.value=0;o.connect(g);g.connect(ctx.destination);o.start();
  let on=0,n=0;const iv=setInterval(()=>{on^=1;n++;o.frequency.setValueAtTime(on?880:620,ctx.currentTime);g.gain.setTargetAtTime(.12,ctx.currentTime,.01);if(n>60)heroAlarmOff();},350);
  heroAlarm={o,g,iv};
  document.addEventListener('pointerdown',heroAlarmOff,{once:true});
}
function heroAlarmOff(){if(!heroAlarm)return;if(heroAlarm.a)heroAlarm.a.pause();clearInterval(heroAlarm.iv);try{heroAlarm.o&&heroAlarm.o.stop();}catch(e){}heroAlarm=null;if(navigator.vibrate)navigator.vibrate(0);}
function heroBossClose(){heroAlarmOff();clearInterval(heroBossOpen.t);const el=document.getElementById('hero-boss');if(el)el.classList.remove('on');}
function heroBossWin(key,hit){
  const b=key?heroBossGet(key):heroBossList(heroTod()).find(x=>x.state==='on');if(!b||b.state!=='on')return heroBossClose();
  heroAlarmOff();heroSfx('hit');heroP.bosses=heroP.bosses||{};const rec=heroP.bosses[b.key]=heroP.bosses[b.key]||{};
  if(b.kind==='w'){rec.hits=[...new Set([...(rec.hits||[]),hit])];if(rec.hits.length<3){save();heroBossOpen(false,b.key);return;}}
  const L=heroState().L,xp=heroBossXP(b,L),now=Date.now();
  rec.won=now;rec.name=b.name;
  const lim=dAdd(b.d,-60);for(const d in heroP.bosses)if(d<lim)delete heroP.bosses[d];
  const bk=heroBook(),e=bk[b.base]=bk[b.base]||{n:0,first:b.d};e.n++;if(b.elite)e.el=(e.el||0)+1;if(!e.best||now-b.at<e.best)e.best=now-b.at;
  heroBonus(b.d,xp,{[b.stat]:1,discipline:.3},`Beat ${b.name}`,'⚔️','dboss');
  let loot=[];for(let i=0;i<heroBossLoot(b);i++)loot=loot.concat(heroLoot(b.d));
  const hp=document.getElementById('hbx-hp');if(hp)hp.style.width='0%';
  const box=document.querySelector('#hero-boss .hbx');if(box)box.classList.add('hit');
  heroSay(heroBossLine(b,'die'));
  setTimeout(()=>{heroBossClose();save();renderTaskList();renderHero();heroSfx('fanfare');
    heroShow(`<div class="hl-t">${b.kind==='w'?'WORLD BOSS DOWN':'BOSS DEFEATED'}</div><div class="hl-em">${hIc('trophy','gold','burst',96)}</div><div class="hl-big" style="font-size:24px;">${esc(b.name)}</div><div class="hl-row">+${xp} XP · beaten in ${Math.max(1,Math.round((now-b.at)/6e4))} min</div>${loot.map(heroItemLine).join('')}`,5000,true);
    if(typeof gwenCfg!=='undefined'&&gwenCfg.key&&typeof gwenLine==='function')gwenLine(`You beat ${b.name}! That's my hero 💜`,'happy');},900);
}
// What a boss says: a taunt when it shows up, a groan when it falls (read out where the device can speak)
function heroBossLine(b,k){
  const r=heroRng(b.key+k),t=b.task.charAt(0).toLowerCase()+b.task.slice(1);
  const L=k==='die'?[`No… beaten by Rayan…`,`This isn't over. I'll be back.`,`Impossible! How are you this strong?`,`Arrgh… remember my name…`]
    :b.kind==='n'?[`It's late, Rayan. Stay up with me… forever.`,`Sleep is for the weak. Keep scrolling…`,`The night is mine. You'll never ${t}.`]
    :[`I am ${b.name}. You'll never ${t}!`,`${b.name} has come for your XP!`,`Ha! ${b.task}? You're too weak, Rayan!`,`Your excuses feed me. Try to ${t}, I dare you.`];
  return L[Math.floor(r()*L.length)];
}
function heroSay(text){
  if(heroP.sfx===false||!window.speechSynthesis||typeof SpeechSynthesisUtterance==='undefined')return;
  try{const u=new SpeechSynthesisUtterance(text);u.pitch=.1;u.rate=.85;u.volume=1;const v=speechSynthesis.getVoices().filter(v=>v.lang.startsWith('en'));if(v.length)u.voice=v.find(x=>/male|david|guy|daniel/i.test(x.name))||v[0];speechSynthesis.speak(u);}catch(e){}
}
async function heroBossSettings(){
  const c=heroBossCfg();
  sheet(`<div style="text-align:center;">${hIc('skull','red','burst',56)}</div><div style="font-size:18px;font-weight:700;text-align:center;color:var(--txt);">Battle settings</div>
    <div class="hm-sub" style="text-align:center;margin:4px 0 12px;">One boss a day at a random time (sometimes an elite). You get ${HERO_DB_MIN} minutes to do its challenge. A world boss comes every Friday night.</div>
    <label class="hx-row"><input type="checkbox" id="hb-on" ${c.on?'checked':''}> Bosses on</label>
    <div class="hx-row">Between <input class="inp" type="time" id="hb-from" value="${c.from}" style="width:auto;"> and <input class="inp" type="time" id="hb-to" value="${c.to}" style="width:auto;"></div>
    <label class="hx-row"><input type="checkbox" id="hb-night" ${c.night!==false?'checked':''}> Nightmare bosses after 10 PM (inside these hours)</label>
    <label class="hx-row"><input type="checkbox" id="hb-hp" ${heroP.hpOff?'':'checked'}> Health (HP): missed tasks hurt, at 0 you fall</label>
    <label class="hx-row"><input type="checkbox" id="hb-sfx" ${heroP.sfx===false?'':'checked'}> Sounds and boss voices</label>
    <div class="hm-sub" style="margin:6px 0 10px;">On the phone it rings like an alarm, even on silent, until you open DayTrack. Do Not Disturb can still hold it back.</div>
    <div style="display:flex;gap:8px;margin-bottom:8px;"><button class="hk-btn" onclick="heroAlarm?heroAlarmOff():heroAlarmOn()">🥁 Hear the music</button><button class="hk-btn" onclick="heroBossTestRing()">📳 Test the alarm</button></div>
    <button class="hk-btn pri" style="width:100%;" onclick="heroBossSave()">Save</button>${closeBtn}`);
}
function heroBossSave(){
  const c=heroBossCfg(),f=document.getElementById('hb-from').value,t=document.getElementById('hb-to').value;
  const was=c.on;c.on=document.getElementById('hb-on').checked;if(/^\d\d:\d\d$/.test(f))c.from=f;if(/^\d\d:\d\d$/.test(t))c.to=t;
  if(c.to<=c.from)c.to='22:00';c.night=document.getElementById('hb-night').checked;
  const hpWas=!heroP.hpOff;heroP.hpOff=!document.getElementById('hb-hp').checked;if(!heroP.hpOff&&!hpWas)heroP.hpOn=heroTod(); // switching HP back on starts fresh
  heroP.sfx=document.getElementById('hb-sfx').checked;
  if(c.on&&!was)c.onAt=Date.now();else if(heroBossList(heroTod()).some(b=>b.state==='gone'))c.onAt=Date.now(); // moving the hours never curses today
  heroBossSent='';save();closeOv('dt-ov');renderHero();renderHeroMini();showToast(c.on?'⚔️ Saved':'Bosses off');
}
function heroBossCard(mini){
  const list=heroBossList(heroTod());
  if(!heroBossCfg().on)return mini?'':`<div class="dboss off" onclick="heroBossSettings()"><div style="flex:1">Daily bosses are off</div><span class="minibtn">Turn on</span></div>`;
  return list.filter(b=>!(b.state==='soon'&&(mini||b.kind==='n'))).map(b=>{
    const hide=b.state==='soon'&&b.kind==='d',ic=hIc(b.state==='won'?'trophy':b.state==='gone'||hide?'skull':b.g,b.state==='won'?'gold':b.state==='gone'||hide?'dark':b.col,'burst',mini?40:54); // a lurking boss stays a mystery
    const left=Math.max(0,Math.ceil((b.until-Date.now())/6e4)),W=b.kind==='w';
    const body={soon:W?`<b>🌍 World boss tonight</b><small>${esc(b.name)} arrives at ${new Date(b.at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}. One hour, three strikes, big loot.</small>`
        :`<b>A boss is lurking…</b><small>It shows up at a random time between ${c12(heroBossCfg().from)} and ${c12(heroBossCfg().to)}. Keep your phone close.</small>`,
      on:`<b>${esc(b.name)} is here!</b><small>${W?`${b.hits.length}/3 strikes`:esc(b.task)} · ${left} min left</small>`,
      won:`<b>${esc(b.name)} defeated</b><small>${W?'See you next Friday':'Next boss tomorrow'}. Wins so far: ${heroBossWins()}</small>`,
      gone:`<b>${esc(b.name)} escaped</b><small>${b.kind==='d'?'Its curse: −10% XP today. Be ready tomorrow.':'No curse this time.'}</small>`}[b.state];
    return`<div class="dboss ${b.state}${b.kind!=='d'||(b.elite&&!hide)?' '+(b.kind==='n'?'night':b.kind==='w'?'world':'elite'):''}"${b.state==='on'?` onclick="heroBossOpen(false,'${b.key}')"`:''}>${ic}<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;">${body}</div>${b.state==='on'?'<span class="hq-claim">Fight</span>':mini?'':`<button class="minibtn" onclick="event.stopPropagation();heroBossSettings()">⚙</button>`}</div>`;
  }).join('')||(mini?'':`<div class="dboss off" onclick="heroBossSettings()"><div style="flex:1">No boss today</div><span class="minibtn">⚙</span></div>`);
}
const c12=hm=>{const[h,m]=hm.split(':').map(Number);return`${(h+11)%12+1}${m?':'+String(m).padStart(2,'0'):''} ${h<12?'AM':'PM'}`;};
// Bosses beaten, for Gwen's house: each becomes a trophy parcel
function heroTrophies(){
  const lim=dAdd(heroTod(),-14),out=Object.entries(heroP.bosses||{}).filter(([d,b])=>b.won&&d.slice(0,10)>=lim).map(([d,b])=>({id:'b-'+d,date:d.slice(0,10),reason:`Rayan beat ${b.name||'a daily boss'}`}));
  Object.entries(heroP.claims||{}).forEach(([k,c])=>{if(k[0]==='w'&&c.d>=lim&&/^Quest: Earn \d+ XP$/.test(c.what||''))out.push({id:'w-'+k.slice(1,11),date:c.d,reason:'Rayan defeated the weekly boss'});});
  return out;
}

// ── Boss book: every boss you've met, with your fastest win; the ones you haven't met are dark ──
function heroBook(){
  if(!heroP.book){heroP.book={};Object.entries(heroP.bosses||{}).forEach(([k,r])=>{if(!r.won)return;const b=heroBossGet(k),base=b?b.base:(r.name||'').replace(/^Elite /,'');if(!base)return;
    const e=heroP.book[base]=heroP.book[base]||{n:0,first:k.slice(0,10)};e.n++;if(b&&(!e.best||r.won-b.at<e.best))e.best=r.won-b.at;});}
  return heroP.book;
}
const heroMin=ms=>ms?`${Math.floor(ms/6e4)}:${String(Math.floor(ms/1e3)%60).padStart(2,'0')}`:'–';
function heroBookHtml(){
  const bk=heroBook(),all=[...HERO_DBOSS.map(x=>[x[0],x[1],x[2],x[3],'Daily']),...HERO_WBOSS.map(x=>[x[0],x[1],x[2],'Three strikes in an hour','World']),...HERO_NBOSS.map(x=>[x[0],x[1],x[2],x[3],'Nightmare'])];
  const met=all.filter(x=>bk[x[0]]).length;
  return`<div class="hm-sub" style="margin-bottom:8px;">${met} of ${all.length} bosses beaten. Tap one you've beaten to fight it again for practice (no XP, just your best time).</div><div class="book">`
    +all.map(([n,g,c,t,k])=>{const e=bk[n];return e?`<button class="bk" onclick="heroReplay('${esc(n).replace(/'/g,'\\\'')}')">${hIc(g,c,'burst',44)}<b>${esc(n)}</b><small>${k} · beaten ${e.n}×${e.el?` (${e.el} elite)`:''}</small><small>Fastest ${heroMin(e.best)}${e.rb?` · practice ${heroMin(e.rb)}`:''}</small></button>`
      :`<div class="bk lock">${hIc('lock','dark','burst',44)}<b>???</b><small>${k} boss</small></div>`;}).join('')+'</div>';
}
// Practice fight: a stopwatch and a strike button, for a best time
function heroReplay(name){
  const x=[...HERO_DBOSS,...HERO_NBOSS].find(b=>b[0]===name)||HERO_WBOSS.find(b=>b[0]===name);if(!x)return;
  const task=x[3]||'Do 3 of your daily boss challenges',t0=Date.now();heroDefs();closeOv('dt-ov');
  let el=document.getElementById('hero-boss');if(!el){el=document.createElement('div');el.id='hero-boss';document.body.appendChild(el);}
  el.innerHTML=`<div class="hbx"><div class="hbx-t">PRACTICE FIGHT</div><div class="hbx-em">${hIc(x[1],x[2],'burst',110)}</div><div class="hbx-n">${esc(name)}</div><div class="boss-hp hbx-hp"><i id="hbx-hp" style="width:100%"></i></div>
    <div class="hbx-task">${esc(task)}</div><div class="hbx-time" id="hbx-time">0:00</div><button class="hbx-go" onclick="heroReplayWin('${esc(name).replace(/'/g,'\\\'')}',${t0})">⚔️ Done! Strike!</button><button class="hbx-later" onclick="heroBossClose()">Give up</button>
    <div class="hbx-r">Practice: no XP, no curse. Best time ${heroMin((heroBook()[name]||{}).rb)}</div></div>`;
  el.classList.add('on');heroSfx('roar');
  clearInterval(heroBossOpen.t);heroBossOpen.t=setInterval(()=>{const t=document.getElementById('hbx-time');if(!t)return clearInterval(heroBossOpen.t);t.textContent=heroClock(Date.now()-t0);},1000);
}
function heroReplayWin(name,t0){
  const ms=Date.now()-t0,e=heroBook()[name];heroSfx('hit');if(e&&(!e.rb||ms<e.rb)){e.rb=ms;save();showToast(`🏆 New best time: ${heroMin(ms)}`);}else showToast(`⏱️ ${heroMin(ms)} · best ${heroMin(e&&e.rb)}`);
  const hp=document.getElementById('hbx-hp');if(hp)hp.style.width='0%';setTimeout(()=>{heroBossClose();renderHero();},700);
}

// ── Class evolution at level 20 ──
const HERO_EVOLVE={arms:'Calisthenics Master',chest:'Juggernaut',back:'Wall Climber',core:'Iron Core',legs:'Sprinter',endurance:'Marathoner',intellect:'Sage',focus:'Strategist',
  creativity:'Artisan',faith:'Hafiz Path',discipline:'Ascetic',vitality:'Healer',charisma:'Diplomat',wealth:'Merchant Lord'};

// ── Personal records ──
function heroRecords(h){
  const byDay={},tk={},wk={};
  h.aw.forEach(a=>{byDay[a.d]=(byDay[a.d]||0)+a.xp;if(a.k==='task')tk[a.d]=(tk[a.d]||0)+1;const w=heroWeekStart(a.d);wk[w]=(wk[w]||0)+a.xp;});
  const mx=o=>Math.max(0,...Object.values(o));
  const out=[['streak','Longest streak',heroBestStreak(),'days','flame'],['xpday','Most XP in a day',mx(byDay),'XP','bolt'],['xpweek','Best week',mx(wk),'XP','star'],
    ['tasks','Most tasks in a day',mx(tk),'tasks','check'],['focus','Longest focus session',Math.max(0,...savedSessions.map(s=>Math.round(s.total/6e4))),'min','clock'],
    ['combo','Best combo',heroP.comboBest||0,'×','bolt']];
  const per={};tasks.forEach(t=>{if(!t.count)return;const u=(t.count.unit||t.name).toLowerCase().trim().slice(0,30);
    const days=new Set([...Object.keys(t.counts||{}),...t.done]);days.forEach(d=>{const n=Math.max((t.counts||{})[d]||0,t.done.includes(d)?t.count.target:0);per[u]=per[u]||{};per[u][d]=(per[u][d]||0)+n;});});
  Object.entries(per).forEach(([u,o])=>out.push(['u-'+u,`Most ${u} in a day`,mx(o),'','dumbbell']));
  const ft=Object.values(heroP.tests||{});[['pushups','Max push-ups','reps'],['pullups','Max pull-ups','reps'],['plank','Longest plank','sec'],['squats','Squats in a minute','reps']].forEach(([k,n,u])=>{const v=Math.max(0,...ft.map(t=>t[k]||0));if(v)out.push(['ft-'+k,n,v,u,'medal']);});
  return out.map(([id,name,v,u,gl])=>({id,name,v,u,gl}));
}
function heroRecCheck(silent){
  const h=heroState(),rec=heroP.rec=heroP.rec||{},fresh=[];
  heroRecords(h).forEach(r=>{if(r.v>(rec[r.id]||0)){if(rec[r.id]&&!silent)fresh.push({...r,was:rec[r.id]});rec[r.id]=r.v;}});
  if(h.evo&&!heroP.evolved){heroP.evolved={d:heroTod(),cls:h.evo};if(!silent)setTimeout(()=>heroShow(`<div class="hl-t">CLASS EVOLVED</div><div class="hl-em">${hIc('wings','legend','burst',96)}</div><div class="hl-big" style="font-size:26px;">${esc(h.evo)}</div><div class="hl-rank">+5% XP from now on</div>`,5000,true),1200);}
  if(fresh.length)setTimeout(()=>heroShow(`<div class="hl-t">NEW RECORD</div>${fresh.slice(0,3).map(r=>`<div class="hl-em">${hIc(r.gl,'gold','burst',64)}</div><div class="hl-big" style="font-size:22px;">${esc(r.name)}</div><div class="hl-row">${r.was} → <b>${r.v} ${r.u}</b></div>`).join('')}`,4500,true),1600);
}

// ── Story chapters: a long questline that unlocks one chapter at a time ──
const HERO_STORY=[['Awakening',[['tasks',10,'Complete 10 tasks'],['level',3,'Reach level 3'],['skill',1,'Master a skill step']]],
  ['First blood',[['dboss',1,'Beat a daily boss'],['quests',5,'Claim 5 quests'],['streak',3,'Finish every task 3 days in a row']]],
  ['The climb',[['level',10,'Reach level 10'],['pushday',100,'Do 100 push-ups in one day'],['streak',7,'A 7-day streak']]],
  ['Mind over matter',[['focus',600,'Focus 600 minutes with the Timer'],['journal',14,'Write 14 journal lines'],['stat:intellect',8,'Intellect level 8']]],
  ['Iron will',[['tasks',300,'Complete 300 tasks'],['dboss',10,'Beat 10 daily bosses'],['perfect',30,'Finish every task on 30 days']]],
  ['The faithful',[['stat:faith',12,'Faith level 12'],['skill',10,'Master 10 skill steps'],['streak',14,'A 14-day streak']]],
  ['Warrior\'s road',[['level',15,'Reach level 15 (Warrior)'],['dboss',30,'Beat 30 daily bosses'],['pushday',200,'Do 200 push-ups in one day']]],
  ['Legend in the making',[['level',30,'Reach level 30'],['streak',30,'A 30-day streak'],['skill',25,'Master 25 skill steps']]]];
function heroStoryVal(k,h){
  if(k.startsWith('stat:'))return heroLvl(h.s.st[k.slice(5)],HERO_SB);
  switch(k){case'tasks':return h.aw.filter(a=>a.k==='task').length;case'level':return h.L+75*h.P;case'skill':return heroSkills().reduce((n,s)=>n+heroDone(s.id),0);
    case'dboss':return heroBossWins();case'quests':return Object.keys(heroP.claims||{}).length;case'streak':return heroBestStreak();
    case'pushday':{const r=heroRecords(h).filter(r=>/push/.test(r.id));return Math.max(0,...r.map(x=>x.v));}
    case'focus':return h.aw.reduce((n,a)=>n+(a.min||0),0);case'journal':return Object.keys(heroP.journal||{}).length;case'perfect':return completedDays.length;}
  return 0;
}
function heroStoryHtml(h){
  const ch=heroP.ch||0,c=HERO_STORY[ch];
  const done=HERO_STORY.slice(0,ch).map((x,i)=>`<div class="hst done">${hIc('check','green','circle',22)} Chapter ${i+1}: ${x[0]}</div>`).join('');
  if(!c)return done+'<div class="hm-sub" style="margin-top:8px;">To be continued… you finished every chapter so far.</div>';
  const goals=c[1].map(([k,n,t])=>{const v=Math.min(n,heroStoryVal(k,h));return{t,v,n,ok:v>=n};}),all=goals.every(g=>g.ok);
  return done+`<div class="hst-now"><div class="hst-h">${hIc('scroll','purple','shield',34)}<div><small>Chapter ${ch+1}</small><b>${c[0]}</b></div></div>`
    +goals.map(g=>`<div class="hq${g.ok?' got':''}"><div style="flex:1;min-width:0;"><div class="hq-t">${esc(g.t)}</div><div class="hq-b"><span class="bar"><i style="width:${g.v/g.n*100}%"></i></span><small>${g.v}/${g.n}</small></div></div>${g.ok?'<span class="hq-ok">✓</span>':''}</div>`).join('')
    +(all?`<button class="hq-chest" onclick="heroStoryClaim()">📜 Finish chapter ${ch+1} (+${200*(ch+1)} XP and loot)</button>`:'')+'</div>';
}
function heroStoryClaim(){
  const h=heroState(),ch=heroP.ch||0,c=HERO_STORY[ch];if(!c||!c[1].every(([k,n])=>heroStoryVal(k,h)>=n))return;
  heroP.ch=ch+1;heroBonus(heroTod(),200*(ch+1),{discipline:1},`Chapter ${ch+1}: ${c[0]}`,'📜','story');const loot=heroLoot();
  save();renderTaskList();renderHero();
  heroShow(`<div class="hl-t">CHAPTER ${ch+1} COMPLETE</div><div class="hl-em">${hIc('scroll','legend','burst',90)}</div><div class="hl-big" style="font-size:24px;">${c[0]}</div><div class="hl-row">+${200*(ch+1)} XP</div>${loot.map(heroItemLine).join('')}`,5000,true);
}

// ── Monthly fitness test ──
const HERO_TESTS=[['pushups','Max push-ups in one go','reps',4,{chest:.6,arms:.6}],['pullups','Max pull-ups in one go','reps',10,{back:.6,arms:.6}],['plank','Longest plank','seconds',1,{core:1}],['squats','Squats in one minute','reps',2,{legs:1}]];
function heroTestOpen(){
  const m=heroTod().slice(0,7),cur=(heroP.tests||{})[m]||{},prev=heroTestPrev(m);
  sheet(`<div style="text-align:center;">${hIc('medal','gold','burst',56)}</div><div style="font-size:18px;font-weight:700;text-align:center;color:var(--txt);">Fitness test · ${new Date().toLocaleString('en',{month:'long'})}</div>
    <div class="hm-sub" style="text-align:center;margin:4px 0 10px;">Do each one with good form, rest in between, then write what you got. Beating last month's numbers gives extra XP.</div>
    ${HERO_TESTS.map(([k,n,u])=>`<div class="hx-row"><span style="flex:1;">${n}${prev&&prev[k]?` <small style="color:var(--sub)">(last: ${prev[k]})</small>`:''}</span><input class="inp" type="number" min="0" max="2000" id="ft-${k}" value="${cur[k]||''}" placeholder="${u}" style="width:90px;"></div>`).join('')}
    <button class="hk-btn pri" style="width:100%;margin-top:10px;" onclick="heroTestSave()">Save results</button>${closeBtn}`);
}
function heroTestPrev(m){const ks=Object.keys(heroP.tests||{}).filter(k=>k<m).sort();return ks.length?heroP.tests[ks[ks.length-1]]:null;}
function heroTestSave(){
  const m=heroTod().slice(0,7),prev=heroTestPrev(m),r={d:heroTod()};let xp=50;const st={endurance:.3};
  HERO_TESTS.forEach(([k,,,per,w])=>{const v=Math.max(0,Math.min(2000,parseInt(document.getElementById('ft-'+k).value,10)||0));if(v)r[k]=v;
    if(v){for(const s in w)st[s]=Math.max(st[s]||0,w[s]);if(prev&&prev[k]&&v>prev[k])xp+=(v-prev[k])*per;}});
  if(Object.keys(r).length<2)return showToast('Write at least one result');
  xp=Math.min(400,xp);heroP.tests=heroP.tests||{};heroP.tests[m]=r;
  heroP.bonus=(heroP.bonus||[]).filter(b=>!(b.k==='test'&&b.m===m));heroBonus(heroTod(),xp,st,'Fitness test','🏅','test',{m});
  save();closeOv('dt-ov');renderTaskList();renderHero();
}
function heroTestHtml(){
  const ks=Object.keys(heroP.tests||{}).sort().reverse().slice(0,3),m=heroTod().slice(0,7);
  return(ks.length?`<table class="ft-t"><tr><th></th>${ks.map(k=>`<th>${new Date(k+'-15').toLocaleString('en',{month:'short'})}</th>`).join('')}</tr>${HERO_TESTS.map(([k,n,u])=>`<tr><td>${n.replace(/ in one go| in one minute/,'')}</td>${ks.map(x=>`<td>${heroP.tests[x][k]||'–'}</td>`).join('')}</tr>`).join('')}</table>`:'<div class="hm-sub">Once a month: max push-ups, pull-ups, plank and squats. Your numbers become records and XP.</div>')
    +`<button class="minibtn" style="margin-top:10px;width:100%;padding:10px;" onclick="heroTestOpen()">${(heroP.tests||{})[m]?'Edit this month\'s test':'🏅 Take this month\'s test'}</button>`;
}

// ── Bounty board: your own quests with your own price ──
async function heroAddBounty(){
  const text=(await ask('What\'s the bounty?','e.g. Clean the car')||'').trim().slice(0,60);if(!text)return;
  const xp=Math.max(10,Math.min(300,parseInt(await ask('XP reward (10 to 300)','50'),10)||50)),st=heroDetect(text);
  heroP.bounties=(heroP.bounties||[]).concat({id:'b'+uid(),text,xp,st:Object.keys(st).length?st:{discipline:1},done:null});save();renderHero();
}
function heroBountyDone(id){const b=(heroP.bounties||[]).find(x=>x.id===id);if(!b||b.done)return;b.done=heroTod();save();renderTaskList();renderHero();}
function heroBountyDel(id){if(!confirm('Remove this bounty?'))return;heroP.bounties=(heroP.bounties||[]).filter(x=>x.id!==id);save();renderHero();}
function heroBountyHtml(){
  const lim=dAdd(heroTod(),-7),l=(heroP.bounties||[]).filter(b=>!b.done||b.done>=lim);
  return(l.length?l.map(b=>`<div class="hq${b.done?' got':''}">${hIc('flag','orange','shield',26)}<div style="flex:1;min-width:0;"><div class="hq-t">${esc(b.text)}</div></div>${b.done?'<span class="hq-ok">✓</span>':`<button class="hq-claim" onclick="heroBountyDone('${b.id}')">Done +${b.xp}</button>`}<button class="hx-x" onclick="heroBountyDel('${b.id}')">×</button></div>`).join(''):'<div class="hm-sub">Post your own quests with your own reward, like "Clean the car, 80 XP".</div>')
    +`<button class="minibtn" style="margin-top:10px;width:100%;padding:10px;" onclick="heroAddBounty()">+ Post a bounty</button>`;
}

// ── Mini bosses: tasks you keep putting off ──
function heroMiniBossHtml(){
  const l=tasks.filter(t=>t.boss&&!t.recurring&&!t.done.length),tod=heroTod();
  if(!l.length)return'<div class="hm-sub">Got a task you keep putting off? Open it and switch on <b>Mini boss</b>. It gets angrier (and worth more XP) every day it waits.</div>';
  return l.map(t=>{const w=Math.max(0,Math.round((new Date(tod+'T12:00:00')-new Date((t.createdAt||tod)+'T12:00:00'))/864e5)),xp=Math.min(300,taskXP(t)*3+10*w),ang=Math.min(1,w/14);
    return`<div class="mboss" style="--a:${ang}" onclick="openEditTask('${t.id}')">${hIc('skull',ang>.6?'red':ang>.3?'orange':'dark','burst',36)}<div style="flex:1;min-width:0;"><b>${esc(t.name)}</b><small>${w?`Waiting ${w} day${w>1?'s':''}, getting angrier`:'Fresh today'}</small></div><span class="hq-xp">+${xp} XP</span></div>`;}).join('');
}

// ── Bad habits you're quitting ──
async function heroAddQuit(){
  const name=(await ask('What are you quitting?','e.g. Vaping, Doomscrolling, Energy drinks')||'').trim().slice(0,40);if(!name)return;
  heroP.quits=(heroP.quits||[]).concat({id:'q'+uid(),name,from:heroTod(),slips:[]});save();renderHero();
}
function heroSlip(id){const q=(heroP.quits||[]).find(x=>x.id===id);if(!q||!confirm(`Slipped on ${q.name} today? No shame, the count restarts and you go again.`))return;q.slips=[...new Set([...(q.slips||[]),heroTod()])];save();renderHero();}
function heroQuitDel(id){if(!confirm('Stop tracking this? Its XP stays.'))return;const q=(heroP.quits||[]).find(x=>x.id===id);if(q){heroBankQuit(q);}heroP.quits=(heroP.quits||[]).filter(x=>x.id!==id);save();renderHero();}
function heroBankQuit(q){const tmp=heroP.quits;heroP.quits=[q];const aw=heroAwards().filter(a=>a.k==='quit');heroP.quits=tmp;if(aw.length)heroBonus(heroTod(),aw.reduce((n,a)=>n+a.xp,0),{discipline:1,vitality:.3},`${q.name}: ${aw.length} clean days (kept)`,'🛡️','quitkept');}
const heroClean=q=>{const last=[...(q.slips||[])].sort().pop();const from=last?dAdd(last,1):q.from;return Math.max(0,Math.round((new Date(heroTod()+'T12:00:00')-new Date(from+'T12:00:00'))/864e5));};
function heroQuitHtml(){
  const l=heroP.quits||[];
  return(l.length?l.map(q=>{const n=heroClean(q),slip=(q.slips||[]).includes(heroTod());return`<div class="hq">${hIc('shield',slip?'dark':n>=30?'gold':n>=7?'teal':'silver','shield',30)}<div style="flex:1;min-width:0;"><div class="hq-t">${esc(q.name)}</div><small style="color:var(--sub);font-size:12px;">${slip?'Slipped today. Tomorrow is day 1 again':`${n} day${n===1?'':'s'} clean · +15 XP each day`}</small></div>${slip?'':`<button class="minibtn" onclick="heroSlip('${q.id}')">I slipped</button>`}<button class="hx-x" onclick="heroQuitDel('${q.id}')">×</button></div>`;}).join(''):'<div class="hm-sub">Quitting something? Every clean day gives Discipline XP. A slip shows as a debuff for that day, then you start again.</div>')
    +`<button class="minibtn" style="margin-top:10px;width:100%;padding:10px;" onclick="heroAddQuit()">+ Add a habit to quit</button>`;
}

// ── Pet: grows with the days you show up, gets sad when you don't ──
const HERO_PETS={fox:['Fox','#F97316','#FED7AA'],cat:['Cat','#8B5CF6','#DDD6FE'],dragon:['Dragon','#16A34A','#BBF7D0'],owl:['Owl','#A16207','#FDE68A']};
const HERO_PET_ST=[[0,'Egg'],[3,'Baby'],[10,'Young'],[30,'Adult'],[90,'Legendary']];
function heroPetInfo(h){
  const days=[...new Set(h.aw.filter(a=>a.xp>0).map(a=>a.d))].sort(),p=heroP.pet;
  const act=p?days.filter(d=>d>=p.born).length:0,st=HERO_PET_ST.filter(x=>act>=x[0]).length-1,last=days[days.length-1],tod=heroTod();
  const gap=last?Math.round((new Date(tod+'T12:00:00')-new Date(last+'T12:00:00'))/864e5):9;
  return{act,st,stage:HERO_PET_ST[st][1],next:HERO_PET_ST[st+1],mood:gap<=1?'happy':gap<=3?'sad':'sleepy'};
}
function heroPetSvg(kind,st,mood,s=110){
  const[,c,l]=HERO_PETS[kind]||HERO_PETS.fox,k=.62+st*.1;
  if(st===0)return`<svg viewBox="0 0 100 100" width="${s}" height="${s}" class="pet egg"><ellipse cx="50" cy="56" rx="28" ry="36" fill="${l}" stroke="${c}" stroke-width="3"/><circle cx="40" cy="44" r="5" fill="${c}"/><circle cx="60" cy="62" r="7" fill="${c}"/><circle cx="46" cy="76" r="4" fill="${c}"/></svg>`;
  const ears={fox:`<path d="M28 30L22 4l22 18zM72 30l6-26-22 18z" fill="${c}"/>`,cat:`<path d="M27 32l-3-24 20 14zM73 32l3-24-20 14z" fill="${c}"/>`,
    dragon:`<path d="M34 24l-6-20 14 14zM66 24l6-20-14 14z" fill="#FDE68A"/><path d="M14 56l-12-10 4 18zM86 56l12-10-4 18z" fill="${c}" opacity=".7"/>`,owl:`<path d="M28 26l-4-16 14 10zM72 26l4-16-14 10z" fill="${c}"/>`}[kind];
  const eyes=mood==='happy'?`<path d="M36 48q5-7 10 0M54 48q5-7 10 0" stroke="#1F2937" stroke-width="3.5" fill="none" stroke-linecap="round"/>`:mood==='sad'?`<circle cx="41" cy="48" r="4" fill="#1F2937"/><circle cx="59" cy="48" r="4" fill="#1F2937"/><path d="M63 54q2 5 0 8" stroke="#60A5FA" stroke-width="3" fill="none"/>`:`<path d="M36 49h10M54 49h10" stroke="#1F2937" stroke-width="3.5" stroke-linecap="round"/>`;
  const mouth=mood==='happy'?`<path d="M43 60q7 7 14 0" stroke="#1F2937" stroke-width="3" fill="none" stroke-linecap="round"/>`:mood==='sad'?`<path d="M43 64q7-6 14 0" stroke="#1F2937" stroke-width="3" fill="none" stroke-linecap="round"/>`:`<text x="66" y="34" font-size="12" fill="${c}">z</text><text x="74" y="24" font-size="9" fill="${c}">z</text>`;
  return`<svg viewBox="0 0 100 100" width="${s}" height="${s}" class="pet ${mood}">${st>=4?`<circle cx="50" cy="54" r="48" fill="${c}" opacity=".18"/>`:''}<g transform="translate(50 56) scale(${k}) translate(-50 -56)">${ears}<ellipse cx="50" cy="56" rx="36" ry="34" fill="${c}"/><ellipse cx="50" cy="64" rx="22" ry="20" fill="${l}"/>${eyes}${mouth}<circle cx="34" cy="60" r="4" fill="#F9A8D4" opacity=".7"/><circle cx="66" cy="60" r="4" fill="#F9A8D4" opacity=".7"/>${st>=4?'<path d="M36 18l6 8 8-12 8 12 6-8-2 14H38z" fill="#FCD34D"/>':''}</g></svg>`;
}
async function heroPetPick(kind){const name=(await ask(`Name your ${HERO_PETS[kind][0].toLowerCase()}`,'e.g. Kitsu')||'').trim().slice(0,20)||HERO_PETS[kind][0];heroP.pet={kind,name,born:heroTod()};save();renderHero();}

// ── Party: Gwen and your pet ──
function heroPartyHtml(h){
  const lv=typeof gwenCfg!=='undefined'&&gwenCfg.key&&typeof gwenLevel==='function'?gwenLevel(gwenBondPts()):0,p=heroP.pet;
  const gw=`<div class="pty">${hIc('heart','pink','shield',44)}<div style="flex:1;min-width:0;"><b>Gwen</b><small>${lv?`Bond level ${lv} · party buff +${Math.min(10,lv)}% XP`:'Set her up on the Gwen tab to join your party'}</small><small>Gives you her daily quest. Talk, play and study with her to raise the bond.</small></div></div>`;
  if(!p)return gw+`<div class="sl" style="margin-top:12px;">Adopt a pet</div><div class="hm-sub" style="margin-bottom:8px;">It hatches and grows with every day you earn XP, and gets sad when you skip days.</div><div class="pet-pick">${Object.entries(HERO_PETS).map(([k,v])=>`<button onclick="heroPetPick('${k}')">${heroPetSvg(k,2,'happy',64)}<small>${v[0]}</small></button>`).join('')}</div>`;
  const i=heroPetInfo(h);
  return gw+`<div class="pty pet-row">${heroPetSvg(p.kind,i.st,i.mood,96)}<div style="flex:1;min-width:0;"><b>${esc(p.name)}</b><small>${i.stage} ${HERO_PETS[p.kind][0].toLowerCase()} · ${{happy:'Happy',sad:'Missing you',sleepy:'Asleep, waiting for you'}[i.mood]}</small><small>${i.next?`${i.next[0]-i.act} more active day${i.next[0]-i.act>1?'s':''} to ${i.next[1]}`:'Fully grown'}</small></div></div>`;
}

// ── Weekly report card ──
function heroReport(h,ws){
  const we=dAdd(ws,6),inW=(a,b)=>h.aw.filter(x=>x.d>=a&&x.d<=b),g=(aw,grp)=>aw.reduce((n,a)=>n+HERO_STATS.filter(x=>x.g===grp).reduce((m,x)=>m+Math.max(0,a.sx[x.id]||0),0),0);
  const cur=inW(ws,we);
  return Object.keys(HERO_GROUPS).map(grp=>{
    const v=g(cur,grp),past=[1,2,3,4].map(i=>g(inW(dAdd(ws,-7*i),dAdd(we,-7*i)),grp)),avg=past.reduce((a,b)=>a+b,0)/4;
    const r=avg>=30?v/avg:v/120,gr=r>=1.2?'A':r>=.9?'B':r>=.6?'C':r>=.3?'D':'F';
    return{grp,v,gr,up:avg>=30?Math.round((v/avg-1)*100):null};
  });
}
function heroReportHtml(h){
  const ws=dAdd(heroWeekStart(heroTod()),-7),r=heroReport(h,ws),col={A:'#22C55E',B:'#14B8A6',C:'#F59E0B',D:'#F97316',F:'#EF4444'};
  return`<div class="hm-sub" style="margin-bottom:8px;">Last week, ${fmtDay(ws)} to ${fmtDay(dAdd(ws,6))}, compared with the 4 weeks before</div><div class="rc">${r.map(x=>`<div><b style="color:${col[x.gr]}">${x.gr}</b><span>${x.grp}</span><small>${x.v} XP${x.up!==null?` · ${x.up>=0?'+':''}${x.up}%`:''}</small></div>`).join('')}</div>`
    +(typeof gwenCfg!=='undefined'&&gwenCfg.key?`<button class="minibtn" style="margin-top:10px;width:100%;padding:10px;" onclick="heroReportGwen()">💜 What does Gwen think?</button>`:'');
}
function heroReportGwen(){
  const r=heroReport(heroState(),dAdd(heroWeekStart(heroTod()),-7));switchTab('gwen');
  const inp=document.getElementById('gwen-in');inp.value=`My report card for last week: ${r.map(x=>`${x.grp} ${x.gr}`).join(', ')}. What do you think, and what should I work on this week?`;inp.focus();
}

// ── This month vs last month ──
function heroVsHtml(h){
  const tod=heroTod(),n=+tod.slice(8),a=tod.slice(0,8)+'01',lm=new Date(a+'T12:00:00');lm.setMonth(lm.getMonth()-1);
  const la=toDateStr(lm),lb=dAdd(la,n-1),pick=(x,y)=>h.aw.filter(q=>q.d>=x&&q.d<=y);
  const A=pick(a,tod),B=pick(la,lb<dAdd(a,-1)?lb:dAdd(a,-1)),cd=(x,y)=>completedDays.filter(d=>d>=x&&d<=y).length;
  const rows=[['XP',A.reduce((s,q)=>s+q.xp,0),B.reduce((s,q)=>s+q.xp,0)],['Tasks done',A.filter(q=>q.k==='task').length,B.filter(q=>q.k==='task').length],['Perfect days',cd(a,tod),cd(la,lb)],['Focus minutes',A.reduce((s,q)=>s+(q.min||0),0),B.reduce((s,q)=>s+(q.min||0),0)]];
  return`<div class="hm-sub" style="margin-bottom:6px;">The first ${n} day${n>1?'s':''} of this month vs the same days last month</div><table class="ft-t vs"><tr><th></th><th>Now</th><th>Then</th><th></th></tr>${rows.map(([k,x,y])=>`<tr><td>${k}</td><td><b>${x}</b></td><td>${y}</td><td style="color:${x>=y?'#22C55E':'#EF4444'};font-weight:800;">${x>y?'▲':x<y?'▼':'='}</td></tr>`).join('')}</table>`;
}

// ── Seasons: one every 3 months, with a tier for the XP you earn in it ──
const HERO_TIERS=[[0,'Bronze','shield','bronze'],[1500,'Silver','shield','silver'],[4000,'Gold','hex','gold'],[8000,'Platinum','hex','teal'],[15000,'Diamond','diamond','blue'],[25000,'Champion','burst','legend']];
function heroSeasons(h){
  const q=d=>`${d.slice(0,4)} S${Math.floor((+d.slice(5,7)-1)/3)+1}`,o={};h.aw.forEach(a=>{const k=q(a.d);o[k]=(o[k]||0)+a.xp;});
  return{cur:q(heroTod()),o};
}
function heroSeasonHtml(h){
  const{cur,o}=heroSeasons(h),xp=o[cur]||0,ti=HERO_TIERS.filter(t=>xp>=t[0]).length-1,t=HERO_TIERS[ti],nx=HERO_TIERS[ti+1];
  const m=+heroTod().slice(5,7),end=new Date(+heroTod().slice(0,4),Math.ceil(m/3)*3,0),left=Math.ceil((end-new Date())/864e5);
  const past=Object.keys(o).filter(k=>k!==cur).sort().reverse().slice(0,4);
  return`<div class="ssn">${hIc(t[2],t[3],t[2]==='burst'?'burst':'hex',60)}<div style="flex:1;min-width:0;"><small>Season ${cur.slice(-1)} · ${cur.slice(0,4)} · ${left} days left</small><b>${t[1]}</b><div class="bar" style="height:7px;margin:6px 0 3px;"><i style="width:${nx?Math.round((xp-t[0])/(nx[0]-t[0])*100):100}%"></i></div><small>${xp.toLocaleString()} XP${nx?` · ${(nx[0]-xp).toLocaleString()} to ${nx[1]}`:''}</small></div></div>`
    +(past.length?`<div class="ssn-past">${past.map(k=>{const p=HERO_TIERS.filter(x=>o[k]>=x[0]).pop();return`<span>${hIc(p[2],p[3],'hex',22)} ${k} ${p[1]}</span>`;}).join('')}</div>`:'')
    +(h.L>=75||h.P?`<div class="ssn-past">${h.P?`<span>${'★'.repeat(Math.min(10,h.P))} Prestige ${h.P}</span>`:''}${h.L>=75?`<button class="hq-claim" onclick="heroPrestige()">Prestige</button>`:''}</div>`:'');
}

// ── A year of XP, one square a day ──
function heroHeatmap(h){
  const by={};h.aw.forEach(a=>by[a.d]=(by[a.d]||0)+a.xp);
  const vals=Object.values(by).filter(v=>v>0).sort((a,b)=>a-b),q=f=>vals[Math.floor(vals.length*f)]||1,lv=[q(.25),q(.5),q(.75)];
  const tod=heroTod(),start=dAdd(heroWeekStart(tod),-52*7);let cells='',d=start,i=0;
  for(;d<=tod;d=dAdd(d,1),i++){const v=by[d]||0,l=v<=0?0:v<=lv[0]?1:v<=lv[1]?2:v<=lv[2]?3:4;cells+=`<rect x="${Math.floor(i/7)*7}" y="${(i%7)*7}" width="6" height="6" rx="1.2" class="hm${l}" onclick="heroDay('${d}')"><title>${fmtDay(d)}: ${v} XP</title></rect>`;}
  return`<svg viewBox="0 0 371 49" class="heat">${cells}</svg><div class="heat-k">Less <i class="hm0"></i><i class="hm1"></i><i class="hm2"></i><i class="hm3"></i><i class="hm4"></i> More · ${Object.keys(by).filter(k=>k>=start&&by[k]>0).length} active days this year</div>`;
}

// ── Journal: one line a night ──
function heroJournalHtml(mini){
  const tod=heroTod(),j=heroP.journal||{},t=j[tod]||'';
  const back=[[7,'A week ago'],[30,'A month ago'],[365,'A year ago']].map(([n,l])=>j[dAdd(tod,-n)]?`<div class="jr-old"><small>${l} you wrote</small>“${esc(j[dAdd(tod,-n)])}”</div>`:'').join('');
  return`<div class="jr"><input class="inp" id="jr-in${mini?'-m':''}" maxlength="200" placeholder="One line about today…" value="${esc(t)}"><button class="minibtn" onclick="heroJournalSave(${mini?1:0})">${t?'Update':'Save +10 XP'}</button></div>`
    +(mini?'':back+Object.keys(j).filter(d=>d<tod).sort().reverse().slice(0,5).map(d=>`<div class="hl-g" style="padding:4px 0;"><span>${fmtDay(d)}: ${esc(j[d])}</span></div>`).join(''));
}
function heroJournalSave(mini){
  const v=(document.getElementById('jr-in'+(mini?'-m':'')).value||'').trim().slice(0,200);heroP.journal=heroP.journal||{};
  if(v)heroP.journal[heroTod()]=v;else delete heroP.journal[heroTod()];save();renderTaskList();renderHero();showToast(v?'📝 Saved':'Removed');
}

// ── Share your character card as a picture ──
async function heroShare(){
  const h=heroState(),c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,1080,1350);g.addColorStop(0,'#1E1B4B');g.addColorStop(.6,'#4C1D95');g.addColorStop(1,'#7C2D12');x.fillStyle=g;x.fillRect(0,0,1080,1350);
  const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(heroRankIc(h.L,260,true));
  await new Promise(r=>{img.onload=r;img.onerror=r;});
  if(heroP.avImg){const av=new Image();av.src=heroP.avImg;await new Promise(r=>{av.onload=r;av.onerror=r;});x.save();x.beginPath();x.arc(540,190,128,0,Math.PI*2);x.clip();try{x.drawImage(av,412,62,256,256);}catch(e){}x.restore();
    x.lineWidth=8;x.strokeStyle='#F5B82E';x.beginPath();x.arc(540,190,130,0,Math.PI*2);x.stroke();try{x.drawImage(img,630,220,120,120);}catch(e){}}
  else try{x.drawImage(img,410,60,260,260);}catch(e){}
  x.textAlign='center';x.fillStyle='#fff';x.font='800 80px system-ui,sans-serif';x.fillText((heroP.name||'Rayan').toUpperCase(),540,400);
  x.font='600 38px system-ui,sans-serif';x.fillStyle='#FCD34D';const t=heroTitle(heroAchievements(h));x.fillText(`${t?'「'+t+'」 ':''}${h.rank} ${h.cls}`,540,460);
  x.font='800 120px system-ui,sans-serif';x.fillText(`LEVEL ${h.L}`,540,600);
  const b=heroBar(h.xp,HERO_B);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(140,640,800,22);x.fillStyle='#F59E0B';x.fillRect(140,640,8*b.pct,22);
  x.font='500 30px system-ui,sans-serif';x.fillStyle='rgba(255,255,255,.8)';x.fillText(`${h.s.total.toLocaleString()} XP · ${heroBossWins()} boss${heroBossWins()===1?'':'es'} beaten · ${heroBestStreak()}-day best streak`,540,710);
  x.textAlign='left';HERO_STATS.forEach((s,i)=>{const cx=i<7?110:580,cy=790+(i%7)*70,L=heroLvl(h.s.st[s.id],HERO_SB),sb=heroBar(h.s.st[s.id],HERO_SB);
    x.fillStyle='#fff';x.font='600 30px system-ui,sans-serif';x.fillText(s.name,cx,cy);x.fillStyle='#FCD34D';x.textAlign='right';x.fillText('Lv '+L,cx+390,cy);x.textAlign='left';
    x.fillStyle='rgba(255,255,255,.15)';x.fillRect(cx,cy+14,390,10);x.fillStyle={Body:'#EF4444',Mind:'#3B82F6',Spirit:'#A855F7',Life:'#22C55E'}[s.g];x.fillRect(cx,cy+14,3.9*sb.pct,10);});
  x.textAlign='center';x.fillStyle='rgba(255,255,255,.55)';x.font='500 26px system-ui,sans-serif';x.fillText(`DayTrack · ${fmtDay(heroTod())}`,540,1310);
  saveImage(c.toDataURL('image/jpeg',.92),`${(heroP.name||'rayan').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-level-${h.L}.jpg`);
}

// Avatar frame grows with your level
const heroFrame=h=>'fr'+(h.P?5:h.L>=50?4:h.L>=30?3:h.L>=15?2:h.L>=5?1:0);
// One line under the character: rare event, combo, potion
function heroExtrasLine(){
  const tod=heroTod(),ev=heroEvent(tod),cl=heroComboLeft(),c=heroP.combo,pot=((heroP.used||{}).potion||[]).includes(tod),out=[];
  if(ev)out.push(`<span class="hx-ev">${hIc(ev.gl,ev.col,'circle',18)} ${ev.name}: ${ev.what}</span>`);
  if(cl&&c.n>=1)out.push(`<span class="hx-ev">⚡ Combo ×${c.n} · next task within ${cl} min for ×${c.n+1}</span>`);
  if(pot)out.push('<span class="hx-ev">🧪 XP potion active</span>');
  return out.length?`<div class="hx-line">${out.join('')}</div>`:'';
}
function heroPerksHtml(h){
  const pts=heroPerkPts(h),has=new Set((heroP.perks||[]).map(p=>p.id));
  return`<div class="hm-sub" style="margin-bottom:8px;">${pts>0?`<b>${pts} perk point${pts>1?'s':''} to spend!</b> `:''}You get a point every 5 levels.${pts<1?` Next at level ${(Math.floor(h.L/5)+1)*5}.`:''}</div><div class="perk-grid">`
    +HERO_PERKS.map(([id,n,d,g,c])=>`<button class="perk${has.has(id)?' got':pts>0?' can':''}" ${!has.has(id)&&pts>0?`onclick="heroPickPerk('${id}')"`:''}>${hIc(g,has.has(id)?c:'dark','hex',36)}<b>${n}</b><small>${d}</small></button>`).join('')+'</div>';
}
function heroRecsHtml(h){
  const r=heroRecords(h).filter(x=>x.v>0);
  return r.length?`<div class="rec-grid">${r.map(x=>`<div class="rec">${hIc(x.gl,'gold','circle',30)}<div><b>${x.v}${x.u==='×'?'×':' '+x.u}</b><small>${esc(x.name)}</small></div></div>`).join('')}</div>`:'<div class="hm-sub">Your best days, streaks and reps show up here and get celebrated when you beat them.</div>';
}
function heroBagHtml(h){
  const inv=heroInv();
  return`<div class="bag">${Object.entries(HERO_ITEMS).map(([k,[n,d,g,c]])=>`<div class="bag-i">${hIc(g,inv[k]>0?c:'dark','hex',40)}<b>${n} ×${inv[k]||0}</b><small>${d}</small>${inv[k]>0?`<button class="minibtn" onclick="heroUse('${k}')">Use</button>`:''}</div>`).join('')}</div>
    <div class="sl" style="display:flex;justify-content:space-between;align-items:center;">Shop<span class="coin">🪙 ${heroCoins(h).toLocaleString()} coins</span></div><div class="hm-sub" style="margin-bottom:6px;">You earn a coin for every 10 XP.</div>`
    +Object.entries(HERO_ITEMS).filter(x=>x[1][4]).map(([k,[n,,g,c,cost]])=>`<div class="shop">${hIc(g,c,'hex',26)}<span>${n}</span><button class="minibtn" onclick="heroBuy('item','${k}')">🪙 ${cost}</button></div>`).join('')
    +heroShop().map(r=>`<div class="shop">${hIc('trophy','gold','circle',26)}<span>${esc(r.name)}</span><button class="hx-x${heroP.pin===r.id?' on':''}" title="Save up for this" onclick="heroPinReward('${r.id}')">${heroP.pin===r.id?'★':'☆'}</button><button class="minibtn" onclick="heroBuy('reward','${r.id}')">🪙 ${r.cost}</button><button class="hx-x" onclick="heroDelReward('${r.id}')">×</button></div>`).join('')
    +`<button class="minibtn" style="margin-top:8px;width:100%;padding:10px;" onclick="heroAddReward()">+ Add a real-life reward</button><div class="hm-sub" style="margin-top:6px;">Tap ☆ on a reward to save up for it: its bar shows on your Tasks card.</div>`
    +`<div class="sl">Crafting</div>`+heroCraftHtml()
    +((heroP.buys||[]).length?`<div class="hm-sub" style="margin-top:8px;">Last bought: ${esc(heroP.buys[heroP.buys.length-1].name)}, ${fmtDay(heroP.buys[heroP.buys.length-1].d)}</div>`:'');
}
function heroGearHtml(){
  const eq=heroP.gear||{},ach=heroAchievements();
  return`<div class="hm-sub" style="margin-bottom:8px;">Achievements unlock gear. Equip one piece per slot: +${Math.round(heroGearFx()*100)}% XP now.</div>`+Object.entries(HERO_SLOTS).map(([sl,nm])=>`<div class="hs-g">${nm}</div><div class="gear-row">${HERO_GEAR.filter(g=>g[1]===sl).map(g=>{const ok=heroGearOk(g),on=eq[sl]===g[0],a=ach.find(x=>x.id===g[6]);
    return`<button class="gear${on?' on':''}${ok?'':' lock'}" ${ok?`onclick="heroEquip('${g[0]}')"`:''} title="${ok?'':'Unlocks with '+esc(a?a.name:'')}">${hIc(ok?g[3]:'lock',ok?g[4]:'dark','shield',34)}<b>${g[2]}</b><small>${ok?`+${Math.round(g[5]*100)}% XP${on?' · on':''}`:`🔒 ${esc(a?a.desc:'')}`}</small></button>`;}).join('')}</div>`).join('');
}
// Task sheet: hardcore and mini boss switches
function heroFlagsInit(t){const a=document.getElementById('hero-flag-hard'),b=document.getElementById('hero-flag-boss');if(a)a.checked=!!(t&&t.hard);if(b)b.checked=!!(t&&t.boss);}
function heroFlags(old){
  const a=document.getElementById('hero-flag-hard'),b=document.getElementById('hero-flag-boss'),hard=!!(a&&a.checked);
  return{hard,hardFrom:hard?(old&&old.hard&&old.hardFrom)||heroTod():null,boss:!!(b&&b.checked)};
}
// ════════ Round 5 ════════

// ── Sounds: made on the spot (no files): coin for XP, fanfare for level-ups and wins, hit, boss roar ──
function heroSfx(k){
  if(heroP.sfx===false)return;const ctx=typeof gwenAudioCtx==='function'?gwenAudioCtx():null;if(!ctx)return;
  try{
    const t=ctx.currentTime+.02,out=ctx.createGain();out.gain.value=.22;out.connect(ctx.destination);
    const tone=(f,a,d,type='square',f2)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t+a);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+a+d);
      g.gain.setValueAtTime(0,t+a);g.gain.linearRampToValueAtTime(1,t+a+.01);g.gain.exponentialRampToValueAtTime(.001,t+a+d);o.connect(g);g.connect(out);o.start(t+a);o.stop(t+a+d+.05);};
    const noise=(a,d,lp)=>{const n=Math.floor(ctx.sampleRate*d),buf=ctx.createBuffer(1,n,ctx.sampleRate),x=buf.getChannelData(0);for(let i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);
      const s=ctx.createBufferSource(),f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;s.buffer=buf;s.connect(f);f.connect(out);s.start(t+a);};
    if(k==='coin'){tone(988,0,.08);tone(1319,.07,.25);}
    else if(k==='fanfare'){[523,659,784,1047].forEach((f,i)=>tone(f,i*.11,i===3?.7:.14,'sawtooth'));tone(784,.33,.7,'triangle');}
    else if(k==='hit'){noise(0,.25,1800);tone(160,0,.3,'sine',50);if(navigator.vibrate)navigator.vibrate(80);}
    else if(k==='roar'){noise(0,1.2,500);tone(110,0,1.2,'sawtooth',45);tone(82,.05,1.1,'square',40);}
  }catch(e){}
}

// ── Health: missed tasks and escaped bosses hurt, done tasks and finished days heal.
// At 0 you fall (−50% XP) until a day with 3 finished tasks revives you at 50 HP. Worked out from saved data, from the day HP started. ──
let heroHPc=null;
function heroHP(){
  if(heroP.hpOff)return null;
  const tod=heroTod();if(!heroP.hpOn)heroP.hpOn=tod;
  const key=[tod,heroP.hpOn,tasks.length,tasks.reduce((n,t)=>n+t.done.length,0),completedDays.length,JSON.stringify(heroP.bosses||{}).length].join('|');
  if(heroHPc&&heroHPc.key===key)return heroHPc;
  const doneOn=d=>tasks.filter(t=>t.done.includes(d)).length,fall={};let hp=100,down=false,from=heroP.hpOn<dAdd(tod,-400)?dAdd(tod,-400):heroP.hpOn;
  for(let d=from;d<tod;d=dAdd(d,1)){
    const n=doneOn(d);
    if(down){if(n>=3){down=false;hp=50;}else fall[d]=true;continue;}
    const dow=new Date(d+'T12:00:00').getDay(),miss=tasks.filter(t=>(t.createdAt||'')<=d&&(t.recurring?isTodayTask(t,d,dow):t.date===d)&&!t.done.includes(d)).length,b=heroDBoss(d);
    hp=Math.min(100,hp+Math.min(30,5*n)+(completedDays.includes(d)?20:0)-10*miss-(b&&b.state==='gone'?15:0));
    if(hp<=0){hp=0;down=true;}
  }
  const n=doneOn(tod),rev=down&&n>=3;if(down&&!rev)fall[tod]=true;
  return heroHPc={key,hp:rev?50:down?0:hp,down:down&&!rev,rev,n,fall};
}
function heroHPHtml(){
  const x=heroHP();if(!x)return'';
  if(x.down)return`<div class="hp-row down" onclick="event.stopPropagation();showToast('Finish 3 tasks today to revive at 50 HP')">💀 <b>Fallen</b><span>Revive: finish 3 tasks today (${x.n}/3). Until then −50% XP</span></div>`;
  return`<div class="hp-row${x.hp<=30?' low':''}" onclick="event.stopPropagation();showToast('❤️ Each missed task: −10 HP at midnight. Escaped boss −15. Done tasks +5 each, a finished day +20')"><span>${x.rev?'✨ Revived':'❤️ HP'}</span><div class="bar"><i style="width:${x.hp}%"></i></div><b>${x.hp}</b></div>`;
}

// ── Ghost: you this week against you last week, up to the same day ──
function heroGhost(h){const tod=heroTod(),ws=heroWeekStart(tod),sum=(a,b)=>h.aw.filter(x=>x.d>=a&&x.d<=b).reduce((n,x)=>n+x.xp,0);return{me:sum(ws,tod),gh:sum(dAdd(ws,-7),dAdd(tod,-7)),full:sum(dAdd(ws,-7),dAdd(ws,-1))};}
function heroGhostHtml(h){
  const g=heroGhost(h),mx=Math.max(1,g.me,g.gh),d=g.me-g.gh;
  return`<div class="ghost"><div><span>You</span><div class="bar"><i style="width:${g.me/mx*100}%"></i></div><b>${g.me.toLocaleString()}</b></div><div class="gh"><span>👻 Ghost</span><div class="bar"><i style="width:${g.gh/mx*100}%"></i></div><b>${g.gh.toLocaleString()}</b></div>
    <small>${d>0?`${d.toLocaleString()} XP ahead of last week's you`:d<0?`${(-d).toLocaleString()} XP behind last week's you. Catch up!`:'Neck and neck'} · the ghost is last week up to the same day (it ended on ${g.full.toLocaleString()})</small></div>`;
}

// ── Weekly ranked: Bronze III to Master I. Beat your 4-week average by 10% to rank up (50% = two steps), drop under 80% and you fall a step ──
const HERO_LADDER=['Bronze','Silver','Gold','Platinum','Diamond','Master'];
function heroRanked(h){
  const ws=heroWeekStart(heroTod());if(!heroP.rkOn)heroP.rkOn=ws;
  const wk={};h.aw.forEach(a=>{const w=heroWeekStart(a.d);wk[w]=(wk[w]||0)+a.xp;});
  const avg=w=>Math.max(150,[1,2,3,4].reduce((n,i)=>n+(wk[dAdd(w,-7*i)]||0),0)/4);
  let st=3,last=0;for(let w=heroP.rkOn<dAdd(ws,-7*104)?dAdd(ws,-7*104):heroP.rkOn;w<ws;w=dAdd(w,7)){const x=wk[w]||0,a=avg(w);last=x>=1.5*a?2:x>=1.1*a?1:x<.8*a?-1:0;st=Math.max(0,Math.min(17,st+last));}
  const a=avg(ws);return{st,t:Math.floor(st/3),name:`${HERO_LADDER[Math.floor(st/3)]} ${['III','II','I'][st%3]}`,x:wk[ws]||0,up:Math.round(1.1*a),keep:Math.round(.8*a),last};
}
function heroRankedHtml(h){
  const r=heroRanked(h),col=['bronze','silver','gold','teal','blue','legend'][r.t];
  return`<div class="ssn">${hIc(['shield','shield','hex','gem','diamond','crown'][r.t],col,r.t>=4?'burst':'hex',56)}<div style="flex:1;min-width:0;"><small>Weekly ranked${r.last>0?' · ranked up last week ▲':r.last<0?' · dropped last week ▼':''}</small><b>${r.name}</b>
    <div class="bar" style="height:7px;margin:6px 0 3px;"><i style="width:${Math.min(100,r.x/r.up*100)}%"></i></div><small>${r.x>=r.up?'Rank-up locked in for Sunday ✓':`${(r.up-r.x).toLocaleString()} XP more this week to rank up`} · under ${r.keep.toLocaleString()} you drop</small></div></div>`;
}

// ── Monthly pass: 30 tiers, sized to your usual XP, a reward every 5 tiers and a title at 30 ──
function heroPass(h){
  const tod=heroTod(),m=tod.slice(0,7),ps=heroP.pass=heroP.pass||{};
  if(!ps[m]){const l=h.aw.filter(a=>a.d>=dAdd(tod,-30)&&a.d<tod).reduce((n,a)=>n+a.xp,0);ps[m]={size:Math.max(100,Math.round(l/30/10)*10),got:[]};for(const k of Object.keys(ps).sort().slice(0,-12))delete ps[k];}
  const p=ps[m],xp=h.aw.filter(a=>a.d.startsWith(m)).reduce((n,a)=>n+a.xp,0);
  return{m,p,xp,tier:Math.min(30,Math.floor(xp/p.size))};
}
const heroPassTitle=m=>new Date(m+'-15T12:00:00').toLocaleString('en',{month:'long'})+' Champion';
function heroPassHtml(h){
  const P=heroPass(h),rw=[5,10,15,20,25,30];
  return`<div class="hm-sub" style="margin-bottom:6px;">Tier ${P.tier}/30 · a tier every ${P.p.size} XP this month · ${P.tier<30?`${(P.p.size*(P.tier+1)-P.xp).toLocaleString()} XP to tier ${P.tier+1}`:'Complete!'}</div><div class="pass">${Array.from({length:30},(_,i)=>{const t=i+1,r=rw.includes(t);return`<i class="${t<=P.tier?'on':''}${r?' rw':''}">${r?(P.p.got.includes(t)?'✓':t===30?'👑':'🎁'):''}</i>`;}).join('')}</div>`
    +`<div class="hm-sub" style="margin-top:6px;">🎁 Loot every 5 tiers · 👑 Tier 30: double loot and the title “${heroPassTitle(P.m)}”</div>`
    +rw.filter(t=>t<=P.tier&&!P.p.got.includes(t)).map(t=>`<button class="hq-chest" onclick="heroPassClaim(${t})">${t===30?'👑':'🎁'} Claim the tier ${t} reward</button>`).join('');
}
function heroPassClaim(t){
  const P=heroPass(heroState());if(t>P.tier||P.p.got.includes(t))return;P.p.got.push(t);
  let loot=heroLoot();if(t===30)loot=loot.concat(heroLoot());save();renderHero();heroSfx('fanfare');
  heroShow(`<div class="hl-t">PASS TIER ${t}</div><div class="hl-em">${hIc(t===30?'crown':'chest','gold','burst',90)}</div>${t===30?`<div class="hl-row">New title: <b>${heroPassTitle(P.m)}</b></div>`:''}${loot.map(heroItemLine).join('')}`,4500,true);
}

// ── Mastery stars: keep training a finished skill (its practice task) for stars at 10, 25, 50, 100 and 200 days ──
const HERO_STARS=[10,25,50,100,200];
function heroStarDays(sk){const p=(heroP.skills||{})[sk.id];if(!p||(p.at||[]).length<sk.steps.length)return null;const from=p.at[p.at.length-1];return tasks.filter(t=>t.skill===sk.id).flatMap(t=>t.done).filter(d=>d>from).sort();}
function heroStars(sk){const ds=heroStarDays(sk);if(!ds)return null;const n=HERO_STARS.filter(x=>ds.length>=x).length;return{n,days:ds.length,next:HERO_STARS[n]};}
function heroStarsHtml(s){
  const x=heroStars(s)||{n:0,days:0,next:10},has=tasks.some(t=>t.skill===s.id);
  return`<div style="text-align:center;font-size:15px;font-weight:700;color:var(--grntxt);margin-top:12px;">🏆 Skill mastered! <span class="stars">${'★'.repeat(x.n)}${'☆'.repeat(5-x.n)}</span></div><div class="hm-sub" style="text-align:center;margin-top:4px;">${x.next?`Train it on ${x.next-x.days} more day${x.next-x.days>1?'s':''} for star ${x.n+1} (+${100*(x.n+1)} XP)`:'All 5 mastery stars!'}</div>`
    +(has?'':`<button class="hk-btn" style="width:100%;margin-top:8px;" onclick="heroTrain('${s.id}')">⭐ Keep training for stars</button>`);
}
function heroTrain(id){
  const s=heroSkill(id);if(!s)return;
  if(!tasks.some(t=>t.skill===id))tasks.push({id:uid(),name:`${s.name} training`,notes:'Keep it sharp for mastery stars',icon:s.ic,iconType:'emoji',recurring:true,days:[...(s.days||[])],done:[],date:null,
    priority:'none',notifStyle:'default',showInCal:true,createdAt:heroTod(),subtasks:[],reminder:null,reminderLastFired:null,reminded:[],count:null,skill:id});
  save();renderTaskList();heroOpenSkill(id);renderHero();showToast('⭐ Training task added');
}

// ── Dungeon: 5 floors, each cleared by finishing a task in time (60, 50, 40, 30, 20 minutes). Once a day ──
const HERO_DG=[60,50,40,30,20];
function heroDg(){const g=heroP.dg;if(!g||g.d!==heroTod())return null;const left=g.f<5&&!g.fail?g.t+HERO_DG[g.f]*6e4-Date.now():0;return{...g,left,over:g.f>=5||!!g.fail||left<=0};}
function heroDgStart(){
  const tod=heroTod();if(heroP.dg&&heroP.dg.d===tod)return;
  heroP.dg={d:tod,t:Date.now(),f:0,n:tasks.filter(t=>t.done.includes(tod)).length};save();renderHero();renderHeroMini();heroSfx('roar');
  showToast('🏰 Floor 1: finish any task within 60 minutes');
}
function heroDgTick(silent){
  const g=heroP.dg,tod=heroTod();if(!g||g.d!==tod||g.f>=5||g.fail)return;
  const n=tasks.filter(t=>t.done.includes(tod)).length;if(silent||n<=g.n){g.n=Math.max(g.n,n);return;}
  g.n=n;if(Date.now()-g.t>HERO_DG[g.f]*6e4){g.fail=1;return;}
  g.f++;g.t=Date.now();heroBonus(tod,20*g.f,{discipline:1,endurance:.2},`Dungeon floor ${g.f}`,'🏰','dungeon');
  if(g.f===5){heroBonus(tod,100,{discipline:1},'Dungeon cleared','🏰','dungeon');const loot=heroLoot(tod);
    setTimeout(()=>{heroSfx('fanfare');heroShow(`<div class="hl-t">DUNGEON CLEARED</div><div class="hl-em">${hIc('chest','gold','burst',90)}</div><div class="hl-row">+400 XP in total</div>${loot.map(heroItemLine).join('')}`,5000,true);},1200);}
  else setTimeout(()=>showToast(`🏰 Floor ${g.f} cleared! Floor ${g.f+1}: next task within ${HERO_DG[g.f]} minutes`),1200);
}
function heroDgHtml(){
  const g=heroDg();
  if(!g)return`<div class="hm-sub" style="margin-bottom:8px;">5 floors. Clear each one by finishing a task in time: 60, 50, 40, 30, then 20 minutes. Floors pay 20 to 100 XP and the end pays a chest. Once a day.</div><button class="hq-chest" onclick="heroDgStart()">🏰 Enter the dungeon</button>`;
  return`<div class="dg">${[1,2,3,4,5].map(i=>`<i class="${i<=g.f?'on':i===g.f+1&&!g.over?'now':''}">${i<=g.f?'✓':i}</i>`).join('')}</div><div class="hm-sub" style="margin-top:6px;">${g.f>=5?'Cleared! Come back tomorrow.':g.over?`The dungeon closed on floor ${g.f+1}. Try again tomorrow.`:`Floor ${g.f+1}: finish a task within ${Math.max(1,Math.ceil(g.left/6e4))} min (+${20*(g.f+1)} XP)`}</div>`;
}

// ── Crafting: turn spare items into better ones ──
const HERO_CRAFT=[['reroll',3,'potion'],['potion',2,'freeze'],['potion',3,'mega']];
function heroCraft(i){
  const[a,n,b]=HERO_CRAFT[i],inv=heroInv();if((inv[a]||0)<n)return showToast(`You need ${n} ${HERO_ITEMS[a][0]}s`);
  inv[a]-=n;inv[b]=(inv[b]||0)+1;save();renderHero();heroSfx('coin');
  heroShow(`<div class="hl-t">CRAFTED</div><div class="hl-em">${hIc(HERO_ITEMS[b][2],HERO_ITEMS[b][3],'burst',80)}</div><div class="hl-big" style="font-size:24px;">${HERO_ITEMS[b][0]}</div><div class="hl-rank">${HERO_ITEMS[b][1]}</div>`,3500,true);
}
function heroCraftHtml(){
  const inv=heroInv();
  return HERO_CRAFT.map(([a,n,b],i)=>`<div class="shop">${hIc(HERO_ITEMS[a][2],HERO_ITEMS[a][3],'hex',24)}<span>${n} ${HERO_ITEMS[a][0]}${n>1?'s':''} → ${HERO_ITEMS[b][0]}</span><button class="minibtn" ${(inv[a]||0)>=n?'':'disabled'} onclick="heroCraft(${i})">Craft</button></div>`).join('');
}

// ── Gwen's daily bet: she picks one of today's tasks and bets you can't finish it before a time ──
function heroBet(){
  if(typeof gwenCfg==='undefined'||!gwenCfg.key)return null;
  const tod=heroTod(),now=new Date(),b=heroP.bet;if(b&&b.d===tod)return b;
  const h=now.getHours();if(h<8||h>=19)return null;
  const open=tasks.filter(t=>isTodayTask(t,tod,now.getDay())&&!t.done.includes(tod));if(!open.length)return null;
  const r=heroRng(tod+'bet'),t=open[Math.floor(r()*open.length)];
  return heroP.bet={d:tod,id:t.id,name:t.name,by:Math.min(22,h+2+Math.floor(r()*3)),won:null};
}
function heroBetTick(silent){
  const b=heroP.bet,tod=heroTod();if(!b||b.d!==tod||b.won!==null)return;
  const t=tasks.find(x=>x.id===b.id),late=new Date().getHours()>=b.by;
  if(!t||!t.done.includes(tod)){if(late)b.won=false;return;}
  if(silent)return; // a tick from another device: that one settles the bet
  b.won=!late;const say=typeof gwenLine==='function'?gwenLine:()=>{};
  if(b.won){heroBonus(tod,60,{charisma:1,discipline:.5},`Won Gwen's bet: ${b.name}`,'💜','bet');if(typeof gwenBond==='function')gwenBond(5);setTimeout(()=>say(`Okay okay, you win! "${b.name}" before ${c12(b.by+':00')}. I'm impressed 💜`,'happy'),1500);}
  else setTimeout(()=>say('Hehe, I won the bet! But you still did it, so I\'m proud of you 💜','happy'),1500);
}
function heroBetHtml(full){
  const b=heroBet();if(!b)return full?`<div class="hm-sub">${typeof gwenCfg!=='undefined'&&gwenCfg.key?'Each day between 8 AM and 7 PM Gwen bets you can\'t finish one of your tasks in time. Win for +60 XP and bond points.':'Set Gwen up on the Gwen tab and she\'ll bet you can\'t finish one of your tasks in time.'}</div>`:'';const lost=b.won===false||(b.won===null&&new Date().getHours()>=b.by);
  return`<div class="bet${b.won?' won':lost?' lost':''}">${hIc('heart','pink','shield',34)}<div style="flex:1;min-width:0;"><b>${b.won?'You won Gwen\'s bet!':lost?'Gwen won the bet':'Gwen bets you can\'t…'}</b><small>“${esc(b.name)}” before ${c12(b.by+':00')}${b.won?' · +60 XP and bond points':lost?'. There\'s always tomorrow 😏':' · win: +60 XP and bond points'}</small></div></div>`;
}

// ── Friend duel: race a friend's DayTrack to the most XP this week. Your PC hosts it like a shared list (same link, same /s/ path) ──
const heroDuelText=()=>{const tod=heroTod(),ws=heroWeekStart(tod),xp=heroState().aw.filter(a=>a.d>=ws&&a.d<=tod).reduce((n,a)=>n+a.xp,0);return`${(heroP.name||'Rayan').replace(/\|/g,'')}|${xp}|${ws}`;};
let heroDuelData=null,heroDuelAt=0;
async function heroDuelPush(force){
  const D=heroP.duel;if(!D||(!force&&Date.now()-heroDuelAt<6e4))return;heroDuelAt=Date.now();
  const opts={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{id:D.me,text:heroDuelText(),done:false,at:Date.now()}]})};
  try{const r=D.host?await lifeApi('share?code='+D.code,opts):await fetch(D.url+'/data',opts);
    heroDuelData=r.status===404?{gone:1}:r.ok?{items:((await r.json()).items||[]).filter(i=>!i.del)}:{err:1};}catch(e){heroDuelData={err:1};}
  const el=document.getElementById('hero-duel');if(el)el.innerHTML=heroDuelHtml();
}
const heroHex=()=>[...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('');
async function heroDuelNew(){
  const url=typeof gwenCfg!=='undefined'&&gwenCfg.key&&typeof shareLink==='function'?shareLink('x'):'';
  if(!url)return showToast('Add your PC address (https://…ts.net) and Gwen key in Settings first');
  const code=heroHex(),me='p'+uid();
  try{const r=await lifeApi('share?code='+code,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'⚔️ DayTrack duel',items:[{id:me,text:heroDuelText(),done:false,at:Date.now()}]})});if(!r.ok)throw 0;}
  catch(e){return showToast('❌ Your PC needs to be on to start a duel');}
  heroP.duel={code,url:shareLink(code),me,host:true};save();await heroDuelPush(true);heroDuelShare();renderHero();
}
function heroDuelShare(){
  const D=heroP.duel;if(!D)return;const msg=`Duel me in DayTrack: most XP this week wins! In DayTrack go to Level → Story → Friend duel → Join one, and paste this link: ${D.url}`;
  if(navigator.share)navigator.share({title:'DayTrack duel',text:msg}).catch(()=>{});else navigator.clipboard.writeText(msg).then(()=>showToast('📋 Invite copied'));
}
async function heroDuelJoin(){
  const m=((await ask('Paste the duel link your friend sent','https://…/s/…'))||'').trim().match(/https:\/\/[^\s]+?\/s\/([a-f0-9]{32})/);
  if(!m)return showToast('That doesn\'t look like a duel link');
  const name=((await ask('Your name in the duel','e.g. Sami'))||'').trim().slice(0,20);if(!name)return;
  heroP.name=name;heroP.duel={code:m[1],url:m[0],me:'p'+uid()};heroDuelData=null;save();await heroDuelPush(true);renderHero();
}
function heroDuelLeave(){if(!confirm('Leave this duel?'))return;heroP.duel=null;heroDuelData=null;save();renderHero();}
function heroDuelHtml(){
  const D=heroP.duel;
  if(!D)return`<div class="hm-sub" style="margin-bottom:8px;">Race a friend to the most XP this week (Sunday to Saturday). They need the DayTrack app too. Your PC hosts the duel, like a shared list.</div><div style="display:flex;gap:8px;"><button class="hk-btn pri" onclick="heroDuelNew()">⚔️ Start a duel</button><button class="hk-btn" onclick="heroDuelJoin()">🔗 Join one</button></div>`;
  if(!heroDuelData){setTimeout(()=>heroDuelPush(true),0);return'<div class="hm-sub">Loading the duel…</div>';}
  if(heroDuelData.gone)return`<div class="hm-sub" style="margin-bottom:8px;">This duel has ended.</div><button class="minibtn" onclick="heroP.duel=null;heroDuelData=null;save();renderHero();">OK</button>`;
  const ws=heroWeekStart(heroTod()),ps=(heroDuelData.items||[]).map(i=>{const[n,x,w]=String(i.text).split('|');return{me:i.id===D.me,n:n||'?',x:w===ws?+x||0:0};}).sort((a,b)=>b.x-a.x),mx=Math.max(1,...ps.map(p=>p.x));
  return(heroDuelData.err?'<div class="hm-sub" style="margin-bottom:6px;">Couldn\'t reach the duel right now (is the host\'s PC on?).</div>':'')
    +ps.map((p,i)=>`<div class="duel${p.me?' me':''}"><b>${i===0&&p.x?'👑 ':''}${esc(p.n)}${p.me?' (you)':''}</b><div class="bar"><i style="width:${p.x/mx*100}%"></i></div><span>${p.x.toLocaleString()}</span></div>`).join('')
    +(ps.length<2&&!heroDuelData.err?'<div class="hm-sub" style="margin:6px 0;">Waiting for your friend to join…</div>':'')
    +`<div style="display:flex;gap:8px;margin-top:8px;">${D.host?'<button class="minibtn" onclick="heroDuelShare()">📤 Invite</button>':''}<button class="minibtn" onclick="heroDuelPush(true)">↻ Refresh</button><button class="minibtn" onclick="heroDuelLeave()">Leave</button></div>`;
}

// ── For the phone's home-screen widget: level bar, HP and today's boss (the widget works out the boss state itself) ──
function heroWidget(){
  try{
    const h=heroState(),b=heroBar(h.xp,HERO_B),hp=heroHP(),bs=heroBossList(heroTod()).filter(x=>!(x.kind==='n'&&x.state==='soon'));
    const x=bs.find(z=>z.state==='on')||bs.find(z=>z.state==='soon')||bs[bs.length-1];
    return{L:h.L,pct:b.pct,left:b.left,hp:hp?hp.hp:-1,down:!!(hp&&hp.down),boss:x?{name:x.name,at:x.at,until:x.until,won:!!x.won,cursed:x.kind==='d'}:null};
  }catch(e){return null;}
}

// ── A day of the year map: what earned that day's XP ──
function heroDay(d){
  const aw=heroAwards().filter(a=>a.d===d),t=aw.reduce((n,a)=>n+a.xp,0);
  sheet(`<div style="font-size:18px;font-weight:700;text-align:center;color:var(--txt);">${fmtDay(d)}</div><div class="hm-sub" style="text-align:center;margin:2px 0 10px;">${t>0?'+':''}${t} XP</div>`
    +(aw.length?aw.map(a=>`<div class="hl-g" style="padding:7px 0;border-bottom:1px solid var(--brd);"><span>${a.ic} ${esc(a.what)}</span><b>${a.xp>0?'+':''}${a.xp}</b></div>`).join(''):'<div class="hm-sub">No XP that day.</div>')+closeBtn);
}
// The real-life reward you're saving for, on the Tasks card
function heroPinHtml(h){
  const r=heroP.pin&&heroShop().find(x=>x.id===heroP.pin);if(!r)return'';const c=heroCoins(h);
  return`<div class="pin" onclick="event.stopPropagation();heroSetSeg('bag');switchTab('hero')"><span>🎯 ${esc(r.name)}</span><div class="bar"><i style="width:${Math.min(100,c/r.cost*100)}%"></i></div><small>${c>=r.cost?'Ready to buy!':`${c}/${r.cost} 🪙`}</small></div>`;
}
function heroPinReward(id){heroP.pin=heroP.pin===id?null:id;save();renderHero();renderHeroMini();}

// ── Steps: every day's real count (the Walk habit stops at its goal), a weekly challenge on a race track, and walk mode ──
// heroP.steps {date: steps} comes from the phone (life.js readSteps) and syncs, so the PC shows it too.
function heroStepsIn(s){
  if(!s)return;const st=heroP.steps=heroP.steps||{},tod=heroTod();let ch=false;
  for(const[d,n]of Object.entries({...(s.days||{}),[tod]:s.today}))if(d<=tod&&n>(st[d]||0)){st[d]=n;ch=true;}
  for(const d in st)if(d<dAdd(tod,-400))delete st[d];
  if(ch){heroWrite();if(document.body.dataset.tab==='hero')renderHero();if(heroWalkOn)heroWalkDraw();}
}
const heroStepsOn=()=>!!heroP.steps&&Object.keys(heroP.steps).length>0;
const heroWeekSteps=ws=>{const st=heroP.steps||{};let n=0;for(let i=0;i<7;i++)n+=st[dAdd(ws,i)]||0;return n;};
const HERO_STEP_GOALS=[35000,50000,70000,100000];
// Challenge XP: 200 plus 1 per 250 steps of the goal, on the day the goal is reached
function heroStepAwards(add){
  Object.entries(heroP.stepCh||{}).forEach(([ws,goal])=>{let n=0;for(let i=0;i<7;i++){const d=dAdd(ws,i);n+=(heroP.steps||{})[d]||0;if(n>=goal){add(d,200+Math.round(goal/250),{endurance:1,legs:.5},`Step challenge: ${goal.toLocaleString()} steps`,'👟','steps');break;}}});
}
// Oval running track; the runner (you) goes round once for the whole week's goal, the ghost is last week
function heroTrack(frac,ghost,size=320){
  const W=size,H=size*.56,r=H/2-14,x0=W/2-(W/2-14-r),x1=W/2+(W/2-14-r),cy=H/2;
  const path=`M${W/2} ${cy+r} L${x1} ${cy+r} A${r} ${r} 0 0 0 ${x1} ${cy-r} L${x0} ${cy-r} A${r} ${r} 0 0 0 ${x0} ${cy+r} Z`;
  const f=Math.max(0,Math.min(1,frac)),g=Math.max(0,Math.min(1,ghost||0)),id='tk'+Math.random().toString(36).slice(2,6);
  const av=heroP.avImg?`<clipPath id="${id}c"><circle r="13"/></clipPath><circle r="15" fill="#F59E0B"/><image href="${heroP.avImg}" x="-13" y="-13" width="26" height="26" clip-path="url(#${id}c)"/>`:`<circle r="15" fill="#F59E0B"/><text text-anchor="middle" dominant-baseline="central" font-size="16">${esc(heroP.av||'🧑')}</text>`;
  return`<svg viewBox="0 0 ${W} ${H}" class="track"><path d="${path}" class="tk-out"/><path d="${path}" class="tk-lane" id="${id}"/><path d="${path}" class="tk-done" pathLength="1" stroke-dasharray="${f} 1"/>
    <line x1="${W/2}" y1="${cy+r-12}" x2="${W/2}" y2="${cy+r+12}" class="tk-line"/><text x="${W/2}" y="${cy+4}" text-anchor="middle" class="tk-c">${Math.round(f*100)}%</text>
    ${g?`<g opacity=".45"><animateMotion dur="1.6s" fill="freeze" keyPoints="0;${g}" keyTimes="0;1" calcMode="linear"><mpath href="#${id}"/></animateMotion><circle r="11" fill="#94A3B8"/><text text-anchor="middle" dominant-baseline="central" font-size="12">👻</text></g>`:''}
    <g><animateMotion dur="2s" fill="freeze" keyPoints="0;${f}" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .2 1"><mpath href="#${id}"/></animateMotion>${av}</g></svg>`;
}
function heroStepsHtml(){
  const tod=heroTod(),ws=heroWeekStart(tod),st=heroP.steps||{},today=st[tod]||0,week=heroWeekSteps(ws),goal=(heroP.stepCh||{})[ws];
  const phone=typeof has==='function'&&has('steps'),on=typeof lifeDev!=='undefined'&&lifeDev.steps;
  if(!heroStepsOn())return phone&&!on?`<div class="hm-sub" style="margin-bottom:8px;">Count your steps with the phone's own step counter, take weekly challenges and watch yourself run laps.</div><button class="hk-btn pri" style="width:100%;" onclick="toggleSteps()">🚶 Turn on steps</button>`
    :`<div class="hm-sub">${phone?'Waiting for the first step count…':'Steps come from the phone app: turn them on there (Settings → Steps) and they show up here too.'}</div>`;
  const dayN=Math.round((new Date(tod+'T12:00:00')-new Date(ws+'T12:00:00'))/864e5)+1,lastW=dAdd(ws,-7);
  let ghostSoFar=0;for(let i=0;i<dayN;i++)ghostSoFar+=st[dAdd(lastW,i)]||0;
  const bars=Array.from({length:7},(_,i)=>{const d=dAdd(ws,i),n=st[d]||0;return{d,n};}),mx=Math.max(1,...bars.map(b=>b.n),goal?goal/7:0);
  const past=Object.keys(heroP.stepCh||{}).filter(w=>w<ws).sort().reverse().slice(0,4);
  return`<div class="st-top"><div><b>${today.toLocaleString()}</b><small>steps today · ${(today*.00075).toFixed(1)} km</small></div></div>`
    +(goal?`<div class="hm-sub" style="margin:10px 0 4px;">This week's challenge: <b>${week.toLocaleString()} / ${goal.toLocaleString()}</b> steps${week>=goal?' · done! 🏆':` · ${(goal-week).toLocaleString()} to go, ${8-dayN} day${8-dayN>1?'s':''} left`}</div>${heroTrack(week/goal,ghostSoFar/goal)}<div class="hm-sub" style="text-align:center;">One lap = your goal · 👻 = you last week by today (${ghostSoFar.toLocaleString()})</div>`
      :`<div class="hm-sub" style="margin:10px 0 6px;">${week.toLocaleString()} steps this week. Take a challenge to race it on the track:</div><div class="st-goals">${HERO_STEP_GOALS.map(g=>`<button class="minibtn" onclick="heroStepGoal(${g})">${g/1000}k</button>`).join('')}<button class="minibtn" onclick="heroStepGoal()">Other</button></div>`)
    +`<div class="st-bars">${bars.map(b=>`<div title="${fmtDay(b.d)}: ${b.n.toLocaleString()}"><i style="height:${Math.round(b.n/mx*100)}%"${b.d===tod?' class="now"':''}></i><small>${DNAMES[new Date(b.d+'T12:00:00').getDay()]}</small></div>`).join('')}</div>`
    +(past.length?`<div class="sl">Past challenges</div>`+past.map(w=>{const n=heroWeekSteps(w),g=heroP.stepCh[w];return`<div class="hl-g" style="padding:5px 0;"><span>${n>=g?'🏆':'❌'} Week of ${fmtDay(w)}</span><b>${n.toLocaleString()} / ${g.toLocaleString()}</b></div>`;}).join(''):'');
}
async function heroStepGoal(g){
  if(!g)g=Math.max(5000,Math.min(500000,parseInt(String(await ask('Steps goal for this week','e.g. 60000')||'').replace(/[^0-9]/g,''),10)||0));if(!g)return;
  const ws=heroWeekStart(heroTod());heroP.stepCh=heroP.stepCh||{};heroP.stepCh[ws]=g;save();renderHero();
  showToast(`👟 Challenge on: ${g.toLocaleString()} steps by Saturday night (+${200+Math.round(g/250)} XP)`);
}
// Last week's result, once, when a new week starts
function heroStepWeekCheck(){
  const ws=heroWeekStart(heroTod()),lw=dAdd(ws,-7),g=(heroP.stepCh||{})[lw];if(!g||heroP.stepSeen===lw)return;heroP.stepSeen=lw;
  const n=heroWeekSteps(lw);setTimeout(()=>heroShow(`<div class="hl-t">WEEK RESULTS</div><div class="hl-em">${hIc(n>=g?'trophy':'flag',n>=g?'gold':'dark','burst',90)}</div><div class="hl-big" style="font-size:26px;">${n.toLocaleString()} steps</div><div class="hl-row">Challenge: ${g.toLocaleString()} ${n>=g?'✓ beaten!':'✗ not this time'}</div>${heroTrack(n/g,0,260)}`,6000,n>=g),2500);
}
// ── Walks, Strava style: GPS route + map, pace, splits, climb, auto-pause, PBs, route ghost, local legend, heatmap,
// monthly badges, weekly streak, km goals, fitness trend, year recap, Gwen's kudos, share card ──
// The GPS points stay on the phone (dt_routes); the walk's numbers go in heroP.walks and sync to the PC.
const heroRoutes=()=>{try{return JSON.parse(localStorage.getItem('dt_routes')||'{}');}catch(e){return{};}};
function heroRouteSave(id,pts){const r=heroRoutes();r[id]=pts;const ks=Object.keys(r).sort();while(ks.length>150)delete r[ks.shift()];try{localStorage.setItem('dt_routes',JSON.stringify(r));}catch(e){}}
const heroDist=(a,b)=>{const r=Math.PI/180,h=Math.sin((b[0]-a[0])*r/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin((b[1]-a[1])*r/2)**2;return 12742e3*Math.asin(Math.sqrt(h));};
const heroPace=(sec,m)=>m>=50?heroClock(sec/m*1e6):'–';                 // min:sec per km
const heroDur=sec=>sec>=3600?`${Math.floor(sec/3600)} h ${Math.round(sec%3600/60)} min`:`${Math.round(sec/60)} min`;
const heroKm=m=>(m/1000).toFixed(m<10000?2:1);
// pts: [lat,lon,alt|null,seconds since start]. Standing still or GPS jumps don't count as moving (auto-pause).
function heroWalkStats(pts){
  let m=0,mov=0,climb=0,ref=null;const cum=[0],tm=[0];
  for(let i=1;i<pts.length;i++){
    const a=pts[i-1],b=pts[i],d=heroDist(a,b),dt=b[3]-a[3],v=dt>0?d/dt:0;
    if(dt>0&&dt<60&&v>.4&&v<7){m+=d;mov+=dt;}
    cum.push(m);tm.push(mov);
    if(b[2]!=null){if(ref==null||b[2]<ref-3)ref=b[2];else if(b[2]>ref+3){climb+=b[2]-ref;ref=b[2];}}  // 3 m deadband for GPS altitude noise
  }
  const sp=[];for(let k=1;k*1000<=m;k++){const i=cum.findIndex(c=>c>=k*1000),f=(k*1000-cum[i-1])/((cum[i]-cum[i-1])||1),t=tm[i-1]+f*(tm[i]-tm[i-1]);sp.push(Math.round(t-sp.reduce((s,x)=>s+x,0)));}
  return{m:Math.round(m),mov:Math.round(mov),climb:Math.round(climb),sp,fk:sp.length?Math.min(...sp):0,cum,tm};
}
// Distance the stats say you'd covered after `t` moving seconds
const heroDistAt=(s,t)=>{const i=s.tm.findIndex(x=>x>=t);if(i<0)return s.m;if(i===0)return 0;return s.cum[i-1]+(t-s.tm[i-1])/((s.tm[i]-s.tm[i-1])||1)*(s.cum[i]-s.cum[i-1]);};

// ── Map: OpenStreetMap tiles under an SVG line; with no internet the line still shows ──
function heroMapFit(all,W,H){
  let a=90,b=-90,c=180,d=-180;all.forEach(r=>r.forEach(p=>{a=Math.min(a,p[0]);b=Math.max(b,p[0]);c=Math.min(c,p[1]);d=Math.max(d,p[1]);}));
  const X=(lon,z)=>(lon+180)/360*256*2**z,Y=(lat,z)=>{const s=Math.sin(lat*Math.PI/180);return(.5-Math.log((1+s)/(1-s))/(4*Math.PI))*256*2**z;};
  let z=17;while(z>2&&(X(d,z)-X(c,z)>W*.82||Y(a,z)-Y(b,z)>H*.82))z--;
  const ox=(X(c,z)+X(d,z))/2-W/2,oy=(Y(a,z)+Y(b,z))/2-H/2;
  return{z,ox,oy,px:p=>[X(p[1],z)-ox,Y(p[0],z)-oy]};
}
function heroMap(routes,W=340,H=220,o={}){
  routes=routes.filter(r=>r&&r.length>1);if(!routes.length)return'';
  const f=heroMapFit(routes,W,H);let tiles='';
  if(!o.noTiles)for(let x=Math.floor(f.ox/256);x*256<f.ox+W;x++)for(let y=Math.floor(f.oy/256);y*256<f.oy+H;y++)
    tiles+=`<img src="https://tile.openstreetmap.org/${f.z}/${x}/${y}.png" style="left:${x*256-f.ox}px;top:${y*256-f.oy}px" alt="" loading="lazy" onerror="this.remove()">`;
  const line=r=>r.map(p=>f.px(p).map(v=>v.toFixed(1)).join(',')).join(' ');
  const svg=routes.map((r,i)=>`<polyline points="${line(r)}" class="${o.heat?'mp-heat':i===o.ghost?'mp-ghost':'mp-line'}"/>`).join('')
    +(o.heat?'':(()=>{const r=routes[0],s=f.px(r[0]),e=f.px(r[r.length-1]);return`<circle cx="${s[0]}" cy="${s[1]}" r="${W<100?3:6}" class="mp-s"/><circle cx="${e[0]}" cy="${e[1]}" r="${W<100?3:6}" class="mp-e"/>`;})());
  return`<div class="mp" style="width:${W}px;height:${H}px">${tiles}<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${svg}</svg>${o.noTiles?'':'<small>© OpenStreetMap</small>'}</div>`;
}

// ── Walk mode ──
let heroWalkOn=null;
const heroClock=ms=>`${Math.floor(ms/6e4)}:${String(Math.floor(ms/1e3)%60).padStart(2,'0')}`;
function heroWalk(resume){
  if(typeof readSteps==='function')readSteps();const tod=heroTod();
  if(!heroWalkOn||resume){   // a new walk (or picking one up again after the app was closed); otherwise just show the running one
    heroWalkOn=Object.assign(resume||{t:Date.now(),s0:(heroP.steps||{})[tod]||0,d:tod},{pts:[],from:0});
    try{localStorage.setItem('dt_walk',JSON.stringify({t:heroWalkOn.t,s0:heroWalkOn.s0,d:heroWalkOn.d}));}catch(e){}
    heroWalkGps();
  }
  let el=document.getElementById('hero-walk');if(!el){el=document.createElement('div');el.id='hero-walk';document.body.appendChild(el);}
  el.classList.add('on');heroWalkPull();heroWalkDraw();
  clearInterval(heroWalk.t);heroWalk.t=setInterval(()=>{if(typeof readSteps==='function')readSteps();},8000);
  clearInterval(heroWalk.c);heroWalk.c=setInterval(()=>{heroWalkPull();heroWalkDraw();},3000);
}
// The phone app records in a background service (keeps going with the screen off); a browser only while the page is open
function heroWalkGps(){
  const N=window.DayTrackNative,w=heroWalkOn;
  if(N&&N.walkStart){w.native=true;w.gps=N.walking&&N.walking()&&w.resumed?true:N.walkStart();return;}
  if(navigator.geolocation&&w.watch==null){w.gps=true;w.watch=navigator.geolocation.watchPosition(p=>heroWalkAdd([p.coords.latitude,p.coords.longitude,p.coords.altitude??-9999,p.timestamp,p.coords.accuracy]),()=>{},{enableHighAccuracy:true,maximumAge:0});}
}
function heroWalkPull(){
  const N=window.DayTrackNative,w=heroWalkOn;if(!w||!w.native)return;
  if(!w.gps){if(N.hasPerm&&N.hasPerm('location'))w.gps=N.walkStart();return;}   // after Allow location
  try{JSON.parse(N.walkPoints(w.from)).forEach(p=>{w.from++;heroWalkAdd(p);});}catch(e){}
}
function heroWalkAdd(p){
  const w=heroWalkOn;if(!w||p[4]>35)return;
  const q=[+(+p[0]).toFixed(5),+(+p[1]).toFixed(5),p[2]==null||p[2]===-9999?null:Math.round(p[2]),Math.max(0,Math.round((p[3]-w.t)/1000))],l=w.pts[w.pts.length-1];
  if(l&&heroDist(l,q)<3&&q[3]-l[3]<20)return;
  w.pts.push(q);if(w.pts.length===1)w.ghost=heroGhostFor(q);
}
// Ghost = your most recent walk that started within 120 m of here
function heroGhostFor(p){
  const r=heroRoutes(),g=(heroP.walks||[]).slice().reverse().find(x=>x.start&&r[x.id]&&heroDist(x.start,p)<120&&x.m>=500);
  return g?{w:g,s:heroWalkStats(r[g.id])}:null;
}
function heroWalkDraw(){
  const el=document.getElementById('hero-walk'),w=heroWalkOn;if(!el||!w)return;
  const tod=heroTod(),now=(heroP.steps||{})[tod]||0,n=Math.max(0,now-w.s0),s=heroWalkStats(w.pts),gps=w.pts.length>1;
  const m=gps?s.m:n*.75,el2=Date.now()-w.t,last=w.pts[w.pts.length-1],paused=gps&&last&&(el2/1000-last[3]>20||(w.pts.length>2&&heroDist(w.pts[w.pts.length-2],last)/Math.max(1,last[3]-w.pts[w.pts.length-2][3])<.4));
  let gh='';if(w.ghost&&gps){const gd=heroDistAt(w.ghost.s,s.mov),diff=Math.round(s.m-gd);gh=`<div class="wk-gh">👻 ${diff>=0?`Ahead of last time by ${diff} m`:`Behind last time by ${-diff} m`}</div>`;}
  el.innerHTML=`<div class="wk">${gps?`<div class="wk-map">${heroMap([w.pts,...(w.ghost?[heroRoutes()[w.ghost.w.id]]:[])],320,150,{noTiles:true,ghost:1})}</div>`
      :`<div class="wk-road"><div class="wk-me">${heroP.avImg?`<img src="${heroP.avImg}" alt="">`:`<span>${esc(heroP.av||'🧑')}</span>`}</div></div>`}
    <div class="wk-n">${heroKm(m)}</div><div class="wk-l">km${gps?'':' (from steps)'}${paused?' · ⏸ auto-paused':''}</div>${gh}
    <div class="wk-row"><div><b>${heroClock(gps?s.mov*1000:el2)}</b><small>${gps?'moving':'time'}</small></div><div><b>${gps?heroPace(s.mov,s.m):heroPace(el2/1000,m)}</b><small>min/km</small></div><div><b>${n.toLocaleString()}</b><small>steps</small></div></div>
    ${gps?`<div class="wk-row"><div><b>${s.climb}</b><small>m climbed</small></div><div><b>${s.sp.length}</b><small>full km</small></div><div><b>${Math.round(m*.055)}</b><small>kcal</small></div></div>`
      :`<div class="hbx-r" style="margin-bottom:12px;">${w.native&&!w.gps?'Allow location to draw your route on a map':'Waiting for GPS…'}</div>`}
    <button class="hbx-go" onclick="heroWalkEnd()">🏁 End walk</button><button class="hbx-x" onclick="heroWalkHide()">Hide (keeps recording)</button></div>`;
}
function heroWalkHide(){const el=document.getElementById('hero-walk');if(el)el.classList.remove('on');clearInterval(heroWalk.c);heroWalk.c=null;renderHero();}
// Back in the app after it was closed mid-walk: carry on from the background recorder
function heroWalkResume(){
  const N=window.DayTrackNative;let s=null;try{s=JSON.parse(localStorage.getItem('dt_walk')||'null');}catch(e){}
  if(!s||heroWalkOn)return;
  if(N&&N.walking&&N.walking()){heroWalkOn={...s,resumed:true};heroWalk(heroWalkOn);}
  else try{localStorage.removeItem('dt_walk');}catch(e){}
}
function heroWalkEnd(){
  const w=heroWalkOn;if(!w)return;heroWalkPull();clearInterval(heroWalk.t);clearInterval(heroWalk.c);
  const N=window.DayTrackNative;if(w.native&&N.walkStop)N.walkStop();if(w.watch!=null)navigator.geolocation.clearWatch(w.watch);
  heroWalkOn=null;try{localStorage.removeItem('dt_walk');}catch(e){}
  const el=document.getElementById('hero-walk');if(el)el.classList.remove('on');
  const n=Math.max(0,((heroP.steps||{})[heroTod()]||0)-w.s0),min=Math.round((Date.now()-w.t)/6e4),s=heroWalkStats(w.pts),id='w'+w.t;
  if(n<20&&s.m<100){renderHero();return showToast('Walk too short to save');}
  const pb0=heroPBs(heroP.walks||[]);
  const x={id,d:w.d,steps:n,min,m:s.m||Math.round(n*.75),mov:s.mov||min*60,climb:s.climb,fk:s.fk,sp:s.sp,...(w.pts.length>1?{start:w.pts[0].slice(0,2),end:w.pts[w.pts.length-1].slice(0,2)}:{})};
  heroP.walks=(heroP.walks||[]).concat(x).slice(-300);if(w.pts.length>1)heroRouteSave(id,w.pts);
  save();renderHero();heroWalkView(id);heroKudos(x,pb0);
}

// ── Records, routes, legend ──
function heroPBs(ws){const b={m:0,fk:0,climb:0};ws.forEach(w=>{b.m=Math.max(b.m,w.m||0);if(w.fk)b.fk=b.fk?Math.min(b.fk,w.fk):w.fk;b.climb=Math.max(b.climb,w.climb||0);});return b;}
function heroWalkPBs(w){
  const ws=heroP.walks||[],b=heroPBs(ws.filter(x=>x.id<w.id)),out=[];if(!ws.some(x=>x.id<w.id))return out;
  if(w.m>b.m&&w.m>=1000)out.push('Longest walk');if(w.fk&&(!b.fk||w.fk<b.fk))out.push('Fastest km');if(w.climb>b.climb&&w.climb>=20)out.push('Biggest climb');return out;
}
// Same route = starts and ends within 150 m of each other and about the same length
const heroSameRoute=(a,b)=>a.start&&b.start&&heroDist(a.start,b.start)<150&&heroDist(a.end,b.end)<150&&Math.abs(a.m-b.m)<Math.max(a.m,b.m)*.25;
function heroRouteGroups(){const gs=[];(heroP.walks||[]).forEach(w=>{if(!w.start)return;const g=gs.find(g=>heroSameRoute(g[0],w));g?g.push(w):gs.push([w]);});return gs;}
const heroRouteName=g=>(heroP.rtNames||{})[g[0].id]||`${heroKm(g[0].m)} km route from ${fmtDay(g[0].d)}`;
function heroLegend(){const from=dAdd(heroTod(),-90),g=heroRouteGroups().map(g=>g.filter(w=>w.d>=from)).filter(g=>g.length>=3).sort((a,b)=>b.length-a.length)[0];return g?heroRouteGroups().find(x=>x.includes(g[0])):null;}
async function heroRouteRename(id){const t=await ask('Name this route','e.g. Park loop');if(!t)return;heroP.rtNames=heroP.rtNames||{};heroP.rtNames[id]=String(t).slice(0,40);save();heroWalkView(heroWalkView.id);}

// ── Monthly badges, weekly streak, km goals ──
const HERO_WCH=[['km50','Walk 50 km','bolt','gold',(ws)=>ws.reduce((s,w)=>s+w.m,0)>=5e4],['climb500','Climb 500 m','flag','silver',ws=>ws.reduce((s,w)=>s+(w.climb||0),0)>=500],
  ['walks12','12 walks','heart','bronze',ws=>ws.length>=12],['long10','One 10 km walk','trophy','legend',ws=>ws.some(w=>w.m>=1e4)]];
// Each badge is earned on the day the month's walks first reach it
function heroWalkBadges(){
  const by={},out=[];(heroP.walks||[]).forEach(w=>(by[w.d.slice(0,7)]=by[w.d.slice(0,7)]||[]).push(w));
  Object.entries(by).forEach(([mo,ws])=>HERO_WCH.forEach(([id,name,g,c,ok])=>{for(let i=1;i<=ws.length;i++)if(ok(ws.slice(0,i))){out.push({mo,id,name,g,c,d:ws[i-1].d});break;}}));
  return out;
}
const HERO_KM_GOALS=[10,20,30,50];
function heroWalkAwards(add){
  const ws=heroP.walks||[];
  ws.forEach(w=>{add(w.d,Math.round((w.m||0)/100),{legs:1,endurance:1},`Walk: ${heroKm(w.m||0)} km`,'🚶','walk');heroWalkPBs(w).forEach(p=>add(w.d,50,{legs:1,endurance:.5},'New record: '+p,'🏅','walk'));});
  heroWalkBadges().forEach(b=>add(b.d,150,{endurance:1,discipline:.5},`Badge: ${b.name} (${b.mo})`,'🎖️','walk'));
  Object.entries(heroP.kmCh||{}).forEach(([wk,km])=>{let m=0;for(const w of ws.filter(w=>w.d>=wk&&w.d<=dAdd(wk,6)).sort((a,b)=>a.d<b.d?-1:1)){m+=w.m;if(m>=km*1000){add(w.d,150+km*10,{endurance:1,legs:.5},`Distance challenge: ${km} km`,'👟','steps');break;}}});
}
function heroWalkStreak(){
  const ws=heroP.walks||[],cnt=wk=>ws.filter(w=>w.d>=wk&&w.d<=dAdd(wk,6)).length;let wk=heroWeekStart(heroTod()),n=0;
  if(cnt(wk)<3)wk=dAdd(wk,-7);while(cnt(wk)>=3){n++;wk=dAdd(wk,-7);}return n;
}
const heroWeekKm=wk=>(heroP.walks||[]).filter(w=>w.d>=wk&&w.d<=dAdd(wk,6)).reduce((s,w)=>s+w.m,0)/1000;
async function heroKmGoal(km){
  if(!km)km=Math.max(1,Math.min(500,parseFloat(String(await ask('Kilometres to walk this week','e.g. 25')||'').replace(/[^0-9.]/g,''))||0));if(!km)return;
  const ws=heroWeekStart(heroTod());heroP.kmCh=heroP.kmCh||{};heroP.kmCh[ws]=km;save();renderHero();
  showToast(`👟 Challenge on: ${km} km by Saturday night (+${150+km*10} XP)`);
}

// ── The Walks card ──
function heroWalksHtml(){
  const ws=(heroP.walks||[]).filter(w=>w.m),phone=!!(window.DayTrackNative&&window.DayTrackNative.walkStart)||!!navigator.geolocation;
  const wk=heroWeekStart(heroTod()),km=heroWeekKm(wk),goal=(heroP.kmCh||{})[wk],streak=heroWalkStreak(),lg=heroLegend(),mo=heroTod().slice(0,7);
  const mine=ws.filter(w=>w.d.slice(0,7)===mo),got=heroWalkBadges().filter(b=>b.mo===mo).map(b=>b.id);
  const head=`<div class="st-top"><div><b>${km.toFixed(1)} km</b><small>this week${streak?` · 🔥 ${streak} week streak`:''}</small></div>${phone?`<button class="hk-btn pri" onclick="heroWalk()">${heroWalkOn?'🚶 Back to your walk':'🚶 Start a walk'}</button>`:''}</div>`;
  if(!ws.length)return head+`<div class="hm-sub" style="margin-top:8px;">Start a walk to record your route on a map with pace, splits and climb. Your past routes come back as a ghost to race.</div>`;
  const last=ws.slice(-5).reverse(),r=heroRoutes();
  return head
    +(goal?`<div class="hm-sub" style="margin:10px 0 4px;">Distance challenge: <b>${km.toFixed(1)} / ${goal} km</b>${km>=goal?' · done! 🏆':''}</div>${heroTrack(km/goal,heroWeekKm(dAdd(wk,-7))/goal)}`
      :`<div class="st-goals" style="margin-top:10px;"><span class="hm-sub">Weekly km goal:</span>${HERO_KM_GOALS.map(k=>`<button class="minibtn" onclick="heroKmGoal(${k})">${k}</button>`).join('')}<button class="minibtn" onclick="heroKmGoal()">Other</button></div>`)
    +(lg?`<div class="wl-lg">${hIc('crown','gold','burst',34)}<div><b>Local legend</b><small>${esc(heroRouteName(lg))} · walked ${lg.length}×</small></div></div>`:'')
    +`<div class="sl">${new Date(mo+'-15').toLocaleDateString(undefined,{month:'long'})} badges</div><div class="wl-bd">${HERO_WCH.map(([id,name,g,c])=>`<div class="${got.includes(id)?'':'off'}">${hIc(g,got.includes(id)?c:'dark','shield',38)}<small>${name}</small></div>`).join('')}</div>`
    +`<div class="sl">Recent walks</div>`+last.map(w=>`<button class="wl-row" onclick="heroWalkView('${w.id}')">${r[w.id]?heroMap([r[w.id]],56,56,{noTiles:true}):'<span class="wl-ic">🚶</span>'}<div><b>${heroKm(w.m)} km · ${heroPace(w.mov,w.m)} /km</b><small>${fmtDay(w.d)} · ${heroDur(w.mov)}${w.climb?` · ↑${w.climb} m`:''}</small></div></button>`).join('')
    +`<div class="wl-btns"><button class="minibtn" onclick="heroHeat()">🗺️ Heatmap</button><button class="minibtn" onclick="heroTrend()">📈 Trend</button><button class="minibtn" onclick="heroYear()">📅 Your year</button></div>`;
}

// ── One walk ──
function heroWalkView(id){
  heroWalkView.id=id;const w=(heroP.walks||[]).find(x=>x.id===id);if(!w)return;
  const r=heroRoutes()[id],pbs=heroWalkPBs(w),g=heroRouteGroups().find(g=>g.includes(w)),i=g?g.indexOf(w):-1;
  let rt='';if(g&&g.length>1){const best=g.filter(x=>x!==w&&x.mov).sort((a,b)=>a.mov-b.mov)[0],d=best?w.mov-best.mov:0;
    rt=`<div class="wl-rt"><b>${esc(heroRouteName(g))}</b><small>${i+1}${['st','nd','rd'][((i+1)%100-20)%10-1]||'th'} time on this route${best?(d<=0?` · 🏆 ${heroClock(-d*1000)} faster than your best`:` · ${heroClock(d*1000)} off your best`):''}</small></div>`;}
  const fast=w.sp&&w.sp.length?Math.min(...w.sp):0,slow=w.sp&&w.sp.length?Math.max(...w.sp):1;
  const alts=r?r.map(p=>p[2]).filter(a=>a!=null):[];let elev='';
  if(alts.length>5){const lo=Math.min(...alts),hi=Math.max(lo+10,...alts),pts=alts.map((a,i)=>`${(i/(alts.length-1)*320).toFixed(1)},${(56-(a-lo)/(hi-lo)*50).toFixed(1)}`).join(' ');elev=`<div class="sl">Elevation (${Math.round(lo)}–${Math.round(hi)} m)</div><svg class="wl-el" viewBox="0 0 320 60" preserveAspectRatio="none"><polygon points="0,60 ${pts} 320,60"/><polyline points="${pts}"/></svg>`;}
  sheet(`<div class="cl">${fmtDay(w.d)} walk</div>${r?heroMap([r],330,220):''}
    ${pbs.length?`<div class="wl-pb">${pbs.map(p=>`🏅 ${p}`).join(' · ')}</div>`:''}
    <div class="wl-grid"><div><b>${heroKm(w.m)}</b><small>km</small></div><div><b>${heroClock(w.mov*1000)}</b><small>moving</small></div><div><b>${heroPace(w.mov,w.m)}</b><small>min/km</small></div>
      <div><b>${(w.steps||0).toLocaleString()}</b><small>steps</small></div><div><b>${w.climb||0} m</b><small>climbed</small></div><div><b>${Math.round(w.m*.055)}</b><small>kcal</small></div></div>
    ${rt}${elev}
    ${w.sp&&w.sp.length?`<div class="sl">Splits</div>`+w.sp.map((s,k)=>`<div class="wl-sp${s===fast&&w.sp.length>1?' best':''}"><span>Km ${k+1}</span><i style="width:${Math.round(40+60*fast/s)}%"></i><b>${heroClock(s*1000)}${s===fast&&w.sp.length>1?' ⚡':''}</b></div>`).join(''):''}
    <div class="wl-btns">${g?`<button class="minibtn" onclick="heroRouteRename('${g[0].id}')">✏️ Name route</button>`:''}<button class="minibtn" onclick="heroWalkShare('${id}')">📤 Share</button><button class="minibtn" onclick="heroWalkDel('${id}')">🗑️ Delete</button></div>`);
}
async function heroWalkDel(id){if(!confirm("Delete this walk?"))return;heroP.walks=(heroP.walks||[]).filter(w=>w.id!==id);const r=heroRoutes();delete r[id];try{localStorage.setItem('dt_routes',JSON.stringify(r));}catch(e){}save();closeOv('dt-ov');renderHero();}

// ── Gwen's kudos: a set line that fits the walk (her brain-written texts are for later) ──
function heroKudos(w,pb0){
  const pbs=heroWalkPBs(w),km=heroKm(w.m);
  const t=pbs.includes('Fastest km')?`New fastest km?! ${heroClock(w.fk*1000)}… okay show-off 😏💜`:pbs.includes('Longest walk')?`${km} km! That's your longest walk ever. My legs hurt just reading that 💜`
    :pbs.includes('Biggest climb')?`${w.climb} m of climbing, you mountain goat 🐐💜`:w.m>=5000?`${km} km walk, nice! Come tell me what you saw 💜`:`Kudos on the ${km} km walk 👏💜`;
  setTimeout(()=>{if(typeof gwenCfg!=='undefined'&&gwenCfg.key&&typeof gwenLine==='function')gwenLine(t,'happy');else showToast('💜 '+t);},2500);
}

// ── Heatmap, trend, year ──
function heroHeat(){const r=Object.values(heroRoutes());sheet(`<div class="cl">Your heatmap</div><div class="hm-sub" style="margin-bottom:8px;">Every route you've walked. Brighter = walked more.</div>${r.length?heroMap(r,330,380,{heat:true}):'<div class="hm-sub">No GPS walks yet.</div>'}`);}
function heroTrend(){
  const ms=Array.from({length:6},(_,i)=>{const x=new Date();x.setDate(1);x.setMonth(x.getMonth()-5+i);return toDateStr(x).slice(0,7);});
  const rows=ms.map(m=>{const ws=(heroP.walks||[]).filter(w=>w.d.slice(0,7)===m&&w.m),km=ws.reduce((s,w)=>s+w.m,0)/1000,mov=ws.reduce((s,w)=>s+w.mov,0);return{m,km,pace:km?mov/km:0,n:ws.length};});
  const mx=Math.max(1,...rows.map(r=>r.km)),ps=rows.filter(r=>r.pace),best=ps.length?Math.min(...ps.map(r=>r.pace)):0,worst=ps.length?Math.max(...ps.map(r=>r.pace)):0;
  const y=p=>worst===best?30:10+(p-best)/(worst-best)*45,pl=rows.map((r,i)=>r.pace?`${i*56+28},${y(r.pace).toFixed(1)}`:'').filter(Boolean).join(' ');
  const a=ps[0],b=ps[ps.length-1],msg=ps.length<2?'Walk in two different months to see a trend.':b.pace<a.pace?`You're ${heroClock((a.pace-b.pace)*1000)} per km faster than in ${new Date(a.m+'-15').toLocaleDateString(undefined,{month:'long'})} 📈`:`Pace is ${heroClock((b.pace-a.pace)*1000)} per km slower than in ${new Date(a.m+'-15').toLocaleDateString(undefined,{month:'long'})}.`;
  sheet(`<div class="cl">Fitness trend</div><div class="hm-sub" style="margin-bottom:10px;">${msg}</div><svg class="wl-tr" viewBox="0 0 336 190">
    ${rows.map((r,i)=>`<rect x="${i*56+12}" y="${160-r.km/mx*70}" width="32" height="${r.km/mx*70}" rx="5"/><text x="${i*56+28}" y="${154-r.km/mx*70}">${r.km?r.km.toFixed(0):''}</text><text x="${i*56+28}" y="180" class="m">${new Date(r.m+'-15').toLocaleDateString(undefined,{month:'short'})}</text>`).join('')}
    ${pl?`<polyline points="${pl}"/>`+rows.map((r,i)=>r.pace?`<circle cx="${i*56+28}" cy="${y(r.pace).toFixed(1)}" r="4"/>`:'').join(''):''}</svg>
    <div class="hm-sub">Bars = km per month · line = pace (higher is faster)</div>`);
}
function heroYear(yr){
  yr=yr||(new Date().getMonth()===0&&new Date().getDate()<8?new Date().getFullYear()-1:new Date().getFullYear());
  const ws=(heroP.walks||[]).filter(w=>w.d.startsWith(yr)&&w.m);if(!ws.length)return sheet(`<div class="cl">${yr} in walks</div><div class="hm-sub">No walks recorded in ${yr} yet.</div>`);
  const km=ws.reduce((s,w)=>s+w.m,0)/1000,h=ws.reduce((s,w)=>s+w.mov,0)/3600,cl=ws.reduce((s,w)=>s+(w.climb||0),0);
  const g=heroRouteGroups().map(g=>g.filter(w=>w.d.startsWith(yr))).sort((a,b)=>b.length-a.length)[0];
  const wk={};ws.forEach(w=>{const k=heroWeekStart(w.d);wk[k]=(wk[k]||0)+w.m;});const bw=Object.entries(wk).sort((a,b)=>b[1]-a[1])[0];
  const steps=Object.entries(heroP.steps||{}).filter(([d])=>d.startsWith(yr)).reduce((s,[,n])=>s+n,0);
  sheet(`<div class="wl-yr"><div class="hl-t">${yr} IN WALKS</div>${hIc('trophy','legend','burst',80)}<div class="hl-big">${km.toFixed(0)} km</div>
    <div class="wl-grid"><div><b>${ws.length}</b><small>walks</small></div><div><b>${h.toFixed(0)} h</b><small>moving</small></div><div><b>${cl.toLocaleString()} m</b><small>climbed</small></div></div>
    ${steps?`<div class="hl-row">👣 ${steps.toLocaleString()} steps</div>`:''}${g&&g.length>1?`<div class="hl-row">❤️ Favourite route: ${esc(heroRouteName(g))} (${g.length}×)</div>`:''}
    <div class="hl-row">🔥 Best week: ${(bw[1]/1000).toFixed(1)} km (week of ${fmtDay(bw[0])})</div>${(n=>n?`<div class="hl-row">🎖️ ${n} badge${n>1?'s':''}</div>`:'')(heroWalkBadges().filter(b=>b.mo.startsWith(yr)).length)}</div>`);
}
// Once a year, from 26 December
function heroYearCheck(){const t=new Date(),y=t.getFullYear();if(t.getMonth()===11&&t.getDate()>=26&&heroP.yrSeen!==y&&(heroP.walks||[]).some(w=>w.d.startsWith(y))){heroP.yrSeen=y;save();setTimeout(()=>heroYear(y),3000);}}

// ── Share card: the route line on a dark card with the numbers ──
async function heroWalkShare(id){
  const w=(heroP.walks||[]).find(x=>x.id===id),r=heroRoutes()[id];if(!w)return;
  const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,1350);g.addColorStop(0,'#0F172A');g.addColorStop(1,'#1E1B4B');x.fillStyle=g;x.fillRect(0,0,1080,1350);
  if(r&&r.length>1){const f=heroMapFit([r],900,760);x.save();x.translate(90,90);x.lineJoin=x.lineCap='round';x.shadowColor='#F97316';x.shadowBlur=30;x.strokeStyle='#FB923C';x.lineWidth=14;x.beginPath();r.forEach((p,i)=>{const[a,b]=f.px(p);i?x.lineTo(a,b):x.moveTo(a,b);});x.stroke();
    x.shadowBlur=0;[[r[0],'#22C55E'],[r[r.length-1],'#EF4444']].forEach(([p,col])=>{const[a,b]=f.px(p);x.fillStyle=col;x.beginPath();x.arc(a,b,18,0,7);x.fill();});x.restore();}
  x.fillStyle='#fff';x.textAlign='center';x.font='bold 130px system-ui,sans-serif';x.fillText(heroKm(w.m)+' km',540,1010);
  x.font='48px system-ui,sans-serif';x.fillStyle='#CBD5E1';x.fillText(`${heroClock(w.mov*1000)} · ${heroPace(w.mov,w.m)} /km${w.climb?` · ↑${w.climb} m`:''}`,540,1090);
  const pbs=heroWalkPBs(w);if(pbs.length){x.fillStyle='#FACC15';x.font='bold 44px system-ui,sans-serif';x.fillText('🏅 '+pbs.join(' · '),540,1170);}
  x.fillStyle='#94A3B8';x.font='40px system-ui,sans-serif';x.fillText(`${esc(heroP.name||'Rayan')} · ${fmtDay(w.d)} · DayTrack`,540,1280);
  saveImage(c.toDataURL('image/jpeg',.92),`walk-${w.d}.jpg`);
}

if(typeof document!=='undefined'){document.addEventListener('DOMContentLoaded',heroDefs);document.addEventListener('DOMContentLoaded',()=>setTimeout(heroWalkResume,1500));}

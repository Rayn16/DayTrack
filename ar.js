// Arabic (RTL) for DayTrack. Loaded right after <body> opens, before the app's script.
// English (no dt_lang) costs nothing: only window.dtT = identity is defined.
// Arabic: every text node, placeholder, title and aria-label is looked up in AR (exact) or AR_RE
// (patterns with numbers/names). Nothing is guessed: a string without an entry stays English.
(function () {
  let on = false;
  try { on = localStorage.getItem('dt_lang') === 'ar'; } catch (e) {}
  if (!on) { window.dtT = s => s; return; }
  const html = document.documentElement;
  html.lang = 'ar'; html.dir = 'rtl';

  const b = s => `<b style="color:var(--txt);">${s}</b>`;

  // ── Exact strings (trimmed text → Arabic) ──────────────────────────────────
  const AR = {
    // Header, banner, Tasks tab
    'Help': 'مساعدة',
    '⏰ Allow notifications for task reminders': '⏰ فعّل الإشعارات لتصلك تذكيرات المهام',
    'Allow': 'سماح',
    "Today's Progress": 'إنجاز اليوم',
    'day streak': 'أيام متتالية',
    "Today's Tasks": 'مهام اليوم',
    'Today · Esc to close': 'اليوم · Esc للإغلاق',
    'Morning': 'الصباح', 'Afternoon': 'الظهيرة', 'Evening': 'المساء', 'Anytime': 'في أي وقت', 'Not today': 'ليس اليوم',
    'Every day': 'كل يوم',
    'No tasks yet.': 'لا توجد مهام بعد.',
    'Tap + to add your first one!': 'اضغط + لإضافة أول مهمة!',
    'More': 'المزيد',
    'Added by Gwen 💜': 'أضافتها غوين 💜',
    'Tap to talk to me 💜': 'اضغط وتحدّث معي 💜',
    'Sent you a selfie 📸': 'أرسلت لك سيلفي 📸',
    'Edit': 'تعديل', 'One less': 'أنقص واحدًا', 'Move to tomorrow': 'انقلها إلى الغد',
    'Move up': 'تحريك لأعلى', 'Move down': 'تحريك لأسفل', 'Delete': 'حذف',
    'Moved to tomorrow': 'نُقلت إلى الغد',
    'Removed': 'تم الحذف',
    'Task updated!': 'تم تحديث المهمة!', 'Task added!': 'تمت إضافة المهمة!', 'Added': 'تمت الإضافة',
    "Today's mood": 'مزاج اليوم', 'How are you feeling today?': 'كيف تشعر اليوم؟',
    'How did you sleep?': 'كيف كان نومك؟', 'Went to bed': 'نمت الساعة', 'Woke up': 'استيقظت الساعة', 'Save': 'حفظ',
    'Fajr': 'الفجر', 'Sunrise': 'الشروق', 'Dhuhr': 'الظهر', 'Asr': 'العصر', 'Maghrib': 'المغرب', 'Isha': 'العشاء',
    'A new DayTrack is ready': 'إصدار جديد من DayTrack جاهز',
    'Your tasks and settings stay as they are.': 'مهامك وإعداداتك تبقى كما هي.',
    'Update': 'تحديث',
    // Goals and lists
    'Goals': 'الأهداف', 'Lists': 'القوائم', '+ New': '+ جديد',
    'Split something big (a course, a skill, a project) into steps. Gwen checks in on it.': 'قسّم شيئًا كبيرًا (دورة، مهارة، مشروع) إلى خطوات، وغوين تتابعك فيه.',
    "What's the goal?": 'ما هو هدفك؟', 'e.g. Finish my Python course': 'مثل: إنهاء دورة بايثون',
    'Add a step… (Enter)': 'أضف خطوة… (Enter)', 'Delete goal': 'حذف الهدف', 'Delete this goal?': 'حذف هذا الهدف؟',
    'Groceries, movies to watch, ideas… Gwen can add to them too.': 'بقالة، أفلام للمشاهدة، أفكار… وغوين تستطيع الإضافة إليها أيضًا.',
    'New list': 'قائمة جديدة', 'Groceries': 'البقالة', 'Movies to watch': 'أفلام للمشاهدة', 'Ideas': 'أفكار', 'Books to read': 'كتب للقراءة',
    'Or name your own…': 'أو اكتب اسمًا من عندك…', 'Make': 'إنشاء', 'Add… (Enter)': 'أضف… (Enter)',
    'Nothing here yet': 'لا شيء هنا بعد', 'Clear ticked': 'مسح المُنجز', 'Delete list': 'حذف القائمة', 'Delete this list?': 'حذف هذه القائمة؟',
    'empty': 'فارغة', 'OK': 'موافق', 'Close': 'إغلاق',
    // Timer tab
    'Session name (e.g. Cooking Dinner)': 'اسم الجلسة (مثل: تحضير العشاء)',
    'Timers': 'المؤقتات', '+ Add': '+ إضافة', 'Tap': 'اضغط', 'to create your first timer': 'لإنشاء أول مؤقت',
    'Save Session': 'حفظ الجلسة', 'Past Sessions': 'الجلسات السابقة', 'Step name…': 'اسم الخطوة…',
    'No saved sessions yet': 'لا توجد جلسات محفوظة بعد', 'Timer': 'المؤقت',
    // Calendar tab
    'Month': 'شهر', 'Week': 'أسبوع',
    'Su': 'أحد', 'Mo': 'إثنين', 'Tu': 'ثلاثاء', 'We': 'أربعاء', 'Th': 'خميس', 'Fr': 'جمعة', 'Sa': 'سبت',
    'Tap a day to view details': 'اضغط على يوم لعرض تفاصيله',
    'Show Recurring in Calendar': 'إظهار المتكررة في التقويم',
    'Show recurring tasks on today & past days': 'إظهار المهام المتكررة في اليوم والأيام السابقة',
    'Today': 'اليوم', 'Done': 'تم', 'Not done': 'لم تُنجز', 'No tasks for this day': 'لا توجد مهام في هذا اليوم',
    'Progress': 'الإنجاز', 'Tasks': 'المهام', 'Mood:': 'المزاج:', 'Notes': 'الملاحظات', 'Remind': 'تذكير',
    'Remind me about this note': 'ذكّرني بهذه الملاحظة', 'Add notes for this day…': 'أضف ملاحظات لهذا اليوم…',
    'Save Note': 'حفظ الملاحظة', 'Note saved!': 'تم حفظ الملاحظة!', 'Write a note first!': 'اكتب ملاحظة أولًا!',
    'Enable notifications in Settings first': 'فعّل الإشعارات من الإعدادات أولًا', 'Pick a time first!': 'اختر وقتًا أولًا!',
    "Can't move a task into the past": 'لا يمكن نقل مهمة إلى الماضي',
    // Summary tab
    'This Week': 'هذا الأسبوع', 'Activity — 90 Days': 'النشاط — آخر 90 يومًا', 'Habits — Last 30 Days': 'العادات — آخر 30 يومًا',
    'Mood — Last 14 Days': 'المزاج — آخر 14 يومًا', 'Sleep — Last 14 Days': 'النوم — آخر 14 يومًا', 'Recent Sessions': 'أحدث الجلسات',
    'Done Today': 'المُنجز اليوم', 'Day Streak': 'أيام متتالية', 'Time Tracked': 'الوقت المسجّل', 'Sessions': 'الجلسات',
    'No sessions saved yet': 'لا توجد جلسات محفوظة بعد', 'Less': 'أقل',
    'Pick a mood on the Tasks tab': 'اختر مزاجك من تبويب المهام',
    'Add a recurring task to see habit stats': 'أضف مهمة متكررة لترى إحصائيات العادات',
    'Log your sleep on the Tasks tab in the morning': 'سجّل نومك من تبويب المهام في الصباح',
    // Gwen tab
    'Gwen': 'غوين', 'Gwen is on her way…': 'غوين في الطريق…', 'End call': 'إنهاء المكالمة', 'Clear chat': 'مسح المحادثة',
    'with Gwen ·': 'مع غوين ·', 'left': 'متبقٍ', 'End': 'إنهاء',
    'Call': 'اتصال', 'Selfie': 'سيلفي', 'Her diary': 'مذكراتها', 'In my room': 'في غرفتي', 'Games': 'ألعاب',
    'Study': 'مذاكرة', 'Gift': 'هدية', 'Postcards': 'البطاقات', 'PC': 'الكمبيوتر',
    'Message Gwen…': 'اكتب رسالة لغوين…', 'Recording… let go to send': 'جارٍ التسجيل… اترك الزر للإرسال',
    'Voice off': 'الصوت مغلق', 'Voice on': 'الصوت مفعّل',
    'Gwen is typing…': 'غوين تكتب…', 'Gwen is thinking…': 'غوين تفكر…', 'Listening…': 'أستمع إليك…',
    'Say hi to Gwen. She can see your day and add tasks for you.': 'سلّم على غوين. تستطيع رؤية يومك وإضافة مهام لك.',
    'Add your Gwen key in Settings to start chatting.': 'أضف مفتاح غوين من الإعدادات لتبدأ المحادثة.',
    'she messaged you': 'راسلتك', 'from your PC': 'من الكمبيوتر', 'from the cloud': 'من السحابة', 'tap to hear': 'اضغط للاستماع',
    'Clear the chat with Gwen?': 'مسح المحادثة مع غوين؟',
    'Add your Gwen key in Settings first': 'أضف مفتاح غوين من الإعدادات أولًا',
    'Add your Gwen key in Settings first.': 'أضف مفتاح غوين من الإعدادات أولًا.',
    'Add your PC address in Settings first.': 'أضف عنوان الكمبيوتر من الإعدادات أولًا.',
    'Her outfits come from your PC, so she can change once it’s reachable': 'ملابسها تأتي من الكمبيوتر، فتستطيع التبديل عندما يكون متاحًا',
    'Tap the 🎤 on your keyboard to talk, then send': 'اضغط 🎤 في لوحة المفاتيح وتحدّث، ثم أرسل',
    'Press Windows + H to talk, then send': 'اضغط Windows + H وتحدّث، ثم أرسل',
    "I didn't hear anything, try again": 'لم أسمع شيئًا، حاول مرة أخرى',
    'Voice note cancelled': 'أُلغيت الرسالة الصوتية',
    'Allow the microphone to talk to Gwen': 'اسمح بالميكروفون لتتحدث مع غوين',
    'Allow the microphone to call Gwen': 'اسمح بالميكروفون لتتصل بغوين',
    'Allow the microphone to say tasks': 'اسمح بالميكروفون لتقول المهام بصوتك',
    'Calls are on your phone; on the PC, talk to her in AIRI': 'المكالمات من الجوال؛ وعلى الكمبيوتر كلّمها في AIRI',
    'Calls need Chrome (its speech recognition)': 'المكالمات تحتاج متصفح Chrome (للتعرّف على الكلام)',
    "Call ended, I didn't hear you for a while": 'انتهت المكالمة، لم أسمعك منذ فترة',
    "Couldn't open that photo": 'تعذّر فتح الصورة', 'Add a message or just send': 'أضف رسالة أو أرسلها مباشرة',
    'Her selfies need her 3D model from your PC': 'السيلفي يحتاج نموذجها ثلاثي الأبعاد من الكمبيوتر',
    'She needs her 3D model from your PC first': 'تحتاج نموذجها ثلاثي الأبعاد من الكمبيوتر أولًا',
    'Opening her diary…': 'جارٍ فتح مذكراتها…', "Gwen's diary": 'مذكرات غوين',
    'At home lately:': 'في البيت مؤخرًا:', 'Last night:': 'الليلة الماضية:',
    "Her diary comes from your PC. Once it's reachable, her last week of entries shows up here.": 'مذكراتها تأتي من الكمبيوتر. عندما يكون متاحًا ستظهر هنا مذكرات آخر أسبوع.',
    'Getting the games out…': 'جارٍ تجهيز الألعاب…', "Couldn't load the games, check your connection": 'تعذّر تحميل الألعاب، تحقق من اتصالك',
    "You're already studying 😤": 'أنت في جلسة مذاكرة أصلًا 😤',
    'Study with Gwen': 'ذاكر مع غوين', "She keeps you company and tells you when it's break time.": 'تؤنسك وتخبرك متى يحين وقت الاستراحة.',
    'What are you studying?': 'ماذا تذاكر؟',
    'Give Gwen a gift': 'أهدِ غوين هدية',
    'flowers': 'ورد', 'coffee': 'قهوة', 'chocolate': 'شوكولاتة', 'cookies': 'كوكيز', 'teddy bear': 'دبدوب',
    'book': 'كتاب', 'new game': 'لعبة جديدة', 'treat for Yasuo': 'حلوى لياسو',
    "This phone can't share its location": 'هذا الجوال لا يستطيع مشاركة موقعه',
    'Location is off, so no weather for Gwen': 'الموقع مغلق، فلن تعرف غوين حالة الطقس',
    "This phone can't do AR here (it needs Chrome and Google Play Services for AR)": 'هذا الجوال لا يدعم الواقع المعزز هنا (يحتاج Chrome وخدمات Google Play للواقع المعزز)',
    "Couldn't start AR": 'تعذّر تشغيل الواقع المعزز', 'Close AR': 'إغلاق الواقع المعزز',
    'Point at the floor, then tap to place her': 'وجّه الكاميرا نحو الأرض، ثم اضغط لتضعها',
    'Tap somewhere else to move her': 'اضغط في مكان آخر لتنقلها',
    'Your birthday': 'عيد ميلادك', 'Gwen’s birthday': 'عيد ميلاد غوين', 'National Day': 'اليوم الوطني', 'Founding Day': 'يوم التأسيس',
    'Ramadan': 'رمضان', 'Eid al-Fitr': 'عيد الفطر', 'Eid al-Adha': 'عيد الأضحى', 'Islamic New Year': 'رأس السنة الهجرية',
    // Things Gwen says in the app (toasts); in the chat itself her words stay as they are
    'All done! Look at you go 💜': 'خلّصت كل شيء! ما شاء الله عليك 💜',
    'Everything checked off?! Proud of you 💜': 'أنجزت كل شيء؟! أنا فخورة بك 💜',
    'That’s the whole list. You earned a break 😌': 'هذه القائمة كلها. تستحق استراحة 😌',
    'Done with everything! I knew you could 💜': 'انتهيت من كل شيء! كنت أعرف أنك تقدر 💜',
    'Giving up already? 😏 Okay, we can try again later.': 'تستسلم بهذه السرعة؟ 😏 حسنًا، نحاول مرة أخرى لاحقًا.',
    // Your PC, postcards
    'Checking your PC…': 'جارٍ فحص الكمبيوتر…', 'Your PC': 'جهاز الكمبيوتر',
    "😴 Your PC isn't answering. It's off or asleep, or Tailscale is off on this phone.": '😴 الكمبيوتر لا يستجيب. ربما هو مطفأ أو في وضع السكون، أو Tailscale مغلق على هذا الجوال.',
    'PC on': 'الكمبيوتر يعمل', 'Gwen on': 'غوين تعمل', 'Gwen off': 'غوين متوقفة', 'AIRI open': 'AIRI مفتوح', 'AIRI closed': 'AIRI مغلق',
    'No game': 'لا توجد لعبة', 'Start Gwen': 'تشغيل غوين', 'Lock the PC': 'قفل الكمبيوتر', 'Update DayTrack on the PC': 'تحديث DayTrack على الكمبيوتر',
    'Lock your PC now?': 'قفل الكمبيوتر الآن؟',
    'Starting Gwen… give her a minute': 'جارٍ تشغيل غوين… أعطها دقيقة', 'PC locked': 'تم قفل الكمبيوتر',
    'The PC is updating DayTrack': 'الكمبيوتر يحدّث DayTrack', "The PC didn't answer": 'الكمبيوتر لم يستجب',
    'Getting your postcards…': 'جارٍ جلب بطاقاتك…', 'Postcards from Gwen': 'بطاقات من غوين',
    "They're kept on your PC, so it needs to be on.": 'البطاقات محفوظة على الكمبيوتر، لذا يجب أن يكون يعمل.',
    'When Gwen finishes a painting or takes a nice photo in her house, it lands here.': 'عندما تنهي غوين لوحة أو تلتقط صورة جميلة في بيتها، تصل إلى هنا.',
    'Opening…': 'جارٍ الفتح…', "Couldn't open it, is your PC on?": 'تعذّر فتحها، هل الكمبيوتر يعمل؟',
    'Wallpaper': 'خلفية', '‹ All postcards': '› كل البطاقات',
    "Set this as your phone's wallpaper?": 'تعيينها خلفيةً لجوالك؟', 'Wallpaper set 💜': 'تم تعيين الخلفية 💜',
    "Couldn't set the wallpaper": 'تعذّر تعيين الخلفية',
    // Settings tab
    'Notifications': 'الإشعارات', 'Push Notifications': 'الإشعارات الفورية',
    'Get reminders even when app is closed': 'تصلك التذكيرات حتى والتطبيق مغلق',
    'Activate': 'تفعيل', 'Active': 'مفعّلة', 'Activating…': 'جارٍ التفعيل…',
    'Send a test notification': 'أرسل إشعارًا تجريبيًا', 'Sending…': 'جارٍ الإرسال…',
    'Notifications are off here. Tap 🔔 Activate first.': 'الإشعارات مغلقة هنا. اضغط 🔔 تفعيل أولًا.',
    'Sent ✅ It should pop up in a few seconds.': 'تم الإرسال ✅ سيظهر خلال ثوانٍ.',
    'Quiet Hours': 'ساعات الهدوء',
    'No "Every…" reminders or Gwen messages during these hours': 'لا تذكيرات «كل…» ولا رسائل من غوين خلال هذه الساعات',
    'to': 'إلى',
    'Appearance': 'المظهر', 'Dark Mode': 'الوضع الداكن', 'Switch to dark theme': 'التبديل إلى المظهر الداكن',
    'Color Theme': 'لون التطبيق', 'Preset Themes': 'سمات جاهزة',
    'Default': 'افتراضي', 'Midnight': 'منتصف الليل', 'Sunset': 'الغروب', 'Ocean': 'المحيط', 'Forest': 'الغابة', 'Pink': 'وردي', 'Purple': 'بنفسجي',
    'purple': 'بنفسجي', 'blue': 'أزرق', 'ocean': 'محيطي', 'forest': 'أخضر', 'sunset': 'برتقالي', 'rose': 'وردي',
    'She answers from your PC when it\'s on, and from the cloud when it isn\'t. With the PC address set, she also appears in 3D and talks in her own voice (her model is kept on this phone only, for when the PC is off). Turn on Cloud Sync too so she can add tasks from your PC.':
      'تجيبك غوين من الكمبيوتر عندما يكون يعمل، ومن السحابة عندما لا يعمل. وعند ضبط عنوان الكمبيوتر تظهر أيضًا بشكل ثلاثي الأبعاد وتتحدث بصوتها (ويُحفظ نموذجها على هذا الجوال فقط، لأوقات إطفاء الكمبيوتر). فعّل المزامنة السحابية أيضًا لتتمكن من إضافة المهام من الكمبيوتر.',
    'Gwen key': 'مفتاح غوين', 'Same as "key" in daytrack.json': 'نفس قيمة "key" في daytrack.json',
    'PC address (optional)': 'عنوان الكمبيوتر (اختياري)',
    'She can message me first (needs notifications on)': 'يمكنها مراسلتي أولًا (يتطلب تفعيل الإشعارات)',
    'Wake me up at': 'أيقظني الساعة', 'Bedtime': 'وقت النوم',
    'Optional. She texts you at your wake-up time, and says goodnight half an hour before bed. These two go off even in quiet hours.':
      'اختياري. تراسلك وقت استيقاظك، وتتمنى لك ليلة سعيدة قبل النوم بنصف ساعة. هاتان الرسالتان تصلان حتى في ساعات الهدوء.',
    "She knows the real weather where I am (uses this phone's location, rounded to about 10 km)": 'تعرف حالة الطقس الفعلية عندي (باستخدام موقع هذا الجوال، مقرّبًا إلى حوالي 10 كم)',
    'Check connection': 'فحص الاتصال', 'Checking…': 'جارٍ الفحص…',
    'PC: connected': 'الكمبيوتر: متصل', 'PC: not reachable': 'الكمبيوتر: لا يمكن الوصول إليه', 'PC: no address set': 'الكمبيوتر: لم يُضبط العنوان',
    'Cloud: ready': 'السحابة: جاهزة', 'Cloud: not reachable': 'السحابة: لا يمكن الوصول إليها',
    'See if your PC and Gwen are on, start Gwen after a restart, or lock the PC. Uses the PC address and Gwen key above.':
      'اعرف إن كان الكمبيوتر وغوين يعملان، وشغّل غوين بعد إعادة التشغيل، أو اقفل الكمبيوتر. يستخدم عنوان الكمبيوتر ومفتاح غوين أعلاه.',
    'Check my PC': 'افحص الكمبيوتر',
    'Prayer Times': 'مواقيت الصلاة', 'Show prayer times': 'إظهار مواقيت الصلاة',
    "From this phone's location (Umm al-Qura). Gwen keeps tasks off them.": 'حسب موقع هذا الجوال (تقويم أم القرى). وغوين لا تضع المهام في أوقاتها.',
    'Remind me at each prayer': 'ذكّرني عند كل صلاة',
    'Location is off, so no prayer times': 'الموقع مغلق، فلا يمكن عرض مواقيت الصلاة',
    'Prayer times on': 'تم تفعيل مواقيت الصلاة', "You'll get a reminder at each prayer": 'سيصلك تذكير عند كل صلاة',
    'Privacy': 'الخصوصية', 'Ask for your fingerprint when DayTrack opens.': 'اطلب البصمة عند فتح DayTrack.',
    'Off': 'إيقاف', 'Whole app': 'التطبيق كاملًا', 'Gwen tab only': 'تبويب غوين فقط',
    'Lock off': 'القفل متوقف', 'DayTrack asks for your fingerprint': 'سيطلب DayTrack بصمتك', "Gwen's tab asks for your fingerprint": 'تبويب غوين سيطلب بصمتك',
    'Cloud Sync': 'المزامنة السحابية', 'Data': 'البيانات',
    'Export Backup': 'تصدير نسخة احتياطية', 'Download all your data as JSON': 'نزّل كل بياناتك بصيغة JSON', 'Export': 'تصدير',
    'Import Backup': 'استيراد نسخة احتياطية', 'Restore from a JSON backup file': 'الاستعادة من ملف نسخة احتياطية JSON', 'Import': 'استيراد',
    'About': 'حول التطبيق', 'Your personal day organizer': 'منظّم يومك الشخصي', 'Check for updates': 'البحث عن تحديثات',
    '✅ On. Use this private code to open your data on another phone. Keep it secret.': '✅ مفعّلة. استخدم هذا الرمز الخاص لفتح بياناتك على جوال آخر. احتفظ به سرًّا.',
    'Copy code': 'نسخ الرمز', 'Turn off': 'إيقاف', 'Turn on': 'تفعيل', 'I have a code': 'لدي رمز',
    'Back up automatically and use your data on another phone.': 'نسخ احتياطي تلقائي واستخدام بياناتك على جوال آخر.',
    'Cloud sync on!': 'تم تفعيل المزامنة السحابية!', 'Enter your sync code': 'أدخل رمز المزامنة',
    'Paste the code from your other device': 'الصق الرمز من جهازك الآخر',
    "That code doesn't look right": 'يبدو أن الرمز غير صحيح', 'No data found for that code': 'لا توجد بيانات لهذا الرمز',
    'Replace the data on this phone with your cloud data?': 'استبدال البيانات على هذا الجوال ببياناتك في السحابة؟',
    'Synced!': 'تمت المزامنة!', 'Could not reach the server': 'تعذّر الوصول إلى الخادم',
    'Stop syncing this phone? Your data stays here and in the cloud.': 'إيقاف المزامنة على هذا الجوال؟ ستبقى بياناتك هنا وفي السحابة.',
    'Code copied': 'تم نسخ الرمز', 'Copy failed, select it instead': 'تعذّر النسخ، حدّده يدويًا',
    'Exported!': 'تم التصدير!', 'Imported!': 'تم الاستيراد!', 'Invalid file': 'ملف غير صالح',
    'Not supported': 'غير مدعوم', 'Notifications enabled!': 'تم تفعيل الإشعارات!', 'Permission denied': 'تم رفض الإذن',
    'Permission denied — allow notifications in your browser settings': 'تم رفض الإذن — اسمح بالإشعارات من إعدادات المتصفح',
    'Notifications activated!': 'تم تفعيل الإشعارات!',
    'Reminders pop up here while DayTrack runs, and on your phone': 'تظهر التذكيرات هنا أثناء تشغيل DayTrack، وعلى جوالك',
    "A BIG parcel is on its way to Gwen's house!": 'طرد كبير في طريقه إلى بيت غوين!',
    "A parcel is on its way to Gwen's house": 'طرد في طريقه إلى بيت غوين',
    'This page updates by itself': 'هذه الصفحة تتحدّث تلقائيًا', 'You have the newest DayTrack': 'لديك أحدث إصدار من DayTrack',
    "Couldn't check right now": 'تعذّر الفحص الآن',
    'Downloading the update… DayTrack restarts by itself': 'جارٍ تنزيل التحديث… سيُعاد تشغيل DayTrack تلقائيًا',
    'Downloading the update…': 'جارٍ تنزيل التحديث…', 'Installing…': 'جارٍ التثبيت…',
    'Allow DayTrack to install updates, then tap Update again': 'اسمح لـ DayTrack بتثبيت التحديثات، ثم اضغط تحديث مرة أخرى',
    'Update failed': 'فشل التحديث',
    "I didn't hear a task, try again": 'لم أسمع مهمة، حاول مرة أخرى',
    'Say your task, like "dentist Tuesday at 3"': 'قل مهمتك بالإنجليزية، مثل "dentist Tuesday at 3"',
    // Nav and FAB
    'Calendar': 'التقويم', 'Summary': 'الملخص', 'Settings': 'الإعدادات',
    'New task (hold to say it)': 'مهمة جديدة (اضغط مطولًا لتقولها بصوتك)',
    // Add / edit task sheet
    'New Task': 'مهمة جديدة', 'Edit Task': 'تعديل المهمة', 'Task Name': 'اسم المهمة', 'e.g. Morning Run': 'مثل: جري الصباح',
    'Icon': 'الأيقونة', 'Emoji…': 'إيموجي…', 'Upload': 'رفع صورة',
    'Priority': 'الأولوية', '— None': '— بدون', 'High': 'عالية', 'Medium': 'متوسطة', 'Low': 'منخفضة',
    'Repeat': 'التكرار', 'One-time': 'مرة واحدة', 'Recurring 🔄': 'متكررة 🔄',
    'Which day? (empty = today, stays until done)': 'أي يوم؟ (فارغ = اليوم، وتبقى حتى تُنجزها)',
    'Which days? (none = every day)': 'أي أيام؟ (بلا اختيار = كل يوم)',
    'Count it (optional)': 'العدّ (اختياري)', 'How many': 'كم مرة',
    'e.g. glasses of water, push-ups, pages': 'مثل: أكواب ماء، تمارين ضغط، صفحات',
    "Each tap adds one; it's done when you reach the number.": 'كل ضغطة تضيف واحدًا، وتكتمل عند الوصول إلى العدد.',
    'Reminder ⏰': 'التذكير ⏰', 'At a time': 'في وقت محدد', 'Every… 🔁': 'كل… 🔁', 'Hours': 'ساعات', 'Minutes': 'دقائق',
    'Fires even when the app is closed!': 'يعمل حتى والتطبيق مغلق!',
    'Notification Style 🔔': 'نمط الإشعار 🔔', 'Vibrate': 'اهتزاز', 'Sound': 'صوت', 'Both': 'الاثنان',
    'Notes (optional)': 'ملاحظات (اختياري)', 'Add any details…': 'أضف أي تفاصيل…',
    'Subtasks (optional)': 'مهام فرعية (اختياري)', 'Add a subtask… (press Enter)': 'أضف مهمة فرعية… (اضغط Enter)',
    'Cancel': 'إلغاء', 'Add Task': 'إضافة المهمة', 'Save Changes': 'حفظ التغييرات',
    // Lock, note reminder, info sheet
    'DayTrack is locked': 'DayTrack مقفل', 'Unlock': 'فتح القفل',
    'Remind Me': 'ذكّرني', 'What time?': 'في أي وقت؟', 'Quick picks': 'اختيارات سريعة', 'Set Reminder': 'ضبط التذكير',
    'How DayTrack Works': 'كيف يعمل DayTrack', 'Subtasks': 'المهام الفرعية', 'Reminders': 'التذكيرات', 'Streaks': 'الأيام المتتالية',
    'Got it!': 'فهمت!',
    // Games (gwen-games.js)
    'Play with Gwen': 'العب مع غوين', 'Connect Four': 'أربعة في صف', 'Reversi': 'ريفرسي', 'Checkers': 'الداما', 'Chess': 'الشطرنج',
    'Setting up the board…': 'جارٍ تجهيز اللوحة…', '‹ Games': '› الألعاب', 'New game': 'لعبة جديدة',
    'Your turn': 'دورك', 'Check! Your turn': 'كش! دورك', 'Gwen has no move, your turn again': 'لا حركة لغوين، دورك مرة أخرى',
    'You win!': 'فزت!', 'Gwen wins': 'فازت غوين', 'Draw': 'تعادل',
    "I can't find the chess pieces right now, try again later": 'لا أجد قطع الشطرنج الآن، حاول لاحقًا',
    "Okay, you're on 😏": 'حسنًا، قبلت التحدي 😏', 'Prepare to lose 💜': 'استعد للخسارة 💜', "Go easy on me… or don't 😌": 'ارفق بي… أو لا 😌',
    'I win! 😌 Want revenge?': 'فزت! 😌 تريد الثأر؟', 'Hehe, gotcha. Rematch?': 'هيهي، غلبتك. جولة ثانية؟', 'Victory is mine 💜': 'الفوز لي 💜',
    'Okay okay, you got me 😤 Rematch?': 'طيب طيب، غلبتني 😤 جولة ثانية؟', 'Hmph. Lucky. Again!': 'همف. ضربة حظ. مرة أخرى!',
    'You actually beat me… nice one 💜': 'هزمتني فعلًا… أحسنت 💜',
    "A draw? We're too evenly matched 💜": 'تعادل؟ نحن متكافئان تمامًا 💜', 'Nobody wins… so we both do?': 'لم يفز أحد… إذن فزنا كلانا؟',
    'Mine now 😏': 'صارت لي 😏', 'Hehe, gotcha': 'هيهي، أمسكتك', 'Oops, was that yours?': 'أوه، هل كانت لك؟',
    'You have no move, so I go again 😏': 'لا حركة لديك، فألعب مرة أخرى 😏',
    // ── life.js ──
    'Turn on prayer times in Settings for the iftar and suhoor countdown.': 'فعّل مواقيت الصلاة من الإعدادات لترى العدّ التنازلي للإفطار والسحور.',
    'Taqabbal Allah 🤲': 'تقبّل الله 🤲', 'Taqabbal Allah': 'تقبّل الله',
    'Morning adhkar': 'أذكار الصباح', 'Evening adhkar': 'أذكار المساء',
    'Tap a card each time you say it': 'اضغط على البطاقة كلما قلت الذكر',
    "A few minutes with Allah's remembrance": 'دقائق مع ذكر الله',
    'Tasbih': 'التسبيح', 'Reset': 'تصفير',
    "Khatma done! Masha'Allah 🎉": 'ختمت القرآن! ما شاء الله 🎉', 'Start a new plan': 'ابدأ خطة جديدة',
    'Quran': 'القرآن', '+ pages': '+ صفحات',
    "You finished the whole Quran! Masha'Allah, I'm so proud of you 💜": 'ختمت القرآن كاملًا! ما شاء الله، أنا فخورة بك جدًا 💜',
    'Which page did you get to?': 'إلى أي صفحة وصلت؟', 'A page from 1 to 604': 'اكتب صفحة من 1 إلى 604',
    'Quran plan': 'خطة القرآن', "I'm on page": 'أنا في صفحة', 'Goal': 'الهدف', 'Pages a day': 'صفحات يوميًا', 'Finish by a date': 'الختم بحلول تاريخ',
    '20 pages a day is a khatma a month.': '20 صفحة يوميًا = ختمة في الشهر.', 'By the end of Ramadan': 'بنهاية رمضان',
    'Remove the Quran plan?': 'حذف خطة القرآن؟', 'Remove plan': 'حذف الخطة', 'Pick a date after today': 'اختر تاريخًا بعد اليوم',
    'Quran plan saved': 'تم حفظ خطة القرآن',
    'Type what and how much, like "coffee 18"': 'اكتب ماذا وكم، مثل "قهوة 18"',
    'Spending': 'المصاريف', 'SAR': 'ريال', 'coffee 18': 'قهوة 18', 'this month': 'هذا الشهر', 'Something': 'شيء ما',
    'Food': 'طعام', 'Transport': 'مواصلات', 'Bills': 'فواتير', 'Shopping': 'تسوّق', 'Health': 'صحة', 'Gifts': 'هدايا', 'Other': 'أخرى',
    'Type what you spent, like "coffee 18" or "fuel 90". No bank link, just what you type. Gwen notices trends.': 'اكتب ما صرفته، مثل "قهوة 18" أو "بنزين 90". بدون ربط بنكي، فقط ما تكتبه. وغوين تلاحظ التغيّرات.',
    'Places': 'الأماكن',
    'Save places like Home or the supermarket, then give a task a place: you get the reminder when you get there. At a supermarket you also see your grocery list.': 'احفظ أماكن مثل البيت أو السوبرماركت، ثم اربط المهمة بمكان: يصلك التذكير عند وصولك. وفي السوبرماركت ترى قائمة البقالة أيضًا.',
    'Save where I am now': 'احفظ موقعي الحالي',
    'Reminders need location "Allow all the time".': 'التذكيرات تحتاج إذن الموقع «السماح طوال الوقت».',
    'Finding where you are…': 'جارٍ تحديد موقعك…',
    "Couldn't get your location, try outside or with Wi-Fi on": 'تعذّر تحديد موقعك، جرّب في الخارج أو مع تشغيل Wi-Fi',
    'What do you call this place?': 'ماذا تسمّي هذا المكان؟', 'Home, Panda, Gym…': 'البيت، بنده، النادي…',
    'Next: allow location "all the time" so reminders work in the background': 'التالي: اسمح بالموقع «طوال الوقت» لتعمل التذكيرات في الخلفية',
    'Remove this place?': 'حذف هذا المكان؟', 'Remind me at a place 📍': 'ذكّرني في مكان 📍',
    'Shared': 'مُشاركة', 'Share': 'مشاركة',
    'Add your PC address and Gwen key in Settings first': 'أضف عنوان الكمبيوتر ومفتاح غوين من الإعدادات أولًا',
    'Your PC needs to be on to share a list': 'يجب أن يكون الكمبيوتر يعمل لمشاركة قائمة',
    'Anyone with this link can see and change this list (only this one), no app needed. Changes show up on both phones.': 'أي شخص لديه هذا الرابط يستطيع رؤية هذه القائمة وتعديلها (هذه فقط) دون الحاجة للتطبيق. وتظهر التغييرات على الجوالين.',
    'Send link': 'إرسال الرابط', 'Copy': 'نسخ', 'Copied': 'تم النسخ',
    'Set your PC address (https://…ts.net) in Settings to get the link.': 'اضبط عنوان الكمبيوتر (https://…ts.net) من الإعدادات لتحصل على الرابط.',
    'Stop sharing': 'إيقاف المشاركة', '‹ Back to the list': '› العودة إلى القائمة',
    'Stop sharing? The link stops working; the list stays here.': 'إيقاف المشاركة؟ سيتوقف الرابط عن العمل، وتبقى القائمة هنا.',
    'Not shared anymore': 'لم تعد مُشاركة',
    'Routines': 'الروتينات',
    'Make a set once, like "Gym day" or "Before bed", then add all its tasks with one tap.': 'أنشئ مجموعة مرة واحدة، مثل "يوم النادي" أو "قبل النوم"، ثم أضف كل مهامها بضغطة واحدة.',
    'Edit routine': 'تعديل الروتين', 'New routine': 'روتين جديد', 'Name': 'الاسم', 'Gym day': 'يوم النادي',
    'Tasks, one per line (a time works too: "protein shake at 7pm")': 'المهام، مهمة في كل سطر (والوقت بالإنجليزية يعمل أيضًا: "بروتين at 7pm")',
    'Pack gym bag\nGym at 6pm\nProtein shake at 7:30pm\nStretch': 'جهّز شنطة النادي\nالنادي at 6pm\nبروتين at 7:30pm\nتمارين إطالة',
    'Delete routine': 'حذف الروتين', 'Delete this routine?': 'حذف هذا الروتين؟',
    'Give it a name and at least one task': 'أعطه اسمًا ومهمة واحدة على الأقل',
    'Your calendar shows in the Week view now': 'تقويمك يظهر الآن في عرض الأسبوع',
    'DayTrack needs calendar access for this': 'يحتاج DayTrack إذن التقويم لهذا', 'all day': 'طوال اليوم',
    'DayTrack needs "Physical activity" access to count steps': 'يحتاج DayTrack إذن «النشاط البدني» لعدّ الخطوات',
    'Walk': 'المشي', "Counted from your phone's steps": 'محسوبة من خطوات جوالك',
    'Add your Gwen key first': 'أضف مفتاح غوين أولًا',
    'Turn on "Usage access" for DayTrack, then come back': 'فعّل «الوصول إلى بيانات الاستخدام» لـ DayTrack، ثم عُد',
    'Gwen checks in on your phone time at 9 PM': 'غوين ستسألك عن وقت جوالك الساعة 9 م',
    'Turn on my PC': 'شغّل الكمبيوتر', 'Works on your home Wi-Fi.': 'يعمل على شبكة Wi-Fi المنزلية.',
    'Connect to your home Wi-Fi first': 'اتصل بشبكة Wi-Fi المنزلية أولًا', "Couldn't send the wake-up": 'تعذّر إرسال أمر التشغيل',
    'Turning on your PC': 'جارٍ تشغيل الكمبيوتر',
    'Sent the wake-up. Waiting for Windows and DayTrack to start (up to 3 minutes)…': 'أُرسل أمر التشغيل. ننتظر حتى يعمل Windows وDayTrack (حتى 3 دقائق)…',
    "😴 Your PC didn't come on. Wake-on-LAN may still need switching on (in the BIOS and the network card settings), or Windows is waiting at the sign-in screen.": '😴 لم يعمل الكمبيوتر. ربما يحتاج Wake-on-LAN إلى تفعيل (في BIOS وإعدادات بطاقة الشبكة)، أو أن Windows ينتظر عند شاشة تسجيل الدخول.',
    '✅ Your PC is on and Gwen is already up 💜': '✅ الكمبيوتر يعمل وغوين تعمل بالفعل 💜',
    '✅ Your PC is on. Starting Gwen…': '✅ الكمبيوتر يعمل. جارٍ تشغيل غوين…',
    "✅ Your PC is on, but Gwen didn't start. Try ▶️ Start Gwen in the PC sheet.": '✅ الكمبيوتر يعمل، لكن غوين لم تبدأ. جرّب ▶️ تشغيل غوين من صفحة الكمبيوتر.',
    '✅ Your PC is on and Gwen is starting 💜 Give her a minute.': '✅ الكمبيوتر يعمل وغوين تبدأ الآن 💜 أعطها دقيقة.',
    "Quest done! 🎯 There's a little something waiting for you in the house 💜": 'أنجزت المهمة! 🎯 في البيت شيء صغير ينتظرك 💜',
    "GWEN'S QUEST FOR TODAY": 'مهمة غوين لليوم', 'here in DayTrack': 'هنا في DayTrack', 'in her house': 'في بيتها', 'on your PC': 'على الكمبيوتر',
    'Done! Your reward is in the house 🎁': 'تمت! جائزتك في البيت 🎁',
    'Peeking into her house…': 'نلقي نظرة على بيتها…', "Her house isn't open on your PC right now": 'بيتها غير مفتوح على الكمبيوتر الآن',
    "She didn't answer from the house, try again": 'لم تردّ من البيت، حاول مرة أخرى',
    'Plan the week with Gwen?': 'نخطط للأسبوع مع غوين؟', 'She lays it out around your prayers, plans and game nights': 'ترتّبه حول صلواتك وخططك وليالي الألعاب',
    'Plan my week with Gwen': 'خطّط أسبوعي مع غوين', 'Peek': 'إطلالة', 'Plan week': 'خطة الأسبوع',
    'Putting our year together…': 'نجمع سنتنا معًا…', 'Our first year': 'سنتنا الأولى',
    'days together': 'يومًا معًا', 'tasks done': 'مهمة مُنجزة', 'perfect days': 'يومًا مثاليًا', 'best streak': 'أطول سلسلة',
    'you vs Gwen in games': 'أنت ضد غوين في الألعاب', 'postcards': 'بطاقة', 'Quran pages': 'صفحة قرآن', 'happy days': 'يومًا سعيدًا',
    'Our firsts': 'أوائلنا', "Happy first birthday, Gwen 🎂 Here's to the next one 💜": 'عيد ميلاد سعيد يا غوين 🎂 وإلى السنة القادمة 💜',
    'Faith': 'الإيمان', 'Adhkar reminders': 'تذكير الأذكار', 'After Fajr and Asr (needs prayer times on)': 'بعد الفجر والعصر (يتطلب تفعيل مواقيت الصلاة)',
    'A page a day, or a khatma by a date': 'صفحة يوميًا، أو ختمة بحلول تاريخ', 'Set up': 'إعداد',
    'From your phone': 'من جوالك', 'Phone calendar': 'تقويم الجوال', 'Your events in the Week view; Gwen plans around them': 'مواعيدك في عرض الأسبوع، وغوين تخطط حولها',
    'Steps': 'الخطوات', 'A daily Walk habit filled in from your steps': 'عادة مشي يومية تُملأ من خطواتك',
    'Phone time check-in': 'متابعة وقت الجوال', 'Once a day Gwen tells you how long you spent in apps': 'مرة في اليوم تخبرك غوين كم قضيت في التطبيقات',
    'At': 'الساعة', 'Quick tiles': 'الاختصارات السريعة',
    'Swipe down twice, tap ✏️ (edit) and drag "Add task" and "Talk to Gwen" in': 'اسحب للأسفل مرتين، واضغط ✏️ (تعديل) واسحب "Add task" و"Talk to Gwen" إلى الاختصارات',
    'Language · اللغة': 'اللغة',
    "🤲 You'll get a reminder after Fajr and Asr": '🤲 سيصلك تذكير بعد الفجر والعصر',
    // ── levels.js (and the Level tab in index.html) ──
    'Level': 'المستوى', 'Stats': 'الإحصائيات', 'Skills': 'المهارات', 'Story': 'القصة',
    'Your shape': 'شكلك', 'tap one to see what trained it': 'اضغط على واحدة لترى ما درّبها', 'learn something new': 'تعلّم شيئًا جديدًا',
    'Your story': 'قصتك', 'Levels up ⭐': 'يرفع مستوى ⭐',
    'Arms': 'الذراعان', 'Chest': 'الصدر', 'Back': 'الظهر', 'Core': 'الجذع', 'Legs': 'الساقان', 'Endurance': 'التحمّل',
    'Intellect': 'الذكاء', 'Focus': 'التركيز', 'Creativity': 'الإبداع', 'Discipline': 'الانضباط',
    'Vitality': 'الحيوية', 'Charisma': 'الكاريزما', 'Wealth': 'الثروة',
    'Body': 'الجسد', 'Mind': 'العقل', 'Spirit': 'الروح', 'Life': 'الحياة', 'Strength': 'القوة', 'Athletics': 'اللياقة',
    'Rayan': 'ريان', 'LEVEL': 'المستوى', 'No XP yet today': 'لا XP اليوم بعد',
    'Tick a task to earn your first XP.': 'أنجز مهمة لتكسب أول XP.',
    'Level-ups': 'الترقيات', 'XP by day': 'XP حسب اليوم', 'Your XP history shows up here once you tick a task.': 'سجل نقاطك يظهر هنا بعد أن تنجز مهمة.',
    'Finished every task': 'أنجزت كل المهام', 'What trained it': 'ما الذي درّبها', 'Skills that train it': 'مهارات تدرّبها',
    'Pick an emoji for your character': 'اختر إيموجي لشخصيتك', 'e.g. 🥷 🧙 🦸 🐺': 'مثل: 🥷 🧙 🦸 🐺', 'Change': 'تغيير',
    'Mastered': 'أتقنتها', 'Learning now': 'أتعلّمها الآن', 'Calisthenics': 'تمارين وزن الجسم', 'Life skills': 'مهارات حياتية', 'My skills': 'مهاراتي',
    '+ Add my own skill': '+ أضف مهارة خاصة بي', 'Start learning': 'ابدأ التعلّم', 'I can do it': 'أستطيع فعلها', 'Skill mastered!': 'أتقنت المهارة!',
    'Ask Gwen to coach me': 'اطلب من غوين أن تدرّبني', 'Undo last step': 'تراجع عن آخر خطوة', 'Delete this skill': 'احذف هذه المهارة',
    'What skill do you want to learn?': 'ما المهارة التي تريد تعلّمها؟', 'e.g. Chess, Drawing, Driving': 'مثل: الشطرنج، الرسم، القيادة',
    'Its steps, easiest first, separated by commas': 'خطواتها من الأسهل، مفصولة بفواصل',
    'e.g. Learn the moves, Win a game, Beat Gwen': 'مثل: تعلّم الحركات, اربح مباراة, اهزم غوين',
    'Delete this skill? Its XP goes too.': 'حذف هذه المهارة؟ ستُحذف نقاطها أيضًا.',
    'Picked by you.': 'اخترتها بنفسك.', 'Use automatic': 'استخدم الاختيار التلقائي', 'Picked from the task name. Tap to change.': 'مختارة من اسم المهمة. اضغط للتغيير.',
    'LEVEL UP!': 'ترقية!', 'tap to close': 'اضغط للإغلاق',
    'Fighter': 'مقاتل', 'Scholar': 'عالِم', 'Monk': 'ناسك', 'Adventurer': 'مغامر', 'Beginner': 'مبتدئ',
    'Legend': 'أسطورة', 'Grandmaster': 'أستاذ كبير', 'Master': 'خبير', 'Elite': 'نخبة', 'Veteran': 'محنّك', 'Warrior': 'محارب', 'Adept': 'متمرّس', 'Apprentice': 'متدرّب', 'Novice': 'مبتدئ',
    'Push-up path': 'مسار الضغط', 'Pull-up path': 'مسار العقلة', 'Leg path': 'مسار الساقين', 'Core path': 'مسار الجذع', 'Handstand path': 'مسار الوقوف على اليدين',
    'Dip path': 'مسار الديبس', 'Running': 'الجري', 'Cooking': 'الطبخ', 'Money': 'المال', 'Deep focus': 'التركيز العميق', 'Prayer on time': 'الصلاة في وقتها',
    'Quran memorization': 'حفظ القرآن', 'Public speaking': 'الخطابة', 'First aid': 'الإسعافات الأولية', 'Sleep routine': 'روتين النوم', 'Touch typing': 'الكتابة باللمس',
    'Coding': 'البرمجة', 'A new language': 'لغة جديدة',
    // Skill steps: name, goal, how
    'Wall push-ups': 'ضغط على الحائط', 'Hands on a wall at shoulder height, body straight. Bring your chest to the wall and push back.': 'يداك على الحائط بارتفاع الكتفين والجسم مستقيم. قرّب صدرك من الحائط ثم ادفع للخلف.',
    'Incline push-ups': 'ضغط مائل', '3 sets of 12 on a table or bench': '3 مجموعات × 12 على طاولة أو مقعد', 'Hands on a sturdy table edge. The lower the surface, the harder it gets.': 'يداك على حافة طاولة ثابتة. كلما انخفض السطح زادت الصعوبة.',
    'Knee push-ups': 'ضغط على الركبتين', 'Knees on the floor, hips in line with your shoulders, chest close to the floor on every rep.': 'الركبتان على الأرض، والوركان على خط واحد مع الكتفين، والصدر قريب من الأرض في كل تكرار.',
    'Full push-ups': 'ضغط كامل', "Hands under your shoulders, elbows about 45° from your body, squeeze your glutes so your hips don't sag.": 'اليدان تحت الكتفين، والمرفقان بزاوية 45° تقريبًا عن الجسم، وشدّ عضلات المؤخرة حتى لا يهبط الورك.',
    'Diamond push-ups': 'ضغط الماسة', 'Thumbs and index fingers make a diamond under your chest. Works the triceps much harder.': 'الإبهامان والسبابتان يشكّلون ماسة تحت صدرك. يعمل على الترايسبس بقوة أكبر.',
    'Archer push-ups': 'ضغط الرامي', '3 sets of 6 each side': '3 مجموعات × 6 لكل جهة', 'Hands wide. Shift your weight onto one arm while the other stays straight out to the side.': 'اليدان متباعدتان. انقل وزنك إلى ذراع واحدة بينما تبقى الأخرى ممدودة إلى الجانب.',
    'One-arm push-up': 'ضغط بذراع واحدة', '3 reps each side': '3 تكرارات لكل جهة', 'Feet wide, hand under your chest. Start on an incline and lower it over the weeks.': 'القدمان متباعدتان واليد تحت الصدر. ابدأ على سطح مائل واخفضه مع الأسابيع.',
    'Dead hang': 'التعلّق', 'Hold 30 seconds': 'ثبات 30 ثانية', 'Hang from a bar with straight arms and active shoulders. Builds the grip everything else needs.': 'تعلّق بالبار بذراعين مستقيمتين وكتفين مشدودتين. يبني قوة القبضة التي يحتاجها كل ما بعده.',
    'Scapular pulls': 'سحب لوح الكتف', 'While hanging, pull your shoulders down and back without bending your arms.': 'وأنت معلّق، اسحب كتفيك للأسفل والخلف دون ثني ذراعيك.',
    'Australian rows': 'السحب الأسترالي', 'Under a low bar or sturdy table, body straight, pull your chest up to it.': 'تحت بار منخفض أو طاولة ثابتة، والجسم مستقيم، اسحب صدرك إليه.',
    'Negative pull-ups': 'عقلة سلبية', '3 sets of 5, 5 seconds down': '3 مجموعات × 5، النزول في 5 ثوانٍ', 'Jump or step to the top, then lower yourself as slowly as you can.': 'اقفز أو اصعد إلى الأعلى، ثم انزل ببطء قدر ما تستطيع.',
    'First pull-up': 'أول عقلة', '1 clean rep': 'تكرار واحد نظيف', 'From a full hang to chin over the bar, no kicking or swinging.': 'من التعلّق الكامل حتى يصل ذقنك فوق البار، دون ركل أو تأرجح.',
    'Pull-ups': 'العقلة', '3 sets of 8': '3 مجموعات × 8', 'Same clean form. Rest two minutes between sets.': 'بنفس الأداء النظيف. استرح دقيقتين بين المجموعات.',
    'Muscle-up': 'مسل أب', '1 rep': 'تكرار واحد', 'An explosive chest-to-bar pull, then lean over the bar and press up. Practise high pull-ups first.': 'سحبة انفجارية حتى يلامس صدرك البار، ثم مِل فوق البار وادفع للأعلى. تدرّب على العقلة العالية أولًا.',
    'Bodyweight squats': 'سكوات بوزن الجسم', '3 sets of 20': '3 مجموعات × 20', 'Feet shoulder width, sit back and down until your thighs are level, knees follow your toes.': 'القدمان بعرض الكتفين، اجلس للخلف وللأسفل حتى يستوي فخذاك، والركبتان باتجاه أصابع القدم.',
    'Lunges': 'الطعنات', '3 sets of 12 each leg': '3 مجموعات × 12 لكل ساق', 'A long step forward, back knee almost touches the floor, chest up.': 'خطوة طويلة للأمام، والركبة الخلفية تكاد تلمس الأرض، والصدر مرفوع.',
    'Bulgarian split squats': 'سكوات بلغاري', '3 sets of 10 each leg': '3 مجموعات × 10 لكل ساق', 'Back foot on a chair, lower straight down on the front leg.': 'القدم الخلفية على كرسي، وانزل مباشرة على الساق الأمامية.',
    'Assisted pistol squat': 'سكوات المسدس بمساعدة', '3 sets of 5 each leg': '3 مجموعات × 5 لكل ساق', 'Hold a door frame and squat on one leg with the other straight out in front.': 'أمسك إطار الباب وانزل على ساق واحدة والأخرى ممدودة أمامك.',
    'Pistol squat': 'سكوات المسدس', '5 each leg': '5 لكل ساق', 'The same with no help. Reach your arms forward for balance.': 'نفس الحركة دون مساعدة. مدّ ذراعيك للأمام للتوازن.',
    'Shrimp squat': 'سكوات الروبيان', 'Hold your back foot behind you and lower that knee to the floor.': 'أمسك قدمك الخلفية خلفك وأنزل تلك الركبة إلى الأرض.',
    'Plank': 'البلانك', 'Hold 60 seconds': 'ثبات 60 ثانية', 'Elbows under shoulders, body one straight line, squeeze your glutes.': 'المرفقان تحت الكتفين، والجسم خط مستقيم واحد، وشدّ عضلات المؤخرة.',
    'Hollow body hold': 'ثبات الجسم المجوّف', 'Lower back pressed into the floor, arms and legs a little off the ground.': 'أسفل الظهر ملتصق بالأرض، والذراعان والساقان مرفوعة قليلًا عنها.',
    'Hanging knee raises': 'رفع الركبتين معلّقًا', '3 sets of 12': '3 مجموعات × 12', 'Hang from a bar and bring your knees to your chest without swinging.': 'تعلّق بالبار وارفع ركبتيك إلى صدرك دون تأرجح.',
    'Hanging leg raises': 'رفع الساقين معلّقًا', '3 sets of 10': '3 مجموعات × 10', 'Straight legs up to hip height or higher.': 'ساقان مستقيمتان حتى مستوى الورك أو أعلى.',
    'L-sit': 'جلسة L', 'Hold 10 seconds': 'ثبات 10 ثوانٍ', 'On parallel bars, two chairs or the floor, press up and hold your legs straight out.': 'على متوازيين أو كرسيين أو الأرض، ادفع للأعلى وثبّت ساقيك ممدودتين.',
    'Dragon flag': 'علم التنين', '3 sets of 3': '3 مجموعات × 3', 'Lying on a bench, hold behind your head, lift your whole straight body and lower it slowly.': 'مستلقيًا على مقعد، أمسك خلف رأسك، وارفع جسمك كله مستقيمًا ثم أنزله ببطء.',
    'Pike hold': 'ثبات البايك', 'Hands on the floor, hips high, weight leaning into your shoulders.': 'اليدان على الأرض، والوركان مرتفعان، والوزن مائل نحو الكتفين.',
    'Wall walk': 'المشي على الحائط', '3 reps': '3 تكرارات', 'Feet on the wall, walk your hands in until your chest is close to it, then walk back out.': 'القدمان على الحائط، وامشِ بيديك نحوه حتى يقترب صدرك منه، ثم عُد.',
    'Chest-to-wall handstand': 'وقوف على اليدين والصدر للحائط', 'Hold 45 seconds': 'ثبات 45 ثانية', 'Belly facing the wall, body straight, push the floor away.': 'البطن مواجه للحائط، والجسم مستقيم، وادفع الأرض بعيدًا.',
    'Kick-up to the wall': 'الصعود بالركل إلى الحائط', '10 soft kick-ups': '10 ركلات خفيفة', 'Back to the wall, kick up gently with one leg and let the other follow.': 'ظهرك للحائط، اركل للأعلى بلطف بساق واحدة ودع الأخرى تتبعها.',
    'Freestanding handstand': 'وقوف حر على اليدين', 'Balance with your fingertips. Learn to bail out by stepping or cartwheeling to the side first.': 'توازن بأطراف أصابعك. تعلّم الخروج الآمن بالنزول أو الدوران إلى الجانب أولًا.',
    'Handstand push-up (wall)': 'ضغط الوقوف على اليدين (على الحائط)', 'Lower your head to the floor between your hands and press back up.': 'أنزل رأسك إلى الأرض بين يديك ثم ادفع للأعلى.',
    'Bench dips': 'ديبس على المقعد', 'Hands on a chair behind you, bend your elbows to 90° and push back up.': 'يداك على كرسي خلفك، اثنِ مرفقيك إلى 90° ثم ادفع للأعلى.',
    'Support hold': 'ثبات الارتكاز', 'On parallel bars or two sturdy chairs, arms locked, shoulders down.': 'على متوازيين أو كرسيين ثابتين، والذراعان مقفلتان، والكتفان للأسفل.',
    'Negative dips': 'ديبس سلبي', 'Start at the top and lower yourself slowly.': 'ابدأ من الأعلى وانزل ببطء.',
    'Parallel bar dips': 'ديبس على المتوازي', 'Lean a little forward and go down until your shoulders are below your elbows.': 'مِل قليلًا للأمام وانزل حتى يصبح كتفاك تحت مرفقيك.',
    'Straight bar dips': 'ديبس على بار مستقيم', '3 sets of 5': '3 مجموعات × 5', 'On a single bar: harder balance, and the first step to a muscle-up.': 'على بار واحد: توازن أصعب، وأول خطوة نحو المسل أب.',
    'Brisk walk': 'مشي سريع', '30 minutes': '30 دقيقة', 'Walk fast enough that talking takes a little effort.': 'امشِ بسرعة تجعل الكلام يحتاج قليلًا من الجهد.',
    'Run and walk': 'جري ومشي', '1 min run, 1 min walk, 10 times': 'دقيقة جري، دقيقة مشي، 10 مرات', 'Run slowly enough to talk. Speed comes later.': 'اجرِ ببطء يسمح لك بالكلام. السرعة تأتي لاحقًا.',
    'Run 2 km': 'اجرِ 2 كم', 'Without stopping': 'دون توقف', 'Same easy pace. If you have to stop, slow down next time.': 'بنفس الإيقاع السهل. إن اضطررت للتوقف، أبطئ في المرة القادمة.',
    'Run 5 km': 'اجرِ 5 كم', 'Add about 10% distance a week, not more.': 'زِد المسافة نحو 10% أسبوعيًا، لا أكثر.',
    '5 km under 30 minutes': '5 كم في أقل من 30 دقيقة', 'One timed run': 'جرية واحدة بتوقيت', 'One faster day a week, everything else easy.': 'يوم واحد أسرع في الأسبوع، وكل ما عداه سهل.',
    'Run 10 km': 'اجرِ 10 كم', 'A long slow run once a week builds it.': 'جرية طويلة بطيئة مرة أسبوعيًا تبنيها.',
    'Perfect eggs': 'بيض مثالي', 'Boiled, scrambled and fried': 'مسلوق ومخفوق ومقلي', 'Boiled: 7 minutes in boiling water then cold water. Scrambled: low heat, keep stirring, take off a little early.': 'المسلوق: 7 دقائق في ماء يغلي ثم ماء بارد. المخفوق: نار هادئة وتحريك مستمر، وارفعه قبل أن ينضج تمامًا بقليل.',
    "Rice that isn't sticky": 'رز غير معجّن', '3 good pots': '3 قدور ناجحة', 'Rinse until the water runs clear, about 1 cup rice to 1.5 water, lid on, lowest heat 15 minutes, rest 10.': 'اغسله حتى يصفو الماء، كوب رز تقريبًا لكل 1.5 كوب ماء، غطِّه، على أهدأ نار 15 دقيقة، ثم اتركه يرتاح 10.',
    'Juicy chicken': 'دجاج طري', 'Pan-cooked chicken breast': 'صدر دجاج في المقلاة', "Even thickness, hot pan, don't move it for the first 5 minutes, rest it 5 minutes before cutting.": 'سماكة متساوية ومقلاة ساخنة، لا تحرّكه أول 5 دقائق، واتركه يرتاح 5 دقائق قبل التقطيع.',
    'One family dish': 'طبق من البيت', 'Kabsa or any dish from home': 'كبسة أو أي طبق من البيت', 'Ask someone at home to cook it with you once, then make it alone.': 'اطلب من أحد في البيت أن يطبخه معك مرة، ثم اصنعه وحدك.',
    'Meal prep': 'تحضير الوجبات', '3 days of lunches in one go': 'غداء 3 أيام دفعة واحدة', 'Pick one protein, one carb and one vegetable, cook them together, split into boxes.': 'اختر بروتينًا ونشويات وخضارًا، اطبخها معًا، ووزّعها في علب.',
    '10 dishes from memory': '10 أطباق من الذاكرة', 'No recipe needed': 'دون وصفة', 'Write the list on a DayTrack list and tick them off.': 'اكتبها في قائمة على DayTrack وعلّمها واحدة واحدة.',
    'Track every riyal': 'سجّل كل ريال', '7 days': '7 أيام', 'Write down everything you spend for a week. Just looking at it changes habits.': 'اكتب كل ما تصرفه لمدة أسبوع. مجرد النظر إليه يغيّر العادات.',
    'Monthly budget': 'ميزانية شهرية', 'A plan for one month': 'خطة لشهر واحد', 'Split income into needs, wants and savings (a common start is 50/30/20).': 'قسّم الدخل إلى احتياجات ورغبات وادخار (بداية شائعة: 50/30/20).',
    'Pay yourself first': 'ادفع لنفسك أولًا', 'Save 10% of every income for a month': 'ادّخر 10% من كل دخل لمدة شهر', 'Move it out the day the money arrives, before spending anything.': 'انقله يوم وصول المال، قبل أن تصرف أي شيء.',
    'Emergency fund': 'صندوق الطوارئ', '1 month of expenses saved': 'مصاريف شهر مدّخرة', 'Keep it separate from your spending account.': 'اجعله منفصلًا عن حساب مصاريفك.',
    'Learn halal investing': 'تعلّم الاستثمار الحلال', 'Understand how funds and sukuk work': 'افهم كيف تعمل الصناديق والصكوك', 'Read how index funds and sukuk work and what fees mean. Learn before you put money in.': 'اقرأ كيف تعمل صناديق المؤشرات والصكوك وماذا تعني الرسوم. تعلّم قبل أن تضع مالك.',
    '3 months of expenses saved': 'مصاريف 3 أشهر مدّخرة', 'Now money surprises stop being emergencies.': 'الآن لم تعد المفاجآت المالية طوارئ.',
    'One pomodoro': 'بومودورو واحد', '25 minutes, phone in another room': '25 دقيقة، والجوال في غرفة أخرى', 'One task, a timer, no switching. Use the Timer tab.': 'مهمة واحدة ومؤقت ولا تنقّل. استخدم تبويب المؤقت.',
    'Four pomodoros': 'أربع جلسات بومودورو', 'In one day': 'في يوم واحد', '25 minutes on, 5 minutes off, four times.': '25 دقيقة عمل و5 راحة، أربع مرات.',
    'Deep work block': 'جلسة عمل عميق', '90 minutes in one go': '90 دقيقة متواصلة', "Plan what you'll do before you start, close everything else.": 'خطّط لما ستفعله قبل أن تبدأ، وأغلق كل شيء آخر.',
    'Deep work week': 'أسبوع عمل عميق', 'A 90-minute block every day for 7 days': 'جلسة 90 دقيقة كل يوم لمدة 7 أيام', 'Same time every day makes it automatic.': 'نفس الوقت كل يوم يجعلها تلقائية.',
    'Double block': 'جلستان', 'Two 90-minute blocks in one day': 'جلستان من 90 دقيقة في يوم واحد', 'A real break between them: walk, eat, no screens.': 'استراحة حقيقية بينهما: امشِ، كُل، دون شاشات.',
    'One full day': 'يوم كامل', 'All five prayers on time': 'الصلوات الخمس في وقتها', 'Turn on prayer times in Settings so DayTrack reminds you.': 'فعّل مواقيت الصلاة من الإعدادات ليذكّرك DayTrack.',
    'Seven days': 'سبعة أيام', 'All five on time for a week': 'الخمس في وقتها لمدة أسبوع', 'If you miss one, just restart the count.': 'إن فاتتك صلاة، ابدأ العدّ من جديد.',
    'Fajr streak': 'سلسلة الفجر', 'Fajr on time for 14 days': 'الفجر في وقته لمدة 14 يومًا', "Sleep earlier the night before; it's the hardest one.": 'نَم مبكرًا في الليلة السابقة؛ إنها الأصعب.',
    'Thirty days': 'ثلاثون يومًا', 'All five on time for a month': 'الخمس في وقتها لمدة شهر', "By now it's a habit, not an effort.": 'الآن أصبحت عادة، لا جهدًا.',
    'The last ten surahs': 'آخر عشر سور', 'From Al-Fil to An-Nas': 'من الفيل إلى الناس', 'A few verses a day: read, repeat ten times, recite them in your prayers.': 'آيات قليلة يوميًا: اقرأ، وكرّر عشر مرات، واقرأها في صلاتك.',
    'Half of Juz Amma': 'نصف جزء عمّ', "Up to Al-A'la": 'حتى سورة الأعلى', 'Review old surahs every day before adding new ones.': 'راجع السور القديمة كل يوم قبل إضافة الجديدة.',
    'Juz Amma': 'جزء عمّ', 'All of juz 30': 'الجزء الثلاثون كاملًا', 'Recite to someone who can correct you.': 'سمّع لشخص يستطيع تصحيحك.',
    'Juz Tabarak': 'جزء تبارك', 'All of juz 29': 'الجزء التاسع والعشرون كاملًا', 'Same method: little by little, with daily review.': 'نفس الطريقة: شيئًا فشيئًا، مع مراجعة يومية.',
    'Surah Al-Kahf': 'سورة الكهف', 'By heart': 'حفظًا', "Many read it every Friday; that's weekly review built in.": 'كثيرون يقرؤونها كل جمعة؛ وهذه مراجعة أسبوعية جاهزة.',
    'Watch yourself': 'شاهد نفسك', 'Record a 1-minute talk and watch it': 'سجّل حديثًا مدته دقيقة وشاهده', "Any topic. Watching it back is uncomfortable, and that's how you improve.": 'أي موضوع. مشاهدته مزعجة، وهكذا تتحسّن.',
    'Tell a story': 'احكِ قصة', 'To friends, without notes': 'لأصدقائك، دون ملاحظات', 'Beginning, problem, ending. Keep it under two minutes.': 'بداية، ومشكلة، ونهاية. أقل من دقيقتين.',
    'No filler words': 'دون كلمات حشو', 'A 3-minute talk with no "umm"': 'حديث 3 دقائق دون "إممم"', 'Pause instead of saying "umm". Pauses sound confident.': 'توقّف بدل أن تقول "إممم". التوقف يبدو واثقًا.',
    'Speak up': 'تكلّم', 'Share an idea in a group or class': 'شارك فكرة في مجموعة أو فصل', 'Say it in the first ten minutes before nerves build.': 'قلها في أول عشر دقائق قبل أن يزداد التوتر.',
    'Presentation': 'عرض تقديمي', 'A 5-minute talk in front of people': 'حديث 5 دقائق أمام الناس', 'Practise it out loud three times the day before.': 'تدرّب عليه بصوت عالٍ ثلاث مرات في اليوم السابق.',
    'Call for help': 'اطلب المساعدة', 'Know 997 and the recovery position': 'اعرف 997 ووضعية الإفاقة', 'In Saudi Arabia 997 is the ambulance. Practise rolling someone onto their side with a friend.': 'في السعودية رقم الإسعاف 997. تدرّب مع صديق على قلب شخص على جنبه.',
    'Bleeding': 'النزيف', 'Know how to stop it': 'اعرف كيف توقفه', 'Firm pressure with a clean cloth and keep pressing. Raise the limb if you can.': 'اضغط بقوة بقطعة قماش نظيفة واستمر في الضغط. وارفع الطرف إن استطعت.',
    'Burns': 'الحروق', 'Know what to do': 'اعرف ماذا تفعل', 'Cool running water for 20 minutes. No ice, no toothpaste.': 'ماء جارٍ بارد لمدة 20 دقيقة. لا ثلج ولا معجون أسنان.',
    'Choking': 'الاختناق', 'Know the steps': 'اعرف الخطوات', 'Five firm back blows between the shoulder blades, then five abdominal thrusts.': 'خمس ضربات قوية على الظهر بين لوحي الكتف، ثم خمس ضغطات على البطن.',
    'CPR': 'الإنعاش القلبي الرئوي', 'Take a certified course': 'احضر دورة معتمدة', '30 hard, fast chest pushes (100-120 a minute) and 2 breaths. A real course is the only proper way to learn it.': '30 ضغطة قوية وسريعة على الصدر (100-120 في الدقيقة) ونفَسان. الدورة الحقيقية هي الطريقة الصحيحة الوحيدة لتعلّمه.',
    'Same wake-up time': 'نفس وقت الاستيقاظ', '7 days in a row': '7 أيام متتالية', 'Even on weekends. Set it in Settings so Gwen wakes you.': 'حتى في الإجازة. اضبطه من الإعدادات لتوقظك غوين.',
    'Screens off': 'إطفاء الشاشات', 'No screens 30 minutes before bed for 7 days': 'دون شاشات قبل النوم بـ30 دقيقة لمدة 7 أيام', 'Read, pray or stretch instead.': 'اقرأ أو صلِّ أو تمدّد بدلًا من ذلك.',
    'Seven hours': 'سبع ساعات', '7+ hours sleep for 7 nights': 'نوم 7 ساعات أو أكثر لمدة 7 ليالٍ', 'Log it on the Tasks tab each morning.': 'سجّله في تبويب المهام كل صباح.',
    'Before midnight': 'قبل منتصف الليل', 'Asleep before 12 for 14 nights': 'نائم قبل 12 لمدة 14 ليلة', 'Move bedtime earlier 15 minutes at a time.': 'قدّم وقت النوم 15 دقيقة في كل مرة.',
    'Home row': 'صف البداية', 'Type without looking at the keys': 'اكتب دون النظر إلى المفاتيح', 'Fingers on ASDF and JKL;. Cover your hands if you have to.': 'الأصابع على ASDF وJKL;. غطِّ يديك إن احتجت.',
    '30 words a minute': '30 كلمة في الدقيقة', 'Without looking': 'دون النظر', 'Try monkeytype.com, 10 minutes a day.': 'جرّب monkeytype.com لمدة 10 دقائق يوميًا.',
    '50 words a minute': '50 كلمة في الدقيقة', 'With 95% accuracy': 'بدقة 95%', 'Accuracy first, speed follows.': 'الدقة أولًا، والسرعة تتبعها.',
    '70 words a minute': '70 كلمة في الدقيقة', 'Practise real sentences, not just words.': 'تدرّب على جمل حقيقية، لا كلمات فقط.',
    '90 words a minute': '90 كلمة في الدقيقة', 'You now type faster than most people think.': 'الآن تكتب أسرع مما يفكر معظم الناس.',
    'Python basics': 'أساسيات بايثون', 'Variables, loops and functions': 'المتغيرات والحلقات والدوال', 'Any free beginner course. Type every example yourself.': 'أي دورة مجانية للمبتدئين. اكتب كل مثال بنفسك.',
    'A small program': 'برنامج صغير', 'A calculator or quiz game': 'آلة حاسبة أو لعبة أسئلة', 'Finishing something small teaches more than another tutorial.': 'إنهاء شيء صغير يعلّمك أكثر من درس جديد.',
    'Git and GitHub': 'Git وGitHub', 'Push a project to GitHub': 'ارفع مشروعًا إلى GitHub', 'Learn commit, push and pull.': 'تعلّم commit وpush وpull.',
    'A real tool': 'أداة حقيقية', "Build something you'll actually use": 'ابنِ شيئًا ستستخدمه فعلًا', 'Automate something boring in your own life.': 'أتمت شيئًا مملًا في حياتك.',
    'Share it': 'شاركه', 'Someone else uses your code': 'شخص آخر يستخدم كودك', 'Help a friend, or fix a small issue in an open project.': 'ساعد صديقًا، أو أصلح مشكلة صغيرة في مشروع مفتوح.',
    'First 100 words': 'أول 100 كلمة', 'The most common 100 words': 'أكثر 100 كلمة استخدامًا', 'Flashcards, 10 minutes a day.': 'بطاقات تعليمية، 10 دقائق يوميًا.',
    '30-day streak': 'سلسلة 30 يومًا', 'A lesson every day for a month': 'درس كل يوم لمدة شهر', 'Small and daily beats long and rare.': 'القليل اليومي أفضل من الطويل النادر.',
    'First conversation': 'أول محادثة', '5 minutes with a real person': '5 دقائق مع شخص حقيقي', 'Online exchange partners or a friend who speaks it.': 'شركاء تبادل لغوي عبر الإنترنت أو صديق يتحدثها.',
    'A show without subtitles': 'مسلسل دون ترجمة', 'One episode': 'حلقة واحدة', "Pick something you've already seen in your own language.": 'اختر شيئًا شاهدته من قبل بلغتك.',
    // ── Level tab ──
    // Segments and cards (index.html)
    'Quests': 'المغامرات', 'Bag': 'الحقيبة', 'Your body': 'جسمك', 'tap a part': 'اضغط على جزء', 'Perks': 'المزايا', 'Personal records': 'أرقامك القياسية',
    'Party': 'الفريق', 'Inventory': 'المخزون', 'Gear': 'العتاد', 'Skill tree': 'شجرة المهارات', 'tap a node': 'اضغط على عقدة',
    'Monthly fitness test': 'اختبار اللياقة الشهري', 'Weekly report card': 'التقرير الأسبوعي', 'You vs last month': 'أنت مقابل الشهر الماضي',
    'Season': 'الموسم', 'Ranked': 'التصنيف', 'Friend duel': 'تحدّي صديق', 'Your year': 'عامك', 'Journal · one line a night': 'اليوميات · سطر واحد كل ليلة',
    'Bosses': 'الزعماء', "Gwen's bet": 'رهان غوين', 'Dungeon': 'الزنزانة', 'You vs your ghost': 'أنت مقابل شبحك', 'Monthly pass': 'التذكرة الشهرية',
    'Quests · claim rewards when done': 'المهام · استلم المكافآت عند إنجازها', 'Bounty board': 'لوحة المكافآت', 'Mini bosses': 'الزعماء الصغار',
    "Bad habits I'm quitting": 'عادات سيئة أتركها', 'Boss book': 'سجل الزعماء', 'Achievements and titles': 'الإنجازات والألقاب',
    'Hardcore': 'الوضع القاسي', 'Double XP, but a missed day costs XP (repeating tasks)': 'ضعف XP، لكن اليوم الفائت يخصم XP (للمهام المتكررة)',
    'Mini boss': 'زعيم صغير', 'For a task you keep putting off: worth more XP every day it waits': 'لمهمة تؤجلها دائمًا: تزيد قيمتها من XP كل يوم تنتظر فيه',
    // Character card, HP, buffs
    'Share card': 'مشاركة البطاقة', 'HP': 'الصحة', 'Revived': 'عدت للحياة', 'Fallen': 'سقطت',
    'Finish 3 tasks today to revive at 50 HP': 'أنجز 3 مهام اليوم لتعود بـ 50 نقطة صحة',
    'Each missed task: −10 HP at midnight. Escaped boss −15. Done tasks +5 each, a finished day +20': 'كل مهمة فائتة: −10 صحة عند منتصف الليل. الزعيم الهارب −15. كل مهمة منجزة +5، واليوم المكتمل +20',
    'No buffs yet today. Sleep 7 h, keep a streak or log your mood': 'لا تعزيزات اليوم بعد. نم 7 ساعات، أو حافظ على سلسلتك، أو سجّل مزاجك',
    'Blazing': 'مشتعل', 'On fire': 'متحمّس', 'Streak broken': 'انقطعت السلسلة', "Yesterday wasn't finished. Finish today to start again": 'لم يكتمل الأمس. أكمل اليوم لتبدأ من جديد',
    'Well rested': 'مرتاح', 'Tired': 'متعب', 'Early bird': 'مبكّر', 'Brave': 'شجاع', 'Getting things done on a hard day': 'تنجز رغم صعوبة اليوم',
    'Good vibes': 'معنويات عالية', 'Feeling good today': 'تشعر بالرضا اليوم', 'Overdue': 'متأخرة', 'Quest momentum': 'زخم المهام',
    'You finished a weekly quest': 'أنهيت مهمة أسبوعية', 'Fast learner': 'سريع التعلّم', 'Your perk': 'ميزتك', 'Prestige': 'الهيبة', 'Evolved': 'متطوّر',
    'Party: Gwen': 'الفريق: غوين', 'Your bond with Gwen': 'رابطك مع غوين', 'What you have equipped': 'ما تجهّزت به', 'XP potion': 'جرعة XP',
    'Double XP today': 'ضعف XP اليوم', 'Mega potion': 'جرعة عملاقة', 'Triple XP today': 'ثلاثة أضعاف XP اليوم',
    'Your HP hit 0. Finish 3 tasks in a day to revive': 'وصلت صحتك إلى 0. أنجز 3 مهام في يوم لتعود', 'Golden day': 'يوم ذهبي',
    'A rare event: +50% XP all day': 'حدث نادر: +50% XP طوال اليوم', 'Boss curse': 'لعنة الزعيم', 'Slipped': 'زلّة',
    "A slip on a habit you're quitting. Back on track tomorrow": 'زلّة في عادة تتركها. عُد إلى المسار غدًا',
    'Meteor day': 'يوم النيازك', 'Chests and bosses drop an extra item': 'الصناديق والزعماء يُسقطون غرضًا إضافيًا', 'Lucky day': 'يوم الحظ',
    'Quest rewards are doubled': 'مكافآت المهام مضاعفة', '+50% XP all day': '+50% XP طوال اليوم', 'XP potion active': 'جرعة XP فعّالة',
    // Quests
    '☀️ Daily': '☀️ اليومية', '📅 Weekly': '📅 الأسبوعية', '🌙 Monthly': '🌙 الشهرية',
    'Daily quests': 'المهام اليومية', 'All quests': 'كل المهام', "Tonight's line": 'سطر الليلة', 'Daily chest opened': 'فُتح الصندوق اليومي',
    'All done! Open the daily chest (+60 XP and loot)': 'انتهيت! افتح الصندوق اليومي (+60 XP وغنائم)', 'Daily chest': 'الصندوق اليومي',
    'Finish every task today': 'أنجز كل مهام اليوم', 'Log how you feel today': 'سجّل شعورك اليوم',
    'Quest momentum: +15% XP for the next 3 days': 'زخم المهام: +15% XP للأيام الثلاثة القادمة', 'CHEST OPENED': 'فُتح الصندوق!',
    'The Procrastinator': 'المُسوِّف', 'Doomscroll Dragon': 'تنين التصفّح اللانهائي', 'The Couch Zombie': 'زومبي الأريكة', 'Ghost of Excuses': 'شبح الأعذار',
    'The Distraction Kraken': 'كراكن التشتّت', 'Lazy Wolf': 'الذئب الكسول', 'Stone of Sloth': 'حجر الخمول',
    'Claim the reward below': 'استلم المكافأة بالأسفل', 'every XP you earn this week hits it': 'كل XP تكسبه هذا الأسبوع يضربه',
    // Skill tree, body
    'Next step': 'الخطوة التالية', 'Locked': 'مقفل', 'FRONT': 'أمام', 'BACK': 'خلف',
    'Your character picture': 'صورة شخصيتك', 'Pick a photo': 'اختر صورة', 'Use an emoji': 'استخدم إيموجي', 'Remove the photo': 'احذف الصورة',
    'New character picture': 'صورة شخصية جديدة', "Couldn't open that picture": 'تعذّر فتح تلك الصورة',
    'Unlocks when you master': 'يُفتح عندما تتقن', 'All 5 mastery stars!': 'كل نجوم الإتقان الخمس!', 'Keep training for stars': 'واصل التدريب لتكسب النجوم',
    'Keep it sharp for mastery stars': 'حافظ على مستواك لتكسب نجوم الإتقان', 'Training task added': 'أُضيفت مهمة التدريب',
    // Achievements and titles
    'Iron Arms': 'ذراعان من حديد', 'Steel Chest': 'صدر فولاذي', 'Eagle Back': 'ظهر النسر', 'Stone Core': 'جذع صخري', 'Swift Legs': 'ساقان سريعتان',
    'Tireless': 'لا يتعب', 'Sage': 'حكيم', 'Laser Focus': 'تركيز الليزر', 'Artist': 'فنان', 'Devout': 'متعبّد', 'Unbreakable': 'لا يُكسر',
    'Vital': 'مفعم بالحيوية', 'Charmer': 'جذّاب', 'Merchant': 'تاجر',
    'First step': 'الخطوة الأولى', 'Complete your first task': 'أنجز أول مهمة', 'Centurion': 'المئوي', 'Complete 100 tasks': 'أنجز 100 مهمة',
    'Relentless': 'لا يلين', 'Complete 500 tasks': 'أنجز 500 مهمة', 'On a roll': 'في انطلاقة', 'Finish every task 7 days in a row': 'أنجز كل المهام 7 أيام متتالية',
    'Unstoppable': 'لا يمكن إيقافه', 'Finish every task 30 days in a row': 'أنجز كل المهام 30 يومًا متتاليًا', 'Hero': 'بطل', 'Quester': 'صاحب المهام',
    'Claim 10 quests': 'استلم 10 مهام', 'Moon hunter': 'صيّاد القمر', 'Moon Hunter': 'صيّاد القمر', 'Claim a monthly quest': 'استلم مهمة شهرية',
    'Master a whole skill path': 'أتقن مسار مهارة كاملًا', 'All-rounder': 'متكامل', 'All-Rounder': 'متكامل',
    'Body, Mind, Spirit and Life all average Lv 5': 'الجسد والعقل والروح والحياة كلها بمتوسط المستوى 5',
    'Boss slayer': 'قاتل الزعماء', 'Slayer': 'القاتل', 'Beat a daily boss': 'اهزم زعيمًا يوميًا', 'Boss hunter': 'صيّاد الزعماء', 'Boss Hunter': 'صيّاد الزعماء',
    'Beat 10 daily bosses': 'اهزم 10 زعماء يوميين', 'Bane of bosses': 'كابوس الزعماء', 'Bane of Bosses': 'كابوس الزعماء', 'Beat 50 daily bosses': 'اهزم 50 زعيمًا يوميًا',
    'Beat 30 daily bosses': 'اهزم 30 زعيمًا يوميًا', 'Combo master': 'سيد الكومبو', 'Combo Master': 'سيد الكومبو', 'Reach a ×5 combo': 'حقّق كومبو ×5',
    'Chronicler': 'المؤرّخ', 'Write 30 journal lines': 'اكتب 30 سطرًا في اليوميات', 'Storyteller': 'الراوي', 'Finish 3 story chapters': 'أنهِ 3 فصول من القصة',
    'Free': 'حُرّ', 'Free Spirit': 'روح حرّة', '30 clean days from a habit': '30 يومًا نظيفًا من عادة', 'Tamer': 'المروّض',
    'Raise your pet to Adult': 'ربِّ حيوانك حتى يصبح بالغًا', 'Reborn': 'وُلد من جديد', 'Prestige once': 'استخدم الهيبة مرة واحدة',
    'Mastered every step': 'أتقنت كل الخطوات', 'Finished a monthly pass': 'أنهيت تذكرة شهرية',
    'ACHIEVEMENT': 'إنجاز!', 'New title:': 'لقب جديد:', 'New gear:': 'عتاد جديد:', 'tap a title to wear it': 'اضغط على لقب لترتديه',
    // Perks
    '+5% XP on everything': '+5% XP على كل شيء', 'Deep sleeper': 'نوم عميق', 'Well rested gives +20% instead of +10%': '«مرتاح» يعطي +20% بدل +10%',
    'Dawn warrior': 'محارب الفجر', 'Early bird gives +15% instead of +5%': '«مبكّر» يعطي +15% بدل +5%', 'Momentum': 'الزخم',
    'Streak buffs give +10% more': 'تعزيزات السلسلة تعطي +10% إضافية', 'Iron mind': 'عقل حديدي', 'Debuffs and curses hurt half as much': 'العقوبات واللعنات تؤثر بنصف قوتها',
    '+50% XP from daily bosses': '+50% XP من الزعماء اليوميين', 'Quest master': 'سيد المهام', '+25% XP from quests': '+25% XP من المهام', 'Lucky': 'محظوظ',
    'Chests and bosses drop two items': 'الصناديق والزعماء يُسقطون غرضين', 'Combo king': 'ملك الكومبو', 'Combo bonus goes up to +50 XP': 'مكافأة الكومبو تصل إلى +50 XP',
    'Ice heart': 'قلب جليدي', 'A free streak freeze every month': 'تجميد سلسلة مجاني كل شهر',
    // Daily reward, items, shop, crafting, gear
    'Your weekly report card is ready in Level → Story': 'تقريرك الأسبوعي جاهز في المستوى ← القصة', 'DAILY REWARD': 'المكافأة اليومية',
    'Streak freeze': 'تجميد السلسلة', 'Saves a missed day so your streak lives on': 'ينقذ يومًا فائتًا لتستمر سلسلتك', 'Double XP for everything today': 'ضعف XP على كل شيء اليوم',
    'Quest reroll': 'تبديل مهمة', 'Swap a daily quest for a new one': 'استبدل مهمة يومية بأخرى جديدة',
    'Triple XP for everything today (crafted only)': 'ثلاثة أضعاف XP على كل شيء اليوم (بالصناعة فقط)', 'found!': 'حصلت عليه!',
    'A potion is already working today': 'هناك جرعة تعمل اليوم بالفعل', 'No broken streak to save right now': 'لا توجد سلسلة منقطعة لإنقاذها الآن',
    'No open daily quest to reroll': 'لا توجد مهمة يومية مفتوحة لتبديلها', 'Which quest?': 'أي مهمة؟', 'New quest!': 'مهمة جديدة!',
    '1 hour of gaming': 'ساعة ألعاب', 'Movie night': 'ليلة فيلم', 'Order food': 'طلب طعام', 'REWARD UNLOCKED': 'فُتحت المكافأة', 'You earned it. Enjoy!': 'تستحقها. استمتع!',
    'A real-life reward': 'مكافأة من الحياة الواقعية', 'e.g. New game, Shawarma, A day off': 'مثل: لعبة جديدة، شاورما، يوم إجازة',
    'How many coins? (you earn 1 per 10 XP)': 'كم عملة؟ (تكسب 1 لكل 10 XP)', 'Remove this reward?': 'حذف هذه المكافأة؟',
    'Use': 'استخدام', 'Shop': 'المتجر', 'You earn a coin for every 10 XP.': 'تكسب عملة مقابل كل 10 XP.', '+ Add a real-life reward': '+ أضف مكافأة واقعية',
    'Tap ☆ on a reward to save up for it: its bar shows on your Tasks card.': 'اضغط ☆ على مكافأة لتدّخر لها: يظهر شريطها في بطاقة المهام.',
    'Save up for this': 'ادّخر لهذه', 'Crafting': 'الصناعة', 'Craft': 'اصنع', 'CRAFTED': 'تمت الصناعة', 'Ready to buy!': 'جاهزة للشراء!',
    'Training gloves': 'قفازات التدريب', 'Gauntlets of will': 'قفازات الإرادة', 'Iron helm': 'خوذة حديدية', 'Crown of focus': 'تاج التركيز',
    'Cloak of dawn': 'عباءة الفجر', 'Legend armor': 'درع الأسطورة', 'Quester badge': 'شارة المهام', 'Master seal': 'ختم الخبير',
    'Balance medal': 'وسام التوازن', 'Slayer medal': 'وسام القاتل', 'Head': 'الرأس', 'Hands': 'اليدان', 'Badge': 'الشارة',
    'Prestige? You go back to level 1 (stats, skills and items stay) and get a prestige star with +5% XP forever.': 'استخدام الهيبة؟ تعود إلى المستوى 1 (تبقى الإحصائيات والمهارات والأغراض) وتحصل على نجمة هيبة مع +5% XP للأبد.',
    // Daily, world and nightmare bosses
    'Sloth Golem': 'غولم الكسل', 'Do 25 push-ups': 'قم بـ 25 ضغطة', 'Do 60 push-ups, any sets': 'قم بـ 60 ضغطة، بأي عدد من المجموعات',
    'Plank Wraith': 'شبح البلانك', 'Hold a plank for 90 seconds': 'اثبت في البلانك 90 ثانية', 'Hold a plank for 3 minutes, breaks allowed': 'اثبت في البلانك 3 دقائق، والاستراحات مسموحة',
    'Squat Goblin': 'عفريت السكوات', 'Do 40 squats': 'قم بـ 40 سكوات', 'Do 100 squats': 'قم بـ 100 سكوات',
    'Clutter Hydra': 'هيدرا الفوضى', 'Tidy your room or desk for 10 minutes': 'رتّب غرفتك أو مكتبك 10 دقائق', 'Clean your whole room, floor included': 'نظّف غرفتك كلها، والأرضية معها',
    'Thirst Djinn': 'جنّي العطش', 'Drink 2 glasses of water': 'اشرب كوبين من الماء', 'Drink 3 glasses of water and eat a piece of fruit': 'اشرب 3 أكواب ماء وكُل قطعة فاكهة',
    'Scroll Specter': 'طيف المخطوطة', 'Read 10 pages of a book': 'اقرأ 10 صفحات من كتاب', 'Read 20 pages of a book': 'اقرأ 20 صفحة من كتاب',
    'Phantom of Silence': 'شبح الصمت', 'Text or call a friend or someone in your family': 'راسل أو اتصل بصديق أو بأحد من عائلتك',
    "Call someone you haven't talked to in a while": 'اتصل بشخص لم تكلّمه منذ مدة', 'Put your phone face down for 15 minutes': 'اقلب جوالك على وجهه 15 دقيقة',
    'Phone in another room for 18 minutes, then come back and strike': 'ضع الجوال في غرفة أخرى 18 دقيقة، ثم عُد واضرب',
    'Dust Titan': 'عملاق الغبار', 'Do 20 burpees': 'قم بـ 20 بيربي', 'Do 50 burpees': 'قم بـ 50 بيربي',
    'Wallet Leech': 'علقة المحفظة', 'Skip one thing you were going to buy today': 'تخلَّ عن شيء كنت ستشتريه اليوم', 'Write down every riyal you spent this week': 'اكتب كل ريال صرفته هذا الأسبوع',
    'Shade of Heedlessness': 'ظل الغفلة', 'Read a page of Quran or say your adhkar': 'اقرأ صفحة من القرآن أو قل أذكارك', 'Read 2 pages of Quran and say your adhkar': 'اقرأ صفحتين من القرآن وقل أذكارك',
    'Blank Page Imp': 'عفريت الصفحة البيضاء', 'Draw, write or make something for 10 minutes': 'ارسم أو اكتب أو اصنع شيئًا 10 دقائق', 'Draw, write or make something for 18 minutes': 'ارسم أو اكتب أو اصنع شيئًا 18 دقيقة',
    'Stiff Ogre': 'الغول المتيبّس', 'Stretch for 5 minutes': 'تمدّد 5 دقائق', 'Stretch for 12 minutes, whole body': 'تمدّد 12 دقيقة، لكامل الجسم',
    'Pull-up Harpy': 'هاربي العقلة', 'Do as many pull-ups or rows as you can, 3 sets': 'قم بأكبر عدد تستطيعه من العقلة أو السحب، 3 مجموعات',
    '5 sets of pull-ups or rows, as many as you can': '5 مجموعات من العقلة أو السحب، بأكبر عدد تستطيعه',
    'The World Eater': 'آكل العالم', 'Titan of Tomorrow': 'عملاق الغد', 'The Endless Scroll': 'التصفّح الذي لا ينتهي', 'Colossus of Comfort': 'عملاق الراحة',
    'Insomnia Lich': 'ليتش الأرق', 'Phone on charge across the room and lights off': 'الجوال على الشاحن في طرف الغرفة والأنوار مطفأة',
    'The Midnight Scroller': 'متصفّح منتصف الليل', 'Close every app and put the phone face down for 20 minutes': 'أغلق كل التطبيقات واقلب الجوال على وجهه 20 دقيقة',
    'Bedtime Banshee': 'بانشي وقت النوم', "Brush your teeth, wash your face and set tomorrow's alarm": 'نظّف أسنانك واغسل وجهك واضبط منبّه الغد',
    'Shade of Tomorrow': 'ظل الغد', "Write tomorrow's top 3 tasks in DayTrack": 'اكتب أهم 3 مهام للغد في DayTrack',
    'Restless Revenant': 'الطيف القلِق', 'Stretch or breathe slowly for 5 minutes': 'تمدّد أو تنفّس ببطء 5 دقائق',
    // Boss screen, boss card, battle settings
    'WORLD BOSS': 'زعيم العالم', 'A NIGHTMARE CRAWLS IN': 'كابوس يزحف إليك', 'AN ELITE BOSS APPEARED': 'ظهر زعيم نخبة', 'A BOSS APPEARED': 'ظهر زعيم',
    'I did it! Strike!': 'فعلتها! اضرب!', 'Gwen, help! (+5 minutes, once a day)': 'غوين، ساعديني! (+5 دقائق، مرة في اليوم)', 'Not yet': 'ليس بعد',
    'Run out of time: −10% XP today': 'إن نفد الوقت: −10% XP اليوم', 'No curse if it gets away': 'لا لعنة إن هرب',
    'I bought you 5 more minutes. Go go go!': 'اشتريت لك 5 دقائق إضافية. هيا هيا هيا!',
    'The ringing alarm works in the phone app. Here the boss screen and a sound show up.': 'رنين المنبّه يعمل في تطبيق الجوال. هنا تظهر شاشة الزعيم وصوت فقط.',
    'Lock your phone: the test boss rings in 5 seconds': 'اقفل جوالك: زعيم التجربة سيرنّ بعد 5 ثوانٍ',
    'WORLD BOSS DOWN': 'سقط زعيم العالم', 'BOSS DEFEATED': 'هُزم الزعيم',
    'No… beaten by Rayan…': 'لا… هزمني ريان…', "This isn't over. I'll be back.": 'لم ينتهِ الأمر. سأعود.', 'Impossible! How are you this strong?': 'مستحيل! كيف صرت بهذه القوة؟',
    'Arrgh… remember my name…': 'آآه… تذكّر اسمي…', "It's late, Rayan. Stay up with me… forever.": 'الوقت متأخر يا ريان. اسهر معي… للأبد.',
    'Sleep is for the weak. Keep scrolling…': 'النوم للضعفاء. واصل التصفّح…',
    'Battle settings': 'إعدادات المعارك', 'Bosses on': 'تفعيل الزعماء', 'Between': 'بين', 'and': 'و',
    'Nightmare bosses after 10 PM (inside these hours)': 'زعماء الكوابيس بعد 10 م (ضمن هذه الساعات)',
    'Health (HP): missed tasks hurt, at 0 you fall': 'الصحة (HP): المهام الفائتة تؤذيك، وعند 0 تسقط', 'Sounds and boss voices': 'الأصوات وأصوات الزعماء',
    'On the phone it rings like an alarm, even on silent, until you open DayTrack. Do Not Disturb can still hold it back.': 'على الجوال يرنّ كالمنبّه حتى في الوضع الصامت، إلى أن تفتح DayTrack. لكن وضع عدم الإزعاج قد يمنعه.',
    'Hear the music': 'استمع للموسيقى', 'Test the alarm': 'جرّب المنبّه', 'Saved': 'تم الحفظ', 'Bosses off': 'الزعماء متوقفون',
    'Daily bosses are off': 'الزعماء اليوميون متوقفون', 'World boss tonight': 'زعيم العالم الليلة', 'A boss is lurking…': 'زعيم يتربّص…',
    'See you next Friday': 'نراك الجمعة القادمة', 'Next boss tomorrow': 'الزعيم التالي غدًا', 'Its curse: −10% XP today. Be ready tomorrow.': 'لعنته: −10% XP اليوم. كن مستعدًا غدًا.',
    'No curse this time.': 'لا لعنة هذه المرة.', 'Fight': 'قاتِل', 'No boss today': 'لا زعيم اليوم',
    'Daily': 'يومي', 'World': 'العالم', 'Nightmare': 'كابوس', 'Three strikes in an hour': 'ثلاث ضربات في ساعة', 'Daily boss': 'زعيم يومي', 'World boss': 'زعيم العالم',
    'Nightmare boss': 'زعيم كابوس', 'PRACTICE FIGHT': 'نزال تدريبي', 'Done! Strike!': 'انتهيت! اضرب!', 'Give up': 'استسلام',
    'Do 3 of your daily boss challenges': 'نفّذ 3 من تحديات زعمائك اليوميين',
    // Class evolution, records
    'Calisthenics Master': 'سيد تمارين وزن الجسم', 'Juggernaut': 'الكاسح', 'Wall Climber': 'متسلّق الجدران', 'Iron Core': 'الجذع الحديدي', 'Sprinter': 'العدّاء',
    'Marathoner': 'عدّاء الماراثون', 'Strategist': 'الاستراتيجي', 'Artisan': 'الحِرَفي', 'Hafiz Path': 'درب الحافظ', 'Ascetic': 'الزاهد', 'Healer': 'المعالج',
    'Diplomat': 'الدبلوماسي', 'Merchant Lord': 'سيد التجار',
    'Longest streak': 'أطول سلسلة', 'Most XP in a day': 'أكثر XP في يوم', 'Best week': 'أفضل أسبوع', 'Most tasks in a day': 'أكثر مهام في يوم',
    'Longest focus session': 'أطول جلسة تركيز', 'Best combo': 'أفضل كومبو', 'Max push-ups': 'أقصى ضغط', 'Max pull-ups': 'أقصى عقلة', 'Longest plank': 'أطول بلانك',
    'Squats in a minute': 'سكوات في دقيقة', 'Squats': 'سكوات', 'CLASS EVOLVED': 'تطوّرت فئتك', '+5% XP from now on': '+5% XP من الآن فصاعدًا', 'NEW RECORD': 'رقم قياسي جديد',
    'Your best days, streaks and reps show up here and get celebrated when you beat them.': 'أفضل أيامك وسلاسلك وتكراراتك تظهر هنا، ويُحتفل بها عندما تحطّمها.',
    // Story
    'Awakening': 'الصحوة', 'Complete 10 tasks': 'أنجز 10 مهام', 'Master a skill step': 'أتقن خطوة مهارة', 'First blood': 'الدم الأول', 'Claim 5 quests': 'استلم 5 مهام',
    'Finish every task 3 days in a row': 'أنجز كل المهام 3 أيام متتالية', 'The climb': 'الصعود', 'Mind over matter': 'العقل فوق المادة',
    'Focus 600 minutes with the Timer': 'ركّز 600 دقيقة بالمؤقت', 'Write 14 journal lines': 'اكتب 14 سطرًا في اليوميات', 'Iron will': 'إرادة حديدية',
    'Complete 300 tasks': 'أنجز 300 مهمة', 'The faithful': 'المؤمن', "Warrior's road": 'طريق المحارب', 'Legend in the making': 'أسطورة قيد الصنع',
    'To be continued… you finished every chapter so far.': 'يُتبع… أنهيت كل الفصول حتى الآن.',
    // Fitness test
    'Max push-ups in one go': 'أقصى ضغط دفعة واحدة', 'Max pull-ups in one go': 'أقصى عقلة دفعة واحدة', 'Squats in one minute': 'سكوات في دقيقة واحدة',
    "Do each one with good form, rest in between, then write what you got. Beating last month's numbers gives extra XP.": 'أدِّ كل تمرين بشكل صحيح، واسترح بينها، ثم اكتب نتيجتك. تحطيم أرقام الشهر الماضي يعطي XP إضافيًا.',
    'Save results': 'حفظ النتائج', 'Write at least one result': 'اكتب نتيجة واحدة على الأقل', 'Fitness test': 'اختبار اللياقة',
    'Once a month: max push-ups, pull-ups, plank and squats. Your numbers become records and XP.': 'مرة في الشهر: أقصى ضغط وعقلة وبلانك وسكوات. أرقامك تصبح أرقامًا قياسية وXP.',
    "Take this month's test": 'خذ اختبار هذا الشهر', "Edit this month's test": 'عدّل اختبار هذا الشهر', 'reps': 'تكرار', 'seconds': 'ثانية',
    // Bounties, mini bosses, quitting
    "What's the bounty?": 'ما المهمة؟', 'e.g. Clean the car': 'مثل: غسل السيارة', 'XP reward (10 to 300)': 'مكافأة XP (من 10 إلى 300)', 'Remove this bounty?': 'حذف هذه المهمة؟',
    'Post your own quests with your own reward, like "Clean the car, 80 XP".': 'انشر مهامك الخاصة بمكافأتك الخاصة، مثل "غسل السيارة، 80 XP".', '+ Post a bounty': '+ انشر مهمة',
    'Got a task you keep putting off? Open it and switch on': 'عندك مهمة تؤجلها دائمًا؟ افتحها وفعّل',
    'It gets angrier (and worth more XP) every day it waits.': 'يزداد غضبها (وقيمتها من XP) كل يوم تنتظر فيه.', 'Fresh today': 'جديدة اليوم',
    'What are you quitting?': 'ما الذي تتركه؟', 'e.g. Vaping, Doomscrolling, Energy drinks': 'مثل: الفيب، التصفّح اللانهائي، مشروبات الطاقة',
    'Stop tracking this? Its XP stays.': 'إيقاف تتبّع هذه العادة؟ يبقى XP الخاص بها.', 'Slipped today. Tomorrow is day 1 again': 'زللت اليوم. غدًا يبدأ العد من اليوم 1',
    'I slipped': 'زللت', '+15 XP each day': '+15 XP كل يوم', '+ Add a habit to quit': '+ أضف عادة لتتركها',
    'Quitting something? Every clean day gives Discipline XP. A slip shows as a debuff for that day, then you start again.': 'تترك شيئًا ما؟ كل يوم نظيف يعطيك XP في الانضباط. والزلّة تظهر كعقوبة في ذلك اليوم، ثم تبدأ من جديد.',
    // Party and pet
    'Set her up on the Gwen tab to join your party': 'جهّزها من تبويب غوين لتنضم إلى فريقك',
    'Gives you her daily quest. Talk, play and study with her to raise the bond.': 'تعطيك مهمتها اليومية. تحدّث والعب وادرس معها لتقوّي الرابط.',
    'Adopt a pet': 'تبنَّ حيوانًا أليفًا', 'It hatches and grows with every day you earn XP, and gets sad when you skip days.': 'يفقس ويكبر مع كل يوم تكسب فيه XP، ويحزن عندما تتغيّب.',
    'Fox': 'ثعلب', 'Cat': 'قطة', 'Dragon': 'تنين', 'Owl': 'بومة', 'Egg': 'بيضة', 'Baby': 'صغير', 'Young': 'يافع', 'Adult': 'بالغ', 'Legendary': 'أسطوري',
    'e.g. Kitsu': 'مثل: كيتسو', 'Happy': 'سعيد', 'Missing you': 'يشتاق إليك', 'Asleep, waiting for you': 'نائم، ينتظرك', 'Fully grown': 'اكتمل نموه',
    // Report, vs, season, ranked, ghost, pass, journal, heatmap
    'What does Gwen think?': 'ما رأي غوين؟', 'Tasks done': 'المهام المنجزة', 'Perfect days': 'الأيام الكاملة', 'Focus minutes': 'دقائق التركيز', 'Now': 'الآن', 'Then': 'آنذاك',
    'Bronze': 'برونزي', 'Silver': 'فضي', 'Gold': 'ذهبي', 'Platinum': 'بلاتيني', 'Diamond': 'ماسي', 'Champion': 'بطل',
    'Weekly ranked': 'التصنيف الأسبوعي', 'ranked up last week': 'ترقّيت الأسبوع الماضي', 'dropped last week': 'تراجعت الأسبوع الماضي', 'Rank-up locked in for Sunday': 'الترقية مضمونة يوم الأحد',
    'You': 'أنت', 'Ghost': 'الشبح', 'Neck and neck': 'متعادلان', 'Complete!': 'اكتملت!', 'Loot every 5 tiers': 'غنائم كل 5 مستويات',
    'One line about today…': 'سطر واحد عن اليوم…', 'Save +10 XP': 'حفظ +10 XP', 'No XP that day.': 'لا XP في ذلك اليوم.',
    // Dungeon, Gwen's bet, duel
    'Floor 1: finish any task within 60 minutes': 'الطابق 1: أنجز أي مهمة خلال 60 دقيقة', 'Dungeon cleared': 'تم تطهير الزنزانة', 'DUNGEON CLEARED': 'تم تطهير الزنزانة!',
    '+400 XP in total': '+400 XP إجمالًا', 'Enter the dungeon': 'ادخل الزنزانة', 'Cleared! Come back tomorrow.': 'تم التطهير! عُد غدًا.',
    '5 floors. Clear each one by finishing a task in time: 60, 50, 40, 30, then 20 minutes. Floors pay 20 to 100 XP and the end pays a chest. Once a day.': '5 طوابق. طهّر كل طابق بإنجاز مهمة في الوقت: 60 ثم 50 ثم 40 ثم 30 ثم 20 دقيقة. الطوابق تعطي من 20 إلى 100 XP، والنهاية تعطي صندوقًا. مرة في اليوم.',
    "Each day between 8 AM and 7 PM Gwen bets you can't finish one of your tasks in time. Win for +60 XP and bond points.": 'كل يوم بين 8 ص و7 م تراهنك غوين أنك لن تنهي إحدى مهامك في الوقت. اربح لتحصل على +60 XP ونقاط رابط.',
    "Set Gwen up on the Gwen tab and she'll bet you can't finish one of your tasks in time.": 'جهّز غوين من تبويب غوين وستراهنك أنك لن تنهي إحدى مهامك في الوقت.',
    "You won Gwen's bet!": 'ربحت رهان غوين!', 'Gwen won the bet': 'غوين ربحت الرهان', "Gwen bets you can't…": 'غوين تراهن أنك لن…',
    '+60 XP and bond points': '+60 XP ونقاط رابط', 'win: +60 XP and bond points': 'الفوز: +60 XP ونقاط رابط',
    'Add your PC address (https://…ts.net) and Gwen key in Settings first': 'أضف عنوان الكمبيوتر (https://…ts.net) ومفتاح غوين من الإعدادات أولًا',
    'Your PC needs to be on to start a duel': 'يجب أن يكون الكمبيوتر يعمل لبدء التحدي', 'Invite copied': 'تم نسخ الدعوة',
    'Paste the duel link your friend sent': 'الصق رابط التحدي الذي أرسله صديقك', "That doesn't look like a duel link": 'لا يبدو هذا رابط تحدٍّ',
    'Your name in the duel': 'اسمك في التحدي', 'e.g. Sami': 'مثل: سامي', 'Leave this duel?': 'مغادرة هذا التحدي؟',
    'Race a friend to the most XP this week (Sunday to Saturday). They need the DayTrack app too. Your PC hosts the duel, like a shared list.': 'سابق صديقًا على أكثر XP هذا الأسبوع (من الأحد إلى السبت). يحتاج تطبيق DayTrack أيضًا. الكمبيوتر يستضيف التحدي مثل القائمة المشتركة.',
    'Start a duel': 'ابدأ تحدّيًا', 'Join one': 'انضم إلى تحدٍّ', 'Loading the duel…': 'جارٍ تحميل التحدي…', 'This duel has ended.': 'انتهى هذا التحدي.',
    "Couldn't reach the duel right now (is the host's PC on?).": 'تعذّر الوصول إلى التحدي الآن (هل كمبيوتر المستضيف يعمل؟).',
    'Waiting for your friend to join…': 'بانتظار انضمام صديقك…', 'Invite': 'دعوة', 'Refresh': 'تحديث', 'Leave': 'مغادرة',
    // Steps and walk mode
    "Count your steps with the phone's own step counter, take weekly challenges and watch yourself run laps.": 'احسب خطواتك بعدّاد الجوال نفسه، وخذ تحديات أسبوعية وشاهد نفسك تدور على المضمار.',
    'Turn on steps': 'فعّل الخطوات', 'Waiting for the first step count…': 'بانتظار أول قراءة للخطوات…',
    'Steps come from the phone app: turn them on there (Settings → Steps) and they show up here too.': 'الخطوات تأتي من تطبيق الجوال: فعّلها هناك (الإعدادات ← الخطوات) وستظهر هنا أيضًا.',
    'Walk mode': 'وضع المشي', 'steps today': 'خطوة اليوم', 'done!': 'تم!', "This week's challenge:": 'تحدي هذا الأسبوع:', 'steps': 'خطوة',
    'One lap = your goal': 'لفة واحدة = هدفك', 'Past challenges': 'التحديات السابقة', 'Steps goal for this week': 'هدف الخطوات لهذا الأسبوع', 'e.g. 60000': 'مثل: 60000',
    'steps this walk': 'خطوة في هذا المشي', 'km': 'كم', 'time': 'الوقت', 'kcal': 'سعرة', 'End walk': 'إنهاء المشي',
    "Steps update every few seconds from your phone's counter": 'تتحدّث الخطوات كل بضع ثوانٍ من عدّاد جوالك', 'WEEK RESULTS': 'نتائج الأسبوع',
    // ── Walks ──
    'Walks': 'المشي', 'Start a walk': 'ابدأ مشيًا', 'Back to your walk': 'العودة إلى مشيك', 'this week': 'هذا الأسبوع', 'Weekly km goal:': 'هدف الكيلومترات الأسبوعي:', 'Other': 'غير ذلك',
    'Local legend': 'أسطورة المكان', 'Recent walks': 'آخر المشاوير', '🗺️ Heatmap': '🗺️ خريطة المشي', '📈 Trend': '📈 التطور', '📅 Your year': '📅 سنتك',
    'Walk 50 km': 'امشِ 50 كم', 'Climb 500 m': 'اصعد 500 م', '12 walks': '12 مشوارًا', 'One 10 km walk': 'مشوار 10 كم',
    'moving': 'حركة', 'min/km': 'د/كم', 'm climbed': 'م صعود', 'full km': 'كم كامل', 'climbed': 'صعود', 'walks': 'مشاوير',
    'Hide (keeps recording)': 'إخفاء (يستمر التسجيل)', 'Splits': 'الأجزاء', '✏️ Name route': '✏️ سمِّ المسار', '📤 Share': '📤 مشاركة', '🗑️ Delete': '🗑️ حذف',
    'Fitness trend': 'تطور لياقتك', 'Your heatmap': 'خريطة مشيك', "Every route you've walked. Brighter = walked more.": 'كل مسار مشيته. الأفتح = مشيته أكثر.',
    'Bars = km per month · line = pace (higher is faster)': 'الأعمدة = كم في الشهر · الخط = السرعة (الأعلى أسرع)', 'Walk in two different months to see a trend.': 'امشِ في شهرين مختلفين لترى التطور.',
    'Allow location to draw your route on a map': 'اسمح بالموقع لرسم مسارك على الخريطة', 'Waiting for GPS…': 'بانتظار GPS…', 'Walk too short to save': 'المشي قصير جدًا للحفظ',
    'Name this route': 'سمِّ هذا المسار', 'e.g. Park loop': 'مثلًا: لفة الحديقة', 'Kilometres to walk this week': 'الكيلومترات التي ستمشيها هذا الأسبوع', 'e.g. 25': 'مثلًا 25',
    'Start a walk to record your route on a map with pace, splits and climb. Your past routes come back as a ghost to race.': 'ابدأ مشيًا لتسجيل مسارك على الخريطة مع السرعة والأجزاء والصعود. مساراتك السابقة تعود كشبح تتسابق معه.',
  };

  // ── Patterns (numbers, names, dates) ───────────────────────────────────────
  const WD = { Sun: 'الأحد', Mon: 'الإثنين', Tue: 'الثلاثاء', Wed: 'الأربعاء', Thu: 'الخميس', Fri: 'الجمعة', Sat: 'السبت',
    Sunday: 'الأحد', Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت' };
  const MO = {};
  ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].forEach((a, i) => {
    const full = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i];
    MO[full] = MO[full.slice(0, 3)] = a;
  });
  const DW = { ...WD, ...MO, AM: 'ص', PM: 'م' };
  const days = n => (n = +n) === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n <= 10 ? `${n} أيام` : `${n} يومًا`;
  const ampm = p => p === 'AM' ? 'ص' : 'م';
  // Level tab: translate x, or null so the whole pattern gives up; cap() undoes the lowercased boss challenge
  const LV = (x, f) => { const a = tr(x); return a == null ? null : f(a); };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const AR_RE = [
    [/^(Up late|Good morning|Good afternoon|Good evening), Rayan$/, (_, g) => ({ 'Up late': 'سهران يا ريان؟', 'Good morning': 'صباح الخير يا ريان', 'Good afternoon': 'نهارك سعيد يا ريان', 'Good evening': 'مساء الخير يا ريان' })[g]],
    [/^(\d+) \/ (\d+) tasks$/, 'أنجزت $1 من $2'],
    [/^Gwen added (\d+) tasks?$/, (_, n) => n === '1' ? 'أضافت غوين مهمة' : `أضافت غوين ${n} مهام`],
    [/^(\d+) left$/, 'متبقٍ $1'],
    [/^(\d+) of (\d+) steps$/, '$1 من $2 خطوات'],
    [/^(\d+) timers?$/, '$1 مؤقت'],
    [/^(\d+) min$/, '$1 دقيقة'],
    [/^(\d+)h (\d+)m$/, '$1س $2د'], [/^(\d+)h$/, '$1س'], [/^(\d+)m$/, '$1د'], [/^(\d+)d$/, '$1 يوم'],
    [/^Every (.+)$/, (_, x) => 'كل ' + T(x)],
    [/^Heads up: that's (\w+) time$/, (_, p) => `تنبيه: هذا وقت صلاة ${T(p)}`],
    [/^"([\s\S]+)" saved!$/, 'تم حفظ "$1"!'],
    [/^Reminder set for (.+)$/, (_, x) => 'تم ضبط التذكير: ' + T(x)],
    [/^Added: ([\s\S]+)$/, (_, x) => 'تمت الإضافة: ' + x.split(' · ').map(T).join(' · ')],
    [/^Play ([\s\S]+)$/, 'تشغيل $1'],
    [/^Time for: ([\s\S]+)$/, 'حان وقت: $1'],
    [/^Gwen: ([\s\S]+)$/, (_, x) => 'غوين: ' + T(x)],
    [/^Welcome back 👀 (\d+) min left on ([\s\S]+)$/, 'أهلًا بعودتك 👀 باقي $1 دقيقة على $2'],
    [/^Okay, (\d+) minutes of ([\s\S]+)\. Phone down, I'm watching 👀$/, 'حسنًا، $1 دقيقة من $2. اترك الجوال، أنا أراقبك 👀'],
    [/^(\d+) minutes of ([\s\S]+), not bad 💜 Take a little break\.$/, '$1 دقيقة من $2، ليس سيئًا 💜 خذ استراحة قصيرة.'],
    [/^(\d+) minutes of ([\s\S]+) done! Take a 5 minute break, you earned it 💜$/, 'أنهيت $1 دقيقة من $2! خذ استراحة 5 دقائق، تستحقها 💜'],
    [/^Only ([\d.]+) hours\? 😟 Go easy today, and maybe a nap later\?$/, '$1 ساعات فقط؟ 😟 خفّف على نفسك اليوم، وربما قيلولة لاحقًا؟'],
    [/^([\d.]+) hours! Someone's well rested 😌$/, '$1 ساعات! يبدو أنك مرتاح 😌'],
    [/^([\d.]+) hours of sleep, not bad 💜$/, '$1 ساعات نوم، ليس سيئًا 💜'],
    [/^([\d.]+) hours logged$/, 'سُجّلت $1 ساعات'],
    [/^Average ([\d.]+) hours$/, 'المتوسط $1 ساعات'],
    [/^Average ([\s\S]+)$/, 'المتوسط $1'],
    [/^We just reached bond level (\d+)! We're getting closer, you know that\?$/, 'وصلنا إلى مستوى الرابط $1! نقترب من بعضنا أكثر، أتعرف ذلك؟'],
    [/^Bond level (\d+)$/, 'مستوى الرابط $1'],
    [/^You finished "([\s\S]+)"! I'm so proud of you 💜$/, 'أنهيت "$1"! أنا فخورة بك جدًا 💜'],
    [/^(\d+) days together$/, (_, n) => `${days(n)} معًا`],
    [/^(.+) (is today!|is tomorrow|in (\d+) days)$/, (_, w, k, n) => { const a = tr(w); return a == null ? null : `${a} ${k === 'is today!' ? 'اليوم!' : k === 'is tomorrow' ? 'غدًا' : `بعد ${days(n)}`}`; }],
    [/^Moved to (.+)$/, (_, x) => 'نُقلت إلى ' + (x === 'today' ? 'اليوم' : T(x))],
    [/^build (\d+)$/, 'إصدار $1'],
    [/^Didn't send: ?([\s\S]*)$/, 'لم يُرسل: $1'],
    [/^Could not reach the server \(([\s\S]*)\)$/, 'تعذّر الوصول إلى الخادم ($1)'],
    [/^Cloud: ([\s\S]+)$/, (_, x) => 'السحابة: ' + T(x)],
    [/^error (\d+)$/, 'خطأ $1'],
    [/^Mic problem: ([\s\S]+)$/, 'مشكلة في الميكروفون: $1'],
    [/^([\s\S]+) is open\. Start Gwen anyway\? Her local brain waits until the game closes\.$/, '$1 مفتوحة. تشغيل غوين رغم ذلك؟ عقلها المحلي ينتظر حتى تُغلق اللعبة.'],
    // life.js
    [/^Ramadan starts in (\d+) days?$/, (_, n) => `يبدأ رمضان بعد ${days(n)}`],
    [/^([A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2})\.( Set a Quran plan in Settings to finish a khatma in Ramadan\.)?$/, (_, d, q) => T(d) + '.' + (q ? ' اضبط خطة قرآن من الإعدادات لتختم في رمضان.' : '')],
    [/^Suhoor ends in (.+)$/, (_, x) => 'ينتهي السحور بعد ' + T(x)],
    [/^Iftar in (.+)$/, (_, x) => 'الإفطار بعد ' + T(x)],
    [/^(Fajr|Maghrib) (\d.+)$/, (_, p, t) => T(p) + ' ' + T(t)],
    [/^Day (\d+)(, fasted)?$/, (_, n, f) => `اليوم ${n}${f ? '، صائم' : ''}`],
    [/^day (\d+)$/, 'اليوم $1'],
    [/^(\d+) fasted$/, 'صمت $1'],
    [/^page (\d+) of (\d+)$/, 'صفحة $1 من $2'],
    [/^Page (\d+)$/, 'صفحة $1'],
    [/^Today (\d+) of (\d+) pages?$/, 'اليوم $1 من $2 صفحات'],
    [/^khatma by (.+)$/, (_, x) => 'الختمة بحلول ' + T(x)],
    [/^(\d+) a day$/, '$1 يوميًا'],
    [/^Today's (\d+) pages? done 💜 Masha'Allah$/, 'صفحات اليوم ($1) تمت 💜 ما شاء الله'],
    [/^Now on page (\d+)$/, 'الآن في صفحة $1'],
    [/^([\d.,]+) SAR$/, '$1 ريال'],
    [/^([\d,]+) vs last month so far$/, '$1 مقارنة بنفس الفترة من الشهر الماضي'],
    [/^Logged ([\s\S]+)$/, 'سُجّل: $1'],
    [/^Saved ([\s\S]+)$/, 'تم حفظ $1'],
    [/^Share "([\s\S]+)" with someone\? They get a link that opens only this list\.$/, 'مشاركة "$1" مع شخص؟ سيصله رابط يفتح هذه القائمة فقط.'],
    [/^([\s\S]+): added (\d+) tasks?$/, (_, r, n) => `${r}: أُضيفت ${n === '1' ? 'مهمة' : n + ' مهام'}`],
    [/^([\s\S]+) is already on your list$/, '$1 موجود في قائمتك بالفعل'],
    [/^From ([\s\S]+)$/, 'من $1'],
    [/^(\d+)\/(\d+) steps$/, '$1/$2 خطوة'],
    [/^([\d,]+) steps today$/, '$1 خطوة اليوم'],
    [/^([\d,]+) steps today! Look at you go 🚶💜$/, '$1 خطوة اليوم! ما شاء الله عليك 🚶💜'],
    [/^Steps on: a daily "Walk" habit, goal ([\d,]+) \(edit it to change\)$/, 'تم تفعيل الخطوات: عادة "المشي" اليومية، الهدف $1 (عدّلها للتغيير)'],
    [/^Edit ([\s\S]+)$/, 'تعديل $1'],
    // levels.js
    [/^Lv (\d+)$/, 'المستوى $1'],
    [/^Lv (\d+) → (\d+)$/, 'المستوى $1 ← $2'],
    [/^Level (\d+)$/, 'المستوى $1'],
    [/^Level (\d+)! Look at you getting stronger every day 💜$/, 'المستوى $1! ما شاء الله، تزداد قوة كل يوم 💜'],
    [/^(Legend|Grandmaster|Master|Elite|Veteran|Warrior|Adept|Apprentice|Novice) (Fighter|Scholar|Monk|Adventurer|Beginner)$/, (_, r, c) => `${AR[c]} ${AR[r]}`],
    [/^([\d,]+) XP to level (\d+)$/, 'باقي $1 XP للمستوى $2'],
    [/^([\d,]+) to level (\d+)$/, 'باقي $1 للمستوى $2'],
    [/^([\d,]+) to Lv (\d+)$/, 'باقي $1 للمستوى $2'],
    [/^\+(\d+) today$/, '+$1 اليوم'],
    [/^\+(\d+) XP today$/, '+$1 XP اليوم'],
    [/^You reached Level (\d+)$/, 'وصلت إلى المستوى $1'],
    [/^([\s\S]+) reached Lv (\d+)$/, (_, x, n) => { const a = tr(x); return a == null ? null : `${a} وصلت إلى المستوى ${n}`; }],
    [/^from ([\s\S]+)$/, (_, x) => 'من ' + T(x)],
    [/^([\s\S]+) \(deleted, XP kept\)$/, '$1 (محذوفة، والنقاط باقية)'],
    [/^([A-Z][a-z]+) (\d+)$/, (_, x, n) => has.call(AR, x) ? `${AR[x]} ${n}` : null],
    [/^([\s\S]+) \+(\d+)$/, (_, x, n) => { const a = tr(x); return a == null ? null : `${a} +${n}`; }],
    [/^Trains ([\s\S]+)$/, (_, x) => 'تدرّب ' + T(x)],
    [/^(\d+)\/(\d+) mastered$/, 'أتقنت $1 من $2'],
    [/^Mastered ([\s\S]+)$/, (_, x) => 'أتقنتها ' + (x === 'today' ? 'اليوم' : T(x))],
    [/^(Now|Start): ([\s\S]+)$/, (_, k, x) => (k === 'Now' ? 'الآن: ' : 'ابدأ: ') + T(x)],
    [/^([\s\S]+) practice$/, (_, x) => { const a = tr(x); return a == null ? null : `تمرين: ${a}`; }],
    [/^"([\s\S]+)" added to your tasks(?: on ([\s\S]+))?$/, (_, x, d) => `أُضيفت "${T(x)}" إلى مهامك${d ? ' أيام ' + T(d) : ''}`],
    [/^Nothing yet\. Add a task with a word like "(.+)" in its name, or pick (.+) under "Levels up" when you add one\.$/, (_, w, x) => `لا شيء بعد. أضف مهمة في اسمها كلمة مثل "${w}"، أو اختر ${T(x)} تحت «يرفع مستوى» عند إضافتها.`],
    [/^(\d+) sets of (\d+)$/, '$1 مجموعات × $2'],
    // ── Level tab ──
    // Ranks with an evolved class, elite bosses
    [/^(Legend|Grandmaster|Master|Elite|Veteran|Warrior|Adept|Apprentice|Novice) (Calisthenics Master|Juggernaut|Wall Climber|Iron Core|Sprinter|Marathoner|Sage|Strategist|Artisan|Hafiz Path|Ascetic|Healer|Diplomat|Merchant Lord)$/, (_, r, c) => `${AR[c]} ${AR[r]}`],
    [/^Elite ([\s\S]+)$/, (_, x) => LV(x, a => `${a} (نخبة)`)],
    // Buffs: chips, their toasts ("🔥 Blazing: 3-day streak") and today's rare event
    [/^(?:(\S+) )?(Blazing|On fire|Streak broken|Well rested|Tired|Early bird|Brave|Good vibes|Overdue|Quest momentum|Fast learner|Prestige|Evolved|Party: Gwen|Gear|XP potion|Mega potion|Fallen|Golden day|Meteor day|Lucky day|Boss curse|Slipped|Rusty [A-Z][a-z]+): ([\s\S]+)$/, (_, ic, n, w) => LV(n, a => LV(w, b => `${ic ? ic + ' ' : ''}${a}: ${b}`))],
    [/^Rusty ([A-Z][a-z]+)$/, (_, x) => has.call(AR, x) ? `صدأ: ${AR[x]}` : null],
    [/^No ([A-Z][a-z]+) training since (.+)\. Train it to clear this$/, (_, x, d) => has.call(AR, x) ? `لا تدريب لـ${AR[x]} منذ ${T(d)}. درّبها لإزالة هذا` : null],
    [/^(\d+)-day streak$/, (_, n) => `سلسلة ${days(n)}`],
    [/^A (\d+)-day streak$/, (_, n) => `سلسلة ${days(n)}`],
    [/^Slept ([\d.]+) h$/, 'نمت $1 س'],
    [/^Only ([\d.]+) h of sleep$/, '$1 س نوم فقط'],
    [/^Up at (.+)$/, (_, t) => 'استيقظت ' + T(t)],
    [/^(\d+) tasks? past (?:their|its) day$/, (_, n) => n === '1' ? 'مهمة تجاوزت يومها' : `${n} مهام تجاوزت يومها`],
    [/^(\d+) prestige stars?$/, '$1 نجمة هيبة'],
    [/^([\s\S]+) class$/, (_, x) => LV(x, a => `فئة ${a}`)],
    [/^Revive: finish 3 tasks today \((\d+)\/3\)\. Until then −50% XP$/, 'للعودة: أنجز 3 مهام اليوم ($1/3). حتى ذلك الحين −50% XP'],
    [/^(\d+) HP left$/, 'باقي $1 صحة'],
    // Quests
    [/^Complete (\d+) tasks?$/, (_, n) => n === '1' ? 'أنجز مهمة واحدة' : `أنجز ${n} مهام`],
    [/^Earn (\d+) (\S+) ([A-Z][a-z]+) XP$/, (_, n, ic, s) => has.call(AR, s) ? `اكسب ${n} XP في ${ic} ${AR[s]}` : null],
    [/^Earn (\d+) XP$/, 'اكسب $1 XP'],
    [/^Finish every task on (\d+) days$/, 'أنجز كل المهام في $1 أيام'],
    [/^Focus (\d+) minutes with the Timer$/, 'ركّز $1 دقيقة بالمؤقت'],
    [/^Master (\d+) skill steps?$/, (_, n) => n === '1' ? 'أتقن خطوة مهارة واحدة' : `أتقن ${n} خطوات مهارة`],
    [/^Complete (\d+) goal steps?$/, (_, n) => n === '1' ? 'أنجز خطوة هدف واحدة' : `أنجز ${n} خطوات من أهدافك`],
    [/^Log your sleep (\d+) nights$/, 'سجّل نومك $1 ليالٍ'],
    [/^Gwen's quest(?: \((.+?)\))?: ([\s\S]+)$/, (_, w, t) => `مهمة غوين${w ? ' (' + T(w) + ')' : ''}: ${t}`],
    [/^Claim \+(\d+)$/, 'استلم +$1'],
    [/^Quest: ([\s\S]+)$/, (_, x) => 'مهمة: ' + T(x)],
    [/^resets in (\d+) h$/, 'تتجدد بعد $1 س'],
    [/^(\d+) days left$/, (_, n) => `باقي ${days(n)}`],
    [/^COMBO ×(\d+)$/, 'كومبو ×$1'], [/^Combo ×(\d+)$/, 'كومبو ×$1'],
    [/^next task within (\d+) min for ×(\d+)$/, 'المهمة التالية خلال $1 دقيقة لـ ×$2'],
    [/^Day (\d+) login reward$/, 'مكافأة دخول اليوم $1'],
    [/^Come back tomorrow for day (\d+)$/, 'عُد غدًا لليوم $1'],
    // Bosses
    [/^([\s\S]+) defeated!?$/, (_, x) => LV(x, a => `هُزم ${a}!`)],
    [/^([\s\S]+) escaped$/, (_, x) => LV(x, a => `هرب ${a}`)],
    [/^([\s\S]+) is here!$/, (_, x) => LV(x, a => `${a} هنا!`)],
    [/^(\d)\/3 strikes$/, '$1/3 ضربات'],
    [/^(\d+) min left$/, 'باقي $1 دقيقة'],
    [/^(\d+):(\d\d) left$/, 'باقي $1:$2'],
    [/^(See you next Friday|Next boss tomorrow)\. Wins so far: (\d+)$/, (_, a, n) => `${AR[a]}. انتصاراتك حتى الآن: ${n}`],
    [/^([\s\S]+) arrives at (.+)\. One hour, three strikes, big loot\.$/, (_, x, t) => LV(x, a => `${a} يصل الساعة ${T(t)}. ساعة واحدة، ثلاث ضربات، غنائم كبيرة.`)],
    [/^It shows up at a random time between (.+) and (.+)\. Keep your phone close\.$/, (_, a, b) => `يظهر في وقت عشوائي بين ${T(a)} و${T(b)}. أبقِ جوالك قريبًا.`],
    [/^One boss a day at a random time \(sometimes an elite\)\. You get (\d+) minutes to do its challenge\. A world boss comes every Friday night\.$/, 'زعيم واحد كل يوم في وقت عشوائي (أحيانًا زعيم نخبة). لديك $1 دقيقة لتنفيذ تحدّيه. وزعيم العالم يأتي كل ليلة جمعة.'],
    [/^Win: \+(\d+) XP and (?:(\d+) )?loot$/, (_, x, n) => `الفوز: +${x} XP و${n ? n + ' غنائم' : 'غنيمة'}`],
    [/^beaten in (\d+) min$/, 'هُزم في $1 دقيقة'],
    [/^Beat ([\s\S]+)$/, (_, x) => LV(x, a => `هزمت ${a}`)],
    [/^I am ([\s\S]+?)\. You'll never ([\s\S]+)!$/, (_, n, t) => LV(n, a => LV(cap(t), b => `أنا ${a}. لن تستطيع أبدًا: ${b}!`))],
    [/^([\s\S]+) has come for your XP!$/, (_, n) => LV(n, a => `${a} جاء ليأخذ XP الخاص بك!`)],
    [/^Ha! ([\s\S]+)\? You're too weak, Rayan!$/, (_, t) => LV(t, b => `ها! ${b}؟ أنت أضعف من ذلك يا ريان!`)],
    [/^Your excuses feed me\. Try to ([\s\S]+), I dare you\.$/, (_, t) => LV(cap(t), b => `أعذارك تُطعمني. جرّب: ${b}، أتحدّاك.`)],
    [/^The night is mine\. You'll never ([\s\S]+)\.$/, (_, t) => LV(cap(t), b => `الليل لي. لن تستطيع أبدًا: ${b}.`)],
    [/^(\d+) of (\d+) bosses beaten\. Tap one you've beaten to fight it again for practice \(no XP, just your best time\)\.$/, 'هزمت $1 من $2 زعيمًا. اضغط على زعيم هزمته لتقاتله مجددًا للتدريب (بلا XP، فقط أفضل وقت).'],
    [/^beaten (\d+)×(?: \((\d+) elite\))?$/, (_, n, e) => `هُزم ${n}×${e ? ` (${e} نخبة)` : ''}`],
    [/^Fastest ([\d:–]+)$/, 'الأسرع $1'],
    [/^practice ([\d:–]+)$/, 'تدريب $1'],
    [/^best ([\d:–]+)$/, 'الأفضل $1'],
    [/^Practice: no XP, no curse\. Best time ([\d:–]+)$/, 'تدريب: بلا XP ولا لعنة. أفضل وقت $1'],
    [/^New best time: ([\d:]+)$/, 'أفضل وقت جديد: $1'],
    // Achievements, perks, story
    [/^(\d+) of (\d+) unlocked$/, 'فتحت $1 من $2'],
    [/^Title: ([\s\S]+)$/, (_, x) => 'اللقب: ' + T(x)],
    [/^([A-Z][a-z]+) level (\d+)$/, (_, x, n) => has.call(AR, x) ? `المستوى ${n} في ${AR[x]}` : null],
    [/^Reach level (\d+)( \(Warrior\))?$/, (_, n, w) => `صِل إلى المستوى ${n}${w ? ' (محارب)' : ''}`],
    [/^Master of ([\s\S]+)$/, (_, x) => LV(x, a => `سيد ${a}`)],
    [/^([\s\S]+) Master$/, (_, x) => LV(x, a => `سيد ${a}`)],
    [/^Unlocks with ([\s\S]+)$/, (_, x) => LV(x, a => `يُفتح مع ${a}`)],
    [/^([A-Z][a-z]+) Champion$/, (_, m) => MO[m] ? `بطل ${MO[m]}` : null],
    [/^Do (\d+) push-ups in one day$/, 'قم بـ $1 ضغطة في يوم واحد'],
    [/^(\d+) perk points? to spend!$/, 'لديك $1 من نقاط المزايا لتنفقها!'],
    [/^You get a point every 5 levels\.(?: Next at level (\d+)\.)?$/, (_, n) => 'تحصل على نقطة كل 5 مستويات.' + (n ? ` التالية عند المستوى ${n}.` : '')],
    [/^Pick ([\s\S]+?)\? ([\s\S]+)\. Perks are forever\.$/, (_, a, b) => `اختيار ${T(a)}؟ ${T(b)}. المزايا دائمة.`],
    [/^Perk unlocked: ([\s\S]+)$/, (_, x) => 'فُتحت ميزة: ' + T(x)],
    [/^Chapter (\d+)$/, 'الفصل $1'],
    [/^Chapter (\d+): ([\s\S]+)$/, (_, n, x) => `الفصل ${n}: ${T(x)}`],
    [/^Finish chapter (\d+) \(\+(\d+) XP and loot\)$/, 'أنهِ الفصل $1 (+$2 XP وغنائم)'],
    [/^(PRESTIGE|CHAPTER|PASS TIER) (\d+)( COMPLETE)?$/, (_, k, n) => ({ PRESTIGE: `الهيبة ${n}`, CHAPTER: `اكتمل الفصل ${n}`, 'PASS TIER': `مستوى التذكرة ${n}` })[k]],
    [/^([\d,]+) (days|tasks|reps|sec)$/, (_, n, u) => u === 'days' ? days(n.replace(/,/g, '')) : `${n} ${({ tasks: 'مهمة', reps: 'تكرار', sec: 'ثانية' })[u]}`],
    [/^Most ([\s\S]+) in a day$/, 'الأكثر من $1 في يوم'],
    [/^\(last: (.+)\)$/, '(السابق: $1)'],
    // Bag, shop, crafting, gear
    [/^([\s\S]+) ×(\d+)$/, (_, x, n) => LV(x, a => `${a} ×${n}`)],
    [/^([\d,]+) coins$/, '$1 عملة'],
    [/^You need (\d+) more coins$/, 'تحتاج $1 عملة إضافية'],
    [/^Buy ([\s\S]+) for (\d+) coins\?$/, (_, x, n) => `شراء ${T(x)} مقابل ${n} عملة؟`],
    [/^(\d+) (Streak freeze|XP potion|Quest reroll|Mega potion)s? → ([\s\S]+)$/, (_, n, a, b) => `${n} × ${AR[a]} ← ${T(b)}`],
    [/^You need (\d+) (Streak freeze|XP potion|Quest reroll|Mega potion)s$/, (_, n, a) => `تحتاج ${n} × ${AR[a]}`],
    [/^([\s\S]+) used$/, (_, x) => LV(x, a => `تم استخدام ${a}`)],
    [/^Freeze (.+) so your streak carries on\?$/, (_, d) => `تجميد ${T(d)} لتستمر سلسلتك؟`],
    [/^Last bought: ([\s\S]+?), ([A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2})$/, (_, x, d) => `آخر شراء: ${T(x)}، ${T(d)}`],
    [/^e\.g\. (\d+)$/, 'مثل: $1'],
    [/^Achievements unlock gear\. Equip one piece per slot: \+(\d+)% XP now\.$/, 'الإنجازات تفتح العتاد. جهّز قطعة واحدة لكل خانة: +$1% XP الآن.'],
    [/^\+(\d+)% XP · on$/, '+$1% XP · مُجهّز'],
    // Bounties, mini bosses, quitting, pet, party
    [/^Done \+(\d+)$/, 'تم +$1'],
    [/^Waiting (\d+) days?, getting angrier$/, (_, n) => `تنتظر منذ ${days(n)}، ويزداد غضبها`],
    [/^(\d+) days? clean$/, (_, n) => `نظيف منذ ${days(n)}`],
    [/^Slipped on ([\s\S]+) today\? No shame, the count restarts and you go again\.$/, 'زللت في "$1" اليوم؟ لا عيب في ذلك، يبدأ العد من جديد وتحاول مرة أخرى.'],
    [/^(Egg|Baby|Young|Adult|Legendary) (fox|cat|dragon|owl)$/, (_, s, k) => { const a = AR[cap(k)]; return s === 'Egg' ? `بيضة ${a}` : `${a} ${AR[s]}`; }],
    [/^(\d+) more active days? to (Baby|Young|Adult|Legendary)$/, (_, n, s) => `باقي ${days(n)} من النشاط ليصبح ${AR[s]}`],
    [/^Name your (fox|cat|dragon|owl)$/, (_, k) => `اختر اسمًا لحيوانك (${AR[cap(k)]})`],
    [/^party buff \+(\d+)% XP$/, 'تعزيز الفريق +$1% XP'],
    // Report, vs, season, ranked, ghost, pass
    [/^Last week, (.+) to (.+), compared with the 4 weeks before$/, (_, a, b) => `الأسبوع الماضي، من ${T(a)} إلى ${T(b)}، مقارنة بالأسابيع الأربعة قبله`],
    [/^The first (\d+) days? of this month vs the same days last month$/, (_, n) => `أول ${days(n)} من هذا الشهر مقابل الأيام نفسها من الشهر الماضي`],
    [/^([\d,]+) to (Silver|Gold|Platinum|Diamond|Champion)$/, (_, n, t) => `باقي ${n} للوصول إلى ${AR[t]}`],
    [/^(\d{4}) S(\d) (Bronze|Silver|Gold|Platinum|Diamond|Champion)$/, (_, y, s, t) => `${y} م${s} ${AR[t]}`],
    [/^(★+) Prestige (\d+)$/, '$1 الهيبة $2'],
    [/^(Bronze|Silver|Gold|Platinum|Diamond|Master) (III|II|I)$/, (_, t, n) => `${t === 'Master' ? 'خبير' : AR[t]} ${n}`],
    [/^([\d,]+) XP more this week to rank up$/, 'باقي $1 XP هذا الأسبوع للترقية'],
    [/^under ([\d,]+) you drop$/, 'تحت $1 تتراجع'],
    [/^([\d,]+) XP ahead of last week's you$/, 'متقدّم بـ $1 XP على نفسك في الأسبوع الماضي'],
    [/^([\d,]+) XP behind last week's you\. Catch up!$/, 'متأخر بـ $1 XP عن نفسك في الأسبوع الماضي. الحق به!'],
    [/^the ghost is last week up to the same day \(it ended on ([\d,]+)\)$/, 'الشبح هو أسبوعك الماضي حتى اليوم نفسه (انتهى عند $1)'],
    [/^Tier (\d+)\/30$/, 'المستوى $1/30'],
    [/^a tier every (\d+) XP this month$/, 'مستوى كل $1 XP هذا الشهر'],
    [/^([\d,]+) XP to tier (\d+)$/, 'باقي $1 XP للمستوى $2'],
    [/^Tier 30: double loot and the title “(.+)”$/, (_, x) => `المستوى 30: غنائم مضاعفة ولقب «${T(x)}»`],
    [/^Claim the tier (\d+) reward$/, 'استلم مكافأة المستوى $1'],
    [/^(A week|A month|A year) ago you wrote$/, (_, x) => ({ 'A week': 'قبل أسبوع', 'A month': 'قبل شهر', 'A year': 'قبل سنة' })[x] + ' كتبت'],
    [/^([\d,]+) active days this year$/, '$1 يوم نشاط هذا العام'],
    // Skills: tree nodes ("Core path 0/6"), lock line, mastery stars
    [/^([\s\S]+) (\d+)\/(\d+)$/, (_, x, a, b) => LV(x, t => `${t} ${a}/${b}`)],
    [/^in ([\s\S]+)$/, (_, x) => LV(x, a => `في ${a}`)],
    [/^Train it on (\d+) more days? for star (\d) \(\+(\d+) XP\)$/, (_, n, s, x) => `درّبها ${days(n)} أخرى للنجمة ${s} (+${x} XP)`],
    [/^([\s\S]+) training$/, (_, x) => LV(x, a => `تدريب: ${a}`)],
    [/^([\s\S]+) mastery ★(\d)$/, (_, x, n) => LV(x, a => `إتقان ${a} ★${n}`)],
    // Dungeon, bet, duel
    [/^Floor (\d+) cleared! Floor (\d+): next task within (\d+) minutes$/, 'تم تطهير الطابق $1! الطابق $2: المهمة التالية خلال $3 دقيقة'],
    [/^The dungeon closed on floor (\d+)\. Try again tomorrow\.$/, 'أُغلقت الزنزانة عند الطابق $1. حاول مجددًا غدًا.'],
    [/^Floor (\d+): finish a task within (\d+) min \(\+(\d+) XP\)$/, 'الطابق $1: أنجز مهمة خلال $2 دقيقة (+$3 XP)'],
    [/^Dungeon floor (\d+)$/, 'طابق الزنزانة $1'],
    [/^“([\s\S]+)” before (.+?)(\. There's always tomorrow 😏)?$/, (_, x, t, l) => `«${x}» قبل ${T(t)}${l ? '. هناك دائمًا غد 😏' : ''}`],
    [/^Won Gwen's bet: ([\s\S]+)$/, 'ربحت رهان غوين: $1'],
    [/^([\s\S]+) \(you\)$/, '$1 (أنت)'],
    // Steps and walk mode
    [/^([\d.]+) km$/, '$1 كم'],
    [/^([\d,]+) to go, (\d+) days? left$/, (_, n, d) => `باقي ${n}، ومتبقٍ ${days(d)}`],
    [/^you last week by today \(([\d,]+)\)$/, 'أنت الأسبوع الماضي حتى اليوم ($1)'],
    [/^([\d,]+) steps this week\. Take a challenge to race it on the track:$/, '$1 خطوة هذا الأسبوع. خذ تحدّيًا لتسابقها على المضمار:'],
    [/^Week of (.+)$/, (_, d) => 'أسبوع ' + T(d)],
    [/^([\d,]+) \/ ([\d,]+) today$/, '$1 / $2 اليوم'],
    [/^([\d,]+) steps$/, '$1 خطوة'],
    [/^(\d+)k$/, '$1 ألف'],
    [/^Challenge: ([\d,]+) (✓ beaten!|✗ not this time)$/, (_, n, r) => `التحدي: ${n} ${r[0] === '✓' ? '✓ تم التغلب عليه!' : '✗ ليس هذه المرة'}`],
    [/^Challenge on: ([\d,]+) steps by Saturday night \(\+(\d+) XP\)$/, 'بدأ التحدي: $1 خطوة قبل ليلة السبت (+$2 XP)'],
    [/^Walk done: ([\d,]+) steps in (\d+) min$/, 'انتهى المشي: $1 خطوة في $2 دقيقة'],
    [/^Elevation \((\d+)–(\d+) m\)$/, 'الارتفاع ($1–$2 م)'],
    [/^([A-Z][a-z]+) badges$/, (_, m) => MO[m] ? 'أوسمة ' + MO[m] : null],
    [/^(\d+)(?:st|nd|rd|th) time on this route(.*)$/, (_, n, r) => `المرة ${n} على هذا المسار` + r.replace(/(\d+:\d+) faster than your best/, '$1 أسرع من أفضل وقت لك').replace(/(\d+:\d+) off your best/, '$1 أبطأ من أفضل وقت لك')],
    [/^walked (\d+)×$/, 'مشيته $1×'],
    [/^Walk: ([\d.]+) km$/, 'مشي: $1 كم'],
    [/^New record: (Longest walk|Fastest km|Biggest climb)$/, (_, x) => 'رقم جديد: ' + ({'Longest walk': 'أطول مشي', 'Fastest km': 'أسرع كيلو', 'Biggest climb': 'أكبر صعود'})[x]],
    [/^🏅 (.+)$/, (_, x) => '🏅 ' + x.replace('Longest walk', 'أطول مشي').replace('Fastest km', 'أسرع كيلو').replace('Biggest climb', 'أكبر صعود')],
    [/^Distance challenge: ([\d.]+) km$/, 'تحدي المسافة: $1 كم'],
    [/^Km (\d+)$/, 'كم $1'],
    [/^([\d.]+) km route from (.+)$/, (_, k, d) => `مسار ${k} كم من ${T(d)}`],
    [/^(.+) walk$/, (_, d) => /^[A-Z][a-z]{2}, /.test(d) ? 'مشي ' + T(d) : null],
    [/^Step challenge: ([\d,]+) steps$/, 'تحدي الخطوات: $1 خطوة'],
    // What earned XP (log, stat sheet, day sheet): user text kept as is
    [/^Mini boss slain: ([\s\S]+?)(?: \(waited (\d+) days?\))?$/, (_, x, n) => `هزمت الزعيم الصغير: ${x}${n ? ` (انتظرت ${days(n)})` : ''}`],
    [/^Missed hardcore: ([\s\S]+)$/, 'فاتتك مهمة قاسية: $1'],
    [/^Journal: ([\s\S]+)$/, 'اليوميات: $1'],
    [/^Bounty: ([\s\S]+)$/, 'مهمة مكافأة: $1'],
    [/^Clean day: ([\s\S]+)$/, 'يوم نظيف: $1'],
    [/^([\s\S]+): (\d+) clean days \(kept\)$/, '$1: $2 أيام نظيفة (محفوظة)'],
    // Heatmap and journal tooltips ("Wed, Oct 7: 120 XP"), skill tree tooltips ("Core path: Plank")
    [/^([A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}): ([\s\S]+)$/, (_, d, x) => `${T(d)}: ${x}`],
    [/^([^:]+): ([\s\S]+)$/, (_, a, b) => LV(a, x => LV(b, y => `${x}: ${y}`))],
    // Dates and times from toLocaleDateString('en-US') and fmt12()
    [/^([A-Z][a-z]+), ([A-Z][a-z]+) (\d{1,2})$/, (_, w, m, d) => WD[w] && MO[m] ? `${WD[w]}، ${d} ${MO[m]}` : null],
    [/^([A-Z][a-z]+), ([A-Z][a-z]+) (\d{1,2}) (\d{1,2}:\d{2})\s(AM|PM)$/, (_, w, m, d, t, p) => WD[w] && MO[m] ? `${WD[w]}، ${d} ${MO[m]} ${t} ${ampm(p)}` : null],
    [/^([A-Z][a-z]+) (\d{1,2})$/, (_, m, d) => MO[m] ? `${d} ${MO[m]}` : null],
    [/^([A-Z][a-z]+) (\d{4})$/, (_, m, y) => MO[m] ? `${MO[m]} ${y}` : null],
    [/^(\d{1,2}:\d{2})\s(AM|PM)$/, (_, t, p) => `${t} ${ampm(p)}`],
  ];

  // The "How DayTrack Works" sheet: whole paragraphs, keyed by their heading
  const INFO = {
    '✅ Tasks': `اضغط زر ${b('+')} لإنشاء مهمة. اختر ${b('مرة واحدة')} لمهمة ليوم واحد، أو ${b('متكررة 🔄')} لتكرارها في أيام محددة من الأسبوع (أو كل يوم). يمكن تحديد يوم للمهمة التي تُنجز مرة واحدة، والمهام المستقبلية تبقى باهتة حتى يحين يومها. اضغط على المهمة لتعليمها كمُنجزة، أو اسحبها إلى اليمين. واسحبها إلى اليسار لنقلها إلى الغد. اضغط ${b('⋯')} لتعديلها أو حذفها أو تغيير ترتيبها. المهام ذات الوقت تُرتّب في الصباح والظهيرة والمساء. اضغط مطولًا على زر ${b('+')} لتقول مهمة بصوتك (بالإنجليزية، مثل "dentist Tuesday at 3"). يمكن أن يكون للمهمة المتكررة ${b('عدّ')} (8 أكواب ماء): كل ضغطة تضيف واحدًا، و⋯ تنقص واحدًا. وتحت مهامك تجد ${b('🎯 الأهداف')} (هدف مقسّم إلى خطوات، وتسأل غوين عنه إذا توقف) و${b('📝 القوائم')} (بقالة، أفلام… وغوين تستطيع الإضافة إليها).`,
    '🔴 Priority': `عند إضافة مهمة، اختر أولوية <b style="color:#EF4444;">عالية</b> أو <b style="color:#F97316;">متوسطة</b> أو <b style="color:#6C63FF;">منخفضة</b>. تظهر نقطة ملوّنة في صف المهمة لتعرف الأهم بنظرة سريعة.`,
    '📋 Subtasks': `قسّم المهمة إلى خطوات أصغر بإضافة مهام فرعية عند إنشائها. اكتب الخطوة واضغط ${b('Enter')} (أو اضغط +). وفي قائمة المهام اضغط على شارة ${b('📋 X/Y')} لعرض الخطوات وتعليمها واحدة تلو الأخرى.`,
    '⏰ Reminders': `اضبط تذكيرًا ${b('في وقت محدد')} (ينطلق مرة واحدة في ساعة معينة) أو ${b('كل… 🔁')} (يتكرر على فترات، مثل كل ساعتين). تصلك التذكيرات كإشعارات حتى والتطبيق مغلق — فقط فعّل الإشعارات من الإعدادات أولًا. على أندرويد يمكنك الضغط على ${b('✅ تم')} أو ${b('⏰ 10 دقائق')} أو ${b('📅 غدًا')} مباشرة من التذكير. والنص الذي تشاركه من تطبيق آخر يتحول إلى مهمة. و${b('ساعات الهدوء')} في الإعدادات توقف تذكيرات «كل…» ليلًا.`,
    '🔥 Streaks': `أنجز ${b('كل')} مهام اليوم لتكسب يومًا في سلسلة أيامك المتتالية (تظهر أعلى تبويب المهام). وتعرض المهام المتكررة أيضًا شارة 🔥 خاصة بها — عدد الأيام المتتالية التي أنجزت فيها تلك المهمة.`,
    '⏱️ Timer': `تابع الوقت عبر عدة خطوات في جلسة واحدة. اضغط ${b('+ إضافة')} لكل خطوة وسمّها، ثم ▶ للبدء / ⏸ للإيقاف المؤقت / ✓ لتثبيتها. واضغط ${b('💾 حفظ الجلسة')} عند الانتهاء — تظهر في الجلسات السابقة وتُحتسب في إحصائيات الملخص.`,
    '📅 Calendar': `اضغط على أي يوم لترى تفاصيله: شريط الإنجاز، والمهام المُنجزة وغير المُنجزة، وقسمًا للملاحظات. النقاط الملوّنة في التقويم تبيّن النشاط: 🟢 أخضر = كل المهام مُنجزة، 🟠 برتقالي = إنجاز جزئي، بنفسجي = توجد مهام لكن لم يُنجز شيء منها. انتقل إلى ${b('أسبوع')} لترى سبعة أيام معًا واسحب مهمة إلى يوم آخر.`,
    '📊 Summary': `شاهد إحصائياتك بنظرة: إنجاز اليوم، والأيام المتتالية، وإجمالي الوقت المسجّل، وعدد الجلسات. مخطط ${b('هذا الأسبوع')} يعرض نسبة الإنجاز اليومية لآخر 7 أيام. وخريطة ${b('النشاط')} تعرض آخر 90 يومًا — كلما كان الأخضر أغمق كانت المهام المُنجزة أكثر. ${b('العادات')} تعرض كم مرة أنجزت كل مهمة متكررة في آخر 30 يومًا، و${b('المزاج')} يعرض المزاج الذي اخترته في تبويب المهام كل يوم. و${b('النوم')} يعرض أوقات نومك واستيقاظك التي تسجّلها كل صباح.`,
    '💜 Gwen': `تحدّث مع غوين عن يومك. فهي ترى مهام اليوم وما هو قادم وأيامك المتتالية ومزاجك. اطلب منها إضافة مهمة أو تذكيرك وستظهر في قائمتك. اضغط 🎤 لتحدّثها بصوتك، وترد عليك بصوتها (🔊 في المحادثة يوقفه). وتراسلك أولًا أيضًا: تحية في الصباح وتذكير لطيف في المساء إن بقي شيء، حتى والتطبيق مغلق. تجيبك من الكمبيوتر عندما يكون يعمل (💻) ومن السحابة عندما لا يعمل (☁️). اضبطها من الإعدادات. ${b('🖼 البطاقات')} تحفظ الصور التي ترسمها في بيتها، و${b('💻 الكمبيوتر')} يبيّن إن كان الكمبيوتر وغوين يعملان، ويستطيع تشغيلها أو قفله.`,
    '⭐ Level': `أنت شخصية في لعبة. كل مهمة تنجزها تعطيك XP، والكلمات في اسمها تحدد أي الإحصائيات تنمو: الضغط يدرّب ${b('الذراعين')} و${b('الصدر')}، والقرآن يدرّب ${b('الإيمان')}، والمذاكرة تدرّب ${b('الذكاء')}. اختر الإحصائيات بنفسك تحت ${b('يرفع مستوى')} عند إضافة مهمة. وإنهاء كل المهام وخطوات الأهداف وجلسات المؤقت يعطي XP أيضًا. اضغط على أي إحصائية لترى ما درّبها. في ${b('المهارات')} مسارات خطوة بخطوة (تمارين وزن الجسم، الطبخ، المال، القرآن…): ابدأ واحدًا فتنضم مهمة التمرين إلى قائمتك، واضغط ${b('أستطيع فعلها')} عندما تتقن خطوة. و${b('القصة')} تعرض كل ترقية ومن أين جاءت النقاط.`,
    '⚙️ Settings': `${b('الإشعارات الفورية')} — اضغط تفعيل لتشغيل التذكيرات في الخلفية. ${b('الوضع الداكن')} — لتبديل المظهر. ${b('المزامنة السحابية')} — نسخ احتياطي تلقائي وفتح بياناتك على جوال آخر برمزك الخاص. ${b('تصدير')} — تنزيل نسخة احتياطية JSON لكل مهامك وجلساتك وملاحظاتك. ${b('استيراد')} — الاستعادة من ملف نسخة احتياطية. ${b('مواقيت الصلاة')} — مواقيت اليوم حسب موقعك، مع تذكير اختياري عند كل صلاة، وغوين لا تضع المهام في أوقاتها. ${b('الخصوصية')} — طلب البصمة للتطبيق كاملًا أو لتبويب غوين فقط. وكل يوم أحد الساعة 8 مساءً يصلك إشعار بملخص أسبوعك.`,
  };

  // A few words mean something else in one place
  const CTX = [
    ['.db', { Su: 'ح', Mo: 'ن', Tu: 'ث', We: 'ر', Th: 'خ', Fr: 'ج', Sa: 'س' }],
    ['#heatmap', { More: 'أكثر' }],
  ];
  // Gwen's chat (and its preview on the Tasks tab) is hers: only this app chrome inside it is translated
  const CHAT = '#gwen-msgs,#gwen-hi .msg';
  const CHAT_OK = /^(Gwen is typing…|Say hi to Gwen\.|Add your Gwen key in Settings to start chatting\.|Tap to talk to me 💜|Sent you a selfie 📸|(💌|💻|☁️) .+ · 🔊 tap to hear|📝 Added: |🎵 Play )/;

  // ── Lookup ─────────────────────────────────────────────────────────────────
  const has = Object.prototype.hasOwnProperty;
  const cache = new Map();
  function core(c) {
    if (has.call(AR, c)) return AR[c];
    const j = join(c, /(\s+[·–]\s+)/); if (j != null) return j;
    for (const [re, rep] of AR_RE) {
      const m = c.match(re);
      if (m) { const v = typeof rep === 'function' ? rep(...m) : c.replace(re, rep); if (v != null) return v; }
    }
    // Emoji or symbols around a known string: "🔔 Activate", "Today · Wed, Oct 8 📝"
    const p = c.match(/^([^A-Za-z0-9"'(‹]*)([\s\S]*?)([^A-Za-z0-9.!?)"'…%]*)$/);
    if (p && (p[1] || p[3]) && p[2]) {
      const a = p[1] ? core(p[2] + p[3]) : null; if (a != null) return p[1] + a;
      const z = p[3] ? core(p[1] + p[2]) : null; if (z != null) return z + p[3];
      const v = p[1] && p[3] ? core(p[2]) : null; if (v != null) return p[1] + v + p[3];
    }
    // Pieces joined with a bare · ("Su·Mo")
    const k = join(c, /(\s*·\s*)/); if (k != null) return k;
    // Leftover date words ("Oct 4", "7:30 PM", "Wednesday, October 8 7:30 PM")
    if (/^[A-Za-z0-9\s,:]+$/.test(c)) { const w = c.match(/[A-Za-z]+/g); if (w.every(x => has.call(DW, x))) return c.replace(/[A-Za-z]+/g, x => DW[x]).replace(/,/g, '،'); }
    return null;
  }
  // Pieces joined with · or –, each translated on its own ("Today · Wed, Oct 8")
  function join(c, sep) {
    const parts = c.split(sep);
    if (parts.length < 2) return null;
    let hit = false;
    const out = parts.map((x, i) => { const t = i % 2 ? null : tr(x); if (t != null) hit = true; return t ?? x; });
    return hit ? out.join('') : null;
  }
  // Translation of s (keeping its outer whitespace), or null when there is none
  function tr(s) {
    if (!s || !/[A-Za-z]/.test(s)) return null;
    if (cache.has(s)) return cache.get(s);
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), v = core(m[2]), out = v == null ? null : m[1] + v + m[3];
    if (cache.size > 3000) cache.clear();
    cache.set(s, out);
    return out;
  }
  function T(s) { if (s == null) return s; s = String(s); const v = tr(s); return v == null ? s : v; }
  window.dtT = T;

  const _confirm = window.confirm.bind(window), _alert = window.alert.bind(window);
  window.confirm = m => _confirm(T(m));
  window.alert = m => _alert(T(m));

  // ── Walking the page ───────────────────────────────────────────────────────
  // 0: translate, 1: leave alone, 2: Gwen's chat (only CHAT_OK strings)
  function zone(el) {
    let chat = 0;
    for (; el && el.nodeType === 1; el = el.parentNode) {
      const t = el.tagName;
      if (t === 'SCRIPT' || t === 'STYLE' || t === 'TEXTAREA' || t === 'NOSCRIPT') return 1;
      if (el.getAttribute('translate') === 'no' || el.classList.contains('notranslate')) return 1;
      if (!chat && el.matches(CHAT)) chat = 2;
    }
    return chat;
  }
  const done = new WeakMap(); // node → what we last wrote, so our own writes are never looked at again
  function text(n) {
    const s = n.data;
    if (done.get(n) === s || !/[A-Za-z]/.test(s)) return;
    const p = n.parentElement;
    if (!p) return;
    const z = zone(p);
    if (z === 1 || (z === 2 && !CHAT_OK.test(s.trim()))) return;
    let v = null;
    for (const [sel, map] of CTX) if (p.closest(sel) && has.call(map, s.trim())) v = s.replace(s.trim(), map[s.trim()]);
    if (v == null) v = tr(s);
    if (v != null && v !== s) { done.set(n, v); n.data = v; }
  }
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const doneA = new WeakMap();
  function attrs(el) {
    let z = -1;
    for (const a of ATTRS) {
      const s = el.getAttribute(a);
      if (!s || !/[A-Za-z]/.test(s)) continue;
      const d = doneA.get(el) || {};
      if (d[a] === s) continue;
      if (z < 0) z = zone(el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' ? el.parentElement : el);
      if (z) return;
      const v = tr(s);
      if (v != null && v !== s) { d[a] = v; doneA.set(el, d); el.setAttribute(a, v); }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return text(root);
    if (root.nodeType !== 1) return;
    attrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === 3 ? text(n) : attrs(n);
  }
  function info() {
    document.querySelectorAll('#info-ov .sh > div').forEach(card => {
      const h = card.firstElementChild, d = h && h.nextElementSibling;
      const k = h && Object.keys(INFO).find(k => k === h.textContent.trim() || T(k) === h.textContent.trim());
      if (k && d && !d.dataset.ar) { d.innerHTML = INFO[k]; d.dataset.ar = 1; }
    });
  }

  // ── RTL fixes ──────────────────────────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
body,button,input,textarea{font-family:'Noto Sans Arabic','Segoe UI',Tahoma,-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;}
.cl,.sl,.tgrp,.int-box label,[style*="letter-spacing"]{letter-spacing:0!important;}
.cl,.sl,.nb{font-size:11px;}
#fab{right:auto;left:18px;}
.mi{text-align:right;}
.tog{transform:scaleX(-1);}
.gmini{margin-left:0;margin-right:auto;}.gmini+.gmini{margin-right:0;}
[style*="text-align:right"]{text-align:left!important;}
[style*="margin-right:-4px"]{margin-right:0!important;margin-left:-4px;}
[style*="padding:8px 0 0 44px"]{padding:8px 44px 0 0!important;}
.wk-chip{margin:3px 0 0 4px;}
.task-item[data-swipe=r]::before{content:'✓ تم';justify-content:flex-end;}
.task-item.done[data-swipe=r]::before{content:'↺ تراجع';}
.task-item[data-swipe=l]::before{content:'غدًا 📅';justify-content:flex-start;}
#tab-cal .card:first-child>div:first-child>button,#gwen-hi>div:last-child{transform:scaleX(-1);}
#gwen-msgs div,#gwen-hi .msg{unicode-bidi:plaintext;}
`;
  document.head.appendChild(css);

  const obs = new MutationObserver(list => {
    for (const r of list) try {
      if (r.type === 'characterData') text(r.target);
      else if (r.type === 'attributes') attrs(r.target);
      else r.addedNodes.forEach(n => n.isConnected && walk(n));
    } catch (e) { console.warn('ar.js', e); }
  });
  const start = () => { info(); walk(document.body); };
  obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

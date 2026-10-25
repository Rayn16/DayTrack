# Graph Report - daytrack  (2026-10-25)

## Corpus Check
- 50 files · ~94,622 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .xml 11, (none) 1, .properties 1)

## Summary
- 1322 nodes · 3434 edges · 64 communities (46 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3bd8a4d2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MainActivity
- levels.js
- heroTod
- life.js
- renderHero
- hIc
- sync.mjs
- tod0
- test-app.mjs
- Bridge
- heroAchievements
- renderLife
- Phone.java
- steps
- gwen-games.js
- heroWalkDraw
- pc.mjs
- steps
- WakeService
- heroRng
- head
- lib/house.mjs
- check-reminders.mjs
- functions/house.mjs
- BossAlarm.java
- N
- heroBossOpen
- .prefs
- heroAwards
- Phone
- heroDaily
- fn.mjs
- android.content.Context
- desktop/package.json
- pullPcApps
- appState
- keyOk
- Poller
- WalkService.java
- DayWidget
- server.js
- FocusService
- Tiles
- main.js
- heroCastPower
- manifest.json
- package.json
- build
- devDependencies
- scripts
- heroShop
- heroDetect
- heroDuelNew
- heroPass
- heroTreeFit
- heroTestSave
- heroDg
- sw.js

## God Nodes (most connected - your core abstractions)
1. `renderHero()` - 116 edges
2. `heroTod()` - 94 edges
3. `hIc()` - 71 edges
4. `Bridge` - 47 edges
5. `renderLife()` - 46 edges
6. `dAdd()` - 45 edges
7. `MainActivity` - 44 edges
8. `blobStore()` - 40 edges
9. `renderHeroMini()` - 34 edges
10. `tod0()` - 31 edges

## Surprising Connections (you probably didn't know these)
- ``GET /api/pc?key=K`` --references--> `ramadan()`  [INFERRED]
  desktop/API.md → netlify/lib/house.mjs
- `What DayTrack adds to `GET /api/house` (and `GET /api/pc`, same fields)` --references--> `text()`  [INFERRED]
  desktop/API.md → ar.js
- ``GET /api/house?key=K`` --references--> `today()`  [INFERRED]
  desktop/API.md → netlify/functions/pc.mjs
- `What the house and desktop send` --references--> `today()`  [INFERRED]
  desktop/API.md → netlify/functions/pc.mjs
- ``GET /api/house?key=K`` --references--> `status()`  [INFERRED]
  desktop/API.md → netlify/functions/pc.mjs

## Import Cycles
- None detected.

## Communities (64 total, 18 thin omitted)

### Community 0 - "MainActivity"
Cohesion: 0.06
Nodes (6): MainActivity, LocationListener, WebChromeClient, WebViewClient, RecognitionListener, LocationListener

### Community 1 - "levels.js"
Cohesion: 0.03
Nodes (61): HCOL, HERO_BASE, HERO_BOSSES, HERO_BY, HERO_CAT_COL, HERO_CRAFT, HERO_DBOSS, HERO_DG (+53 more)

### Community 2 - "heroTod"
Cohesion: 0.06
Nodes (62): dAdd(), heroAddQuit(), heroBet(), heroBountyDone(), heroBountyHtml(), heroClean(), heroComboLeft(), heroDuelHtml() (+54 more)

### Community 3 - "life.js"
Cohesion: 0.05
Nodes (46): addSpend(), ADHKAR, adhkarLeft, arDigits(), calCache, chainDoneDays(), chainHighlight(), chainPick() (+38 more)

### Community 4 - "renderHero"
Cohesion: 0.08
Nodes (47): c12(), heroAt(), heroAvatar(), heroAvEmoji(), heroAvHtml(), heroAvPhoto(), heroBar(), heroBetHtml() (+39 more)

### Community 5 - "hIc"
Cohesion: 0.12
Nodes (47): heroAchCheck(), heroBagHtml(), heroBaseHtml(), heroBetTick(), heroBonus(), heroBuild(), heroBuy(), heroClaim() (+39 more)

### Community 7 - "sync.mjs"
Cohesion: 0.08
Nodes (35): attrs(), core(), info(), join(), T(), text(), tr(), walk() (+27 more)

### Community 8 - "tod0"
Cohesion: 0.09
Nodes (37): addDays(), addMonths(), applySpread(), bdayCard(), bdayGwen(), bdayNext(), bdayNudges(), bdaysSoon() (+29 more)

### Community 9 - "test-app.mjs"
Cohesion: 0.06
Nodes (25): code, d, dir, fajr, keys, kinds, peekReq, server (+17 more)

### Community 11 - "heroAchievements"
Cohesion: 0.12
Nodes (32): heroAchievements(), heroAskGwen(), heroBestStreak(), heroBossWins(), heroDone(), heroKarma(), heroLearn(), heroLocked() (+24 more)

### Community 12 - "renderLife"
Cohesion: 0.10
Nodes (32): adhkarTap(), bdayAdd(), bdayDel(), lang(), letterCard(), lifeFast(), lifeQuestCheck(), lifeSave() (+24 more)

### Community 15 - "steps"
Cohesion: 0.07
Nodes (26): defaults, runs-on, steps, run, GH_TOKEN, jobs, build, name (+18 more)

### Community 16 - "gwen-games.js"
Cohesion: 0.10
Nodes (24): c4, C4_LINES, checkers, chess, CHESS_GLYPH, ckCrowned(), ckDirs(), ckJumps() (+16 more)

### Community 17 - "heroWalkDraw"
Cohesion: 0.15
Nodes (27): heroClock(), heroDist(), heroDistAt(), heroGhostFor(), heroHeat(), heroKm(), heroKudos(), heroMap() (+19 more)

### Community 18 - "pc.mjs"
Cohesion: 0.17
Nodes (23): gameNights(), GAMES, handler(), json(), logApp(), logGame(), processes(), startGwen() (+15 more)

### Community 19 - "steps"
Cohesion: 0.08
Nodes (25): runs-on, steps, GH_TOKEN, PW, jobs, build, name, permissions (+17 more)

### Community 21 - "heroRng"
Cohesion: 0.15
Nodes (25): heroBoss(), heroBossAt(), heroBossAtk(), heroBossCfg(), heroBossGet(), heroBossSettings(), heroCrit(), heroDBoss() (+17 more)

### Community 22 - "head"
Cohesion: 0.11
Nodes (25): editRoutine(), friendsNew(), friendsShare(), gwenSet(), head(), houseRewards(), lifeApi(), lifeHex() (+17 more)

### Community 23 - "lib/house.mjs"
Cohesion: 0.18
Nodes (22): handler(), hhmm(), blobStore(), allFound(), choreKind(), CHORES, choresTicked(), clueFound() (+14 more)

### Community 24 - "check-reminders.mjs"
Cohesion: 0.18
Nodes (18): gwenCheckin(), handler(), notify(), timeOf(), handler(), reply(), FIXED, gwenPersona() (+10 more)

### Community 25 - "functions/house.mjs"
Cohesion: 0.19
Nodes (20): `GET /api/house?key=K`, handler(), json(), outfitFile(), OUTFITS, peek(), peekDone, peeks (+12 more)

### Community 26 - "BossAlarm.java"
Cohesion: 0.15
Nodes (3): ActionReceiver, PlaceReceiver, PollReceiver

### Community 27 - "N"
Cohesion: 0.18
Nodes (21): focusBack(), focusCheck(), has(), isShop(), lifeDevStore(), lifeGetFile(), N(), phoneEvents() (+13 more)

### Community 28 - "heroBossOpen"
Cohesion: 0.18
Nodes (20): heroAlarmOff(), heroAlarmOn(), heroBook(), heroBookHtml(), heroBossClose(), heroBossLine(), heroBossList(), heroBossLoot() (+12 more)

### Community 30 - "heroAwards"
Cohesion: 0.14
Nodes (17): heroAwards(), heroBank(), heroBankQuit(), heroBuffs(), heroDay(), heroDoneDays(), heroHC(), heroMiniBossHtml() (+9 more)

### Community 32 - "heroDaily"
Cohesion: 0.19
Nodes (16): heroCostTxt(), heroDaily(), heroEnchant(), heroEnchCost(), heroEquip(), heroGearFx(), heroGearHtml(), heroGearLost() (+8 more)

### Community 33 - "fn.mjs"
Cohesion: 0.21
Nodes (9): handler(), handler(), handler(), json(), merge(), handler(), isNative(), lambda() (+1 more)

### Community 35 - "desktop/package.json"
Cohesion: 0.18
Nodes (13): dependencies, @anthropic-ai/sdk@^0.131.0, @netlify/blobs@^8.2.0, web-push@^3.6.7, description, @anthropic-ai/sdk, @netlify/blobs, web-push (+5 more)

### Community 36 - "pullPcApps"
Cohesion: 0.15
Nodes (14): adhkarCard(), adhkarDone(), adhkarNow(), fmtLeft(), focusCard(), hijri(), nowMin(), pcStudy() (+6 more)

### Community 37 - "appState"
Cohesion: 0.14
Nodes (14): appState(), chatMin(), focusShare(), gwenWeekCard(), isPhone(), joinHer(), lifeStore(), myWeek() (+6 more)

### Community 38 - "keyOk"
Cohesion: 0.23
Nodes (10): dump(), handler(), STORES, APPS, file(), handler(), json(), read() (+2 more)

### Community 43 - "server.js"
Cohesion: 0.21
Nodes (7): CORS, dailyBackup(), fileStore(), loadKeys(), NAMES, start(), fns

### Community 45 - "Tiles"
Cohesion: 0.29
Nodes (3): Add, Gwen, Tiles

### Community 46 - "main.js"
Cohesion: 0.33
Nodes (8): build(), checkUpdate(), HIDDEN_FLAG, show(), togglePanel(), trayMenu(), update(), WEB

### Community 47 - "heroCastPower"
Cohesion: 0.27
Nodes (10): heroBossAtkHtml(), heroBossAtkList(), heroCast(), heroCastPower(), heroMana(), heroManaHtml(), heroPickInit(), heroPickRender() (+2 more)

### Community 48 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 49 - "package.json"
Cohesion: 0.27
Nodes (9): dependencies, @anthropic-ai/sdk@^0.131.0, @netlify/blobs@^8.1.0, web-push@^3.6.7, @anthropic-ai/sdk, @netlify/blobs, web-push, name (+1 more)

### Community 50 - "build"
Cohesion: 0.25
Nodes (8): build, appId, files, nsis, win, artifactName, oneClick, icon

### Community 51 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, electron@^38.8.6, electron-builder@^26.15.3, electron, electron-builder

### Community 52 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, dist, start, web

### Community 53 - "heroShop"
Cohesion: 0.50
Nodes (4): heroAddReward(), heroDelReward(), heroPinHtml(), heroShop()

### Community 54 - "heroDetect"
Cohesion: 0.67
Nodes (3): heroAddBounty(), heroDetect(), heroNewSkill()

### Community 55 - "heroDuelNew"
Cohesion: 0.67
Nodes (3): heroDuelNew(), heroDuelShare(), heroHex()

### Community 56 - "heroPass"
Cohesion: 0.67
Nodes (3): heroPass(), heroPassHtml(), heroPassTitle()

### Community 57 - "heroTreeFit"
Cohesion: 0.67
Nodes (3): heroSetSeg(), heroTreeFit(), heroTreeZoom()

### Community 58 - "heroTestSave"
Cohesion: 0.67
Nodes (3): heroTestOpen(), heroTestPrev(), heroTestSave()

## Knowledge Gaps
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MainActivity` connect `MainActivity` to `Bridge`, `MainActivity.java`, `Poller.java`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `MainActivity` be split into smaller, more focused modules?**
  _Cohesion score 0.05621621621621622 - nodes in this community are weakly interconnected._
- **Why does `Bridge` connect `Bridge` to `MainActivity`, `android.content.Context`, `Poller`, `DayWidget`, `.prefs`, `Phone`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Should `levels.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03125 - nodes in this community are weakly interconnected._
- **Should `heroTod` be split into smaller, more focused modules?**
  _Cohesion score 0.05764145954521417 - nodes in this community are weakly interconnected._
- **Should `life.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05241090146750524 - nodes in this community are weakly interconnected._
- **Should `renderHero` be split into smaller, more focused modules?**
  _Cohesion score 0.07678075855689177 - nodes in this community are weakly interconnected._
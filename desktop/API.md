# DayTrack.exe: endpoints for Gwen's house and Gwen's PC side

DayTrack.exe listens on `http://127.0.0.1:5053` (the phone reaches the same thing over Tailscale at
`https://<pc>.ts.net/dt/...`). Every endpoint below is at `http://127.0.0.1:5053/api/<name>`
(the older `/.netlify/functions/<name>` path works too).

**Key:** every call carries `key`, the `"key"` value in `Documents\Gwen\daytrack.json` (Gwen's key), either in the
JSON body or as `?key=` on a GET. Wrong or missing key: `401`.
**Images:** `"image": "data:image/jpeg;base64,..."` (or png/webp), up to 8 MB. DayTrack makes the phone-sized copy itself.
Replies are JSON; `{"ok": true}` unless said otherwise.

## Gwen's house (Unity)

### `GET /api/house?key=K`
What the house should know right now. Poll it when the house starts and every few minutes.
```json
{
  "parcels": [{"id": "p-2026-10-07", "date": "2026-10-07", "size": "small", "kind": "plant",
               "reason": "Rayan finished all 5 of his tasks today", "status": "waiting"}],
  "born": "2026-09-30", "daysTogether": 7,
  "milestone": {"days": 30, "date": "2026-10-30", "today": false, "in": 23}
}
```
- `parcels` (idea 2): one per day Rayan finishes every DayTrack task. `size` is `"big"` on every 7th day of a streak.
  Added 2026-10-08 (level system): `kind: "trophy"`, `size: "big"`, id `tb-<date>` (he beat that day's daily boss) or `tw-<week start>`
  (he beat the weekly boss). The house should put a trophy on a shelf; `reason` says which boss.
  `kind` is a suggestion (`decoration`, `plant` or `book`); the house picks the actual item. `status` is `waiting`
  until the house says it's at the door (`delivered`); opened parcels drop off the list. Kept 30 days.
- Added 2026-10-08 (ideas 1-6 of the second round; every field is optional to read, unknown ones can be ignored):
  - `quest` `{id, date, where: "phone"|"house"|"pc", kind, text, done, doneBy?}`: today's quest (idea 2). One a day, taking turns
    phone → house → pc. House kinds: deer, marshmallow, walk, dance, chess, checkers, connect4, reversi, uno, pong, dishes, photo,
    yasuo, puzzle, leaves, boat, picnic, fox, piano, story. PC kinds: `hello` (he talked to her on the PC), `watch` ("watch this with me").
    Phone kinds are checked by DayTrack. When `done` turns true (whoever did it), the house gives the reward.
  - `peeks` `[{id, at}]`: the phone wants a photo of what she's doing right now (idea 4). Answer with a `peek` event within 45 s.
  - `week` `{start, lines[]}`: the week he planned with Gwen (idea 3), for the kitchen table.
  - `prayers` `{date, fajr, dhuhr, asr, maghrib, isha}` ("HH:MM", from the phone's location) or `null` when he hasn't turned prayer times on.
  - `ramadan` `{active, day, in, starts, iftar?, suhoor?}` (idea 5): `iftar` = Maghrib, `suhoor` = Fajr, only during Ramadan with prayer times on.
    Before it, `in` = days until it starts and `starts` = its first day (Umm al-Qura).
  - `now`: the last `now` event (below), with the server's `at`; `houseOpen`: the house polled in the last minute.
  - `outfit` `{outfit, by, at}`: the shared outfit file `Documents\Gwen\gwen-outfit.json` (idea 1).
  - Phone and desktop add `&from=phone` (or any `from`) so their polls don't count as the house being open.
- `GET /api/house?key=K&year=1` → `{"year": {text, firsts[], images[], at}}`, the house's part of "our first year" (idea 6).
- `milestone` (idea 5): the next of 30, 100 and 365 days since Gwen was born (`born`, from `"gwenBorn"` in
  daytrack.json, default 2026-09-30). On the day itself `today` is true; DayTrack texts Rayan about it in her
  morning hello, the house does the surprise.

### `POST /api/house`
| body | what it does |
|---|---|
| `{"key", "event": "text", "text", "image"?}` | Idea 1: Gwen texts Rayan about her day in the house, optionally with a house photo. Shows in her DayTrack chat and as a phone notification (with the photo). At most 4 a day; during his quiet hours it lands in the chat without buzzing. |
| `{"key", "event": "delivered", "id"}` | The parcel is at the house door now. |
| `{"key", "event": "opened", "id", "text"?, "image"?}` | Idea 2: she unpacked it with him; `text`/`image` go to his phone like a `text` event. |
| `{"key", "event": "postcard", "image", "title"?, "text"?}` | Idea 3: a finished painting or a good house photo. Saved to the Postcards gallery in DayTrack (he can set it as his wallpaper) and texted to him (default text "I made you something 💜"). Returns `{"ok": true, "id"}`. |
| `{"key", "event": "milestone", "days", "text"?, "image"?}` | Idea 5: a photo of her milestone surprise, texted to him. |

Added 2026-10-08:

| body | what it does |
|---|---|
| `{"key", "event": "now", "open", "activity", "kind", "room", "outfit", "since", "with_rayan", "line"}` | Idea 1: what she's doing in the house now (same fields as `Documents\Gwen\house\now.json`). Phone Gwen mentions it. Send it when it changes. |
| `{"key", "event": "outfit", "outfit", "by"?}` | Idea 1: writes `Documents\Gwen\gwen-outfit.json` (`outfit` one of Classic, Cozy, Hoodie, Pajamas, Gamer, Jubilee; `by` house/desktop/phone). |
| `{"key", "event": "quest", "id", "by"?}` | Idea 2: today's quest is done. Replies `{"ok", "quest"}`; `ok: false` if `id` isn't today's. Desktop can use `POST /api/pc {"action": "quest", "id"}`. |
| `{"key", "event": "peek", "id", "image", "activity"?}` | Idea 4: the photo for a `peeks` request. |
| `{"key", "event": "week", "start", "lines"}` | Idea 3: the phone saves the planned week (the house only reads it). |
| `{"key", "event": "year", "text", "firsts", "images"}` | Idea 6: the house's part of "our first year" (up to 12 images). |
| `"about": "what happened"` on `text`, `opened`, `postcard` and `milestone` | Idea 42: DayTrack writes the text in her own words with her persona (Claude key in daytrack.json); `text` is the fallback line if that fails. |

The phone's peek: `GET /api/house?key=K&peek=1` waits for the house's photo (up to 45 s) and returns the image (`X-Activity` header says
what she was doing), `409 {"error": "house-closed"}` when the house hasn't polled in the last minute, or `504` if it didn't answer.

Texts are her own words, written by the house's brain (DayTrack doesn't rewrite them); keep them short like a text
message. `text` events over the daily limit reply `{"ok": false, "error": "limit"}`.

## Gwen's PC side (desktop Gwen)

### `GET /api/pc?key=K`
```json
{"pc": true, "gwen": true, "airi": true, "game": "The Isle", "reportedAt": 1791350000000, "mac": "aa:bb:cc:dd:ee:ff",
 "ramadan": {"active": true, "day": 13, "iftar": "17:52", "suhoor": "04:58"}}
```
`mac` is the network card the phone sends its Wake-on-LAN packet to (idea 30). `ramadan` (idea 5) is for desktop Gwen to keep quiet
near iftar. `GET /api/pc?key=K&games=1` → `{"nights": {"Tue": {"from": 20, "to": 23, "weeks": 3}}}`: weekdays he gamed on in at
least 2 of the last 4 weeks (from the reports below), for planning the week (idea 3).
`gwen` = her bridge (127.0.0.1:5052) answers. `airi` = airi.exe is running. `game` = the game that's open, or `null`.
`game` and `airi` come from the last `report` (below) if it's under 3 minutes old, else DayTrack checks the
process list itself (airi.exe and a short list of known games).

### `POST /api/pc`
| body | what it does |
|---|---|
| `{"key", "action": "report", "gwen"?, "airi"?, "game"?}` | Desktop Gwen tells DayTrack what's running (send it every minute and when a game opens/closes). `game` = a display name or `null`. |
| `{"key", "action": "start"}` | Idea 29: starts Gwen. Runs `Documents\Gwen\Start-Gwen-Remote.bat` if it exists, else `Documents\Gwen\Start-Gwen.bat`, hidden, from `Documents\Gwen`. Replies `{"ok": true, "ran": "Start-Gwen.bat"}`. The phone asks Rayan first if a game is open. |
| `{"key", "action": "quest", "id"}` | Idea 2: a `pc` quest is done (he talked to her, or watched something with her). |
| `{"key", "action": "lock"}` | Idea 42: locks Windows. |
| `{"key", "action": "panel"}` | Idea 43: shows/hides DayTrack's Today panel (DayTrack's own hotkey is Ctrl+Alt+D; call this if Gwen binds another one). |
| `{"key", "action": "update"}` | Updates DayTrack.exe from the latest GitHub release (used by the phone's Update button). |

## Backups (idea 44)

- `GET /api/backup?key=K` returns everything DayTrack keeps (the synced tasks, chats, goals, lists, sleep log,
  postcards list, parcels and server state) as one JSON file.
- DayTrack.exe also writes that file once a day to `Documents\Gwen\daytrack-backup\daytrack-YYYY-MM-DD.json` and
  keeps the last 7, so a nightly backup can simply copy that folder. Its live data is in `%APPDATA%\DayTrack\data`.

## The phone app in the background (2026-10-08)

- `POST /api/phone {"key", "event": "screen", "minutes", "apps": [{"name", "minutes"}]}`: idea 39, the phone's daily phone time; Gwen texts him about it.

## Shared lists (idea 35)

`/api/share?code=<32 hex>`: GET a list, POST `{name?, items: [{id, text, done, at, del?}]}` to merge (per item the newest `at` wins;
only a POST with `name` can create a list). People without DayTrack open `https://<pc>.ts.net:8443/s/<code>`: a small page served
by DayTrack.exe at `/s/<code>` (data at `/s/<code>/data`, items only). To make it reachable from outside the tailnet, once:
`tailscale funnel --bg --https=8443 --set-path /s http://127.0.0.1:5053/s` (only `/s/` is public, and only on port 8443).

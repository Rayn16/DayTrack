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
  `kind` is a suggestion (`decoration`, `plant` or `book`); the house picks the actual item. `status` is `waiting`
  until the house says it's at the door (`delivered`); opened parcels drop off the list. Kept 30 days.
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

Texts are her own words, written by the house's brain (DayTrack doesn't rewrite them); keep them short like a text
message. `text` events over the daily limit reply `{"ok": false, "error": "limit"}`.

## Gwen's PC side (desktop Gwen)

### `GET /api/pc?key=K`
```json
{"pc": true, "gwen": true, "airi": true, "game": "The Isle", "reportedAt": 1791350000000}
```
`gwen` = her bridge (127.0.0.1:5052) answers. `airi` = airi.exe is running. `game` = the game that's open, or `null`.
`game` and `airi` come from the last `report` (below) if it's under 3 minutes old, else DayTrack checks the
process list itself (airi.exe and a short list of known games).

### `POST /api/pc`
| body | what it does |
|---|---|
| `{"key", "action": "report", "gwen"?, "airi"?, "game"?}` | Desktop Gwen tells DayTrack what's running (send it every minute and when a game opens/closes). `game` = a display name or `null`. |
| `{"key", "action": "start"}` | Idea 29: starts Gwen. Runs `Documents\Gwen\Start-Gwen-Remote.bat` if it exists, else `Documents\Gwen\Start-Gwen.bat`, hidden, from `Documents\Gwen`. Replies `{"ok": true, "ran": "Start-Gwen.bat"}`. The phone asks Rayan first if a game is open. |
| `{"key", "action": "lock"}` | Idea 42: locks Windows. |
| `{"key", "action": "panel"}` | Idea 43: shows/hides DayTrack's Today panel (DayTrack's own hotkey is Ctrl+Alt+D; call this if Gwen binds another one). |
| `{"key", "action": "update"}` | Updates DayTrack.exe from the latest GitHub release (used by the phone's Update button). |

## Backups (idea 44)

- `GET /api/backup?key=K` returns everything DayTrack keeps (the synced tasks, chats, goals, lists, sleep log,
  postcards list, parcels and server state) as one JSON file.
- DayTrack.exe also writes that file once a day to `Documents\Gwen\daytrack-backup\daytrack-YYYY-MM-DD.json` and
  keeps the last 7, so a nightly backup can simply copy that folder. Its live data is in `%APPDATA%\DayTrack\data`.

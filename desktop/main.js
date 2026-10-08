// DayTrack for Windows: the same app as the phone, with its files inside the exe. It is also the
// DayTrack server (server.js), so it starts with Windows and keeps running in the tray when closed.
const {app, BrowserWindow, Tray, Menu, protocol, session, shell, globalShortcut, nativeImage, Notification, screen} = require('electron');
const path = require('path');
const fs = require('fs');
const {spawn} = require('child_process');
const server = require('./server');

const WEB = path.join(__dirname, 'web');
const RELEASE = 'https://github.com/Rayn16/DayTrack/releases';
let win, panel, tray, fns, quitting = false, newBuild = 0;
// The build number is the last part of the version (1.0.<GitHub build>), set when the release is built
const build = () => Number(app.getVersion().split('.')[2]) || 0;

if (!app.requestSingleInstanceLock()) app.quit();
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: {standard: true, secure: true, supportFetchAPI: true, corsEnabled: true}}]);

function show() {
  if (!win) {
    const {workArea: wa} = screen.getPrimaryDisplay();
    // Wide enough for the dashboard (sidebar and columns); narrower windows get the phone layout
    win = new BrowserWindow({width: Math.min(1360, wa.width), height: Math.min(860, wa.height), minWidth: 380, title: 'DayTrack', icon: path.join(WEB, 'icon.png'), autoHideMenuBar: true});
    win.webContents.setWindowOpenHandler(({url}) => { shell.openExternal(url); return {action: 'deny'}; });
    // Closing only hides it: the phone still needs the server
    win.on('close', e => { if (!quitting) { e.preventDefault(); win.hide(); } });
    win.loadURL('app://daytrack/');
  }
  win.show(); win.focus();
}

// Ctrl+Alt+D: today's tasks over whatever's on screen, gone again when you click away
function togglePanel() {
  if (panel && panel.isVisible()) return panel.hide();
  if (!panel) {
    const {workArea: a} = screen.getPrimaryDisplay();
    panel = new BrowserWindow({width: 380, height: 540, x: a.x + a.width - 396, y: a.y + 16, frame: false, resizable: false, alwaysOnTop: true,
      skipTaskbar: true, show: false, title: 'DayTrack today', icon: path.join(WEB, 'icon.png')});
    panel.on('blur', () => panel.hide());
    panel.on('closed', () => { panel = null; });
    panel.loadURL('app://daytrack/?panel=1');
    panel.once('ready-to-show', () => { panel.show(); panel.focus(); });
    return;
  }
  panel.webContents.executeJavaScript('window.dtPanelShow&&dtPanelShow()').catch(() => {});
  panel.show(); panel.focus();
}

// Updates: a new build on the "desktop" GitHub release. It downloads the installer, runs it quietly and starts
// DayTrack again (in the tray when the phone asked for it, so nothing pops up over a game).
async function checkUpdate() {
  try {
    const r = await fetch('https://api.github.com/repos/Rayn16/DayTrack/releases/tags/desktop', {headers: {'User-Agent': 'DayTrack'}});
    const n = Number(((await r.json()).body || '').match(/Build (\d+)/)?.[1]) || 0;
    if (n > build() && n !== newBuild) {
      newBuild = n;
      tray.setContextMenu(trayMenu());
      const note = new Notification({title: 'DayTrack update ready', body: 'Click to install the new version.'});
      note.on('click', () => update(false));
      note.show();
    }
  } catch (e) { console.warn('Update check failed:', e.message); }
}
async function update(hidden) {
  const r = await fetch(`${RELEASE}/download/desktop/DayTrack-Setup.exe`);
  if (!r.ok) throw new Error('Download failed: ' + r.status);
  const setup = path.join(app.getPath('temp'), 'DayTrack-Setup.exe'), q = s => `'${s.replace(/'/g, "''")}'`;
  fs.writeFileSync(setup, Buffer.from(await r.arrayBuffer()));
  // PowerShell waits for this app to close, installs over it silently, then starts the new one
  spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command',
    `Start-Sleep 2; Start-Process -Wait -FilePath ${q(setup)} -ArgumentList '/S'; Start-Process -FilePath ${q(process.execPath)}${hidden ? " -ArgumentList '--hidden'" : ''}`],
  {detached: true, windowsHide: true, stdio: 'ignore'}).unref();
  quitting = true;
  app.quit();
}
function trayMenu() {
  return Menu.buildFromTemplate([{label: 'Open DayTrack', click: show}, {label: 'Today (Ctrl+Alt+D)', click: togglePanel},
    ...(newBuild ? [{label: 'Install update', click: () => update(false).catch(e => console.error(e.message))}] : []), {label: 'Quit', click: () => app.quit()}]);
}

app.on('second-instance', show);
app.on('before-quit', () => { quitting = true; });

app.whenReady().then(async () => {
  app.setAppUserModelId('com.rayn16.daytrack'); // Windows shows its notifications under DayTrack
  protocol.handle('app', async req => {
    const {pathname} = new URL(req.url);
    const fn = pathname.match(/^\/\.netlify\/functions\/([a-z-]+)$/);
    if (fn) return fns && fns[fn[1]] ? fns[fn[1]](req) : new Response('Server not running', {status: 503});
    // The page asks the app itself: its build number, install an update, close the Today panel
    if (pathname === '/__dt/info') return Response.json({build: build(), version: app.getVersion(), newBuild, panel: !!panel});
    if (pathname === '/__dt/update' && req.method === 'POST') { update(false).catch(e => console.error('Update:', e.message)); return Response.json({ok: true}); }
    if (pathname === '/__dt/panel' && req.method === 'POST') { if (panel) panel.hide(); return Response.json({ok: true}); }
    const file = path.join(WEB, decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(WEB + path.sep) || !fs.existsSync(file)) return new Response('Not found', {status: 404});
    const type = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png'}[path.extname(file)];
    return new Response(fs.readFileSync(file), {headers: {'Content-Type': type || 'application/octet-stream'}});
  });

  // Gwen's bridge only lets the website in, so let this window in too
  session.defaultSession.webRequest.onHeadersReceived({urls: ['http://127.0.0.1/*', 'http://localhost/*']}, (d, done) => {
    const h = Object.fromEntries(Object.entries(d.responseHeaders || {}).filter(([k]) => !k.toLowerCase().startsWith('access-control-')));
    Object.assign(h, {'Access-Control-Allow-Origin': ['*'], 'Access-Control-Allow-Headers': ['*'], 'Access-Control-Allow-Methods': ['*']});
    done({responseHeaders: h, statusLine: d.method === 'OPTIONS' ? 'HTTP/1.1 204 No Content' : d.statusLine});
  });

  // Photos from Gwen's house, shrunk for the phone
  globalThis.dtThumb = (buf, width) => {
    const img = nativeImage.createFromBuffer(buf);
    return img.isEmpty() ? null : (img.getSize().width > width ? img.resize({width, quality: 'good'}) : img).toJPEG(80);
  };
  try {
    ({fns} = await server.start({
      dataDir: path.join(app.getPath('userData'), 'data'),
      keysFile: path.join(app.getPath('documents'), 'Gwen', 'daytrack.json'),
      fnDir: path.join(__dirname, 'server', 'functions'),
      hooks: {version: app.getVersion(), update: hidden => update(hidden).catch(e => console.error('Update:', e.message)), panel: togglePanel},
    }));
  } catch (e) { console.error('DayTrack server did not start:', e.message); }

  if (app.isPackaged) app.setLoginItemSettings({openAtLogin: true, args: ['--hidden']});
  tray = new Tray(path.join(WEB, 'icon.png'));
  tray.setToolTip('DayTrack');
  tray.setContextMenu(trayMenu());
  tray.on('click', show);
  if (!globalShortcut.register('Control+Alt+D', togglePanel)) console.warn('Ctrl+Alt+D is taken by another app');
  if (app.isPackaged) { setTimeout(checkUpdate, 30e3); setInterval(checkUpdate, 6 * 3600e3); }
  if (!process.argv.includes('--hidden')) show();
});

app.on('window-all-closed', e => e.preventDefault());
app.on('will-quit', () => globalShortcut.unregisterAll());

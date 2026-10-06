// DayTrack for Windows: the same app as the phone, with its files inside the exe. It is also the
// DayTrack server (server.js), so it starts with Windows and keeps running in the tray when closed.
const {app, BrowserWindow, Tray, Menu, protocol, session, shell} = require('electron');
const path = require('path');
const fs = require('fs');
const server = require('./server');

const WEB = path.join(__dirname, 'web');
let win, tray, fns, quitting = false;

if (!app.requestSingleInstanceLock()) app.quit();
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: {standard: true, secure: true, supportFetchAPI: true, corsEnabled: true}}]);

function show() {
  if (!win) {
    win = new BrowserWindow({width: 480, height: 900, title: 'DayTrack', icon: path.join(WEB, 'icon.png'), autoHideMenuBar: true});
    win.webContents.setWindowOpenHandler(({url}) => { shell.openExternal(url); return {action: 'deny'}; });
    // Closing only hides it: the phone still needs the server
    win.on('close', e => { if (!quitting) { e.preventDefault(); win.hide(); } });
    win.loadURL('app://daytrack/');
  }
  win.show(); win.focus();
}

app.on('second-instance', show);
app.on('before-quit', () => { quitting = true; });

app.whenReady().then(async () => {
  protocol.handle('app', async req => {
    const {pathname} = new URL(req.url);
    const fn = pathname.match(/^\/\.netlify\/functions\/([a-z-]+)$/);
    if (fn) return fns && fns[fn[1]] ? fns[fn[1]](req) : new Response('Server not running', {status: 503});
    const file = path.join(WEB, decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(WEB + path.sep) || !fs.existsSync(file)) return new Response('Not found', {status: 404});
    const type = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png'}[path.extname(file)];
    return new Response(fs.readFileSync(file), {headers: {'Content-Type': type || 'application/octet-stream'}});
  });

  // Gwen's bridge only lets the website in, so let this window in too
  session.defaultSession.webRequest.onHeadersReceived({urls: ['http://127.0.0.1/*', 'http://localhost/*']}, (d, done) => {
    const h = Object.fromEntries(Object.entries(d.responseHeaders || {}).filter(([k]) => !k.toLowerCase().startsWith('access-control-')));
    Object.assign(h, {'Access-Control-Allow-Origin': ['*'], 'Access-Control-Allow-Headers': ['*'], 'Access-Control-Allow-Methods': ['*']});
    done({responseHeaders: h, statusLine: d.method === 'OPTIONS' ? 'HTTP/1.1 204 No Content' : d.statusLine});
  });

  try {
    ({fns} = await server.start({
      dataDir: path.join(app.getPath('userData'), 'data'),
      keysFile: path.join(app.getPath('documents'), 'Gwen', 'daytrack.json'),
      fnDir: path.join(__dirname, 'server', 'functions'),
    }));
  } catch (e) { console.error('DayTrack server did not start:', e.message); }

  if (app.isPackaged) app.setLoginItemSettings({openAtLogin: true, args: ['--hidden']});
  tray = new Tray(path.join(WEB, 'icon.png'));
  tray.setToolTip('DayTrack');
  tray.setContextMenu(Menu.buildFromTemplate([{label: 'Open DayTrack', click: show}, {label: 'Quit', click: () => app.quit()}]));
  tray.on('click', show);
  if (!process.argv.includes('--hidden')) show();
});

app.on('window-all-closed', e => e.preventDefault());

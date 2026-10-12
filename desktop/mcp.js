// Wave idea 160: DayTrack as a Claude connector. A tiny MCP server over stdio (JSON-RPC, one message per line) that
// Claude desktop starts from claude_desktop_config.json (tray: "Copy Claude connector setup"; desktop/API.md).
// It only talks to DayTrack.exe on 127.0.0.1 with Gwen's key. Args: [path to Documents\Gwen\daytrack.json]
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');

const KEYS = process.argv[2] || path.join(os.homedir(), 'Documents', 'Gwen', 'daytrack.json');
const API = 'http://127.0.0.1:5053/api/pc';
const key = () => { try { const k = JSON.parse(fs.readFileSync(KEYS, 'utf8')); return k.gwenKey || k.key; } catch (_) { throw new Error(`Can't read Gwen's key from ${KEYS}`); } };
async function pc(query, body) {
  const r = await fetch(body ? API : `${API}?${query}&key=${encodeURIComponent(key())}`,
    body ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...body, key: key()})} : {});
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `DayTrack answered ${r.status}`);
  return d;
}

const none = {type: 'object', properties: {}};
const TOOLS = [
  {name: 'daytrack_today', description: "Rayan's DayTrack tasks for today (timed ones first) and which are done.", inputSchema: none, run: () => pc('today=1')},
  {name: 'daytrack_projects', inputSchema: none, run: () => pc('projects=1'),
    description: 'His Projects list, the one a Claude run keeps in step with the Project Map. Item text is "<Project>: <text>"; the id prefix says what it is: '
      + 'meta (summary), need~ (only Rayan can do it), ask~ (Claude asked him), done~ (Claude finished it), today~ (today\'s top 3), day~ (added to his day), '
      + 'goal~, next~ (the next step), and from DayTrack note~ (a note for Claude), log~ (focus time), cost~ (an expense), signed~ (a restaurant signed). null = no Projects list yet.'},
  {name: 'daytrack_add_task', description: 'Add a task to his DayTrack (it shows up on his phone and PC, marked as added by Gwen).',
    inputSchema: {type: 'object', properties: {name: {type: 'string', description: 'Short task name, up to 80 characters'}, date: {type: 'string', description: 'YYYY-MM-DD; leave out for today'},
      time: {type: 'string', description: 'HH:MM reminder time (24 h)'}}, required: ['name']},
    run: a => pc(null, {action: 'task', name: a.name, date: a.date, time: a.time})},
  {name: 'daytrack_add_project_note', description: 'Add a note for one project to the Projects list; the next Claude run on the Project Map reads it and does it. End it with "?" to ask Claude a question.',
    inputSchema: {type: 'object', properties: {project: {type: 'string', enum: ['Food apps', 'Life', 'Money', 'repos', 'Dashboard']}, text: {type: 'string', description: 'The note. "<project>: <note>" has to fit in 120 characters'}},
      required: ['project', 'text']},
    run: a => pc(null, {action: 'note', project: a.project, text: a.text})},
];

const send = m => process.stdout.write(JSON.stringify({jsonrpc: '2.0', ...m}) + '\n');
async function answer(m) {
  if (m.method === 'initialize') return {protocolVersion: (m.params && m.params.protocolVersion) || '2025-06-18', capabilities: {tools: {}}, serverInfo: {name: 'daytrack', version: '1.0.0'}};
  if (m.method === 'ping') return {};
  if (m.method === 'tools/list') return {tools: TOOLS.map(({run, ...t}) => t)};
  if (m.method !== 'tools/call') throw Object.assign(new Error('Method not found'), {code: -32601});
  const t = TOOLS.find(x => x.name === (m.params && m.params.name));
  if (!t) throw Object.assign(new Error('Unknown tool'), {code: -32602});
  try { return {content: [{type: 'text', text: JSON.stringify(await t.run(m.params.arguments || {}))}]}; }
  catch (e) { return {content: [{type: 'text', text: e.cause && e.cause.code === 'ECONNREFUSED' ? 'DayTrack is not running on this PC.' : e.message}], isError: true}; }
}
readline.createInterface({input: process.stdin}).on('line', async line => {
  let m;
  try { m = JSON.parse(line); } catch (_) { return send({id: null, error: {code: -32700, message: 'Parse error'}}); }
  if (!m || m.id === undefined || m.id === null) return; // notifications get no answer
  try { send({id: m.id, result: await answer(m)}); } catch (e) { send({id: m.id, error: {code: e.code || -32603, message: e.message}}); }
});

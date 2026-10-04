// Board games against Gwen: Connect Four, Reversi, Checkers and Chess.
// Rayan (H) always moves first from the bottom of the board; Gwen (G) answers with a small minimax.
// Each game is {start, moves, play, result, eval}: result is null while playing, else H, G or 0 for a draw.
const H = 1, G = 2;
const other = p => 3 - p;

// ── Connect Four: 7 columns × 6 rows, row 0 at the top ───────────────────────
const C4_LINES = [];
for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++)
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const cells = [0, 1, 2, 3].map(k => [r + dr * k, c + dc * k]);
    if (cells.every(([y, x]) => y >= 0 && y < 6 && x >= 0 && x < 7)) C4_LINES.push(cells.map(([y, x]) => y * 7 + x));
  }
const c4 = {
  name: 'Connect Four', cols: 7, rows: 6, depth: 5,
  start: () => ({ b: Array(42).fill(0), turn: H }),
  moves: s => [3, 2, 4, 1, 5, 0, 6].filter(c => !s.b[c]),
  play(s, c) { const b = s.b.slice(); let r = 5; while (b[r * 7 + c]) r--; b[r * 7 + c] = s.turn; return { b, turn: other(s.turn), last: r * 7 + c }; },
  result(s) {
    for (const l of C4_LINES) { const v = s.b[l[0]]; if (v && l.every(i => s.b[i] === v)) return v; }
    return s.b.slice(0, 7).every(Boolean) ? 0 : null;
  },
  eval(s, p) { // open lines of 2 and 3 for p minus the opponent's
    let v = 0;
    for (const l of C4_LINES) {
      const mine = l.filter(i => s.b[i] === p).length, theirs = l.filter(i => s.b[i] === other(p)).length;
      if (!theirs) v += [0, 1, 4, 20][mine] || 0; else if (!mine) v -= [0, 1, 5, 25][theirs] || 0;
    }
    return v + s.b.filter((x, i) => x === p && i % 7 === 3).length * 2;
  },
  // Click any cell of a column to drop there
  target: (s, i) => c4.moves(s).includes(i % 7) ? i % 7 : null,
};

// ── Reversi: 8×8, Rayan is black and starts ──────────────────────────────────
const DIRS8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const RV_W = [100, -20, 10, 5, 5, 10, -20, 100, -20, -50, -2, -2, -2, -2, -50, -20, 10, -2, 1, 1, 1, 1, -2, 10, 5, -2, 1, 0, 0, 1, -2, 5];
const rvWeight = i => { const r = i >> 3, c = i & 7; return RV_W[(r < 4 ? r : 7 - r) * 8 + c]; };
const rvFlips = (b, i, p) => {
  if (b[i]) return [];
  const out = [];
  for (const [dr, dc] of DIRS8) {
    const run = []; let r = (i >> 3) + dr, c = (i & 7) + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === other(p)) { run.push(r * 8 + c); r += dr; c += dc; }
    if (run.length && r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === p) out.push(...run);
  }
  return out;
};
const rvLegal = (b, p) => b.map((_, i) => i).filter(i => rvFlips(b, i, p).length);
const reversi = {
  name: 'Reversi', cols: 8, rows: 8, depth: 3,
  start() { const b = Array(64).fill(0); b[27] = b[36] = G; b[28] = b[35] = H; return { b, turn: H }; },
  moves(s) { const m = rvLegal(s.b, s.turn); return m.length ? m : rvLegal(s.b, other(s.turn)).length ? ['pass'] : []; },
  play(s, i) {
    if (i === 'pass') return { b: s.b, turn: other(s.turn), passed: true };
    const b = s.b.slice(); for (const f of rvFlips(b, i, s.turn)) b[f] = s.turn; b[i] = s.turn;
    return { b, turn: other(s.turn), last: i };
  },
  result(s) {
    if (rvLegal(s.b, H).length || rvLegal(s.b, G).length) return null;
    const h = s.b.filter(x => x === H).length, g = s.b.filter(x => x === G).length;
    return h > g ? H : g > h ? G : 0;
  },
  eval: (s, p) => s.b.reduce((v, x, i) => v + (x === p ? rvWeight(i) : x ? -rvWeight(i) : 0), 0) + 3 * (rvLegal(s.b, p).length - rvLegal(s.b, other(p)).length),
  target: (s, i) => reversi.moves(s).includes(i) ? i : null,
};

// ── Checkers: 8×8 dark squares, captures are compulsory, multi-jumps, kings ──
// Pieces: {p: H|G, k: king}. Rayan moves up the board (row 7 → 0).
const ckDirs = (pc) => pc.k ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : pc.p === H ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
const ckCrowned = (pc, r) => !pc.k && (pc.p === H ? r === 0 : r === 7);
function ckJumps(b, from, pc, path, taken, out) {
  let more = false;
  const r0 = from >> 3, c0 = from & 7;
  for (const [dr, dc] of ckDirs(pc)) {
    const r1 = r0 + dr, c1 = c0 + dc, r2 = r0 + 2 * dr, c2 = c0 + 2 * dc;
    if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7) continue;
    const mid = r1 * 8 + c1, to = r2 * 8 + c2;
    if (!b[mid] || b[mid].p === pc.p || taken.includes(mid) || b[to]) continue;
    more = true;
    const nb = b.slice(); nb[from] = null; nb[to] = pc;
    if (ckCrowned(pc, r2)) out.push({ path: [...path, to], taken: [...taken, mid] }); // crowning ends the turn
    else ckJumps(nb, to, pc, [...path, to], [...taken, mid], out);
  }
  if (!more && taken.length) out.push({ path, taken });
}
const checkers = {
  name: 'Checkers', cols: 8, rows: 8, depth: 6,
  start() {
    const b = Array(64).fill(null);
    for (let i = 0; i < 64; i++) if (((i >> 3) + (i & 7)) % 2) { if (i < 24) b[i] = { p: G, k: false }; else if (i >= 40) b[i] = { p: H, k: false }; }
    return { b, turn: H, quiet: 0 };
  },
  moves(s) {
    const jumps = [], steps = [];
    s.b.forEach((pc, i) => {
      if (!pc || pc.p !== s.turn) return;
      ckJumps(s.b, i, pc, [i], [], jumps);
      for (const [dr, dc] of ckDirs(pc)) {
        const r = (i >> 3) + dr, c = (i & 7) + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && !s.b[r * 8 + c]) steps.push({ path: [i, r * 8 + c], taken: [] });
      }
    });
    return jumps.length ? jumps : steps;
  },
  play(s, m) {
    const b = s.b.slice(), from = m.path[0], to = m.path[m.path.length - 1], pc = b[from];
    b[from] = null; for (const t of m.taken) b[t] = null;
    b[to] = ckCrowned(pc, to >> 3) ? { p: pc.p, k: true } : pc;
    return { b, turn: other(s.turn), quiet: m.taken.length ? 0 : s.quiet + 1, last: to };
  },
  result(s) {
    if (s.quiet >= 60) return 0; // 30 moves each without a capture
    return checkers.moves(s).length ? null : other(s.turn);
  },
  eval: (s, p) => s.b.reduce((v, pc, i) => !pc ? v : v + (pc.p === p ? 1 : -1) * (pc.k ? 160 : 100 + (pc.p === H ? 7 - (i >> 3) : i >> 3) * 2), 0),
};

// ── Chess, with chess.js for the rules. Rayan is white. ──────────────────────
const VAL = { p: 100, n: 300, b: 320, r: 500, q: 900, k: 0 };
let Chess = null;
const chess = {
  name: 'Chess', cols: 8, rows: 8,
  async load() { if (!Chess) ({ Chess } = await import('https://cdn.jsdelivr.net/npm/chess.js@1.4.0/dist/esm/chess.js')); },
  start: () => ({ g: new Chess(), turn: H }),
  moves: s => s.g.moves({ verbose: true }),
  play(s, m) { s.g.move({ from: m.from, to: m.to, promotion: 'q' }); return { g: s.g, turn: other(s.turn), last: sq(m.to) }; },
  result(s) { const g = s.g; return g.isCheckmate() ? other(s.turn) : g.isGameOver() ? 0 : null; },
  // Material plus a little centre, from Gwen's side (black)
  score(g) {
    let v = 0;
    g.board().forEach((row, r) => row.forEach((x, c) => { if (x) v += (x.color === 'b' ? 1 : -1) * (VAL[x.type] + (x.type !== 'k' && r > 1 && r < 6 && c > 1 && c < 6 ? 12 : 0)); }));
    return v;
  },
  // Two plies with make/undo on one board (copying chess.js positions is slow)
  ai(s) {
    const g = s.g; let best = null, bestV = -Infinity;
    for (const m of shuffle(g.moves({ verbose: true }))) {
      g.move(m);
      let worst = Infinity;
      if (g.isCheckmate()) worst = 1e6; else if (g.isGameOver()) worst = 0;
      else for (const r of g.moves({ verbose: true })) {
        g.move(r); const v = g.isCheckmate() ? -1e6 : chess.score(g); g.undo();
        if (v < worst) worst = v; if (worst <= bestV) break;
      }
      g.undo();
      if (worst > bestV) { bestV = worst; best = m; }
    }
    return best;
  },
};
const sq = name => (8 - Number(name[1])) * 8 + name.charCodeAt(0) - 97;

// ── Gwen's move: negamax with alpha-beta ─────────────────────────────────────
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function negamax(game, s, d, a, b) {
  const w = game.result(s);
  if (w !== null) return w === 0 ? 0 : w === s.turn ? 1e6 + d : -1e6 - d;
  if (!d) return game.eval(s, s.turn);
  for (const m of game.moves(s)) { a = Math.max(a, -negamax(game, game.play(s, m), d - 1, -b, -a)); if (a >= b) break; }
  return a;
}
export function gwenMove(game, s) {
  if (game.ai) return game.ai(s);
  let best = null, bestV = -Infinity;
  for (const m of shuffle(game.moves(s).slice())) {
    const v = -negamax(game, game.play(s, m), game.depth - 1, -Infinity, -bestV + 1);
    if (v > bestV) { bestV = v; best = m; }
  }
  return best;
}
export const GAMES = { c4, reversi, checkers, chess };

// ── The games sheet ──────────────────────────────────────────────────────────
// app: {el, say(text, gesture), done(name, result), close()} where result is 'won' (Rayan), 'lost' or 'draw'
const PIECE = {
  c4: v => `<div class="gg-disc" style="background:${v === H ? '#FACC15' : v ? '#EF4444' : '#221C6B'}"></div>`,
  reversi: v => v ? `<div class="gg-disc" style="background:${v === H ? '#222' : '#fafafa'};border:1px solid #0003"></div>` : '',
  checkers: pc => pc ? `<div class="gg-disc" style="background:${pc.p === H ? '#DC2626' : '#8B5CF6'}">${pc.k ? '👑' : ''}</div>` : '',
};
const CHESS_GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
const LINES = {
  start: ['Okay, you\'re on 😏', 'Prepare to lose 💜', 'Go easy on me… or don\'t 😌'],
  lost: ['I win! 😌 Want revenge?', 'Hehe, gotcha. Rematch?', 'Victory is mine 💜'],
  won: ['Okay okay, you got me 😤 Rematch?', 'Hmph. Lucky. Again!', 'You actually beat me… nice one 💜'],
  draw: ['A draw? We\'re too evenly matched 💜', 'Nobody wins… so we both do?'],
  capture: ['Mine now 😏', 'Hehe, gotcha', 'Oops, was that yours?'],
};
const pick = a => a[Math.floor(Math.random() * a.length)];

export async function openGames(app) {
  const el = app.el;
  let id = null, game = null, s = null, sel = null, busy = false, said = '', run = 0;
  const say = (t, g) => { said = t; app.say(t, g); };
  const menu = () => {
    id = null; run++;
    el.innerHTML = `<div class="gg-head"><b>🎮 Play with Gwen</b><button data-act="close">✕</button></div>
      <div class="gg-menu">${Object.entries(GAMES).map(([k, g]) => `<button data-game="${k}">${{ c4: '🔴', reversi: '⚫', checkers: '🟣', chess: '♞' }[k]} ${g.name}</button>`).join('')}</div>`;
  };
  const start = async k => {
    id = k; game = GAMES[k]; sel = null; busy = false; said = ''; run++;
    if (game.load) { el.querySelector('.gg-menu').innerHTML = '<div style="text-align:center;padding:20px;">Setting up the board…</div>'; try { await game.load(); } catch (e) { say('I can\'t find the chess pieces right now, try again later'); return menu(); } }
    s = game.start(); say(pick(LINES.start), 'wave'); draw('Your turn');
  };
  const draw = status => {
    const n = game.cols * game.rows, last = s.last, targets = new Set(), sels = new Set();
    if (id === 'checkers' || id === 'chess') {
      for (const m of game.moves(s)) {
        const from = id === 'chess' ? sq(m.from) : m.path[0], to = id === 'chess' ? sq(m.to) : m.path[m.path.length - 1];
        if (s.turn === H) sels.add(from); if (sel === from) targets.add(to);
      }
    } else if (s.turn === H && game.result(s) === null) for (const m of game.moves(s)) if (m !== 'pass') targets.add(id === 'c4' ? -1 - m : m);
    const board = id === 'chess' ? s.g.board().flat() : s.b;
    let cells = '';
    for (let i = 0; i < n; i++) {
      const dark = (id === 'checkers' || id === 'chess') && ((i >> 3) + (i & 7)) % 2;
      const x = board[i], hint = targets.has(i) || (id === 'c4' && targets.has(-1 - (i % 7)) && !s.b[i] && (i + 7 >= 42 || s.b[i + 7]));
      const bg = id === 'c4' ? '#4C3FB8' : id === 'reversi' ? '#15803D' : dark ? (id === 'chess' ? '#B58863' : '#5B4636') : (id === 'chess' ? '#F0D9B5' : '#E8D9B0');
      const piece = id === 'chess' ? (x ? `<span style="font-size:min(7vw,34px);line-height:1;color:${x.color === 'w' ? '#fff' : '#111'};text-shadow:0 0 2px ${x.color === 'w' ? '#000' : '#fff8'}">${CHESS_GLYPH[x.type]}</span>` : '') : PIECE[id](x);
      cells += `<div class="gg-cell" data-i="${i}" style="background:${bg};${sel === i ? 'box-shadow:inset 0 0 0 3px #FBBF24;' : last === i ? 'box-shadow:inset 0 0 0 3px #A78BFA;' : ''}">${piece}${hint ? '<div class="gg-dot"></div>' : ''}</div>`;
    }
    el.innerHTML = `<div class="gg-head"><button data-act="menu">‹ Games</button><b>${game.name}</b><button data-act="close">✕</button></div>
      <div class="gg-status">${status}</div>${said ? `<div class="gg-say">💜 ${said}</div>` : ''}
      <div class="gg-board" style="grid-template-columns:repeat(${game.cols},1fr);${id === 'c4' ? 'border-radius:12px;padding:4px;background:#4C3FB8;' : ''}">${cells}</div>
      <button class="gg-new" data-act="new">New game</button>`;
  };
  const finish = () => {
    const w = game.result(s); if (w === null) return false;
    const r = w === H ? 'won' : w === G ? 'lost' : 'draw';
    say(pick(LINES[r]), r === 'won' ? 'pout' : r === 'lost' ? 'happy' : 'shrug');
    draw(r === 'won' ? '🎉 You win!' : r === 'lost' ? '💜 Gwen wins' : '🤝 Draw');
    app.done(game.name, r);
    return true;
  };
  const human = m => {
    s = game.play(s, m); sel = null;
    if (finish()) return;
    if (game.moves(s)[0] === 'pass') { s = game.play(s, 'pass'); }
    gwenTurn();
  };
  const gwenTurn = () => {
    if (s.turn !== G) { draw(id === 'reversi' ? 'Gwen has no move, your turn again' : 'Your turn'); return; }
    busy = true; draw('Gwen is thinking…');
    const r0 = run;
    setTimeout(() => {
      if (r0 !== run) return; // closed or restarted meanwhile
      const m = gwenMove(game, s);
      const took = id === 'chess' ? !!m.captured : id === 'checkers' ? m.taken.length : 0;
      s = game.play(s, m); busy = false;
      if (finish()) return;
      if (took && Math.random() < 0.4) say(pick(LINES.capture), 'happy');
      if (game.moves(s)[0] === 'pass') { s = game.play(s, 'pass'); say('You have no move, so I go again 😏'); return gwenTurn(); }
      draw(id === 'chess' && s.g.inCheck() ? 'Check! Your turn' : 'Your turn');
    }, 350);
  };
  el.onclick = e => {
    const b = e.target.closest('[data-act],[data-game],[data-i]'); if (!b) return;
    if (b.dataset.act === 'close') { run++; return app.close(); }
    if (b.dataset.act === 'menu') return menu();
    if (b.dataset.act === 'new') return start(id);
    if (b.dataset.game) return start(b.dataset.game);
    if (busy || !game || s.turn !== H || game.result(s) !== null) return;
    const i = Number(b.dataset.i);
    if (id === 'c4' || id === 'reversi') { const m = game.target(s, i); if (m !== null) human(m); return; }
    const ms = game.moves(s), from = m => id === 'chess' ? sq(m.from) : m.path[0], to = m => id === 'chess' ? sq(m.to) : m.path[m.path.length - 1];
    const go = sel !== null && ms.find(m => from(m) === sel && to(m) === i);
    if (go) return human(go);
    sel = ms.some(m => from(m) === i) ? i : null; draw('Your turn');
  };
  menu();
}

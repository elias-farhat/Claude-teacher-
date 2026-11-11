// node render_cdp.mjs <filmDir> <out.mp4> [fps] [from] [to]
// Same job as render.mjs but needs no npm packages: drives headless Chrome over the DevTools protocol
// (Node 22 has WebSocket built in) and reads frames straight from the canvas.
import http from 'http'; import fs from 'fs'; import path from 'path'; import os from 'os'; import { spawn } from 'child_process';
const [dir = '.', out = 'out.mp4', fpsArg = '30', fromArg, toArg] = process.argv.slice(2); const fps = +fpsArg; const root = path.resolve(dir);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, p === '/' ? 'index.html' : p);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
await new Promise(r => srv.on('listening', r)); const port = srv.address().port;
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'chr-'));
const chrome = spawn(process.env.CHROME || 'google-chrome', ['--headless=new', '--disable-gpu', '--no-sandbox', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--window-size=1920,1080', '--hide-scrollbars', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((res, rej) => { let buf = ''; chrome.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) res(m[1]); }); setTimeout(() => rej(new Error('chrome did not start')), 20000); });
const dport = new URL(wsUrl).port;
const list = await (await fetch(`http://127.0.0.1:${dport}/json/list`)).json(); const pageWs = list.find(t => t.type === 'page').webSocketDebuggerUrl;
const ws = new WebSocket(pageWs); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } else if (m.method === 'Runtime.exceptionThrown') { console.error('page error', JSON.stringify(m.params.exceptionDetails).slice(0, 600)); process.exit(1); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const m = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (m.result.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 600)); return m.result.result.value; };
await send('Runtime.enable');
const from = +(fromArg || 0);
await send('Page.navigate', { url: `http://localhost:${port}/${process.env.PAGE || ""}?from=${from}&to=${toArg || 1e9}` });
const t0 = Date.now(); while (!(await ev('window.READY === true'))) { if (Date.now() - t0 > 180000) throw new Error('not ready'); await new Promise(r => setTimeout(r, 200)); }
if (process.env.PNGS) { const m = await ev('window.PNG'); for (const [k, v] of Object.entries(m)) fs.writeFileSync(path.join(process.env.PNGS, k + '.png'), Buffer.from(v.split(',')[1], 'base64')); console.log('pngs written'); ws.close(); chrome.kill(); srv.close(); process.exit(0); }
const dur = await ev('window.DUR'); const to = Math.min(+(toArg || dur), dur);
const i0 = Math.round(from * fps), i1 = Math.round(to * fps);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const faces = []; const t1 = Date.now();
for (let i = i0; i < i1; i++) {
  const v = await ev(`render(${i / fps}); [document.getElementById(window.OUT || 'c').toDataURL('image/jpeg', .92), JSON.stringify(window.FACES), window.SCENE]`);
  faces.push([+(i / fps).toFixed(3), v[2], JSON.parse(v[1])]);
  const buf = Buffer.from(v[0].slice(v[0].indexOf(',') + 1), 'base64'); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if ((i - i0) % 300 === 0) console.log(`${out}: frame ${i - i0}/${i1 - i0}`);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r));
fs.writeFileSync(out.replace(/\.mp4$/, '.faces.json'), JSON.stringify(faces));
console.log(`${i1 - i0} frames in ${((Date.now() - t1) / 1000).toFixed(1)} s (${((Date.now() - t1) / Math.max(1, i1 - i0)).toFixed(0)} ms/frame) -> ${out}`);
ws.close(); chrome.kill(); srv.close(); await new Promise(r => setTimeout(r, 500)); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(0);

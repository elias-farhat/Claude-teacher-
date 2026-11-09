// node render.mjs <filmDir> <out.mp4> [fps]  — renders window.render(t) frame by frame with headless Chrome
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import { chromium } from 'playwright-core';
const [dir = '.', out = 'out.mp4', fpsArg = '30'] = process.argv.slice(2); const fps = +fpsArg; const root = path.resolve(dir);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = srv.address().port;
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--disable-gpu'] });
const st = JSON.parse(fs.readFileSync(path.join(root, 'story.json'), 'utf8')); const [VW, VH] = st.size || [1080, 1920];
const pg = await b.newPage({ viewport: { width: VW, height: VH } });
pg.on('pageerror', e => { console.error('page error', e); process.exit(1); });
await pg.goto(`http://localhost:${port}/`); await pg.waitForFunction('window.READY === true', null, { timeout: 60000 });
const dur = await pg.evaluate('window.DUR'); const n = Math.round(dur * fps);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < n; i++) { await pg.evaluate(t => window.render(t), i / fps); const buf = await pg.screenshot({ type: 'jpeg', quality: 93 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
ff.stdin.end(); await new Promise(r => ff.on('close', r));
console.log(`${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s (${((Date.now() - t0) / n).toFixed(0)} ms/frame) -> ${out}`);
await b.close(); srv.close();

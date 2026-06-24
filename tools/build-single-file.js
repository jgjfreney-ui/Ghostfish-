// Bundle the whole game into ONE self-contained .html file.
// Inlines styles.css and every src/*.js (in index.html order) so the result
// runs by double-tapping it — no server, no extra files. Great for sideloading
// onto a phone ("Add to Home Screen" makes it feel like an app, fully offline).
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// 1) inline the stylesheet
const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="styles\.css"\s*\/?>/,
  `<style>\n${css}\n</style>`);

// 2) collect and inline every external script, preserving order
const srcRe = /<script src="([^"]+)"><\/script>\s*/g;
const srcs = [];
let m;
while ((m = srcRe.exec(html)) !== null) srcs.push(m[1]);
html = html.replace(srcRe, '');

const combined = srcs.map((s) => {
  const code = fs.readFileSync(path.join(ROOT, s), 'utf8');
  return `\n/* ===== ${s} ===== */\n${code}`;
}).join('\n');

html = html.replace('</body>', `  <script>\n${combined}\n</script>\n</body>`);

const outDir = path.join(ROOT, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'Ghostbug.html');
fs.writeFileSync(out, html);

const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`Built ${out} (${kb} KB, ${srcs.length} scripts inlined).`);

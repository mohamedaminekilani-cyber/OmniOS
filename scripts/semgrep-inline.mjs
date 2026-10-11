// Expose browser JavaScript embedded in OmniOS HTML to Semgrep.
// Generated analysis files are never bundled or shipped with the app.
import fs from 'node:fs';
import path from 'node:path';
import {sourceRelease} from './release-source.mjs';

const out = '.semgrep-inline';
fs.rmSync(out, {recursive:true, force:true});
fs.mkdirSync(out, {recursive:true});
const documents = [
  ['app-assembled', sourceRelease().html],
  ['pwa-loader', fs.readFileSync('index.html', 'utf8')]
];
const manifest = [];
for (const [name, html] of documents) {
  const tags = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  let match;
  let count = 0;
  while ((match = tags.exec(html))) {
    const attrs = match[1];
    if (/\bsrc\s*=/.test(attrs)) continue;
    const type = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (type && !['module', 'text/javascript', 'application/javascript'].includes(type)) continue;
    const js = match[2].trim();
    if (!js) continue;
    const file = path.join(out, name + '-' + String(++count).padStart(3, '0') + '.js');
    fs.writeFileSync(file, js + '\n');
    const scriptStartLine = html.slice(0, match.index + match[0].indexOf('>') + 1).split('\n').length;
    manifest.push({file, document:name, scriptStartLine, bytes:Buffer.byteLength(js)});
  }
}
if (!manifest.length) throw new Error('No inline JavaScript found; audit coverage is missing.');
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Semgrep extracted ' + manifest.length + ' inline script(s), ' +
  manifest.reduce((sum,x)=>sum+x.bytes,0) + ' bytes total.');

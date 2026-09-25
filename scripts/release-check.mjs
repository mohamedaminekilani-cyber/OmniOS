import fs from 'node:fs';
import vm from 'node:vm';
const parts=Array.from({length:28},(_,i)=>`app-parts/part-${String(i+1).padStart(3,'0')}.html`);
const html=parts.map(p=>fs.readFileSync(p,'utf8')).join('');
let count=0;
for(const [name,source]of [['application',html],['loader',fs.readFileSync('index.html','utf8')]]){
 for(const m of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(/\bsrc\s*=|type\s*=\s*["'](?:application\/json|application\/ld\+json)/i.test(m[1]))continue;
  new vm.Script(m[2],{filename:`${name}:script${++count}`});
 }
}
for(const name of fs.readdirSync('js'))new vm.Script(fs.readFileSync('js/'+name,'utf8'),{filename:name});
new vm.Script(fs.readFileSync('sw.js','utf8'),{filename:'sw.js'});
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
if(manifest.name!=='Second Brain')throw Error('Inconsistent application branding');
console.log(`Parsed ${count} assembled scripts, modules and service worker.`);

import fs from 'node:fs';

function fail(message){ console.error('FAIL:',message); process.exitCode=1; }
function ok(message){ console.log('OK:',message); }

const parts=Array.from({length:28},(_,i)=>`app-parts/part-${String(i+1).padStart(3,'0')}.html`);
for(const path of parts){
  if(!fs.existsSync(path)){ fail(`Missing ${path}`); continue; }
  if(fs.statSync(path).size<1000) fail(`${path} is unexpectedly small`);
}
if(!process.exitCode) ok('28 application fragments are present');

const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
if(manifest.name!=='Second Brain'||manifest.short_name!=='Second Brain') fail('PWA manifest branding is inconsistent');
else ok('PWA manifest uses Second Brain branding');

const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes("ignoreSearch:event.request.destination==='script'")) fail('Offline script query matching regression');
else ok('Offline script fallback ignores script query strings');

const index=fs.readFileSync('index.html','utf8');
const personalization=fs.readFileSync('pwa-personalization.js','utf8');
for(const [name,content] of [['index.html',index],['manifest.webmanifest',JSON.stringify(manifest)],['pwa-personalization.js',personalization],['sw.js',sw]]){
  if(/>\s*OmniOS\s*</.test(content)||/content=["']OmniOS["']/.test(content)||/Loading OmniOS|OmniOS reminder|Your OmniOS data|Ask OmniOS/.test(content)){
    fail(`Legacy user-facing OmniOS branding remains in ${name}`);
  }
}
if(!process.exitCode) ok('User-facing PWA surfaces use Second Brain branding');

const p4=fs.readFileSync('app-parts/part-004.html','utf8');
for(const token of ['applyAuxDurably35','persistStateDurably35','MAX_PRESYNC_SNAPS35','legacy plaintext password records']){
  if(!p4.includes(token)) fail(`Recovery hardening marker missing: ${token}`);
}
const p28=fs.readFileSync('app-parts/part-028.html','utf8');
for(const token of ['metadataChanged','kind:\'pre-sync\'','r.applyAuxDurably?.(auxChanges)','r.writeAuxMetaDurably?.(mergedAuxMeta)','delete syncState.passwords','mergeStructuredAux','OmniBibleReloadFromStorage']){
  if(!p28.includes(token)) fail(`Sync hardening marker missing: ${token}`);
}
const p2=fs.readFileSync('app-parts/part-002.html','utf8');
if(p2.includes('Math.floor(Math.random() * chars.length)')) fail('Password generator still uses Math.random');
if(!p2.includes('cryptoObj.getRandomValues')) fail('Password generator does not use Web Crypto');
else ok('Password generator uses Web Crypto');

const inlineScripts=[];
for(const path of parts){
  const html=fs.readFileSync(path,'utf8');
  const re=/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m;
  while((m=re.exec(html))){
    const open=html.slice(m.index,html.indexOf('>',m.index)+1);
    if(/type\s*=\s*["'](?:application\/json|application\/ld\+json)["']/i.test(open)) continue;
    if(/\bsrc\s*=/i.test(open)) continue;
    inlineScripts.push({path,code:m[1]});
  }
}
let syntaxFailures=0;
for(const {path,code} of inlineScripts){
  try{ new Function(code); }
  catch(e){ syntaxFailures++; fail(`Inline script syntax error in ${path}: ${e.message}`); }
}
if(!syntaxFailures) ok(`${inlineScripts.length} inline scripts parsed successfully`);

if(process.exitCode) process.exit(process.exitCode);
console.log('Release regression gate passed.');

import fs from 'node:fs';
import {createHash} from 'node:crypto';
export function sourceRelease(){
  const parts=Array.from({length:28},(_,i)=>`app-parts/part-${String(i+1).padStart(3,'0')}.html`);
  let html=parts.map(p=>fs.readFileSync(p,'utf8')).join('');
  const modules={};
  html=html.replace(/<script\b[^>]*\bsrc=["'](\.\/)?(js\/[^"']+|pwa-personalization\.js)["'][^>]*><\/script>/gi,(_,prefix,file)=>{
    modules[file]=fs.readFileSync(file,'utf8');
    return '<script>\n'+modules[file].replace(/<\/script/gi,'<\\/script')+'\n</script>';
  });
  const sha256=createHash('sha256').update(html).digest('hex');
  return {html,manifest:{version:1,file:`app.${sha256.slice(0,20)}.html`,sha256,bytes:Buffer.byteLength(html),parts,modules:Object.keys(modules),subject:'Life Hub: keep only the current v43 interface'}};
}
if(process.argv.includes('--write'))fs.writeFileSync('source-release.json',JSON.stringify(sourceRelease().manifest,null,2)+'\n');
if(process.argv.includes('--check')){
  const saved=JSON.parse(fs.readFileSync('source-release.json','utf8'));
  if(JSON.stringify(saved)!==JSON.stringify(sourceRelease().manifest))throw Error('Source release is stale. Run npm run release:source before committing.');
  console.log('Source-hosted release checksum matches the application.');
}

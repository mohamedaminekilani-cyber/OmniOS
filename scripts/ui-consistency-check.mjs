import fs from 'node:fs';

const parts=Array.from({length:28},(_,i)=>`app-parts/part-${String(i+1).padStart(3,'0')}.html`);
const html=parts.map(p=>fs.readFileSync(p,'utf8')).join('');

function duplicates(values){
  const counts=new Map();
  for(const v of values)counts.set(v,(counts.get(v)||0)+1);
  return [...counts].filter(([,n])=>n>1);
}

const styleIds=[...html.matchAll(/<style\b[^>]*\bid=["']([^"']+)["']/gi)].map(m=>m[1]);
const scriptIds=[...html.matchAll(/<script\b[^>]*\bid=["']([^"']+)["']/gi)].map(m=>m[1]);
const dupStyles=duplicates(styleIds);
const dupScripts=duplicates(scriptIds);

if(dupStyles.length)throw new Error('Duplicate style ids: '+dupStyles.map(([id,n])=>id+' ×'+n).join(', '));
if(dupScripts.length)throw new Error('Duplicate script ids: '+dupScripts.map(([id,n])=>id+' ×'+n).join(', '));

const deprecated=[
  'omnios-v64-mobile-bars-placement-fix',
  'omnios-v64-mobile-bars-stacking-fix',
  'omnios-v64-mobile-nav-final-polish',
  'omnios-v64-mobile-active-frame',
  'omnios-v65-mobile-ux-authority',
  'omnios-v81-menu-safezone-welcome-later'
];
const lingering=deprecated.filter(id=>html.includes(`id="${id}"`)||html.includes(`id='${id}'`));
if(lingering.length)throw new Error('Deprecated UI authority layers reintroduced: '+lingering.join(', '));

const critical=['renderDashboard43','renderLifeSection43','renderLife43','installHeader'];
for(const name of critical){
  const count=(html.match(new RegExp('\\bfunction\\s+'+name+'\\s*\\(','g'))||[]).length;
  if(count>1)throw new Error(`Conflicting UI renderer ${name} declared ${count} times`);
}

console.log(`UI consistency OK: ${styleIds.length} style blocks, ${scriptIds.length} script blocks, one canonical core renderer path.`);

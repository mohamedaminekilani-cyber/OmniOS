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
  'omnios-v64-more-autoclose',
  'omnios-v64-menu-svg-state',
  'omnios-v64-menu-interaction-final',
  'omnios-v64-bottom-nav-hard-close',
  'omnios-v65-mobile-ux-authority',
  'omnios-v65-mobile-ux-js',
  'omnios-v81-menu-safezone-welcome-later'
];
const lingering=deprecated.filter(id=>html.includes(`id="${id}"`)||html.includes(`id='${id}'`));
if(lingering.length)throw new Error('Deprecated UI authority layers reintroduced: '+lingering.join(', '));

const requiredBlocks=[
  'omnios-dashboard-lifehub-css',
  'omnios-dashboard-lifehub-js',
  'omnios-header-assistant-ui-css',
  'omnios-header-assistant-ui-js',
  'omnios-page-covers-css',
  'omnios-page-covers-js',
  'omnios-v74-uiux-authority',
  'omnios-v75-chrome-clearance',
  'omnios-v82-menu-safezone-edge-fix',
  'omnios-v85-hide-closed-menu',
  'omnios-v92-svg-only-mobile-icons'
];
for(const id of requiredBlocks){
  const count=[...styleIds,...scriptIds].filter(x=>x===id).length;
  if(count!==1)throw new Error(`Canonical UI block ${id} expected once, found ${count}`);
}

const critical=[
  'renderDashboard43','renderLifeSection43','renderLife43','ensure43',
  'personInitials43','personAvatar43','personDate43','personContact43','personStat43',
  'installHeader','setAssistantOpen','openFloatingAssistant','closeFloatingAssistant',
  'toggleFloatingAssistant','bindAssistantFab'
];
for(const name of critical){
  const count=(html.match(new RegExp('\\bfunction\\s+'+name+'\\s*\\(','g'))||[]).length;
  if(count!==1)throw new Error(`Canonical UI helper ${name} expected once, found ${count}`);
}

const v64Theme=html.match(/<style\b[^>]*\bid=["']omnios-v64-aurora-glass-ui["'][^>]*>([\s\S]*?)<\/style>/i)?.[1]||'';
if(/@media\s*\(\s*max-width\s*:\s*760px\s*\)/i.test(v64Theme)){
  throw new Error('Obsolete v64 mobile layout authority remains inside aurora theme');
}

console.log(`UI consistency OK: ${styleIds.length} style blocks, ${scriptIds.length} script blocks, one canonical core renderer path.`);

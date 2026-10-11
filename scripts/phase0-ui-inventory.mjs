/**
 * Phase 0 structural UI inventory.
 * Read-only, dependency-free, and intentionally not a pixel/rendering audit.
 * Run: node scripts/phase0-ui-inventory.mjs
 */
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const parts = Array.from({length:28},(_,i)=>'app-parts/part-'+String(i+1).padStart(3,'0')+'.html');
const watched = ['.sidebar','.topbar','.view-container','.mobile-nav','.nav-item','#view-dashboard','#view-today','#view-master-calendar','#view-habits','#view-workout','.btn-primary','.modal'];
const matches = (text,expr)=>[...text.matchAll(expr)];
const count=(text,expr)=>matches(text,expr).length;

export function collectUiInventory(){
  const sources=parts.filter(p=>fs.existsSync(p)&&fs.statSync(p).size>0).concat('index.html');
  const components={};
  const totals={sourceFiles:sources.length,chars:0,styleBlocks:0,scriptBlocks:0,important:0,mediaQueries:0,mutationObserverOccurrences:0,domContentLoadedOccurrences:0};
  const blocks={};
  const styleIds=[];
  for(const path of sources){
    const source=fs.readFileSync(path,'utf8');
    const style=matches(source,/<style\b([^>]*)>([\s\S]*?)<\/style>/gi);
    const scripts=matches(source,/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi);
    const stats={
      characters:source.length,styles:style.length,scripts:scripts.length,
      important:count(source,/!important/g),mediaQueries:count(source,/@media\s*\(/g),
      observerOccurrences:count(source,/new\s+MutationObserver\s*\(/g),
      readyOccurrences:count(source,/DOMContentLoaded/g)
    };
    components[path]=stats;
    totals.chars+=stats.characters;
    totals.styleBlocks+=stats.styles;totals.scriptBlocks+=stats.scripts;
    totals.important+=stats.important;totals.mediaQueries+=stats.mediaQueries;
    totals.mutationObserverOccurrences+=stats.observerOccurrences;
    totals.domContentLoadedOccurrences+=stats.readyOccurrences;
    for(const m of style){
      const id=m[1].match(/\bid=["']([^"']+)["']/i)?.[1]||'(anonymous)';
      if(id!=='(anonymous)')styleIds.push(id);
      for(const selector of watched){
        if(!m[2].includes(selector))continue;
        const t=blocks[selector]||(blocks[selector]={blockCount:0,examples:[]});
        t.blockCount++;
        if(t.examples.length<3)t.examples.push({file:path,style:id});
      }
    }
  }
  const shell=fs.readFileSync('app-parts/part-001.html','utf8');
  const sidebar=shell.match(/<nav class="nav-menu"[\s\S]*?<\/nav>/)?.[0]||'';
  const mobile=shell.match(/<nav class="mobile-nav[^"]*"[\s\S]*?<\/nav>/)?.[0]||'';
  const navigation={
    sidebarRoutes:matches(sidebar,/data-view=["']([^"']+)["']/gi).map(m=>m[1]),
    mobilePrimaryRoutes:matches(mobile,/data-mobile-view=["']([^"']+)["']/gi).map(m=>m[1]),
    hasMobileMore:mobile.includes('id="omr-mobile-more"'),
    hasMobileMoreDialog:fs.readFileSync('app-parts/part-028.html','utf8').includes('id="omr-mobile-drawer"')
  };
  const duplicateStyleIds=Object.entries(styleIds.reduce((o,id)=>{o[id]=(o[id]||0)+1;return o},{})).filter(([,n])=>n>1);
  const release=JSON.parse(fs.readFileSync('source-release.json','utf8'));
  return {
    note:'Counts are static source occurrences, not simultaneously active observers, computed styling, WCAG scores or real-browser measurements.',
    totals,components,selectorOverlap:blocks,navigation,
    duplicateStyleIds,release:{sha256:release.sha256,bytes:release.bytes,parts:release.parts.length,modules:release.modules.length}
  };
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(collectUiInventory(),null,2));

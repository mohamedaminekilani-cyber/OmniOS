import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
export default async () => {
 const store=getStore('omnios-sync-relay',{consistency:'strong'}),cutoff=Date.now()-20*60*1000;
 let deleted=0;
 for await (const page of store.list({prefix:'message/',paginate:true})) {
  const expired=page.blobs.filter(x=>{const stamp=Number(x.key.split('/')[2]?.slice(0,13));return stamp>0&&stamp<cutoff});
  for(let i=0;i<expired.length;i+=20){await Promise.all(expired.slice(i,i+20).map(x=>store.delete(x.key)));deleted+=Math.min(20,expired.length-i)}
 }
 return Response.json({deleted});
};
export const config: Config={schedule:'*/20 * * * *'};

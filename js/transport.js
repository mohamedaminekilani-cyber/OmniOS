(function(root){'use strict';
const MAX=24*1024*1024,CHUNK=8192,queues=new WeakMap(),buffers=new WeakMap(),completed=new WeakMap();
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
const b64=bytes=>btoa(String.fromCharCode(...bytes));
async function packets(obj){const bytes=enc.encode(JSON.stringify(obj));if(bytes.length>MAX)throw Error('Transfer exceeds 24 MB. Export a backup for this workspace.');const id=crypto.randomUUID(),hash=await digest(bytes),count=Math.ceil(bytes.length/CHUNK),out=[];for(let i=0;i<count;i++)out.push({sbFrame:2,id,index:i,count,size:bytes.length,hash,data:b64(bytes.subarray(i*CHUNK,(i+1)*CHUNK))});return out}
async function receive(channel,raw){
 const msg=typeof raw==='string'?JSON.parse(raw):raw;if(!msg?.sbFrame)return msg;
 if(msg.sbFrame!==2||!Number.isInteger(msg.size)||msg.size<1||msg.size>MAX||!Number.isInteger(msg.count)||msg.count!==Math.ceil(msg.size/CHUNK)||!Number.isInteger(msg.index)||msg.index<0||msg.index>=msg.count||!/^[a-zA-Z0-9-]{1,80}$/.test(msg.id)||!/^[a-f0-9]{64}$/.test(msg.hash)||typeof msg.data!=='string'||msg.data.length>11000)throw Error('Invalid transfer frame');
 let done=completed.get(channel);if(!done){done=new Map();completed.set(channel,done)}for(const[id,at]of done)if(Date.now()-at>60000)done.delete(id);if(done.has(msg.id))return null;
 let map=buffers.get(channel);if(!map){map=new Map();buffers.set(channel,map)}for(const[id,row]of map)if(Date.now()-row.at>60000)map.delete(id);
 let row=map.get(msg.id);if(!row){if(map.size>=2)throw Error('Too many simultaneous transfers');row={at:Date.now(),count:msg.count,size:msg.size,hash:msg.hash,parts:new Map()};map.set(msg.id,row)}
 if(row.count!==msg.count||row.hash!==msg.hash||row.size!==msg.size)throw Error('Transfer metadata changed');
 const bytes=Uint8Array.from(atob(msg.data),c=>c.charCodeAt(0)),expected=msg.index===msg.count-1?msg.size-CHUNK*(msg.count-1):CHUNK;if(bytes.length!==expected)throw Error('Incomplete transfer frame');row.parts.set(msg.index,bytes);row.at=Date.now();
 if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('secondbrain:transfer',{detail:{received:Math.min(row.parts.size*CHUNK,row.size),total:row.size}}));
 if(row.parts.size!==row.count)return null;
 map.delete(msg.id);const all=new Uint8Array(row.size);for(let i=0;i<row.count;i++)all.set(row.parts.get(i),i*CHUNK);if(await digest(all)!==row.hash)throw Error('Transfer checksum mismatch');const value=JSON.parse(dec.decode(all));done.set(msg.id,Date.now());return value;
}
function send(channel,obj,sendFrame){
 const run=async()=>{for(const p of await packets(obj)){
  const wire=channel.dataChannel||channel;const deadline=Date.now()+15000;while(wire.bufferedAmount>256*1024){if(wire.readyState!=='open'||Date.now()>deadline)throw Error('Connection interrupted; reconnect to retry.');await new Promise(r=>setTimeout(r,20))}
  if(sendFrame)await sendFrame(p);else{if(channel.readyState!=='open')throw Error('Connection closed');channel.send(JSON.stringify(p))}
 }};const job=(queues.get(channel)||Promise.resolve()).then(run,run);queues.set(channel,job.catch(()=>{}));return job;
}
function track(channel,fingerprint,onTimeout){clearTimeout(channel.__sbAckTimer);if(channel.__sbAck===fingerprint)return;channel.__sbAckTimer=setTimeout(()=>{channel.__omniLastSent='';onTimeout()},30000)}
function acknowledge(channel,fingerprint){channel.__sbAck=fingerprint;if(fingerprint===channel.__omniLastSent)clearTimeout(channel.__sbAckTimer)}
root.SecondBrainTransport={packets,receive,send,track,acknowledge,MAX};
})(typeof window!=='undefined'?window:globalThis);

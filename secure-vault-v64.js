(function(){
'use strict';
if(window.__secondBrainSecureVault64)return;
window.__secondBrainSecureVault64=true;

var VAULT_KEY='secondbrain_password_vault_v1';
var ITERATIONS=250000;
var session={key:null,records:[],meta:null};

function esc64(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]})}
function bytesToB64(bytes){var s='';for(var i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(s)}
function b64ToBytes(s){var raw=atob(String(s||'')),out=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
function randomBytes(n){var a=new Uint8Array(n);crypto.getRandomValues(a);return a}
function clone64(v){return JSON.parse(JSON.stringify(v))}
function readVault(){try{var v=JSON.parse(localStorage.getItem(VAULT_KEY)||'null');return v&&v.version===1?v:null}catch(_){return null}}
async function deriveKey(pass,salt,iterations){
  var base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:salt,iterations:iterations||ITERATIONS},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])
}
async function writeEncrypted(records,key,meta){
  var iv=randomBytes(12),plain=new TextEncoder().encode(JSON.stringify(records||[]));
  var cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,plain));
  var next={version:1,kdf:{name:'PBKDF2',hash:'SHA-256',iterations:meta.kdf.iterations,salt:meta.kdf.salt},cipher:{name:'AES-GCM',iv:bytesToB64(iv),data:bytesToB64(cipher)},updatedAt:new Date().toISOString()};
  localStorage.setItem(VAULT_KEY,JSON.stringify(next));
  session.meta=next;
  document.dispatchEvent(new CustomEvent('omnios:data-changed',{detail:{secureVault:true}}));
  return next
}
async function createVault(pass,records){
  if(String(pass||'').length<10)throw new Error('Use at least 10 characters for the vault passphrase.');
  var salt=randomBytes(16),meta={kdf:{iterations:ITERATIONS,salt:bytesToB64(salt)}};
  var key=await deriveKey(pass,salt,ITERATIONS);
  session.key=key;session.records=clone64(records||[]);
  await writeEncrypted(session.records,key,meta);
  return true
}
async function unlockVault(pass){
  var v=readVault();if(!v)throw new Error('No encrypted vault exists yet.');
  var key=await deriveKey(pass,b64ToBytes(v.kdf.salt),Number(v.kdf.iterations)||ITERATIONS);
  try{
    var plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64ToBytes(v.cipher.iv)},key,b64ToBytes(v.cipher.data));
    var records=JSON.parse(new TextDecoder().decode(plain));
    if(!Array.isArray(records))throw new Error();
    session={key:key,records:records,meta:v};return true
  }catch(_){throw new Error('Incorrect passphrase or unreadable vault.')}
}
function securePassword(length){
  var chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*',out='',max=256-(256%chars.length);
  length=Math.max(12,Number(length)||20);
  while(out.length<length){var bytes=randomBytes(32);for(var i=0;i<bytes.length&&out.length<length;i++)if(bytes[i]<max)out+=chars[bytes[i]%chars.length]}
  return out
}
function shell(title,body){
  if(typeof budgetModalShell==='function')return budgetModalShell(title,body);
  var ov=document.createElement('div');ov.className='modal-overlay active';ov.innerHTML='<div class="modal"><div class="modal-header"><h3>'+esc64(title)+'</h3><button type="button" class="icon-btn" data-close>×</button></div><div class="modal-body">'+body+'</div></div>';document.body.appendChild(ov);ov.querySelector('[data-close]').onclick=function(){ov.remove()};return ov
}
function lockedHtml(){
  var legacy=(typeof state!=='undefined'&&Array.isArray(state.passwords))?state.passwords.length:0;
  var exists=!!readVault();
  if(!exists&&legacy){
    return '<div class="card" style="padding:16px"><strong>Secure vault migration required</strong><p class="text-muted text-sm" style="margin-top:6px">You have '+legacy+' legacy credential entr'+(legacy===1?'y':'ies')+' stored in plaintext. Create a vault passphrase to encrypt them with AES-GCM. The plaintext copies are removed from the main workspace after encryption succeeds.</p><div class="form-group"><label class="form-label">New vault passphrase</label><input class="form-input" id="vault-pass-a" type="password" autocomplete="new-password"></div><div class="form-group"><label class="form-label">Confirm passphrase</label><input class="form-input" id="vault-pass-b" type="password" autocomplete="new-password"></div><button type="button" class="btn btn-primary" id="vault-migrate">Encrypt & migrate</button></div>';
  }
  if(!exists){
    return '<div class="card" style="padding:16px"><strong>Create encrypted password vault</strong><p class="text-muted text-sm" style="margin-top:6px">Credentials are encrypted locally with a passphrase that is never saved by Second Brain.</p><div class="form-group"><label class="form-label">Vault passphrase</label><input class="form-input" id="vault-pass-a" type="password" autocomplete="new-password"></div><div class="form-group"><label class="form-label">Confirm passphrase</label><input class="form-input" id="vault-pass-b" type="password" autocomplete="new-password"></div><button type="button" class="btn btn-primary" id="vault-create">Create vault</button></div>';
  }
  return '<div class="card" style="padding:16px"><strong>Password vault locked</strong><p class="text-muted text-sm" style="margin-top:6px">Enter your vault passphrase to decrypt credentials in memory for this session.</p><div class="form-group"><label class="form-label">Vault passphrase</label><input class="form-input" id="vault-unlock-pass" type="password" autocomplete="current-password"></div><button type="button" class="btn btn-primary" id="vault-unlock">Unlock vault</button></div>';
}
function wireLocked(list){
  var a=list.querySelector('#vault-pass-a'),b=list.querySelector('#vault-pass-b');
  async function create(migrate){
    try{
      if(!a||!b||a.value!==b.value)throw new Error('Passphrases do not match.');
      var records=migrate&&Array.isArray(state.passwords)?clone64(state.passwords):[];
      await createVault(a.value,records);
      if(migrate){state.passwords=[];if(typeof saveState==='function')saveState()}
      renderPasswords();window.toast&&window.toast(migrate?'Passwords encrypted and migrated':'Encrypted vault created');
    }catch(e){window.toast?window.toast(e.message):alert(e.message)}
  }
  var m=list.querySelector('#vault-migrate'),cr=list.querySelector('#vault-create');
  if(m)m.onclick=function(){create(true)};if(cr)cr.onclick=function(){create(false)};
  var u=list.querySelector('#vault-unlock'),p=list.querySelector('#vault-unlock-pass');
  if(u)u.onclick=async function(){try{await unlockVault(p.value);renderPasswords();window.toast&&window.toast('Vault unlocked')}catch(e){window.toast?window.toast(e.message):alert(e.message)}};
  if(p)p.addEventListener('keydown',function(e){if(e.key==='Enter'&&u)u.click()})
}
function secureRenderPasswords(){
  var list=document.getElementById('password-list');if(!list)return;
  if(!session.key){list.innerHTML=lockedHtml();wireLocked(list);return}
  var q='';try{q=String(passwordSearch||'').toLowerCase()}catch(_){}
  var items=session.records.filter(function(p){return !q||String(p.site||'').toLowerCase().includes(q)||String(p.username||'').toLowerCase().includes(q)});
  var html='<div class="flex-between" style="margin-bottom:10px"><div class="text-muted text-sm">AES-GCM encrypted vault · decrypted only in memory</div><button type="button" class="btn btn-sm" id="vault-lock-now">Lock</button></div>';
  if(!items.length)html+='<div class="empty-state">'+(session.records.length?'No saved passwords match your search.':'No passwords saved yet. Add your first login to get started.')+'</div>';
  else html+=items.map(function(p){
    return '<div class="card" data-vault-open="'+esc64(p.id)+'" style="cursor:pointer"><div class="flex-between" style="margin-bottom:6px"><strong>'+esc64(p.site)+'</strong><button type="button" class="icon-btn btn-sm" data-vault-copy="'+esc64(p.id)+'" title="Copy password">📋</button></div><div class="text-muted text-sm">'+esc64(p.username||'No username set')+'</div><div style="font-family:monospace;margin-top:6px">••••••••••••</div></div>'
  }).join('');
  list.innerHTML=html;
  list.querySelector('#vault-lock-now').onclick=function(){session={key:null,records:[],meta:null};secureRenderPasswords()};
  list.querySelectorAll('[data-vault-open]').forEach(function(el){el.onclick=function(e){if(e.target.closest('[data-vault-copy]'))return;secureOpenPasswordModal(el.getAttribute('data-vault-open'))}});
  list.querySelectorAll('[data-vault-copy]').forEach(function(el){el.onclick=function(){var p=session.records.find(function(x){return String(x.id)===String(el.getAttribute('data-vault-copy'))});if(!p)return;navigator.clipboard.writeText(p.password||'').then(function(){window.toast&&window.toast('Password copied')}).catch(function(){window.toast&&window.toast('Could not copy password')})}})
}
async function persistRecords(){
  if(!session.key||!session.meta)throw new Error('Vault is locked.');
  await writeEncrypted(session.records,session.key,session.meta)
}
function secureOpenPasswordModal(id){
  if(!session.key){secureRenderPasswords();return}
  var p=id?session.records.find(function(x){return String(x.id)===String(id)}):null;
  var ov=shell(p?'Edit Password':'Add Password',
    '<div class="form-group"><label class="form-label">Site / service</label><input class="form-input" id="pw-site" value="'+esc64(p&&p.site||'')+'"></div>'+
    '<div class="form-group"><label class="form-label">Website URL (optional)</label><input class="form-input" id="pw-url" value="'+esc64(p&&p.url||'')+'" placeholder="https://…"></div>'+
    '<div class="form-group"><label class="form-label">Username / email</label><input class="form-input" id="pw-username" value="'+esc64(p&&p.username||'')+'" autocomplete="username"></div>'+
    '<div class="form-group"><label class="form-label">Password</label><div style="display:flex;gap:6px"><input class="form-input" id="pw-password" type="password" autocomplete="new-password" value="'+esc64(p&&p.password||'')+'" style="font-family:monospace"><button type="button" class="btn btn-sm" id="pw-toggle">Show</button><button type="button" class="btn btn-sm" id="pw-generate">Generate</button></div></div>'+
    '<div class="form-group"><label class="form-label">Notes (optional)</label><textarea class="form-textarea" id="pw-notes">'+esc64(p&&p.notes||'')+'</textarea></div>'+
    '<div class="text-muted text-sm">Encrypted with AES-GCM before it is written to local storage. The vault passphrase is not stored.</div>'+
    '<div class="modal-footer"><button type="button" class="btn btn-danger" id="pw-delete" style="display:'+(p?'inline-flex':'none')+'">Delete</button><span style="flex:1"></span><button type="button" class="btn" data-close>Cancel</button><button type="button" class="btn btn-primary" id="pw-save">Save</button></div>');
  var input=ov.querySelector('#pw-password');
  ov.querySelector('#pw-toggle').onclick=function(){input.type=input.type==='password'?'text':'password';this.textContent=input.type==='password'?'Show':'Hide'};
  ov.querySelector('#pw-generate').onclick=function(){input.value=securePassword()};
  ov.querySelector('#pw-save').onclick=async function(){
    try{
      var site=ov.querySelector('#pw-site').value.trim();if(!site)throw new Error('Enter a site or service name.');
      var data={site:site,url:ov.querySelector('#pw-url').value.trim(),username:ov.querySelector('#pw-username').value.trim(),password:input.value,notes:ov.querySelector('#pw-notes').value.trim()};
      if(p)Object.assign(p,data);else session.records.push(Object.assign({id:(crypto.randomUUID?crypto.randomUUID():'pw-'+Date.now())},data));
      await persistRecords();ov.remove();secureRenderPasswords();window.toast&&window.toast(p?'Password updated':'Password saved')
    }catch(e){window.toast?window.toast(e.message):alert(e.message)}
  };
  if(p)ov.querySelector('#pw-delete').onclick=async function(){if(!confirm('Delete the saved login for "'+p.site+'"?'))return;session.records=session.records.filter(function(x){return String(x.id)!==String(p.id)});await persistRecords();ov.remove();secureRenderPasswords();window.toast&&window.toast('Password deleted')};
  ov.querySelectorAll('[data-close]').forEach(function(x){x.onclick=function(){ov.remove()}})
}

try{renderPasswords=secureRenderPasswords;openPasswordModal=secureOpenPasswordModal;genPassword=securePassword}catch(e){console.warn('Secure vault binding patch',e)}
window.SecondBrainVault64={lock:function(){session={key:null,records:[],meta:null};secureRenderPasswords()},isUnlocked:function(){return !!session.key},hasVault:function(){return !!readVault()}};
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&session.key){setTimeout(function(){if(document.visibilityState==='hidden'){session={key:null,records:[],meta:null}}},5*60*1000)}});
setTimeout(function(){try{secureRenderPasswords()}catch(_){}},0);
})();
/* OmniOS Home Workout — lightweight, text-first bodyweight plans, session and progress tracking. */
(function(){
'use strict';
if(window.OmniHomeWorkout)return;
var CATALOG=[
 ['push-up','Push-ups','Push','Chest · triceps','None','reps',12,'Beginner'],
 ['diamond-push-up','Diamond push-ups','Push','Triceps · chest','None','reps',8,'Intermediate'],
 ['incline-push-up','Incline push-ups','Push','Chest · shoulders','Chair','reps',12,'Beginner'],
 ['decline-push-up','Decline push-ups','Push','Upper chest · shoulders','Chair','reps',10,'Advanced'],
 ['pike-push-up','Pike push-ups','Push','Shoulders · triceps','None','reps',8,'Intermediate'],
 ['dip','Dips','Push','Triceps · chest','Stable bars','reps',8,'Intermediate'],
 ['pull-up','Pull-ups','Pull','Back · biceps','Pull-up bar','reps',6,'Intermediate'],
 ['chin-up','Chin-ups','Pull','Biceps · back','Pull-up bar','reps',6,'Intermediate'],
 ['bodyweight-squat','Bodyweight squats','Legs','Quads · glutes','None','reps',18,'Beginner'],
 ['jump-squat','Jump squats','Legs','Quads · glutes','None','reps',12,'Intermediate'],
 ['reverse-lunge','Reverse lunges','Legs','Quads · glutes','None','reps',12,'Beginner'],
 ['glute-bridge','Glute bridges','Legs','Glutes · posterior chain','None','reps',15,'Beginner'],
 ['calf-raise','Calf raises','Legs','Calves','None','reps',20,'Beginner'],
 ['wall-sit','Wall sit','Legs','Quads · core','Wall','time',45,'Beginner'],
 ['plank','Plank','Core','Abs · transverse core','None','time',40,'Beginner'],
 ['side-plank','Side plank','Core','Obliques','None','time',30,'Intermediate'],
 ['mountain-climber','Mountain climbers','Core','Core · conditioning','None','time',40,'Beginner'],
 ['bicycle-crunch','Bicycle crunches','Core','Abs · obliques','None','reps',20,'Beginner'],
 ['hanging-leg-raise','Hanging leg raises','Core','Abs · hip flexors','Pull-up bar','reps',10,'Advanced'],
 ['burpee','Burpees','Full body','Full body · cardio','None','reps',10,'Intermediate'],
 ['jumping-jack','Jumping jacks','Full body','Full body · cardio','None','time',60,'Beginner']
].map(function(a){return {id:a[0],name:a[1],group:a[2],muscle:a[3],equipment:a[4],mode:a[5],target:a[6],difficulty:a[7]};});
var EXERCISES=Object.fromEntries(CATALOG.map(function(e){return [e.id,e]}));
var BUILTINS=[
 {id:'starter-full',name:'Full body · 25 min',note:'Balanced home training',items:[['push-up',3,10,60],['bodyweight-squat',3,16,45],['reverse-lunge',3,10,45],['plank',3,40,45]]},
 {id:'starter-upper',name:'Upper body strength',note:'Push and pull movements',items:[['push-up',4,12,75],['pull-up',3,6,90],['diamond-push-up',3,8,75],['chin-up',3,6,90]]},
 {id:'starter-legs',name:'Legs & core',note:'No weights needed',items:[['bodyweight-squat',4,18,60],['glute-bridge',3,15,45],['jump-squat',3,10,60],['wall-sit',3,45,45],['plank',3,40,45]]}
].map(function(p){return {id:p.id,name:p.name,note:p.note,builtin:true,items:p.items.map(function(a){return {id:a[0],sets:a[1],target:a[2],rest:a[3]}})};});
var page='plans',category='All',query='',chartExercise='push-up',draft=null,interval=null,initDone=false,oldRender=null;
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function uid(){return 'home-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
function clamp(n,min,max,backup){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):backup}
function dateKey(input){var d=new Date(input||Date.now());return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function store(){if(!state.homeWorkout||typeof state.homeWorkout!=='object')state.homeWorkout={};var d=state.homeWorkout;if(!Array.isArray(d.routines))d.routines=[];if(!Array.isArray(d.sessions))d.sessions=[];if(!d.active||!Array.isArray(d.active.entries))d.active=null;return d}
function persist(){if(typeof saveState==='function')saveState()}
function note(m){if(typeof window.toast==='function')window.toast(m)}
function getExercise(id){return EXERCISES[id]||null}
function plan(id){return store().routines.find(function(p){return p.id===id})||BUILTINS.find(function(p){return p.id===id})}
function allPlans(){return BUILTINS.concat(store().routines)}
function itemDefaults(id){var x=getExercise(id);return {id:id,sets:3,target:x?x.target:10,rest:60}}
function safeItems(items){return (Array.isArray(items)?items:[]).filter(function(it){return it&&getExercise(it.id)}).slice(0,30).map(function(it){var e=getExercise(it.id);return {id:e.id,sets:clamp(it.sets,1,12,3),target:clamp(it.target,1,e.mode==='time'?1800:300,e.target),rest:clamp(it.rest,0,900,60)}})}
function stats(){
 var rows=store().sessions,now=Date.now(),week=rows.filter(function(s){return s.endedAt&&now-new Date(s.endedAt).getTime()<7*86400000}),sets=0,reps=0,minutes=0;
 week.forEach(function(s){minutes+=Math.round(Number(s.durationSec||0)/60);(s.entries||[]).forEach(function(e){(e.sets||[]).forEach(function(set){if(set.done){sets++;if(getExercise(e.id)?.mode==='reps')reps+=Number(set.actual||0)}})})});
 return {week:week.length,sets:sets,reps:reps,minutes:minutes}
}
function current(){return store().active}
function cardButton(action,label,more){return '<button type="button" class="btn '+(more||'')+'" data-hw-action="'+esc(action)+'">'+esc(label)+'</button>'}
function nav(){
 return '<div class="hw-nav" role="tablist" aria-label="Home workout sections">'+
 [['plans','My plans'],['library','Exercises'],['progress','Progress'],['history','History']].map(function(a){return '<button type="button" role="tab" aria-selected="'+(page===a[0])+'" class="hw-nav-btn '+(page===a[0]?'active':'')+'" data-hw-page="'+a[0]+'">'+a[1]+'</button>'}).join('')+'</div>';
}
function ensureUI(){
 var view=document.getElementById('view-workout');if(!view)return null;
 var tabs=view.querySelector('.workout-tabs');if(tabs&&!tabs.querySelector('[data-workout-tab="home"]')){
  var button=document.createElement('button');button.type='button';button.className='view-btn';button.dataset.workoutTab='home';button.textContent='Home workout';tabs.appendChild(button);
 }
 var panel=document.getElementById('hw-panel');if(!panel){panel=document.createElement('section');panel.id='hw-panel';panel.setAttribute('aria-label','Home workout');panel.setAttribute('aria-live','off');view.appendChild(panel)}
 return panel;
}
function syncView(){
 var v=document.getElementById('view-workout');if(!v)return;
 var home=typeof workoutTab!=='undefined'&&workoutTab==='home';
 v.classList.toggle('hw-active',home);
 v.querySelectorAll('[data-workout-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.workoutTab===(home?'home':workoutTab))});
 if(home)render();
}
function render(){
 var root=ensureUI();if(!root)return;
 var v=document.getElementById('view-workout');v.classList.add('hw-active');
 var d=store(),s=stats(),a=d.active;
 var header='<div class="hw-top"><div><div class="hw-kicker">BODYWEIGHT TRAINING</div><h3>Home workout</h3><p>Your plans, timed sets and progress in one place. No gym required.</p></div><div class="hw-top-actions">'+(a?cardButton('resume','Resume session','btn-primary'):cardButton('new-plan','Build a plan','btn-primary'))+'</div></div>';
 var kpis='<div class="hw-kpis"><div><small>Sessions · 7 days</small><strong>'+s.week+'</strong></div><div><small>Completed sets</small><strong>'+s.sets+'</strong></div><div><small>Bodyweight reps</small><strong>'+s.reps+'</strong></div><div><small>Training time</small><strong>'+s.minutes+' min</strong></div></div>';
 root.innerHTML=header+kpis+(a?sessionView(a):nav()+(page==='plans'?plansView():page==='library'?libraryView():page==='progress'?progressView():historyView()));
 updateClock();
}
function plansView(){
 var plans=allPlans(),history=store().sessions;
 return '<div class="hw-heading"><div><h4>Training plans</h4><p>Choose a starter or create your own sequence.</p></div>'+cardButton('new-plan','+ New plan')+'</div><div class="hw-plans">'+plans.map(function(p){
 var count=p.items.reduce(function(n,i){return n+i.sets},0);
 var last=history.find(function(s){return s.routineId===p.id});
 return '<article class="hw-plan"><div class="hw-plan-content"><div class="hw-overline">'+(p.builtin?'STARTER PLAN':'MY PLAN')+'</div><h4>'+esc(p.name)+'</h4><p>'+esc(p.note||'Custom home workout')+'</p><div class="hw-plan-exercises">'+p.items.slice(0,3).map(function(it){return esc(getExercise(it.id)?.name||it.id)}).join(' · ')+(p.items.length>3?' · +'+(p.items.length-3)+' more':'')+'</div><div class="hw-plan-chips"><span>'+p.items.length+' exercises</span><span>'+count+' sets</span>'+(last?'<span>Last done '+esc(dateKey(last.endedAt))+'</span>':'')+'</div><div class="hw-plan-actions"><button type="button" class="btn btn-primary" data-hw-start="'+esc(p.id)+'">Start</button><button type="button" class="btn" data-hw-edit="'+esc(p.id)+'">'+(p.builtin?'Customize':'Edit')+'</button>'+(p.builtin?'':'<button type="button" class="btn hw-danger" data-hw-delete="'+esc(p.id)+'">Delete</button>')+'</div></div></article>'
 }).join('')+'</div>';
}
function libraryView(){
 var list=CATALOG.filter(function(e){return (category==='All'||e.group===category)&&(!query||[e.name,e.muscle,e.equipment].join(' ').toLowerCase().includes(query.toLowerCase()))});
 return '<div class="hw-heading"><div><h4>Exercise library</h4><p>Build a routine from 21 bodyweight exercises.</p></div><label class="hw-search"><span class="sr-only">Find an exercise</span><input id="hw-search" type="search" placeholder="Search exercises…" value="'+esc(query)+'"></label></div>'+
 '<div class="hw-filters">'+['All','Push','Pull','Legs','Core','Full body'].map(function(g){return '<button type="button" class="hw-chip '+(g===category?'active':'')+'" data-hw-category="'+esc(g)+'">'+esc(g)+'</button>'}).join('')+'</div>'+
 '<div class="hw-library">'+list.map(function(e){return '<article class="hw-ex-card"><div class="hw-ex-info"><div class="hw-overline">'+esc(e.group)+' · '+esc(e.difficulty)+'</div><h5>'+esc(e.name)+'</h5><p>'+esc(e.muscle)+'</p><small>'+esc(e.equipment)+' · '+(e.mode==='time'?'Timed':'Repetitions')+'</small><button type="button" class="hw-mini-action" data-hw-add-ex="'+esc(e.id)+'">+ Build with this exercise</button></div></article>'}).join('')+'</div>'+(list.length?'':'<div class="hw-empty">No exercises match your search.</div>');
}
function historyView(){
 var sessions=store().sessions;
 return '<div class="hw-heading"><div><h4>Workout history</h4><p>Every finished session, with real sets and time spent.</p></div></div>'+
 (sessions.length?'<div class="hw-history">'+sessions.map(function(s){var done=(s.entries||[]).reduce(function(n,i){return n+i.sets.filter(function(v){return v.done}).length},0);return '<article class="hw-history-row"><div><strong>'+esc(s.name)+'</strong><p>'+esc(dateKey(s.endedAt))+' · '+done+' sets · '+Math.max(1,Math.round((s.durationSec||0)/60))+' min</p></div><button type="button" class="btn btn-sm" data-hw-repeat="'+esc(s.routineId||'')+'" '+(plan(s.routineId)?'':'disabled')+'>Repeat</button></article>'}).join('')+'</div>':'<div class="hw-empty">No home workouts completed yet. Start a plan to build your history.</div>');
}
function progressView(){
 var entries=store().sessions.slice().reverse();
 var data=entries.map(function(s){
  var val=0;
  (s.entries||[]).forEach(function(it){if(it.id!==chartExercise)return;(it.sets||[]).forEach(function(set){if(set.done)val=Math.max(val,Number(set.actual)||0)})});
  return {label:dateKey(s.endedAt),value:val}
 }).filter(function(v){return v.value>0}).slice(-12);
 var max=Math.max(1,...data.map(function(x){return x.value}));
 var e=getExercise(chartExercise)||CATALOG[0];
 return '<div class="hw-heading"><div><h4>Your progress</h4><p>Track best completed set per session, not just targets.</p></div><label class="hw-field-small">Exercise<select id="hw-chart-ex">'+CATALOG.map(function(x){return '<option value="'+esc(x.id)+'" '+(x.id===chartExercise?'selected':'')+'>'+esc(x.name)+'</option>'}).join('')+'</select></label></div>'+
 '<div class="hw-chart-card"><div class="hw-chart-top"><div><small>BEST '+(e.mode==='time'?'SECONDS':'REPS')+' PER SESSION</small><h4>'+esc(e.name)+'</h4></div><strong>'+(data.length?data[data.length-1].value:'—')+'</strong></div>'+
 (data.length?'<div class="hw-bars">'+data.map(function(x){return '<div class="hw-bar-column" title="'+esc(x.label)+' · '+x.value+'"><span>'+x.value+'</span><div class="hw-bar-rail"><div style="height:'+Math.max(6,Math.round(100*x.value/max))+'%"></div></div><small>'+esc(x.label.slice(5))+'</small></div>'}).join('')+'</div>':'<div class="hw-empty">Complete at least one set of '+esc(e.name)+' to see progress here.</div>')+'</div>';
}
function activePosition(a){
 for(var i=0;i<a.entries.length;i++){for(var j=0;j<a.entries[i].sets.length;j++){if(!a.entries[i].sets[j].done)return {exercise:i,set:j}}}
 return null;
}
function clockRemaining(a){if(!a.clock)return 0;return Math.max(0,Math.ceil((a.clock.until? (a.clock.until-Date.now())/1000 : a.clock.remaining)||0))}
function fmt(t){t=Math.max(0,Math.round(t));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}
function sessionView(a){
 var c=a.clock,idx=activePosition(a),done=0,total=0;
 a.entries.forEach(function(it){it.sets.forEach(function(st){total++;if(st.done)done++})});
 var i=idx?idx.exercise:Math.max(0,a.entries.length-1),j=idx?idx.set:0,item=a.entries[i],e=getExercise(item.id)||CATALOG[0],set=item.sets[j],remain=clockRemaining(a);
 var complete=done===total;
 var meta='<div class="hw-session-status"><span>'+done+' / '+total+' sets</span><span>'+Math.round(done/Math.max(1,total)*100)+'% complete</span></div><div class="hw-progress-track"><i style="width:'+Math.round(done/Math.max(1,total)*100)+'%"></i></div>';
 return '<div class="hw-session"><div class="hw-session-header"><div><div class="hw-overline">ACTIVE WORKOUT</div><h4>'+esc(a.name)+'</h4><p>Started '+esc(new Date(a.startedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))+'</p></div><div class="hw-session-tools">'+cardButton('finish','Finish session','btn-primary')+cardButton('discard','Discard','hw-danger')+'</div></div>'+meta+
 '<div class="hw-session-layout"><div class="hw-main-card"><div class="hw-overline">'+esc(e.group)+' · '+esc(e.muscle)+'</div><h3>'+(complete?'All sets completed':esc(e.name))+'</h3><p class="hw-session-sub">'+(complete?'You can finish and save your results.':'Set '+(j+1)+' of '+item.sets.length+' · '+esc(e.equipment))+'</p>'+
 (complete?'<div class="hw-empty">Great work — save this session to update your progress charts.</div>':'<div class="hw-actual"><label>Actual '+(e.mode==='time'?'seconds':'reps')+'<input id="hw-actual" type="number" inputmode="numeric" min="0" max="1800" value="'+esc(set.actual==null?item.target:set.actual)+'"></label>'+cardButton('complete-set','✓ Complete set','btn-primary')+'</div>')+
 (complete?'':(e.mode==='time'?'<div class="hw-timed-tools">'+cardButton('exercise-clock',(c&&c.kind==='exercise'?'Pause / resume':'Start set timer'))+ '<strong id="hw-work-timer">'+(c&&c.kind==='exercise'?fmt(remain):fmt(item.target))+'</strong></div>':''))+
 '<div class="hw-rest"><div><small>REST TIMER</small><strong id="hw-rest-timer">'+(c&&c.kind==='rest'?fmt(remain):fmt(item.rest))+'</strong><p>'+(c&&c.kind==='rest'?'Rest until your next set':'Rest after each set · '+item.rest+' sec')+'</p></div><div class="hw-rest-actions">'+cardButton('rest-toggle',c&&c.kind==='rest'&&c.until?'Pause':c&&c.kind==='rest'?'Resume':'Start rest')+cardButton('rest-minus','−15s')+cardButton('rest-plus','+15s')+cardButton('rest-skip','Skip')+'</div></div></div>'+
 '<aside class="hw-queue"><div class="hw-heading"><div><h4>Workout queue</h4><p>Each set saved as you go.</p></div></div>'+
 a.entries.map(function(it,n){var x=getExercise(it.id)||CATALOG[0],d=it.sets.filter(function(st){return st.done}).length;return '<div class="hw-queue-row '+(n===i?'current':'')+'"><span class="hw-queue-index" aria-hidden="true">'+(n+1)+'</span><div><strong>'+esc(x.name)+'</strong><small>'+d+'/'+it.sets.length+' sets · '+esc(x.mode==='time'?'seconds':'reps')+'</small><div class="hw-set-dots">'+it.sets.map(function(st,k){return '<span title="Set '+(k+1)+(st.done?': complete':': pending')+'" class="'+(st.done?'done':'')+'"></span>'}).join('')+'</div></div></div>'}).join('')+'</aside></div></div>';
}
function renderEditor(){
 var previous=document.getElementById('hw-builder');if(previous)previous.remove();
 if(!draft)return;
 var overlay=document.createElement('div');overlay.id='hw-builder';overlay.className='hw-modal-backdrop';overlay.setAttribute('role','presentation');
 var rows=draft.items.map(function(it,i){var ex=getExercise(it.id)||CATALOG[0];return '<div class="hw-builder-row"><div class="hw-builder-fields"><strong>'+esc(ex.name)+'</strong><div class="hw-builder-grid"><label>Sets<input type="number" data-hw-field="sets" data-hw-row="'+i+'" min="1" max="12" value="'+it.sets+'"></label><label>'+(ex.mode==='time'?'Seconds':'Reps')+'<input type="number" data-hw-field="target" data-hw-row="'+i+'" min="1" max="1800" value="'+it.target+'"></label><label>Rest (sec)<input type="number" data-hw-field="rest" data-hw-row="'+i+'" min="0" max="900" value="'+it.rest+'"></label></div></div><div class="hw-builder-actions"><button type="button" data-hw-move="'+i+'" data-direction="-1" aria-label="Move exercise up">↑</button><button type="button" data-hw-move="'+i+'" data-direction="1" aria-label="Move exercise down">↓</button><button type="button" data-hw-remove="'+i+'" aria-label="Remove exercise">×</button></div></div>'}).join('');
 overlay.innerHTML='<div class="hw-modal" role="dialog" aria-modal="true" aria-labelledby="hw-builder-title"><div class="hw-modal-head"><div><div class="hw-kicker">YOUR HOME TRAINING</div><h3 id="hw-builder-title">'+(draft.id?'Edit plan':'Build a workout plan')+'</h3></div><button type="button" class="btn" data-hw-action="close-editor" aria-label="Close workout builder">✕</button></div><div class="hw-modal-body"><label class="hw-field">Plan name<input id="hw-plan-name" maxlength="70" placeholder="e.g. Full body morning" value="'+esc(draft.name)+'"></label><label class="hw-field">Description<input id="hw-plan-note" maxlength="140" placeholder="Optional note" value="'+esc(draft.note||'')+'"></label><h4>Exercise sequence</h4><div class="hw-builder-list">'+(rows||'<div class="hw-empty">Choose an exercise below to begin.</div>')+'</div><div class="hw-add-row"><label>Add exercise<select id="hw-ex-picker">'+CATALOG.map(function(x){return '<option value="'+esc(x.id)+'">'+esc(x.name)+' · '+esc(x.group)+'</option>'}).join('')+'</select></label>'+cardButton('append-ex','+ Add exercise')+'</div></div><div class="hw-modal-footer">'+cardButton('close-editor','Cancel')+cardButton('save-plan','Save plan','btn-primary')+'</div></div>';
 document.body.appendChild(overlay);
 overlay.addEventListener('click',function(evt){if(evt.target===overlay)closeEditor()});
 overlay.querySelector('#hw-plan-name').focus();
}
function editPlan(id){var p=id?plan(id):null;draft=p?{id:p.builtin?'':p.id,name:p.builtin?p.name+' (custom)':p.name,note:p.note||'',items:safeItems(p.items)}:{id:'',name:'My home workout',note:'',items:[]};renderEditor()}
function closeEditor(){draft=null;document.getElementById('hw-builder')?.remove()}
function saveDraft(){
 if(!draft)return;
 var name=String(draft.name||'').trim();
 if(!name){note('Give your workout a name.');return}
 if(!draft.items.length){note('Add at least one exercise.');return}
 var d=store(),id=draft.id||uid(),routine={id:id,name:name.slice(0,70),note:(draft.note||'').slice(0,140),items:safeItems(draft.items)};
 var at=d.routines.findIndex(function(p){return p.id===id});if(at<0)d.routines.unshift(routine);else d.routines[at]=routine;
 closeEditor();persist();render();note('Home workout saved');
}
function start(id){
 var d=store();if(d.active){note('Finish or discard the current workout first.');return}
 var p=plan(id);if(!p)return;
 var a={id:uid(),routineId:p.id,name:p.name,startedAt:new Date().toISOString(),date:dateKey(),entries:safeItems(p.items).map(function(it){return {id:it.id,target:it.target,rest:it.rest,sets:Array.from({length:it.sets},function(){return {done:false,actual:null,doneAt:null}})}}),clock:null};
 if(!a.entries.length)return;
 d.active=a;persist();render();
}
function updateClock(){
 var a=current();if(!a||!a.clock)return;
 var remain=clockRemaining(a);
 var el=document.getElementById(a.clock.kind==='rest'?'hw-rest-timer':'hw-work-timer');
 if(el)el.textContent=fmt(remain);
 if(a.clock.until&&remain===0){
  var k=a.clock.kind;a.clock={kind:k,remaining:0,until:null};persist();
  if(navigator.vibrate)try{navigator.vibrate(150)}catch(_){}
  note(k==='rest'?'Rest finished — ready for your next set.':'Exercise timer finished — log your result.');
  if(document.getElementById('hw-panel')&&document.getElementById('view-workout')?.classList.contains('hw-active'))render();
 }
}
function setClock(kind,seconds){var a=current();if(!a)return;a.clock={kind:kind,remaining:seconds,until:Date.now()+Math.max(0,seconds)*1000};persist();render()}
function toggleClock(kind){
 var a=current();if(!a)return;
 if(!a.clock||a.clock.kind!==kind){var p=activePosition(a),it=p?a.entries[p.exercise]:a.entries[0];setClock(kind,kind==='rest'?it.rest:it.target);return}
 if(a.clock.until){a.clock.remaining=clockRemaining(a);a.clock.until=null}
 else a.clock.until=Date.now()+Math.max(0,a.clock.remaining)*1000;
 persist();render();
}
function adjustRest(delta){var a=current();if(!a)return;var t=a.clock&&a.clock.kind==='rest'?clockRemaining(a):activePosition(a)?a.entries[activePosition(a).exercise].rest:60;setClock('rest',Math.max(0,t+delta))}
function completeSet(){
 var a=current();if(!a)return;var pos=activePosition(a);if(!pos){note('All sets are finished. Save the session.');return}
 var item=a.entries[pos.exercise],exercise=getExercise(item.id),set=item.sets[pos.set],input=document.getElementById('hw-actual');
 var actual=clamp(input?.value,0,1800,item.target);
 set.done=true;set.actual=actual;set.doneAt=new Date().toISOString();a.clock=null;
 var next=activePosition(a);persist();
 if(next)setClock('rest',item.rest);
 else{render();note('Workout complete — save your session.')}
}
function finish(){
 var d=store(),a=d.active;if(!a)return;
 var done=a.entries.reduce(function(n,it){return n+it.sets.filter(function(st){return st.done}).length},0);
 if(!done){note('Complete at least one set before saving.');return}
 var remaining=a.entries.reduce(function(n,it){return n+it.sets.filter(function(st){return !st.done}).length},0);
 if(remaining&&!confirm('Finish early? '+remaining+' unfinished sets will remain incomplete in history.'))return;
 a.endedAt=new Date().toISOString();a.durationSec=Math.max(0,Math.round((Date.now()-new Date(a.startedAt).getTime())/1000));a.clock=null;
 d.sessions.unshift(a);d.active=null;page='history';persist();render();note('Workout saved to your history');
}
function discard(){if(!current()||!confirm('Discard this home workout? Completed sets in this session will not be saved.'))return;store().active=null;persist();render()}
function control(action){
 if(action==='new-plan')editPlan();if(action==='resume')render();if(action==='close-editor')closeEditor();
 if(action==='append-ex'){if(!draft)return;var id=document.getElementById('hw-ex-picker')?.value||CATALOG[0].id;draft.items.push(itemDefaults(id));renderEditor()}
 if(action==='save-plan')saveDraft();if(action==='complete-set')completeSet();if(action==='rest-toggle')toggleClock('rest');
 if(action==='exercise-clock')toggleClock('exercise');if(action==='rest-minus')adjustRest(-15);if(action==='rest-plus')adjustRest(15);
 if(action==='rest-skip'){var a=current();if(a){a.clock=null;persist();render()}}
 if(action==='finish')finish();if(action==='discard')discard();
}
function handle(event){
 var target=event.target;if(!(target instanceof Element))return;
 var planStart=target.closest('[data-hw-start]');if(planStart){start(planStart.dataset.hwStart);return}
 var planEdit=target.closest('[data-hw-edit]');if(planEdit){editPlan(planEdit.dataset.hwEdit);return}
 var planDelete=target.closest('[data-hw-delete]');if(planDelete){if(confirm('Delete this saved plan? Workout history remains intact.')){var d=store();d.routines=d.routines.filter(function(x){return x.id!==planDelete.dataset.hwDelete});persist();render()}return}
 var add=target.closest('[data-hw-add-ex]');if(add){draft={id:'',name:'My home workout',note:'',items:[itemDefaults(add.dataset.hwAddEx)]};renderEditor();return}
 var repeat=target.closest('[data-hw-repeat]');if(repeat){start(repeat.dataset.hwRepeat);return}
 var nav=target.closest('[data-hw-page]');if(nav){page=nav.dataset.hwPage;render();return}
 var chip=target.closest('[data-hw-category]');if(chip){category=chip.dataset.hwCategory;render();return}
 var action=target.closest('[data-hw-action]');if(action){control(action.dataset.hwAction);return}
 var del=target.closest('[data-hw-remove]');if(del&&draft){draft.items.splice(Number(del.dataset.hwRemove),1);renderEditor();return}
 var move=target.closest('[data-hw-move]');if(move&&draft){var i=Number(move.dataset.hwMove),to=i+Number(move.dataset.direction);if(to>=0&&to<draft.items.length){var t=draft.items.splice(i,1)[0];draft.items.splice(to,0,t);renderEditor()}return}
}
function change(event){
 var t=event.target;if(!(t instanceof Element))return;
 if(t.id==='hw-search'){query=t.value;var end=t.selectionStart;var panel=document.getElementById('hw-panel');if(panel){var old=panel.scrollTop;render();var fresh=document.getElementById('hw-search');if(fresh){fresh.focus();try{fresh.setSelectionRange(end,end)}catch(_){}}panel.scrollTop=old}return}
 if(t.id==='hw-chart-ex'){chartExercise=t.value;render();return}
 if(!draft)return;
 if(t.id==='hw-plan-name')draft.name=t.value;
 if(t.id==='hw-plan-note')draft.note=t.value;
 if(t.dataset.hwField){var i=Number(t.dataset.hwRow),ex=getExercise(draft.items[i]?.id);if(draft.items[i]&&ex){var key=t.dataset.hwField;draft.items[i][key]=clamp(t.value,key==='rest'?0:1,key==='sets'?12:key==='rest'?900:key==='target'&&ex.mode==='time'?1800:300,draft.items[i][key])}}
}
function install(){
 if(initDone)return;var panel=ensureUI();if(!panel)return;
 initDone=true;
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-workout-tab]');if(!b)return;var v=document.getElementById('view-workout');
 if(b.dataset.workoutTab==='home'){e.preventDefault();e.stopImmediatePropagation();workoutTab='home';syncView()}
 else if(v){v.classList.remove('hw-active')}
 },true);
 document.addEventListener('click',function(e){if(e.target.closest?.('#workout-start-btn,#workout-open-history-btn'))document.getElementById('view-workout')?.classList.remove('hw-active')},true);
 document.addEventListener('click',function(e){if(e.target.closest?.('#hw-panel,#hw-builder'))handle(e)});
 document.addEventListener('input',function(e){if(e.target.closest?.('#hw-panel,#hw-builder'))change(e)});
 document.addEventListener('change',function(e){if(e.target.closest?.('#hw-panel,#hw-builder'))change(e)});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&draft)closeEditor()});
 oldRender=window.renderWorkout;
 if(typeof oldRender==='function'){
  window.renderWorkout=function(){if(typeof workoutTab!=='undefined'&&workoutTab==='home'){syncView();return}var v=document.getElementById('view-workout');if(v)v.classList.remove('hw-active');return oldRender.apply(this,arguments)};
 }
 interval=window.setInterval(function(){if(current()&&document.getElementById('view-workout')?.classList.contains('hw-active'))updateClock()},1000);
 if(typeof workoutTab!=='undefined'&&workoutTab==='home')syncView();
}
window.OmniHomeWorkout={catalog:CATALOG,open:function(){install();workoutTab='home';syncView()},getState:store,refresh:syncView};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const script=fs.readFileSync('js/home-workout.js','utf8');
function fixture(){
 const doc='<!doctype html><html><body><section id="view-workout" class="view"><div class="workout-hero"></div><div id="workout-kpis"></div><div id="gym-membership-card"></div><div class="workout-tabs"><button data-workout-tab="session">Gym</button></div><div id="workout-content"></div></section></body></html>';
 const dom=new JSDOM(doc,{url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.matchMedia=()=>({matches:false});w.confirm=()=>true;w.alert=()=>{};
 w.eval('var state={homeWorkout:{routines:[],sessions:[],active:null}};var workoutTab="session";function saveState(){};function renderWorkout(){}');
 w.eval(script);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {w,dom,click(selector){const el=w.document.querySelector(selector);assert.ok(el,'missing '+selector);el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));return el},get store(){return w.OmniHomeWorkout.getState()}};
}
test('21 exercises remain usable without image markup or external image requests',()=>{
 assert.doesNotMatch(script, /@bryllim|cdn\\.jsdelivr|function figure\\(|<img|hw-figure|hw-credits/);
 const f=fixture();assert.equal(f.w.OmniHomeWorkout.catalog.length,21);assert.ok(f.w.OmniHomeWorkout.catalog.find(e=>e.id==='chin-up'));
 f.w.OmniHomeWorkout.open();
 assert.equal(f.w.document.querySelectorAll('#hw-panel img').length,0);
 assert.ok(f.w.document.querySelector('.hw-plan-exercises'));
 f.click('[data-hw-page="library"]');
 assert.equal(f.w.document.querySelectorAll('.hw-ex-card').length,21);
 assert.equal(f.w.document.querySelectorAll('#hw-panel img').length,0);
 f.click('[data-hw-add-ex="push-up"]');
 assert.ok(f.w.document.querySelector('#hw-builder .hw-builder-row'));
 assert.equal(f.w.document.querySelectorAll('#hw-builder img').length,0);
 f.dom.window.close();
});
test('plans, set progression, timing controls and completed history survive state saves',()=>{
 const f=fixture();f.w.OmniHomeWorkout.open();
 f.click('[data-hw-start="starter-full"]');assert.ok(f.store.active);
 assert.equal(f.store.active.entries[0].sets.length,3);
 assert.equal(f.w.document.querySelectorAll('#hw-panel img').length,0);
 assert.equal(f.w.document.getElementById('hw-actual').value,'10');
 f.w.document.getElementById('hw-actual').value='15';
 f.click('[data-hw-action="complete-set"]');
 assert.equal(f.store.active.entries[0].sets[0].actual,15);
 assert.equal(f.store.active.entries[0].sets[0].done,true);
 assert.equal(f.store.active.clock.kind,'rest');
 f.click('[data-hw-action="rest-plus"]');
 assert.equal(f.store.active.clock.kind,'rest');
 f.click('[data-hw-action="rest-skip"]');assert.equal(f.store.active.clock,null);
 f.click('[data-hw-action="finish"]');
 assert.equal(f.store.sessions.length,1);assert.equal(f.store.active,null);
 assert.equal(f.store.sessions[0].entries[0].sets[0].actual,15);
 f.dom.window.close();
});
test('custom plans can be created and edited without disturbing gym sessions',()=>{
 const f=fixture();f.w.eval('state.workouts=[{id:1,status:"completed",name:"Old gym session"}]');
 f.w.OmniHomeWorkout.open();
 f.click('[data-hw-action="new-plan"]');
 const form=f.w.document.getElementById('hw-plan-name');form.value='Lunch bodyweight';form.dispatchEvent(new f.w.Event('input',{bubbles:true}));
 f.click('[data-hw-action="append-ex"]');f.click('[data-hw-action="save-plan"]');
 assert.equal(f.store.routines.length,1);
 assert.equal(f.store.routines[0].name,'Lunch bodyweight');
 assert.equal(f.store.routines[0].items.length,1);
 assert.equal(f.w.eval('state.workouts.length'),1);
 f.dom.window.close();
});

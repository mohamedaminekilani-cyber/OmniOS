import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const habitsGym=fs.readFileSync('app-parts/part-002.html','utf8');
const habitCards=fs.readFileSync('app-parts/part-004.html','utf8');
const layers=fs.readFileSync('app-parts/part-028.html','utf8');
const bodyweight=fs.readFileSync('js/home-workout.js','utf8');
const css=layers.match(/<style id="omnios-unified-design-2026">([\s\S]*?)<\/style>/)?.[1]||'';

test('Phase 5 is last in switchable design, after Phases 1 through 4',()=>{
 const markers=['OMNIOS PHASE 1 FOUNDATION / v1','OMNIOS PHASE 2 APPLICATION SHELL / v1',
  'OMNIOS PHASE 3 / DAILY WORKSPACE','OMNIOS PHASE 4 / CALENDAR + PLANNER / v1',
  'OMNIOS PHASE 5 / HABITS + ROUTINE + WORKOUT / v1'];
 let previous=-1;
 for(const marker of markers){const i=css.indexOf(marker);assert.ok(i>previous,'Missing or out-of-order '+marker);previous=i}
 const own=css.slice(previous);
 for(const x of ['#view-habits','#view-routine','#view-workout',
  'om5-habit-meter','om5-routine-progress','om5-workout-progress','hw-session-layout',
  'v105-month-grid','v95-habit-list','ds-success','@media(max-width:760px)']){
  assert.ok(own.includes(x),'Phase 5 missing '+x);
 }
 assert.doesNotMatch(own,/MutationObserver|fetch\(|localStorage/);
 assert.match(own,/box-shadow:none!important/);
 assert.match(own,/prefers-reduced-motion:reduce/);
});

test('Habit summary renders progress and meaningful daily metrics without altering history',()=>{
 const p=habitsGym.indexOf('function renderHabitSummary()');
 const q=habitsGym.indexOf('function renderHabits()',p);
 assert.ok(p>=0&&q>p);
 const fixture=habitsGym.slice(p,q);
 const dom=new JSDOM('<!doctype html><html><body><div id="habit-summary"></div></body></html>',{runScripts:'outside-only'});
 const w=dom.window;w.habitStats=()=>({rate:75,todayDone:3,todayTotal:4,best:10,current:3});
 w.eval(fixture);w.renderHabitSummary();
 const cards=w.document.querySelectorAll('.habit-summary');
 assert.equal(cards.length,4);
 assert.match(cards[0].textContent,/Weekly consistency/);
 assert.match(cards[1].textContent,/3.*4/);
 const bar=w.document.querySelector('.om5-habit-meter');
 assert.equal(bar.getAttribute('aria-valuenow'),'75');
 assert.match(bar.innerHTML,/width:75%/);
 dom.window.close();
});

test('Habit month check-ins remain reversible and announce selected dates',()=>{
 assert.match(habitCards,/const HABIT_ACCENTS_V95=\['#2547E8','#5F31C4','#C6F04A','#55606D'\]/);
 const p=habitCards.indexOf('function renderHabitMonthlyV105(');
 const q=habitCards.indexOf('window.renderHabitCalendar=renderHabitMonthlyV105',p);
 assert.ok(p>=0&&q>p);
 const src=habitCards.slice(p,q);
 for(const term of ['aria-pressed=','aria-current="date"',
  'data-habit-day','toggleHabitDay(id,date)','renderHabits()','data-v105-open']){
  assert.ok(src.includes(term),'Month checkin missing '+term);
 }
 assert.match(habitCards,/data-v95-toggle-today=.*aria-pressed=/);
});

test('Routine renders completion status from existing per-cycle data',()=>{
 const p=layers.indexOf('function routineCard('),q=layers.indexOf('function openEditor611(',p);
 assert.ok(p>=0&&q>p);
 const src=layers.slice(p,q);
 for(const x of ['cycleProgress(r)','data-rt611-check','toggleStep611(r,i)',
  'aria-pressed=','om5-routine-overview','role="progressbar"',
  'data-rt611-edit','data-rt611-new','data-rt611-delete','data-rt611-tab']){
  assert.ok(src.includes(x),'Routine functionality missing '+x);
 }
});

test('Gym set logging retains edit callbacks and announces completion',()=>{
 const p=habitsGym.indexOf('function renderWorkoutSession(');
 const q=habitsGym.indexOf('function workoutModalShell(',p);
 const src=habitsGym.slice(p,q);
 for(const x of ['om5-session-head','om5-workout-progress','role="progressbar"',
  'om5-set-scroll','set-table','updateWorkoutSet','addSetToWorkout',
  'startWorkoutRest','finishWorkout','abandonWorkout','aria-pressed=']){
  assert.ok(src.includes(x),'Gym set control missing '+x);
 }
});

test('Home Workout remains image-free with timers, plans, sets and tracking intact',()=>{
 assert.doesNotMatch(bodyweight,/<img|cdn\.jsdelivr|@bryllim/);
 for(const term of ['function sessionView(a)','function progressView()','function plansView()',
  'function completeSet()','function toggleClock(kind)','function adjustRest(delta)',
  'id="hw-rest-timer"','aria-valuenow=','role="timer"','data-hw-start']){
  assert.ok(bodyweight.includes(term),'Missing bodyweight function '+term);
 }
});

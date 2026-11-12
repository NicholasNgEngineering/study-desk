import { practiceQuestions, practiceWeeks, renderPractice } from './practice.js?v=practice-choices-20261112';
import { durationLabel, pendingStudyBlocks, readStudyProgress, weeklyBlockProgress } from './study-progress.js';
import { baseTerm, blankTerm, courseCodePattern, isTermId, makeWorkspace, nextTerm, statuses, termLabel, validTerm, validWorkspace } from './workspace.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => HTML_ENTITIES[character]);
const LEGACY_KEY = 'nick-study-desk-v1';
const KEY = 'nick-study-desk-workspace-v2';
const courseColors = { CVEN3101: '#729783', CVEN3202: '#9988b3', ENGG2500: '#b89964' };

// Keep the original item IDs so saved checkmarks and backups still match.
const operationsModules = [
 { number: 4, week: 5, title: 'Contract Management', lectures: 1 },
 { number: 5, week: 7, title: 'Conceptual Cost Estimation', lectures: 2 },
 { number: 6, week: 8, title: 'Earthwork and Foundation Cost Estimation', lectures: 2 },
 { number: 7, week: 9, title: 'Construction Safety and Quality Management', lectures: 2 },
 { number: 8, week: 10, title: 'Engineering Ethics and Risks', lectures: 2,
  note: 'The Moodle screenshot shows this module locked and lists the Module 7 Safety and Quality quiz as a prerequisite.' },
].map(({ number, week, title, lectures, note }) => {
 const id = 'week-' + week;
 return {
  title: `Module ${number} · ${title}`,
  note,
  items: [
   [id + '-slides', 'Lecture slides'],
   [id + '-workshop-questions', 'Workshop questions'],
   [id + '-workshop-solutions', 'Workshop worked solutions'],
   ...Array.from({ length: lectures }, (_, index) => [
    `${id}-lecture-${index + 1}`, `Lecture ${index + 1} transcript`,
   ]),
   [id + '-workshop-transcript', 'Workshop transcript or recording (if available)'],
  ],
 };
});

const courseMaterials = {
 CVEN3101: [
  ...operationsModules,
  { title: 'Final exam notices (if posted)', items: [
   ['final-instructions', 'Latest final exam notice or Moodle announcement (if posted)'],
   ['permitted-aids', 'Separate permitted-aids instructions (if posted)'],
   ['exam-format-update', 'Separate exam format update (if posted)'],
  ] },
  { title: 'Past or sample final (if available)', items: [
   ['sample-final', 'One CVEN3101 past or sample final paper'],
   ['sample-final-solutions', 'Answer key or worked solutions for that paper'],
  ] },
  { title: 'Assignment feedback (when returned)', items: [
   ['part-a-feedback', 'Part A marked feedback (when returned)'],
   ['part-b-feedback', 'Part B marked feedback (when returned)'],
  ] },
 ],
 ENGG2500: [{ items: [
  ['week-9-transcripts', 'Week 9 lecture transcripts'],
  ['final-instructions', '2026 final exam instructions (if available)'],
  ['week-10-slides', 'Week 10 slides'],
  ['week-10-transcripts', 'Week 10 lecture transcripts'],
  ['week-10-workshop', 'Week 10 workshop'],
  ['assignment-4', 'Online Assignment 4'],
  ['assignment-5', 'Online Assignment 5'],
 ] }],
 CVEN3202: [
  { title: 'Send first', items: [
   ['final-instructions', 'Latest final exam announcement or briefing'],
   ['equation-sheet', 'Final exam equation sheet PDF (if posted)'],
   ['week-7-slides', 'Week 7 slides · rate of consolidation and shear strength'],
   ['week-8-slides', 'Week 8 slides · shear strength and direct shear'],
   ['week-9-slides', 'Week 9 slides · triaxial testing and stress paths'],
   ['workshop-6-questions', 'Workshop 6 (Week 8) question sheet'],
   ['workshop-6-solutions', 'Workshop 6 worked solutions'],
   ['workshop-7-questions', 'Workshop 7 (Week 9) question sheet'],
   ['workshop-7-solutions', 'Workshop 7 worked solutions'],
  ] },
  { title: 'Past or sample final (if available)', items: [
   ['sample-final', 'One official past or sample final paper'],
   ['sample-final-solutions', 'Worked solutions or marking guide for that paper'],
  ] },
  { title: 'Weeks 7–9 lecture transcripts', items: [
   ['transcript-oct-26', 'Week 7 lecture transcript · 26 Oct'],
   ['transcript-oct-29', 'Week 7 lecture transcript · 29 Oct'],
   ['transcript-nov-02', 'Week 8 lecture transcript · 2 Nov'],
   ['transcript-nov-05', 'Week 8 lecture transcript · 5 Nov'],
   ['transcript-nov-09', 'Week 9 lecture transcript · 9 Nov'],
   ['transcript-nov-12', 'Week 9 lecture transcript · 12 Nov (when available)'],
  ] },
  { title: 'Upcoming materials (when available)', items: [
   ['week-10-slides', 'Week 10 slides · slope stability'],
   ['transcript-nov-16', 'Week 10 lecture transcript · 16 Nov (if recorded)'],
   ['transcript-nov-19', 'Week 10 lecture transcript · 19 Nov (if recorded)'],
   ['workshop-8-questions', 'Workshop 8 question sheet'],
   ['workshop-8-solutions', 'Workshop 8 worked solutions'],
   ['workshop-9-questions', 'Workshop 9 question sheet'],
   ['workshop-9-solutions', 'Workshop 9 worked solutions'],
   ['final-briefing-update', 'Last-lecture exam briefing (if it adds new details)'],
  ] },
  { title: 'Workshop transcripts and feedback (if available)', items: [
   ['workshop-6-transcript', 'Workshop 6 transcript'],
   ['workshop-7-transcript', 'Workshop 7 transcript'],
   ['workshop-8-transcript', 'Workshop 8 transcript'],
   ['workshop-9-transcript', 'Workshop 9 transcript'],
   ['marked-quizzes', 'Marked quiz submissions with feedback still to share'],
   ['marked-labs', 'Marked lab submissions with feedback still to share'],
  ] },
 ],
};
const sentMaterials = course => new Set(Array.isArray(course.sentMaterials) ? course.sentMaterials : []);
const sydneyDate = new Intl.DateTimeFormat('en-CA', {
 timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit',
});
const headerDate = new Intl.DateTimeFormat('en-AU', {
 timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
});
const shortDate = new Intl.DateTimeFormat('en-AU', { timeZone: 'UTC', day: 'numeric', month: 'short' });
const dayMillis = 86_400_000;
const termStart = Date.parse('2026-09-14');
const calendarRoot = $('#study-calendar');
const practiceRoot = $('#practice-content');
const courseNav = $('#side-courses');
const weeklyPanel = $('#weekly-panel');
const taskPanels = { tasks: $('#tasks-panel'), deadlines: $('#deadlines-panel') };
const courseDot = '<span class="course-dot"></span>';
const markupCache = new WeakMap();
let workspace;
let state;
let activeTerm;
let linkedWeeks;
let studyProgress;
let calendarJump;
let practiceWeek;
let course;
let view = 'overview';
let expandedCourse;
let weekFilter = 'all';
const taskFilters = {
 tasks: { filter: 'all', query: '' },
 deadlines: { filter: 'outstanding', query: '' },
};
let editor;
let toastTimer;
let calendarRenderer;
let calendarRequest;
let courseSectionMotion;

function readSaved(key) {
 try {
  return JSON.parse(localStorage.getItem(key));
 } catch {
  $('#save-state').textContent = 'Saved data unavailable';
  return null;
 }
}

const saved = readSaved(KEY);
if (validWorkspace(saved)) workspace = saved;
else {
 const original = readSaved(LEGACY_KEY);
 if (validTerm(original)) workspace = makeWorkspace(original);
 else if (original || saved) toast('Saved data could not be loaded. Original tracker displayed.');
}
if (!workspace) workspace = makeWorkspace(await fetch('seed.json').then(response => response.json()));
workspace.terms[nextTerm] ??= blankTerm();

function save() {
 try {
  localStorage.setItem(KEY, JSON.stringify(workspace));
  $('#save-state').textContent = 'Saved on this browser';
 } catch {
  $('#save-state').textContent = 'Not saved · export a backup';
  toast('Browser could not save changes. Export a backup to keep them.');
 }
}

function toast(message) {
 const element = $('#toast');
 element.textContent = message;
 element.classList.add('visible');
 clearTimeout(toastTimer);
 toastTimer = setTimeout(() => element.classList.remove('visible'), 3000);
}

const today = () => sydneyDate.format(new Date());
const dateText = date => date ? shortDate.format(new Date(date + 'T00:00:00Z')) : 'Date unknown';
const dayDiff = (date, reference = today()) => Math.round((Date.parse(date) - Date.parse(reference)) / dayMillis);
const currentWeek = (date = today()) => activeTerm === baseTerm
 ? Math.floor((Date.parse(date) - termStart) / (7 * dayMillis)) + 1 : null;
const current = () => state.courses.find(item => item.code === course);
const allTasks = () => state.courses.flatMap(item => item.tasks.map(task => ({ ...task, code: item.code })));
const isOpen = item => item.status !== 'Done' && item.status !== 'N/A';

function summarize(items) {
 let total = 0;
 let done = 0;
 for (const item of items) {
  if (item.status === 'N/A') continue;
  total++;
  if (item.status === 'Done') done++;
 }
 return { total, done, percent: total ? Math.round(done / total * 100) : 0 };
}

const safeURL=u=>{try{let p=new URL(u);return ['http:','https:'].includes(p.protocol)?p.href:'';}catch{return '';}};
const color = code => courseColors[code]
 ?? Object.values(courseColors)[state.courses.findIndex(item => item.code === code) % 3]
 ?? '#729783';

function courseWeeks(item) {
 return item.weeks.map(week => {
  const progress = linkedWeeks.get(item.code + '/' + week.week);
  if (!progress || week.status === 'N/A') return week;
  const calendarDone = !week.calendarOverride && week.status !== 'Done' && progress.done === progress.total;
  return { ...week, status: calendarDone ? 'Done' : week.status, calendarDone, calendarProgress: progress };
 });
}

function refreshChecklist() {
 studyProgress = readStudyProgress(state.studyCalendar, activeTerm === baseTerm);
 linkedWeeks = weeklyBlockProgress(studyProgress);
}

function quickCheck(item, kind, code) {
 const done = item.status === 'Done';
 const label = (done ? 'Reopen ' : 'Mark done: ') + item.title;
 return `<button class="quick-check ${done ? 'checked' : ''}" data-toggle="${esc(item.id)}" data-kind="${kind}" data-course="${code}" aria-label="${esc(label)}" aria-pressed="${done}">${done ? '✓' : ''}</button>`;
}

function statusSelect(item, kind, code) {
 const tone = item.status === 'Done' ? 'done' : item.status === 'In progress' ? 'progress' : '';
 return `<select class="status ${tone}" aria-label="Status for ${esc(item.title)}" data-status="${esc(item.id)}" data-kind="${kind}" data-course="${code}">${statuses.map(status => `<option ${status === item.status ? 'selected' : ''}>${status}</option>`).join('')}</select>`;
}

function setMarkup(element, html) {
 if (markupCache.get(element) === html) return;
 element.innerHTML = html;
 markupCache.set(element, html);
}

const courseSections = { weekly: 'weeks', tasks: 'assessments', info: 'info' };
const sectionLabels = { weekly: 'Weekly checklist', tasks: 'Assessments & labs', info: 'Course info & links' };
const pageNames = { overview: 'Overview', calendar: 'Study Calendar', practice: 'Practice', deadlines: 'Deadlines' };

function render() {
 const courseOpen = Object.hasOwn(courseSections, view);
 const calendarOpen = view === 'calendar';
 const overviewOpen = view === 'overview' || courseOpen;
 $('#overview-content').hidden = !overviewOpen;
 $('#course-area').hidden = !state.courses.length;
 $('#deadlines-content').hidden = view !== 'deadlines';
 calendarRoot.hidden = !calendarOpen;
 practiceRoot.hidden = view !== 'practice';

 for (const button of $$('.workspace-nav [data-view]')) {
  const active = button.dataset.view === (overviewOpen ? 'overview' : view);
  button.classList.toggle('active', active);
  if (active) button.setAttribute('aria-current', 'page');
  else button.removeAttribute('aria-current');
 }
 $('#crumb').textContent = courseOpen ? course : pageNames[view];
 $('#active-term-label').textContent = 'UNSW · ' + termLabel(activeTerm);
 setMarkup($('#term-options'), Object.keys(workspace.terms).sort().reverse().map(id =>
  `<button type="button" data-term="${id}" ${id === activeTerm ? 'aria-current="true"' : ''}>
    ${termLabel(id)}${id === activeTerm ? '<span aria-hidden="true">✓</span>' : ''}
   </button>`).join(''));
 $('[data-add-course]').hidden = activeTerm === baseTerm;
 $('.course-label').hidden = !state.courses.length;
 $('#deadlines-header [data-add-task]').hidden = !state.courses.length;
 $('#today').textContent = headerDate.format(new Date());
 const tasks = allTasks();
 const date = today();
 const open = tasks.filter(isOpen);
 const due = open.filter(task => {
  const days = task.date ? dayDiff(task.date, date) : -1;
  return days >= 0 && days <= 7;
 }).length;
 $('#deadline-count').textContent = due;
 renderCourseNav();

 if (calendarOpen) showCalendar(tasks, date);
 else if (view === 'practice') renderPractice(practiceRoot, {
  state, course: current(), week: practiceWeek, starter: activeTerm === baseTerm, escape: esc, save, today,
  select: (code, week) => openView('practice', code, activeTerm, { week, keepPosition: true }),
 });
 else if (overviewOpen) {
  renderOverview(tasks, open, due, date);
  if (course) renderCourseArea(courseOpen ? view : 'weekly');
 } else renderTasks('deadlines');
}

function sectionLink(code, section) {
 return `<a href="${courseHash(code, section)}" data-jump-course="${code}" data-jump-section="${section}">${sectionLabels[section]}</a>`;
}

function renderCourseNav() {
 setMarkup(courseNav, state.courses.map(({ code }) => `<div class="side-course-group">
  <button type="button" class="side-course" data-course-menu="${code}" aria-expanded="false" aria-controls="menu-${code}" style="--course:${color(code)}">
   ${courseDot}${code}<span class="side-course-chevron" aria-hidden="true"></span>
  </button>
  <div class="side-course-menu" id="menu-${code}" inert>
   <div>${Object.keys(courseSections).map(section => sectionLink(code, section)).join('')}</div>
  </div>
 </div>`).join(''));
 for (const button of courseNav.querySelectorAll('[data-course-menu]')) {
  const code = button.dataset.courseMenu;
  const expanded = code === expandedCourse;
  button.setAttribute('aria-expanded', String(expanded));
  button.classList.toggle('selected', code === course && Object.hasOwn(courseSections, view));
  const menu = button.nextElementSibling;
  menu.classList.toggle('open', expanded);
  menu.inert = !expanded;
 }
 updateSectionLinks(courseNav);
}

function updateSectionLinks(root, section = view) {
 for (const link of root.querySelectorAll('[data-jump-section]')) {
  if (link.dataset.jumpCourse === course && link.dataset.jumpSection === section) link.setAttribute('aria-current', 'location');
  else link.removeAttribute('aria-current');
 }
}

function renderCalendar(tasks = allTasks(), currentDate = today()) {
 const jump = calendarJump;
 calendarJump = undefined;
 calendarRenderer(calendarRoot, {
  tasks,
  get courses() { return state.courses.map(item => ({ ...item, weeks: courseWeeks(item) })); },
  currentDate,
  escapeText: esc,
  term: activeTerm,
  termName: termLabel(activeTerm),
  useSeed: activeTerm === baseTerm,
  updateCalendar(next, progress) {
   state.studyCalendar = next;
   linkedWeeks = weeklyBlockProgress(progress);
   save();
  },
  notify: toast,
 }, studyProgress, jump);
}

function loadCalendarStyle() {
 if ($('#study-calendar-style')) return Promise.resolve();
 return new Promise((resolve, reject) => {
  const link = document.createElement('link');
  link.id = 'study-calendar-style';
  link.rel = 'stylesheet';
  link.href = './study-calendar.css';
  link.onload = resolve;
  link.onerror = () => {
   link.remove();
   reject(new Error('Calendar stylesheet could not load'));
  };
  document.head.append(link);
 });
}

function showCalendar(tasks, date) {
 if (calendarRenderer) {
  renderCalendar(tasks, date);
  return;
 }
 calendarRoot.innerHTML = '<p role="status">Loading Study Calendar…</p>';
 if (calendarRequest) return;
 calendarRequest = Promise.all([import('./study-calendar.js'), loadCalendarStyle()])
  .then(([module]) => {
   calendarRenderer = module.renderStudyCalendar;
   if (view === 'calendar') renderCalendar();
  })
  .catch(() => {
   calendarRequest = undefined;
   calendarRenderer = undefined;
   if (view === 'calendar') calendarRoot.innerHTML = '<p role="status">Study Calendar could not load. Refresh to try again.</p>';
  });
}

function renderOverview(tasks, open, due, date) {
 const hasCourses = state.courses.length > 0;
 $('#stats').hidden = !hasCourses;
 $('#overview-upcoming').hidden = !hasCourses;
 $('#overview-content .overview-grid').classList.toggle('overview-grid-empty', !hasCourses);
 const resume = $('#overview-resume');
 const upcoming = pendingStudyBlocks(studyProgress);
 const next = upcoming.find(block => block.credit > 0) ?? upcoming[0];
 resume.hidden = !next;
 if (next) setMarkup(resume, `<div>
   <span>${next.block.course ? next.block.course + ' · ' : ''}${dateText(next.date)} · ${durationLabel(next.remaining)} left</span>
   <strong>${esc(next.block.title)}</strong>
  </div><button type="button" class="primary" data-resume-block="${next.id}">Resume studying</button>`);
 const week = currentWeek(date);
 const weekSummary = summarize(state.courses.flatMap(courseWeeks));
 const taskSummary = summarize(tasks);
 $('#overview-term').textContent = termLabel(activeTerm).toUpperCase();
 $('#week-label').textContent = activeTerm !== baseTerm ? ''
  : week > 0 && week <= 11 ? '· WEEK ' + week : '· REVISION & EXAMS';
 setMarkup($('#stats'), `<div class="stat">
   <div class="stat-label">Study weeks finished</div>
   <div class="stat-value">${weekSummary.done}<small>/ ${weekSummary.total}</small></div>
   <div class="mini-bar"><i style="width:${weekSummary.percent}%"></i></div>
  </div><div class="stat">
   <div class="stat-label">Assessments complete</div>
   <div class="stat-value">${taskSummary.done}<small>/ ${taskSummary.total}</small></div>
   <div class="stat-foot">${open.length} outstanding</div>
  </div><div class="stat">
   <div class="stat-label">Due in the next 7 days</div>
   <div class="stat-value">${due}</div>
   <div class="stat-foot">${open.filter(task => !task.date).length} tasks with dates to confirm</div>
  </div>`);
 setMarkup($('#course-tabs'), state.courses.map(item => {
  const { total, done, percent } = summarize(courseWeeks(item));
  return `<a href="${courseHash(item.code)}" class="course-tab" ${item.code === course ? 'aria-current="true"' : ''} data-jump-course="${item.code}" data-jump-section="weekly" style="--course:${color(item.code)}">
    <div class="course-tile-name">
     <span class="tab-code">${courseDot}${item.code}</span>
     <strong>${esc(item.name)}</strong>
    </div>
    <div class="course-tile-progress"><span>${done}/${total} weeks</span><span class="mini-bar"><i style="width:${percent}%"></i></span></div>
    <span class="course-tile-arrow" aria-hidden="true">›</span>
   </a>`;
 }).join('') || '<div class="card empty">No courses added yet.</div>');
 setMarkup($('#overview-upcoming'), upcomingCard(open, date));
}

function renderCourseArea(section) {
 const selected = current();
 const { total, done, percent } = summarize(courseWeeks(selected));
 const codeLabel = $('#course-code');
 const tabs = $('#section-tabs');
 const previousSection = tabs.querySelector('[aria-current]')?.dataset.jumpSection;
 const changed = previousSection && (codeLabel.textContent !== selected.code || previousSection !== section);
 codeLabel.textContent = selected.code;
 $('#course-name').textContent = selected.name;
 $('#course-progress').innerHTML = `<strong>${percent}% complete</strong>${done} of ${total} study weeks finished`;
 setMarkup(tabs, Object.keys(courseSections).map(section => sectionLink(selected.code, section)).join(''));
 updateSectionLinks(tabs, section);
 for (const key of Object.keys(courseSections)) {
  $('#course-' + key).hidden = key !== section;
 }
 if (section === 'weekly') renderWeeks();
 else if (section === 'tasks') renderTasks('tasks');
 else renderInfo();

 if (changed) {
  courseSectionMotion?.cancel();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
   courseSectionMotion = $('#course-' + section).animate([
    { transform: 'translateY(6px)' },
    { transform: 'translateY(-2px)', offset: 0.55 },
    { transform: 'none' },
   ], { duration: 170, easing: 'ease-out' });
  }
 }
}

function matchesTask(task, filter, search) {
 const matchesFilter = filter === 'all' || filter === task.type
  || (filter === 'outstanding' && isOpen(task))
  || (filter === 'done' && task.status === 'Done')
  || (filter === 'unknown' && !task.date);
 return matchesFilter && (!search || [task.title, task.details, task.notes].join(' ').toLowerCase().includes(search));
}
function renderWeeks() {
 const selected = current();
 const weekNumber = currentWeek();
 const weeks = courseWeeks(selected).filter(week => weekFilter === 'all'
  || (weekFilter === 'done' && week.status === 'Done')
  || (weekFilter === 'outstanding' && isOpen(week)));
 setMarkup(weeklyPanel, `<div class="card">
  <div class="card-head"><h3 id="weekly-title">Weekly checklist</h3>${filterMenu(weekFilter, 'weeks')}</div>
  <div class="table-scroll"><table>
   <thead><tr><th>Week</th><th>Topics & notes</th><th>Status</th><th><span class="sr-only">Edit</span></th></tr></thead>
   <tbody>${weeks.map(week => `<tr class="${week.status === 'Done' ? 'done-row' : week.status === 'N/A' ? 'na-row' : ''}">
     <td class="week-cell"><span class="week-name">Week ${week.week}</span><span class="week-date">${dateText(week.date)}</span>
      ${practiceQuestions(state, selected.code, week.week, activeTerm === baseTerm).length
       ? `<a class="week-practice-link" href="${routeHash('practice', selected.code, activeTerm, week.week)}">Practise<span class="sr-only"> Week ${week.week}</span></a>` : ''}${week.week === weekNumber ? '<span class="current-tag">THIS WEEK</span>' : ''}</td>
     <td class="topic">${esc(week.title)}${week.notes ? `<span class="row-notes">${esc(week.notes)}</span>` : ''}
      ${calendarWeekNote(week, selected.code)}</td>
     <td><div class="status-wrap">${week.status === 'N/A' ? '' : quickCheck(week, 'weeks', selected.code)}${statusSelect(week, 'weeks', selected.code)}</div></td>
     <td><button class="edit-small" data-edit="${esc(week.id)}" data-kind="weeks" data-course="${selected.code}" aria-label="Edit Week ${week.week} notes">⋯</button></td>
    </tr>`).join('') || '<tr><td colspan="4" class="empty">No weeks match this view.</td></tr>'}</tbody>
  </table></div>
 </div>`);
}

function calendarWeekNote(week, code) {
 if (!week.calendarProgress || (!week.calendarDone && !week.calendarOverride)) return '';
 const text = week.calendarDone ? 'Done from Study Calendar' : '';
 const resume = week.calendarOverride
  ? `<button type="button" class="link-button" data-resume-sync="${esc(week.id)}" data-course="${code}">Use calendar status</button>`
  : '';
 return `<span class="calendar-week-note">${text}${resume}</span>`;
}

function upcomingCard(openTasks, reference) {
 const next = openTasks.filter(task => task.date).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
 return `<div class="overview-upcoming-title"><h2 class="workspace-section-title">Upcoming deadlines</h2><button class="link-button" data-view="deadlines">View all</button></div>
  <div class="card upcoming-list">${next.map(task => {
   const remaining = dayDiff(task.date, reference);
   const due = remaining < 0 ? 'Overdue' : remaining === 0 ? 'Due today' : 'In ' + remaining + ' days';
   return `<div class="upcoming">
    <div class="date-square"><small>${dateText(task.date).split(' ').slice(1).join(' ')}</small><strong>${Number(task.date.slice(8))}</strong></div>
    <div><button class="task-link" data-open-task="${esc(task.id)}" data-course="${task.code}">${esc(task.title)}</button><p>${task.code} · ${task.time ? esc(task.time) : 'Time unknown'}</p></div>
    <span class="due-badge">${due}</span>
   </div>`;
  }).join('') || '<p class="empty">No dated tasks outstanding.</p>'}</div>`;
}
function filterMenu(filter, kind) {
 const options = [['all','Show all'], ['outstanding','Outstanding'], ['done','Completed']];
 if (kind !== 'weeks') options.push(['unknown','Unknown dates'], ['Lab','Labs'], ['Assignment','Assignments'], ['Exam','Exams'], ['Quiz','Quizzes'], ['Module','Modules']);
 return `<select class="filter-select" data-filter="${kind}" aria-label="Filter ${kind}">${options.map(([value, label]) =>
  `<option value="${value}" ${filter === value ? 'selected' : ''}>${label}</option>`).join('')}</select>`;
}
function taskCard(task, code) {
 const url = safeURL(task.url);
 const date = task.date
  ? `<span>${dateText(task.date)} ${esc(task.date.slice(0, 4))} · ${task.time ? esc(task.time) : 'time unknown'}</span>`
  : '<span class="tag unknown">Date unknown</span>';
 return `<article class="card task-card ${task.status === 'Done' ? 'done-row' : ''}">
  <div class="task-check">${quickCheck(task, 'tasks', code)}</div>
  <div class="task-content">
   <div class="task-meta"><span class="tag" style="color:${color(code)}">${code}</span><span>${esc(task.type)}</span>${date}</div>
   <div class="task-title">${esc(task.title)}</div>
   <details class="task-extra">
    <summary>Details & sources</summary>
    <div class="task-details">${esc(task.details || 'Requirements unknown.')}</div>
    ${task.notes ? `<div class="task-details">${esc(task.notes)}</div>` : ''}
    <div class="task-source">${esc(task.source || 'Added by you')}${url ? ` · <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>` : ''}</div>
    ${task.assumed ? '<div class="assumed">Assumed done from a past date on 11 Nov 2026. You can change this.</div>' : ''}
   </details>
  </div>
  <div class="task-actions">${statusSelect(task, 'tasks', code)}<button class="edit-small" data-edit="${esc(task.id)}" data-kind="tasks" data-course="${code}" aria-label="Edit ${esc(task.title)}">⋯</button></div>
 </article>`;
}
function renderTasks(kind) {
 const panel = taskPanels[kind];
 const { filter, query } = taskFilters[kind];
 if (!panel.firstElementChild) {
  panel.innerHTML = `<div class="toolbar">
   <input type="search" data-search="${kind}" placeholder="Search tasks or requirements…" aria-label="Search ${kind}">
   <div>${filterMenu(filter, kind)}</div>
  </div><div class="${kind === 'tasks' ? 'task-list ' : ''}task-results"></div>`;
 }
 panel.querySelector('[data-filter]').value = filter;
 const search = panel.querySelector('[data-search]');
 if (search.value !== query) search.value = query;
 renderTaskResults(kind);
}

function renderTaskResults(kind) {
 const results = taskPanels[kind].querySelector('.task-results');
 const { filter, query } = taskFilters[kind];
 const search = query.toLowerCase();
 if (kind === 'tasks') {
  const selected = current();
  setMarkup(results, selected.tasks.filter(task => matchesTask(task, filter, search))
   .map(task => taskCard(task, selected.code)).join('') || '<div class="card empty">No tasks match this view.</div>');
  return;
 }
 const tasks = allTasks().filter(task => matchesTask(task, filter, search))
  .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
 const groups = new Map([
  ['Overdue', []], ['Next 7 days', []], ['Later this term', []], ['Unknown dates', []], ['Completed', []],
 ]);
 const reference = today();
 for (const task of tasks) {
  const days = task.date ? dayDiff(task.date, reference) : null;
  let label = 'Later this term';
  if (days === null) label = 'Unknown dates';
  else if (task.status === 'Done') label = 'Completed';
  else if (days < 0) label = 'Overdue';
  else if (days <= 7) label = 'Next 7 days';
  groups.get(label).push(task);
 }
 setMarkup(results, [...groups].filter(([, items]) => items.length).map(([label, items]) =>
  `<div class="deadline-group">${label}<span>${items.length} tasks</span></div>
   <div class="task-list">${items.map(task => taskCard(task, task.code)).join('')}</div>`).join('')
  || '<div class="card empty">No matching tasks.</div>');
}
function materialsChecklist(groups, priority) {
 return `<section class="card materials-card" aria-labelledby="materials-to-send-title">
  <header class="materials-heading">
   <h4 id="materials-to-send-title">Materials to send</h4>
   <button type="button" data-toggle-completed-materials hidden>Show completed</button>
  </header>
  ${priority ? `<p class="materials-note">${esc(priority)}</p>` : ''}
  ${groups.map(({ title, note, items }, index) => {
   const list = `<ul class="materials-checklist">${items.map(([id, label]) => `<li>
    <label><input type="checkbox" data-send-material="${esc(id)}"><span>${esc(label)}</span></label>
   </li>`).join('')}</ul>`;
   return title ? `<details class="materials-group" ${index === 0 ? 'open' : ''}>
    <summary><span class="materials-summary"><span>${esc(title)}</span><span class="materials-count"></span></span></summary>
    ${note ? `<p class="materials-note">${esc(note)}</p>` : ''}
    ${list}
    <p class="materials-note materials-group-complete" hidden>Use Show completed to review these items.</p>
   </details>` : list;
  }).join('')}
  <p class="materials-empty" hidden>All items complete.</p>
 </section>`;
}

function updateMaterialsView(card) {
 const showCompleted = card.classList.contains('show-completed');
 const checkboxes = card.querySelectorAll('[data-send-material]');
 let completed = 0;
 for (const checkbox of checkboxes) {
  if (checkbox.checked) completed++;
  checkbox.closest('li').hidden = checkbox.checked && !showCompleted;
 }
 for (const group of card.querySelectorAll('.materials-group')) {
  const total = group.querySelectorAll('[data-send-material]').length;
  const done = group.querySelectorAll('[data-send-material]:checked').length;
  group.querySelector('.materials-count').textContent = `${done} of ${total} done`;
  group.querySelector('.materials-group-complete').hidden = showCompleted || done !== total;
 }
 const toggle = card.querySelector('[data-toggle-completed-materials]');
 if (completed === 0) card.classList.remove('show-completed');
 toggle.hidden = completed === 0;
 toggle.textContent = showCompleted ? 'Hide completed' : `Show completed (${completed})`;
 card.querySelector('.materials-empty').hidden = showCompleted || completed !== checkboxes.length;
}

function renderInfo() {
 const selected = current();
 const panel = $('#info-panel');
 const materials = activeTerm === baseTerm && courseMaterials[selected.code];
 const operations = activeTerm === baseTerm && selected.code === 'CVEN3101';
 setMarkup(panel, `<div class="info-grid">
  <div class="info-stack">
   <div class="card">
    <h4>Course links & materials</h4>
    ${selected.resources.map((resource, index) => {
     const url = safeURL(resource.url);
     return `<div class="resource">
      ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(resource.title)} ↗</a>` : `<strong>${esc(resource.title)} · Link unknown</strong>`}
      <p>${esc(resource.note)}</p><button class="link-button" data-resource="${index}">Edit link</button>
     </div>`;
    }).join('')}
    <button class="link-button" data-add-resource>＋ Add a resource link</button>
   </div>
   <div class="card">
    <h4>Your course notes</h4><p class="course-notes">${esc(selected.notes || 'No notes yet.')}</p>
    <button class="link-button" data-notes>Edit notes</button>
   </div>
   ${operations ? `<section class="card" aria-labelledby="exam-prep-title">
    <h4 id="exam-prep-title">Exam prep</h4>
    <ul class="materials-checklist"><li><label>
     <input type="checkbox" data-prepare-formula-sheet><span>Prepare your double-sided A4 formula sheet</span>
    </label></li></ul>
   </section>` : ''}
  </div>
  <div class="info-stack">
   <div class="card">
    <h4>Course information</h4>
    <ul>${selected.warnings.map(warning => `<li>${esc(warning)}</li>`).join('')}</ul>
    <div class="info-actions"><button data-edit-info>Edit course information</button></div>
    <details class="course-sources">
     <summary>Sources & date assumptions</summary>
     ${selected.info.map(item => `<p>${esc(item)}</p>`).join('')}
     <p>${activeTerm === baseTerm
      ? 'Dates come from your tracker and the 11 Nov 2026 calendar snapshot. Past dated tasks through 10 Nov were assumed done. Original course outlines and task briefs still need confirmation.'
      : 'Dates and requirements are unknown until you add the course materials.'}</p>
    </details>
   </div>
   ${materials ? materialsChecklist(materials, operations
    ? 'Start with the workshop questions and worked solutions for Modules 4–7.' : '') : ''}
  </div>
 </div>`);
 if (operations) {
  panel.querySelector('[data-prepare-formula-sheet]').checked = selected.formulaSheetPrepared === true;
 }
 if (materials) {
  const card = panel.querySelector('.materials-card');
  const sent = sentMaterials(selected);
  for (const checkbox of card.querySelectorAll('[data-send-material]')) {
   checkbox.checked = sent.has(checkbox.dataset.sendMaterial);
  }
  updateMaterialsView(card);
 }
}

const content = $('.content');
content.addEventListener('click', event => {
 const button = event.target.closest('button');
 if (!button) return;
 const data = button.dataset;
 if ('toggle' in data) changeStatus(data.course, data.kind, data.toggle);
 else if ('edit' in data) editItem(data.course, data.kind, data.edit);

 else if ('resumeSync' in data) {
  const week = current().weeks.find(item => item.id === data.resumeSync);
  delete week.calendarOverride;
  save();
  render();
 } else if ('notes' in data) editNotes();
 else if ('editInfo' in data) editInfo();
 else if ('resource' in data) editResource(Number(data.resource));
 else if ('addResource' in data) editResource(-1);
 else if ('toggleCompletedMaterials' in data) {
  const card = button.closest('.materials-card');
  card.classList.toggle('show-completed');
  updateMaterialsView(card);
 }

});

content.addEventListener('change', event => {
 const control = event.target;
 const kind = control.dataset.filter;
 if (kind === 'weeks') {
  weekFilter = control.value;
  renderWeeks();
  weeklyPanel.querySelector('[data-filter]').focus({ preventScroll: true });
 } else if (kind) {
  taskFilters[kind].filter = control.value;
  renderTaskResults(kind);
 } else if ('status' in control.dataset) {
  const { course: code, kind, status: id } = control.dataset;
  changeStatus(code, kind, id, control.value);
 } else if ('prepareFormulaSheet' in control.dataset) {
  current().formulaSheetPrepared = control.checked;
  save();
 } else if ('sendMaterial' in control.dataset) {
  const selected = current();
  const sent = sentMaterials(selected);
  if (control.checked) sent.add(control.dataset.sendMaterial);
  else sent.delete(control.dataset.sendMaterial);
  selected.sentMaterials = [...sent];
  save();
  const card = control.closest('.materials-card');
  const hadFocus = document.activeElement === control;
  updateMaterialsView(card);
  if (hadFocus && control.closest('li').hidden) {
   const siblings = [...control.closest('ul').querySelectorAll('[data-send-material]')];
   const index = siblings.indexOf(control);
   const next = siblings.slice(index + 1).find(checkbox => !checkbox.checked)
    ?? siblings.slice(0, index).findLast(checkbox => !checkbox.checked)
    ?? control.closest('.materials-group')?.querySelector('summary')
    ?? card.querySelector('[data-toggle-completed-materials]');
   next.focus({ preventScroll: true });
  }
 }
});

content.addEventListener('input', event => {
 const kind = event.target.dataset.search;
 if (!kind) return;
 taskFilters[kind].query = event.target.value;
 renderTaskResults(kind);
});

function changeStatus(code, kind, id, value) {
 const item = state.courses.find(candidate => candidate.code === code);
 const entry = item[kind].find(candidate => candidate.id === id);
 const effective = kind === 'weeks' ? courseWeeks(item).find(week => week.id === id) : entry;
 entry.status = value || (effective.status === 'Done' ? 'Not started' : 'Done');
 if (kind === 'tasks') entry.assumed = false;
 else {
  const progress = effective.calendarProgress;
  if (entry.status !== 'Done' && entry.status !== 'N/A' && progress && progress.done === progress.total) {
   entry.calendarOverride = true;
  } else {
   delete entry.calendarOverride;
  }
 }
 save();
 render();
}

const field=(name,label,value='',type='text')=>`<label class="field">${label}${type==='textarea'?`<textarea name="${name}">${esc(value)}</textarea>`:`<input name="${name}" type="${type}" value="${esc(value)}" ${name==='title'?'required maxlength="250"':''}>`}</label>`;
function showEditor(title,html,onSave){$('#dialog-title').textContent=title;$('#fields').innerHTML=html;editor=onSave;$('#editor').showModal();}
function editItem(code, kind, id) {
 const selected = state.courses.find(item => item.code === code);
 const item = selected[kind].find(entry => entry.id === id);
 if (kind === 'weeks') {
  showEditor('Week ' + item.week + ' notes',
   field('title', 'Topics', item.title) + field('date', 'Week start date · optional', item.date ?? '', 'date')
    + field('notes', 'Study notes', item.notes, 'textarea'),
   form => {
    item.title = form.get('title').trim();
    item.date = form.get('date') || null;
    item.notes = form.get('notes');
   });
  return;
 }
 showTaskEditor(selected, item);
}
function showTaskEditor(c,t=null){const item=t||{title:'',date:'',time:'',type:'Assignment',details:'',notes:'',url:''};showEditor(t?'Edit task':'Add a task',(!t?`<label class="field">Course<select name="course">${state.courses.map(x=>`<option ${x.code===c.code?'selected':''}>${x.code}</option>`).join('')}</select></label>`:'')+field('title','Task name',item.title)+`<div class="form-row">${field('date','Date · leave blank if unknown',item.date,'date')}${field('time','Sydney time · optional',item.time,'time')}</div><label class="field">Task type<select name="type">${['Assignment','Lab','Exam','Quiz','Module','Other'].map(x=>`<option ${item.type===x?'selected':''}>${x}</option>`).join('')}</select></label>`+field('details','Requirements · leave blank if unknown',item.details,'textarea')+field('notes','Notes / unknown information',item.notes,'textarea')+field('url','Source or Moodle link · optional',item.url,'url'),f=>{const values={title:f.get('title').trim(),date:f.get('date')||null,time:f.get('time'),type:f.get('type'),details:f.get('details'),notes:f.get('notes'),url:f.get('url')};if(values.url&&!safeURL(values.url))throw Error('Use an http or https link.');if(t)Object.assign(t,values);else{const code=f.get('course');state.courses.find(x=>x.code===code).tasks.push({...values,id:crypto.randomUUID(),status:'Not started',assumed:false,source:'Added by you'});setRoute('tasks', code);}});}
function editNotes(){const c=current();showEditor('Course notes',field('notes','Notes for '+c.code,c.notes,'textarea'),f=>c.notes=f.get('notes'));}
function editInfo(){const c=current();showEditor('Course information',field('info','Important information · one item per line',c.warnings.join('\n'),'textarea'),f=>c.warnings=f.get('info').split('\n').filter(Boolean));}
function editResource(i){const c=current(),r=c.resources[i]||{title:'',url:'',note:''};showEditor(i<0?'Add resource link':'Edit resource link',field('title','Resource name',r.title)+field('url','Link · blank means unknown',r.url,'url')+field('note','Details',r.note,'textarea'),f=>{const x={title:f.get('title').trim(),url:f.get('url'),note:f.get('note')};if(x.url&&!safeURL(x.url))throw Error('Use an http or https link.');if(i<0)c.resources.push(x);else c.resources[i]=x;});}
function exportBackup(){const blob=new Blob([JSON.stringify(workspace,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Nick_Study_Desk_'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Backup exported.');}
$('#edit-form').onsubmit = event => {
 event.preventDefault();
 try {
  const oldHash = location.hash;
  editor(new FormData(event.target));
  save();
  $('#editor').close();
  render();
  if (location.hash !== oldHash) scrollToView();
  toast('Changes saved.');
 } catch (error) { toast(error.message); }
};
$('#close-dialog').onclick = $('#cancel').onclick = () => $('#editor').close();

function showTermEditor() {
 const year = Math.max(Number(today().slice(0, 4)), Number(activeTerm.slice(0, 4)));
 showEditor('Add a term', `<div class="form-row">
  <label class="field">Year<input name="year" type="number" required min="2000" max="2099" value="${year}"></label>
  <label class="field">Term<select name="number"><option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option></select></label>
 </div>`, form => {
  const id = form.get('year') + '-t' + form.get('number');
  if (!isTermId(id)) throw Error('Choose a year and term.');
  if (Object.hasOwn(workspace.terms, id)) throw Error('That term is already in your workspace.');
  workspace.terms[id] = blankTerm();
  setRoute('overview', undefined, id);
 });
}

function showCourseEditor() {
 showEditor('Add a course', `<label class="field">Course code<input name="code" required placeholder="e.g. CVEN3101" maxlength="8" autocapitalize="characters"></label>
  ${field('title', 'Course name')}
  <label class="field">Checklist weeks<input name="weeks" type="number" required min="1" max="16" value="10"></label>`, form => {
  const code = form.get('code').trim().toUpperCase();
  const name = form.get('title').trim();
  const count = Number(form.get('weeks'));
  if (!courseCodePattern.test(code)) throw Error('Enter a course code like CVEN3101.');
  if (state.courses.some(item => item.code === code)) throw Error('That course is already in this term.');
  if (!name || !Number.isInteger(count) || count < 1 || count > 16) throw Error('Enter a course name and between 1 and 16 checklist weeks.');
  const weeks = Array.from({ length: count }, (_, index) => ({
   id: 'week-' + (index + 1), week: index + 1, title: 'Topics unknown', status: 'Not started', date: null, notes: '',
  }));
  state.courses.push({ code, name, weeks, tasks: [], info: [], warnings: [], resources: [], notes: '' });
  setRoute('weekly', code);
 });
}

function routeHash(nextView, nextCourse, term, week) {
 const prefix = term === baseTerm ? '' : 'term/' + term;
 const destination = Object.hasOwn(courseSections, nextView)
  ? 'course/' + nextCourse.toLowerCase() + '/' + courseSections[nextView]
  : nextView === 'calendar' ? 'study-calendar' : nextView === 'deadlines' ? 'deadlines'
  : nextView === 'practice' ? (nextCourse && week ? 'practice/' + nextCourse.toLowerCase() + '/' + week : 'practice') : '';
 const path = [prefix, destination].filter(Boolean).join('/');
 return path ? '#' + path : '';
}

function courseHash(code, section = 'weekly') {
 return routeHash(section, code, activeTerm);
}

function readRoute() {
 let path = location.hash.slice(1);
 let term = baseTerm;
 if (path.startsWith('term/')) {
  const [, id, ...rest] = path.split('/');
  if (!Object.hasOwn(workspace.terms, id)) return { view: 'overview', term };
  term = id;
  path = rest.join('/');
 }
 if (path === 'study-calendar') return { view: 'calendar', term };
 if (path === 'deadlines') return { view: 'deadlines', term };
 const practice = path.match(/^practice\/([a-z]{4}\d{4})\/(\d{1,2})$/);
 if (path === 'practice' || practice) {
  return { view: 'practice', term, course: practice?.[1].toUpperCase(), week: Number(practice?.[2]) };
 }
 const parts = path.match(/^course\/([a-z]{4}\d{4})\/(weeks|assessments|info)$/);
 const code = parts?.[1].toUpperCase();
 if (code && workspace.terms[term].courses.some(item => item.code === code)) {
  const section = Object.keys(courseSections).find(key => courseSections[key] === parts[2]);
  return { view: section, course: code, term };
 }
 return { view: 'overview', term };
}

function practiceSelection(term, requestedCourse, requestedWeek) {
 const courses = workspace.terms[term].courses;
 const selected = courses.find(item => item.code === requestedCourse)
  ?? (term === baseTerm ? courses.find(item => item.code === 'ENGG2500') : undefined)
  ?? courses[0];
 const weeks = practiceWeeks(selected);
 return { code: selected?.code, week: weeks.includes(requestedWeek) ? requestedWeek : weeks[0] };
}

function applyRoute(nextView, nextCourse, nextTermId, week) {
 const termChanged = activeTerm !== nextTermId;
 const previousCourse = course;
 activeTerm = nextTermId;
 state = workspace.terms[activeTerm];
 view = nextView;
 if (view !== 'calendar' || termChanged) calendarJump = undefined;
 const retainedCourse = !termChanged && state.courses.some(item => item.code === course) ? course : undefined;
 if (nextView === 'practice') {
  const selection = practiceSelection(activeTerm, nextCourse, week);
  course = selection.code;
  practiceWeek = selection.week;
 } else course = nextCourse ?? retainedCourse ?? state.courses[0]?.code;
 if (termChanged) {
  expandedCourse = undefined;
  taskFilters.deadlines = { filter: 'outstanding', query: '' };
 }
 if (termChanged || previousCourse !== course) {
  weekFilter = 'all';
  taskFilters.tasks = { filter: 'all', query: '' };
 }
 if (Object.hasOwn(courseSections, view)) expandedCourse = course;
 refreshChecklist();
}

function setRoute(nextView, nextCourse, nextTermId = activeTerm, week) {
 if (nextView === 'practice') {
  const selection = practiceSelection(nextTermId, nextCourse, week);
  nextCourse = selection.code;
  week = selection.week;
 }
 const hash = routeHash(nextView, nextCourse, nextTermId, week);
 if (location.hash !== hash) history.pushState(null, '', hash || location.pathname + location.search);
 applyRoute(nextView, nextCourse, nextTermId, week);
}

function scrollToView({ smooth = true, focus = false, keepPosition = false } = {}) {
 if (keepPosition) return;
 const behavior = smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant';
 if (Object.hasOwn(courseSections, view)) {
  const target = $('#course-header');
  if (focus) target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'start', behavior });
 } else {
  window.scrollTo({ top: 0, behavior });
 }
}

function openView(nextView, nextCourse, nextTermId, options) {
 setRoute(nextView, nextCourse, nextTermId, options?.week);
 render();
 scrollToView(options);
}

history.scrollRestoration = 'manual';
window.addEventListener('hashchange', () => {
 const next = readRoute();
 applyRoute(next.view, next.course, next.term, next.week);
 render();
 scrollToView();
});

courseNav.addEventListener('keydown', event => {
 if (event.key !== 'Escape' || !expandedCourse) return;
 const button = courseNav.querySelector(`[data-course-menu="${expandedCourse}"]`);
 expandedCourse = undefined;
 renderCourseNav();
 button?.focus();
});

const termPicker = $('#term-picker');
termPicker.addEventListener('keydown', event => {
 if (event.key !== 'Escape' || !termPicker.open) return;
 event.preventDefault();
 termPicker.open = false;
 termPicker.querySelector('summary').focus();
});

document.addEventListener('click', event => {
 if (termPicker.open && !termPicker.contains(event.target)) termPicker.open = false;
 const control = event.target.closest('button, a[data-view], a[data-jump-section]');
 if (!control) return;
 const data = control.dataset;
 if ('term' in data) {
  termPicker.open = false;
  if (data.term !== activeTerm) openView('overview', undefined, data.term);
  termPicker.querySelector('summary').focus();
 } else if ('addTerm' in data) {
  termPicker.open = false;
  termPicker.querySelector('summary').focus();
  showTermEditor();
 } else if ('addCourse' in data) showCourseEditor();
 else if ('courseMenu' in data) {
  const code = data.courseMenu;
  if (expandedCourse === code) {
   expandedCourse = undefined;
   renderCourseNav();
  } else if (matchMedia('(max-width: 760px)').matches) {
   expandedCourse = code;
   renderCourseNav();
  } else openView('weekly', code);
 } else if ('jumpSection' in data) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const tabs = control.closest('#section-tabs');
  const keepPosition = tabs && $('#course-header').getBoundingClientRect().bottom > 0
   && tabs.getBoundingClientRect().bottom < window.innerHeight - 64;
  openView(data.jumpSection, data.jumpCourse, activeTerm, { keepPosition, focus: !tabs });
 } else if ('resumeBlock' in data) {
  calendarJump = data.resumeBlock;
  openView('calendar', undefined, activeTerm, { keepPosition: true });
 } else if ('view' in data) {
  event.preventDefault();
  openView(data.view);
 } else if ('openTask' in data) editItem(data.course, 'tasks', data.openTask);
 else if ('addTask' in data) showTaskEditor(current() ?? state.courses[0]);
 else if ('export' in data || control.id === 'export') exportBackup();
 else if ('import' in data || control.id === 'import') $('#backup-file').click();
});

$('#backup-file').onchange = async event => {
 const file = event.target.files[0];
 if (!file) return;
 try {
  if (file.size > 5000000) throw Error('Backup is too large.');
  const backup = JSON.parse(await file.text());
  const allTerms = validWorkspace(backup);
  if (!allTerms && !validTerm(backup)) throw Error('This is not a valid Study Desk backup.');
  const message = allTerms ? 'This replaces all terms with the terms in your backup.'
   : 'This replaces the progress, tasks and notes for Term 3, 2026.';
  showEditor('Restore your backup', '<p>' + message + '</p>', () => {
   if (allTerms) workspace = backup;
   else workspace.terms[baseTerm] = backup;
   workspace.terms[nextTerm] ??= blankTerm();
   setRoute('overview', undefined, allTerms && Object.hasOwn(workspace.terms, activeTerm) ? activeTerm : baseTerm);
  });
 } catch (error) { toast(error.message || 'Could not restore this file.'); }
 event.target.value = '';
};

const initialRoute = readRoute();
applyRoute(initialRoute.view, initialRoute.course, initialRoute.term, initialRoute.week);
render();
if (Object.hasOwn(courseSections, view)) scrollToView({ smooth: false });

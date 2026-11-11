const fluidsWeekOne = [
 { topic: 'Specific gravity', prompt: 'An oil has a specific gravity of 0.85. Using 1,000 kg/m³ as the density of water, find the density of the oil.',
  unit: 'kg/m³', answer: 850, tolerance: 0.5, working: 'Density = specific gravity × water density = 0.85 × 1,000 = 850 kg/m³.' },
 { topic: 'Specific weight', prompt: 'A liquid has a density of 850 kg/m³. Find its specific weight using g = 9.81 m/s².',
  unit: 'N/m³', answer: 8338.5, tolerance: 1, working: 'Specific weight = ρg = 850 × 9.81 = 8,338.5 N/m³.' },
 { topic: 'Specific volume', prompt: 'A liquid has a density of 850 kg/m³. Find its specific volume in m³/kg to four significant figures.',
  unit: 'm³/kg', answer: 1/850, tolerance: 0.0000005, working: 'Specific volume = 1/ρ = 1/850 = 0.001176 m³/kg to four significant figures.' },
 { topic: 'Dynamic viscosity', prompt: 'A Newtonian fluid experiences a shear stress of 0.36 Pa at a velocity gradient of 120 s⁻¹. Find its dynamic viscosity.',
  unit: 'N·s/m²', answer: 0.003, tolerance: 0.000001, working: 'Use τ = μ(du/dy). Then μ = 0.36/120 = 0.003 N·s/m².' },
 { topic: 'Kinematic viscosity', prompt: 'An oil has a dynamic viscosity of 0.003 N·s/m² and a density of 850 kg/m³. Find its kinematic viscosity to three significant figures.',
  unit: 'm²/s', answer: 0.003/850, tolerance: 0.000000005, working: 'Kinematic viscosity = μ/ρ = 0.003/850 = 0.00000353 m²/s to three significant figures.' },
 { topic: 'Gauge and absolute pressure', prompt: 'A gauge reads −18.5 kPa. The local atmospheric pressure is 101.3 kPa. Find the absolute pressure.',
  unit: 'kPa', answer: 82.8, tolerance: 0.05, working: 'Absolute pressure = atmospheric pressure + gauge pressure = 101.3 − 18.5 = 82.8 kPa.' },
 { topic: 'Hydrostatic pressure', prompt: 'A tank is open to the atmosphere. Find the gauge pressure 2.4 m below its water surface. Use ρ = 998 kg/m³ and g = 9.81 m/s².',
  unit: 'kPa', answer: 998*9.81*2.4/1000, tolerance: 0.05, working: 'Gauge pressure = ρgh = 998 × 9.81 × 2.4 = 23,496.912 Pa. Divide by 1,000 to get 23.50 kPa.' },
 { topic: 'Layered liquids', prompt: 'An open tank has a 0.80 m layer of oil (850 kg/m³) above 1.25 m of water (1,000 kg/m³). Find the bottom gauge pressure using g = 9.81 m/s².',
  unit: 'kPa', answer: (850*0.8+1000*1.25)*9.81/1000, tolerance: 0.05, working: 'Add the pressure increases through both layers. p = 9.81(850 × 0.80 + 1,000 × 1.25) = 18,933.3 Pa = 18.93 kPa.' },
 { topic: 'Differential manometer', prompt: 'Two pressure taps A and B are at the same elevation in a water line. A mercury U-tube connects the taps. The mercury interface on the B side is 0.18 m higher than on the A side. Find pA − pB. Use ρwater = 1,000 kg/m³, ρmercury = 13,600 kg/m³ and g = 9.81 m/s².',
  unit: 'kPa', answer: (13600-1000)*9.81*0.18/1000, tolerance: 0.05, working: 'A has the higher pressure because its mercury interface is lower. The water columns offset part of the mercury head. pA − pB = (13,600 − 1,000) × 9.81 × 0.18 = 22.25 kPa.' },
 { topic: 'Ideal gas density', prompt: 'Air is at 101.3 kPa absolute and 295 K. Treat it as an ideal gas with R = 286.9 J/(kg·K). Find its density to three significant figures.',
  unit: 'kg/m³', answer: 101300/(286.9*295), tolerance: 0.005, working: 'Use ρ = p/(RT). Convert absolute pressure to pascals, then divide 101,300 by 286.9 × 295 to get 1.20 kg/m³.' },
 { topic: 'Pressure at a free surface', prompt: 'A tank is open to the atmosphere. What is the gauge pressure at the water surface?',
  options: ['The local atmospheric pressure', 'Zero', 'The negative of the local atmospheric pressure', 'The same as at the bottom of the tank'],
  answer: 'B', working: 'At the free surface, the absolute pressure equals the local atmospheric pressure. Gauge pressure is the difference between these pressures, so it is zero.' },
].map((question, index) => ({ ...question, id: 'engg2500-w1-' + (index + 1) }));

export function practiceWeeks(course) {
 return course?.weeks.filter(week => week.status !== 'N/A').map(({ week }) => week) ?? [];
}

const minParts = 2;
const maxParts = 12;
const choiceLetters = 'ABCDEFGH';
const normalize = text => text.trim().toLowerCase().replace(/\s+/g, ' ');
const shortText = (value, limit) => typeof value === 'string' && value.length <= limit;
const hasLabel = part => shortText(part?.label, 100) && part.label.trim();
const validOptions = options => Array.isArray(options) && options.length >= 2 && options.length <= choiceLetters.length
 && options.every(text => shortText(text, 300) && text.trim())
 && new Set(options.map(normalize)).size === options.length;
const validChoice = (answer, count) => typeof answer === 'string' && answer.length === 1
 && choiceLetters.slice(0, count).includes(answer);

function validAnswer({ options, answer, tolerance }) {
 if (options != null) return validOptions(options) && validChoice(answer, options.length);
 if (Number.isFinite(answer)) return Number.isFinite(tolerance) && tolerance >= 0;
 return Array.isArray(answer) && answer.length > 0 && answer.length <= 15
  && answer.every(text => shortText(text, 150) && text.trim());
}

const validParts = parts => Array.isArray(parts) && parts.length >= minParts && parts.length <= maxParts;

export function practiceQuestions(state, code, week, starter, includeRemoved = false) {
 const imported = state.practice?.sets?.[code + '/' + week];
 const base = starter && code === 'ENGG2500' && week === 1 ? fluidsWeekOne : [];
 const questions = base.concat(Array.isArray(imported) ? imported.filter(question =>
  typeof question?.id === 'string' && typeof question.prompt === 'string' &&
  (question.parts == null ? validAnswer(question)
   : validParts(question.parts) && question.parts.every(part => hasLabel(part) && validAnswer(part)))) : []);
 if (includeRemoved || !Array.isArray(state.practice?.removed)) return questions;
 const removed = new Set(state.practice.removed);
 return questions.filter(question => !removed.has(question.id));
}

export function parsePracticePack(raw) {
 if (raw.length > 120000) throw Error('This set is too large. Split it into smaller sets.');
 const cleaned = raw.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i, '$1');
 let input;
 try { input = JSON.parse(cleaned); }
 catch { throw Error('Paste a valid JSON question set. Use the study-chat prompt for the format.'); }
 if (!Array.isArray(input) || !input.length || input.length > 60) throw Error('Paste an array of 1 to 60 questions.');
 return input.map((item, index) => {
  const fail = message => { throw Error('Question ' + (index + 1) + '. ' + message); };
  const { topic, prompt, working, parts } = item ?? {};
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000
   || typeof working !== 'string' || !working.trim() || working.length > 4000) {
   fail('Include a question prompt and worked solution, each under 4,000 characters.');
  }
  if (topic != null && !shortText(topic, 100)) fail('Use short text for the topic.');
  const question = { topic: topic?.trim() || '', prompt: prompt.trim(), working: working.trim() };
  if (parts == null) return { ...question, ...parseAnswer(item, fail) };
  if (!validParts(parts)) fail('Include ' + minParts + ' to ' + maxParts + ' parts.');
  question.parts = parts.map((part, partIndex) => {
   const failPart = message => fail('Part ' + (partIndex + 1) + '. ' + message);
   if (!hasLabel(part)) failPart('Include a short label for this part.');
   return { label: part.label.trim(), ...parseAnswer(part, failPart) };
  });
  const labels = new Set(question.parts.map(part => normalize(part.label)));
  if (labels.size !== question.parts.length) fail('Give each part a different label.');
  return question;
 });
}

function parseAnswer(spec, fail) {
 const { unit, options, answer, tolerance } = spec;
 if (options != null) {
  if (!validOptions(options)) fail('Use 2 to 8 distinct options of up to 300 characters each.');
  const letter = typeof answer === 'string' ? answer.trim().toUpperCase() : answer;
  if (!validChoice(letter, options.length)) fail('Use the letter of one listed option as the answer, such as "B".');
  return { options: options.map(option => option.trim()), answer: letter };
 }
 if (unit != null && !shortText(unit, 40)) fail('Use short text for the unit.');
 if (!validAnswer(spec)) {
  fail(Number.isFinite(answer)
   ? 'Include a numeric tolerance of zero or more.'
   : 'Use a number or an array of accepted short answers.');
 }
 return { unit: unit?.trim() || '', answer, tolerance: Number.isFinite(answer) ? tolerance : 0 };
}

const numeric = /^[+−-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+−-]?\d+)?$/i;

export function gradePracticeAnswer(question, response) {
 const value = response.trim();
 if (!value) return 'empty';
 if (question.options) return value.toUpperCase() === question.answer ? 'correct' : 'incorrect';
 if (Array.isArray(question.answer)) {
  return question.answer.some(answer => normalize(answer) === normalize(value)) ? 'correct' : 'incorrect';
 }
 const clean = value.replace(/−/g, '-').replace(/^(?=[+-]?\d{1,3}(?:,\d{3})+(?:\.|e|$))([+-]?[\d,]+)/i, digits => digits.replace(/,/g, ''));
 if (!numeric.test(clean) || !Number.isFinite(Number(clean))) return 'number';
 const actual = Number(clean);
 const slack = Number.EPSILON * Math.max(Math.abs(question.answer), Math.abs(actual));
 return Math.abs(actual - question.answer) <= question.tolerance + slack ? 'correct' : 'incorrect';
}

const promptText = (code, week) => `Make a Study Desk practice set for ${code}, Week ${week}, using the topics and questions we covered in this chat. Return only a JSON array of 1 to 60 questions.

Keep the parts of each original question together. When several answers use the same scenario or given data, write the setup once in "prompt" and put the requested answers in a "parts" array (2 to 12 parts). Keep the original order and give each part a distinct label that says what to calculate or provide. Put the answer fields directly on a standalone question with one answer.

Use a mix of typed answers and multiple choice as appropriate. Keep source multiple-choice questions as multiple choice. For each multiple-choice question or part, use "options" with 2 to 8 distinct strings in display order, and use the letter of the one correct option as "answer" (for example, "B" for the second option). Leave letters out of the option strings. For newly written options, use plausible distractors and vary the position of the correct option. Use a typed answer when the student should calculate or recall it independently.

Use an answer number and an absolute tolerance in the displayed unit for numeric answers. Use an array of accepted strings for short text answers. Use an empty unit for dimensionless answers. Verify the answers, units and rounding. Put the worked solution for all parts in the question's "working" field.

Example set:
[
 {"topic":"Fluid properties","prompt":"A container holds 3.0 L of oil with a mass of 2.55 kg. Use water density 1000 kg/m³ and g = 9.81 m/s². Find the four properties below.","parts":[
  {"label":"Density","unit":"kg/m³","answer":850,"tolerance":0.5},
  {"label":"Specific gravity","unit":"","answer":0.85,"tolerance":0.001},
  {"label":"Specific weight","unit":"N/m³","answer":8338.5,"tolerance":0.5},
  {"label":"Specific volume (4 significant figures)","unit":"m³/kg","answer":0.00117647,"tolerance":0.0000005}
 ],"working":"Convert 3.0 L to 0.0030 m³. Density = 2.55 ÷ 0.0030 = 850 kg/m³. Specific gravity = 850 ÷ 1000 = 0.85. Specific weight = 850 × 9.81 = 8338.5 N/m³. Specific volume = 1 ÷ 850 = 0.001176 m³/kg to four significant figures."},
 {"topic":"Pressure","prompt":"The gauge pressure is 20 kPa and atmospheric pressure is 101.3 kPa. Find the absolute pressure.","unit":"kPa","answer":121.3,"tolerance":0.05,"working":"Absolute pressure = 101.3 + 20 = 121.3 kPa."},
 {"topic":"Specific gravity","prompt":"Which quantity is dimensionless?","options":["Dynamic viscosity","Specific weight","Specific gravity","Density"],"answer":"C","working":"Specific gravity is the ratio of two densities, so the units cancel."}
]`;

const questionKey = question => JSON.stringify([question.prompt,
 question.parts?.map(part => [normalize(part.label), Boolean(part.options)]) ?? Boolean(question.options)]);

function choiceField(spec, id, legend, esc, description = '') {
 return `<fieldset class="practice-choices" id="${id}" data-answer ${description}>
  <legend>${legend}</legend>
  ${spec.options.map((option, index) => `<label class="practice-choice">
   <input type="radio" name="${id}" value="${choiceLetters[index]}">
   <span class="practice-choice-letter">${choiceLetters[index]}.</span><span>${esc(option)}</span>
  </label>`).join('')}
 </fieldset>`;
}

function answerFields(question, esc) {
 const input = (spec, id, attributes = '') => `<input id="${id}" name="${id}" data-answer type="text"
  ${Number.isFinite(spec.answer) ? 'inputmode="decimal"' : ''} autocomplete="off" maxlength="180" ${attributes}>`;
 const unit = spec => spec.unit ? ' (' + esc(spec.unit) + ')' : '';
 const checkAnswer = '<button type="submit" class="primary">Check answer</button>';
 if (!question.parts) return question.options
  ? choiceField(question, 'practice-answer', 'Choose one answer', esc) + checkAnswer
  : `
  <label class="field" for="practice-answer">Your answer${unit(question)}</label>
  <div class="practice-answer">${input(question, 'practice-answer', 'required')}
   ${checkAnswer}
  </div>`;
 return `<div class="practice-parts">${question.parts.map((part, index) => {
  const id = 'practice-answer-' + index;
  const label = String.fromCharCode(65 + index) + '. ' + esc(part.label) + unit(part);
  const description = 'aria-describedby="' + id + '-feedback"';
  const field = part.options ? choiceField(part, id, label, esc, description)
   : `<label class="field" for="${id}">${label}</label>${input(part, id, description)}`;
  return `<div class="practice-part">
   ${field}
   <span class="practice-part-feedback" id="${id}-feedback" hidden></span>
  </div>`;
 }).join('')}</div>
 <button type="submit" class="primary">Check answers</button>`;
}

const reviewIntervals = [1, 3, 7, 14, 30, 60, 90];
const reviewRatings = ['Again', 'Hard', 'Good', 'Easy'];
const reviewDate = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const formatReviewDate = date => reviewDate.format(new Date(date + 'T00:00:00Z'));

function getReview(state, id) {
 const reviews = state.practice?.reviews;
 const review = reviews && Object.hasOwn(reviews, id) ? reviews[id] : undefined;
 return review && /^\d{4}-\d{2}-\d{2}$/.test(review.due)
  && Number.isFinite(Date.parse(review.due)) && Number.isInteger(review.interval)
  && review.interval >= 0 && review.interval <= 90 && Number.isInteger(review.successes)
  && review.successes >= 0 && review.successes <= 3 ? review : undefined;
}

export function nextPracticeReview(previous, rating, date) {
 const interval = previous?.interval ?? 0;
 const successes = previous?.successes ?? 0;
 let days = 0;
 let nextSuccesses = 0;
 if (rating === 'Hard') {
  days = Math.max(1, Math.ceil(interval / 2));
  nextSuccesses = successes;
 } else if (rating === 'Good' || rating === 'Easy') {
  const future = reviewIntervals.filter(value => value > interval);
  days = (rating === 'Easy' ? future[1] : undefined) ?? future[0] ?? reviewIntervals.at(-1);
  nextSuccesses = Math.min(3, successes + 1);
 }
 const due = new Date(date + 'T00:00:00Z');
 due.setUTCDate(due.getUTCDate() + days);
 return { due: due.toISOString().slice(0, 10), interval: days, successes: nextSuccesses };
}

function masteryLabel(review, solved) {
 if (review?.successes === 3) return 'Mastered';
 if (review?.successes > 0) return 'In review';
 return review || solved ? 'Learning' : 'New';
}

export function renderPractice(root, { state, course, week, starter, escape: esc, select, save, today }) {
 const solved = new Set(Array.isArray(state.practice?.solved) ? state.practice.solved : []);
 const removed = new Set(Array.isArray(state.practice?.removed) ? state.practice.removed : []);
 const key = course && week ? course.code + '/' + week : '';
 const allQuestions = () => practiceQuestions(state, course.code, week, starter, true);
 const header = `<header class="page-heading"><div><div class="eyebrow">STUDY DESK</div><h1 id="practice-title">Practice</h1></div>
  ${key ? `<div class="practice-heading-actions">
   <button type="button" data-practice-import>Import questions</button>
   <details class="practice-options" hidden>
    <summary><span aria-hidden="true">⋯</span><span class="sr-only">Question options</span></summary>
    <div class="practice-options-panel"><button type="button" data-remove-question>Remove question</button></div>
   </details>
  </div>` : ''}</header>`;
 const pickers = course ? `<div class="practice-pickers">
  <label class="field">Course <select data-practice-course>${state.courses.map(item =>
   `<option value="${esc(item.code)}" ${item.code === course.code ? 'selected' : ''}>${esc(item.code)} · ${esc(item.name)}</option>`).join('')}</select></label>
  <label class="field">Week <select data-practice-week ${week ? '' : 'disabled'}>${practiceWeeks(course).map(number =>
   `<option value="${number}" ${number === week ? 'selected' : ''}>Week ${number}</option>`).join('')}</select></label>
 </div>` : '';
 root.innerHTML = header + pickers + (key
  ? '<div class="practice-body"></div><dialog class="practice-import" aria-labelledby="practice-import-title"></dialog>'
  : '<div class="card empty">Add a course with a weekly checklist to start practising.</div>');
 const coursePicker = root.querySelector('[data-practice-course]');
 if (coursePicker) coursePicker.onchange = event => select(event.target.value);
 if (!key) return;

 const body = root.querySelector('.practice-body');
 const dialog = root.querySelector('.practice-import');
 root.querySelector('[data-practice-week]').onchange = event => select(course.code, Number(event.target.value));
 root.querySelector('[data-practice-import]').onclick = openImport;
 const options = root.querySelector('.practice-options');
 const removeButton = options.querySelector('[data-remove-question]');
 options.onfocusout = event => {
  if (!options.contains(event.relatedTarget)) options.open = false;
 };
 options.onkeydown = event => {
  if (event.key === 'Escape' && options.open) {
   event.preventDefault();
   options.open = false;
   options.querySelector('summary').focus();
  }
 };
 let showAll = false;
 let activeId;
 let lastRemoved;

 function updatePractice(changes) {
  state.practice = { ...state.practice, ...changes };
  save();
 }

 function restoreQuestion(id) {
  removed.delete(id);
  if (lastRemoved === id) lastRemoved = undefined;
  updatePractice({ removed: [...removed] });
  activeId = id;
  if (getReview(state, id)?.due > today()) showAll = true;
  questionView(true);
 }

 function openRemoved() {
  const questions = allQuestions().filter(question => removed.has(question.id));
  dialog.innerHTML = `<h2 id="practice-import-title">Removed questions</h2>
   <ul class="practice-removed-list">${questions.map((question, index) => `<li>
    <span>${esc(question.prompt)}</span>
    <button type="button" data-restore-question="${index}">Restore</button>
   </li>`).join('')}</ul>
   <div class="dialog-actions"><button type="button" data-close>Close</button></div>`;
  dialog.querySelector('[data-close]').onclick = () => dialog.close();
  for (const button of dialog.querySelectorAll('[data-restore-question]')) button.onclick = () => {
   dialog.close();
   restoreQuestion(questions[Number(button.dataset.restoreQuestion)].id);
  };
  dialog.showModal();
 }

 function questionView(focus = false) {
  const date = today();
  const bank = allQuestions();
  const questions = bank.filter(question => !removed.has(question.id));
  const removedCount = bank.length - questions.length;
  const reviews = new Map(questions.map(({ id }) => [id, getReview(state, id)]));
  const due = questions.filter(({ id }) => !reviews.get(id) || reviews.get(id).due <= date);
  const queue = showAll ? questions : due;
  const active = Math.max(0, queue.findIndex(({ id }) => id === activeId));
  const question = queue[active];
  options.open = false;
  options.hidden = !question;
  activeId = question?.id;
  const mastered = questions.filter(({ id }) => reviews.get(id)?.successes === 3).length;
  body.innerHTML = `<div class="practice-status">
   <div class="practice-modes" aria-label="Question filter">
    <button type="button" data-review-mode="due" aria-pressed="${!showAll}">Due today (${due.length})</button>
    <button type="button" data-review-mode="all" aria-pressed="${showAll}">All questions (${questions.length})</button>
   </div>
   ${questions.length ? `<div class="practice-progress"><strong>${mastered} of ${questions.length} mastered</strong>
    <progress aria-label="Questions mastered" max="${questions.length}" value="${mastered}"></progress></div>` : ''}
   ${removedCount ? `<button type="button" class="practice-quiet" data-open-removed>Removed (${removedCount})</button>` : ''}
  </div>
  ${lastRemoved ? '<div class="practice-undo" role="status">Question removed. <button type="button" class="practice-quiet" data-undo-remove>Undo</button></div>' : ''}
  <div class="practice-question"></div>`;
  for (const button of body.querySelectorAll('[data-review-mode]')) button.onclick = () => {
   const mode = button.dataset.reviewMode;
   showAll = mode === 'all';
   questionView();
   body.querySelector('[data-review-mode="' + mode + '"]').focus();
  };
  const undo = body.querySelector('[data-undo-remove]');
  if (undo) undo.onclick = () => restoreQuestion(lastRemoved);
  const open = body.querySelector('[data-open-removed]');
  if (open) open.onclick = openRemoved;

  const panel = body.querySelector('.practice-question');
  if (!question) {
   const future = questions.map(({ id }) => reviews.get(id)?.due).filter(Boolean).sort()[0];
   panel.innerHTML = `<div class="card empty">${questions.length
    ? 'You’re caught up. Next review ' + formatReviewDate(future) + '.'
    : 'No questions for this week. Import a question set to get started.'}</div>`;
   if (focus) (undo ?? body.querySelector('[data-review-mode="all"]')).focus();
   return;
  }

  const review = reviews.get(question.id);
  const isDue = !review || review.due <= date;
  const label = masteryLabel(review, solved.has(question.id));
  const parts = question.parts ?? [question];
  const multi = Boolean(question.parts);
  panel.innerHTML = `<article class="card practice-card">
    <div class="eyebrow">QUESTION ${active + 1} OF ${queue.length} <span class="practice-mastery" data-mastery="${label}">${label}</span></div>
    <h2 tabindex="-1">${esc(question.topic || 'Question ' + (active + 1))}</h2>
    <p class="practice-prompt">${esc(question.prompt)}</p>
    ${isDue ? '' : `<p class="practice-next-review">Next review ${formatReviewDate(review.due)}.</p>`}
    <form>${answerFields(question, esc)}</form>
    <p class="practice-feedback" role="status" hidden></p>
    <details class="practice-working" hidden><summary>Show working</summary><p>${esc(question.working)}</p></details>
    ${isDue ? `<fieldset class="practice-ratings" hidden><legend>How did it go?</legend>${reviewRatings.map(rating => {
     const { interval } = nextPracticeReview(review, rating, date);
     return `<button type="button" data-practice-rating="${rating}">${rating}<small>${interval === 0 ? 'Today' : interval + (interval === 1 ? ' day' : ' days')}</small></button>`;
    }).join('')}</fieldset>` : ''}
   </article>
   <div class="practice-nav"><button type="button" data-step="-1" ${active === 0 ? 'disabled' : ''}>Previous</button>
    <button type="button" data-step="1" ${active === queue.length - 1 ? 'disabled' : ''}>Next question</button></div>`;

  function nextQuestionId() {
   return queue[active + 1]?.id ?? queue[0]?.id;
  }
  removeButton.onclick = () => {
   removed.add(question.id);
   lastRemoved = question.id;
   updatePractice({ removed: [...removed] });
   activeId = nextQuestionId();
   questionView(true);
  };

  const ratings = panel.querySelector('.practice-ratings');
  const form = panel.querySelector('form');
  const controls = [...form.querySelectorAll('[data-answer]')];
  const partFeedback = [...form.querySelectorAll('.practice-part-feedback')];
  const feedback = panel.querySelector('.practice-feedback');
  const partMessages = {
   correct: 'Correct.', incorrect: 'Incorrect.', empty: 'Enter an answer.',
   number: 'Enter a number in the requested unit, such as 0.003 or 3e-3.',
  };
  let missed = false;
  form.onsubmit = event => {
   event.preventDefault();
   const responses = new FormData(form);
   const results = parts.map((part, index) => gradePracticeAnswer(part, responses.get(controls[index].id) ?? ''));
   const messages = results.map((result, index) => result === 'empty' && parts[index].options
    ? 'Choose an answer.' : partMessages[result]);
   const correct = results.filter(result => result === 'correct').length;
   const allCorrect = correct === parts.length;
   const answered = results.every(result => result === 'correct' || result === 'incorrect');
   if (results.includes('incorrect')) missed = true;
   if (!multi && question.options) controls[0].setAttribute('aria-invalid', String(!allCorrect));
   partFeedback.forEach((message, index) => {
    const result = results[index];
    message.textContent = messages[index];
    message.dataset.result = result;
    message.hidden = false;
    controls[index].setAttribute('aria-invalid', String(result !== 'correct'));
   });
   const summary = multi ? correct + ' of ' + parts.length + ' correct.'
    : allCorrect && missed && isDue ? 'Correct on retry.' : messages[0];
   let guidance = '';
   if (multi && !answered) guidance = ' Answer every part to finish checking.';
   else if (answered && missed && isDue) guidance = ' Choose Again to review it later today.';
   else if (answered && !allCorrect) guidance = ' Try again or check the working.';
   feedback.dataset.result = allCorrect ? 'correct' : 'incorrect';
   feedback.textContent = summary + guidance;
   feedback.hidden = false;
   if (answered) panel.querySelector('.practice-working').hidden = false;
   if (ratings) {
    ratings.hidden = !answered;
    for (const button of ratings.querySelectorAll('button')) {
     button.disabled = missed && button.dataset.practiceRating !== 'Again';
    }
   }
   if (allCorrect && !solved.has(question.id)) {
    solved.add(question.id);
    updatePractice({ solved: [...solved] });
   }
  };
  form.oninput = event => {
   const control = event.target.closest('[data-answer]');
   if (!control) return;
   const message = partFeedback[controls.indexOf(control)];
   if (message) message.hidden = true;
   control.removeAttribute('aria-invalid');
   feedback.hidden = true;
   if (ratings) ratings.hidden = true;
  };
  for (const button of panel.querySelectorAll('[data-practice-rating]')) button.onclick = () => {
   const next = nextPracticeReview(review, button.dataset.practiceRating, today());
   updatePractice({ reviews: { ...state.practice?.reviews, [question.id]: next } });
   activeId = nextQuestionId();
   questionView(true);
  };
  for (const button of panel.querySelectorAll('[data-step]')) button.onclick = () => {
   activeId = queue[active + Number(button.dataset.step)].id;
   questionView(true);
  };
  if (focus) panel.querySelector('h2').focus();
 }

 function openImport() {
  dialog.innerHTML = `<form>
   <h2 id="practice-import-title">Import practice questions</h2>
   <p>${esc(course.code)} · Week ${week}</p>
   <details class="practice-template">
    <summary>Get a prompt for your study chat</summary>
    <textarea aria-label="Study chat prompt" readonly>${esc(promptText(course.code, week))}</textarea>
    <button type="button" data-copy-prompt>Copy prompt</button>
   </details>
   <label class="field">Paste questions as JSON<textarea name="pack" maxlength="120000" required rows="7"></textarea></label>
   <p class="practice-import-error" role="alert"></p>
   <div class="dialog-actions"><button type="button" data-cancel>Cancel</button><button type="submit" class="primary">Import questions</button></div>
  </form>`;
  dialog.querySelector('[data-cancel]').onclick = () => dialog.close();
  dialog.querySelector('[data-copy-prompt]').onclick = async event => {
   const button = event.currentTarget;
   const prompt = dialog.querySelector('textarea[readonly]');
   try { await navigator.clipboard.writeText(prompt.value); button.textContent = 'Copied'; }
   catch { prompt.focus(); prompt.select(); }
  };
  dialog.querySelector('form').onsubmit = event => {
   event.preventDefault();
   try {
    const parsed = parsePracticePack(new FormData(event.currentTarget).get('pack'));
    const existing = new Set(allQuestions().map(questionKey));
    const added = [];
    for (const question of parsed) {
     const signature = questionKey(question);
     if (existing.has(signature)) continue;
     existing.add(signature);
     added.push({ ...question, id: crypto.randomUUID() });
    }
    if (!added.length) throw Error('These questions are already in this week. You can restore any that you removed.');
    const sets = state.practice?.sets;
    const prior = Array.isArray(sets?.[key]) ? sets[key] : [];
    updatePractice({ sets: { ...sets, [key]: prior.concat(added) } });
    activeId = added[0].id;
    dialog.close();
    questionView(true);
   } catch (error) { dialog.querySelector('[role=alert]').textContent = error.message; }
  };
  dialog.showModal();
 }
 questionView();
}

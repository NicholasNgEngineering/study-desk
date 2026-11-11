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
].map((question, index) => ({ ...question, id: 'engg2500-w1-' + (index + 1) }));

export function practiceWeeks(course) {
 return course?.weeks.filter(week => week.status !== 'N/A').map(({ week }) => week) ?? [];
}

export function practiceQuestions(state, code, week, starter) {
 const imported = state.practice?.sets?.[code + '/' + week];
 const base = starter && code === 'ENGG2500' && week === 1 ? fluidsWeekOne : [];
 return base.concat(Array.isArray(imported) ? imported.filter(question =>
  typeof question?.id === 'string' && typeof question.prompt === 'string' &&
  (Number.isFinite(question.answer) || Array.isArray(question.answer) && question.answer.every(text => typeof text === 'string'))) : []);
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
  const { topic, prompt, unit, answer, tolerance, working } = item ?? {};
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000
   || typeof working !== 'string' || !working.trim() || working.length > 4000) {
   fail('Include a question prompt and worked solution, each under 4,000 characters.');
  }
  if ((topic != null && (typeof topic !== 'string' || topic.length > 100))
   || (unit != null && (typeof unit !== 'string' || unit.length > 40))) fail('Use short text for the topic and unit.');
  if (typeof answer === 'number' && Number.isFinite(answer)) {
   if (typeof tolerance !== 'number' || !Number.isFinite(tolerance) || tolerance < 0) fail('Include a numeric tolerance of zero or more.');
  } else if (!Array.isArray(answer) || !answer.length || answer.length > 15
   || !answer.every(text => typeof text === 'string' && text.trim() && text.length <= 150)) {
   fail('Use a number or an array of accepted short answers.');
  }
  return { topic: topic?.trim() || '', prompt: prompt.trim(), unit: unit?.trim() || '',
   answer, tolerance: typeof answer === 'number' ? tolerance : 0, working: working.trim() };
 });
}

const normalize = text => text.trim().toLowerCase().replace(/\s+/g, ' ');
const numeric = /^[+−-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+−-]?\d+)?$/i;

export function gradePracticeAnswer(question, response) {
 const value = response.trim();
 if (!value) return 'empty';
 if (Array.isArray(question.answer)) {
  return question.answer.some(answer => normalize(answer) === normalize(value)) ? 'correct' : 'incorrect';
 }
 const clean = value.replace(/−/g, '-').replace(/^(?=[+-]?\d{1,3}(?:,\d{3})+(?:\.|e|$))([+-]?[\d,]+)/i, digits => digits.replace(/,/g, ''));
 if (!numeric.test(clean) || !Number.isFinite(Number(clean))) return 'number';
 const actual = Number(clean);
 const slack = Number.EPSILON * Math.max(Math.abs(question.answer), Math.abs(actual));
 return Math.abs(actual - question.answer) <= question.tolerance + slack ? 'correct' : 'incorrect';
}

const promptText = (code, week) => `Make a Study Desk question set for ${code}, Week ${week}, using the topics and questions we covered in this chat. Check the answers and units. Return only a JSON array. For numeric questions, use an answer number and an absolute tolerance in the stated unit. For short text, use an array of accepted answers. Give a worked solution for each question.
Example:
[{"topic":"Density","prompt":"A liquid fills a 2 m³ tank and has a mass of 1600 kg. What is its density?","unit":"kg/m³","answer":800,"tolerance":0.5,"working":"Density = mass ÷ volume = 1600 ÷ 2 = 800 kg/m³."}]`;

export function renderPractice(root, { state, course, week, starter, escape: esc, select, save }) {
 const questions = course && week ? practiceQuestions(state, course.code, week, starter) : [];
 const solved = Array.isArray(state.practice?.solved) ? state.practice.solved : [];
 const done = new Set(solved);
 const key = course && week ? course.code + '/' + week : '';
 const header = `<header class="page-heading"><div><div class="eyebrow">STUDY DESK</div><h1 id="practice-title">Practice</h1></div>
  ${key ? '<button type="button" data-practice-import>Import questions</button>' : ''}</header>`;
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
 let active = 0;

 function questionView(focus = false) {
  const question = questions[active];
  if (!question) {
   body.innerHTML = '<div class="card empty">No questions for this week yet. Use Import questions to add a set from your study chat.</div>';
   return;
  }
  const numericAnswer = typeof question.answer === 'number';
  const completed = questions.filter(item => done.has(item.id)).length;
  body.innerHTML = `<div class="practice-progress"><strong data-practice-score>${completed} of ${questions.length} solved</strong>
   <progress aria-label="Questions solved" max="${questions.length}" value="${completed}"></progress></div>
   <article class="card practice-card">
    <div class="eyebrow">QUESTION ${active + 1} OF ${questions.length} <span data-practice-done ${done.has(question.id) ? '' : 'hidden'}>✓ Solved</span></div>
    <h2 tabindex="-1">${esc(question.topic || 'Question ' + (active + 1))}</h2>
    <p class="practice-prompt">${esc(question.prompt)}</p>
    <form>
     <label class="field" for="practice-answer">Your answer${question.unit ? ' (' + esc(question.unit) + ')' : ''}</label>
     <div class="practice-answer">
      <input id="practice-answer" name="answer" type="text" ${numericAnswer ? 'inputmode="decimal"' : ''} autocomplete="off" maxlength="180" required>
      <button type="submit" class="primary">Check answer</button>
     </div>
    </form>
    <p class="practice-feedback" role="status" hidden></p>
    <details class="practice-working" hidden><summary>Show working</summary><p>${esc(question.working)}</p></details>
   </article>
   <div class="practice-nav"><button type="button" data-step="-1" ${active === 0 ? 'disabled' : ''}>Previous</button>
    <button type="button" data-step="1" ${active === questions.length - 1 ? 'disabled' : ''}>Next question</button></div>`;
  body.querySelector('form').onsubmit = event => {
   event.preventDefault();
   const answer = body.querySelector('#practice-answer');
   const result = gradePracticeAnswer(question, answer.value);
   const feedback = body.querySelector('.practice-feedback');
   feedback.hidden = false;
   feedback.dataset.result = result;
   feedback.textContent = { correct: 'Correct.', incorrect: 'Incorrect. Try again or check the working.',
    empty: 'Enter an answer.', number: 'Enter a number in the requested unit, such as 0.003 or 3e-3.' }[result];
   if (result === 'correct' || result === 'incorrect') body.querySelector('.practice-working').hidden = false;
   if (result === 'correct' && !done.has(question.id)) {
    done.add(question.id);
    state.practice = { ...state.practice, solved: [...done] };
    save();
    body.querySelector('[data-practice-done]').hidden = false;
    body.querySelector('[data-practice-score]').textContent = (completed + 1) + ' of ' + questions.length + ' solved';
    body.querySelector('progress').value = completed + 1;
   }
  };
  for (const button of body.querySelectorAll('[data-step]')) button.onclick = () => {
   active += Number(button.dataset.step);
   questionView(true);
  };
  if (focus) body.querySelector('h2').focus();
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
    const existing = new Set(questions.map(question => question.prompt));
    const added = [];
    for (const question of parsed) {
     if (existing.has(question.prompt)) continue;
     existing.add(question.prompt);
     added.push({ ...question, id: crypto.randomUUID() });
    }
    if (!added.length) throw Error('These questions are already in this week.');
    const sets = state.practice?.sets;
    const prior = Array.isArray(sets?.[key]) ? sets[key] : [];
    state.practice = { ...state.practice, sets: { ...sets, [key]: prior.concat(added) } };
    save();
    active = questions.length;
    questions.push(...added);
    dialog.close();
    questionView(true);
   } catch (error) { dialog.querySelector('[role=alert]').textContent = error.message; }
  };
  dialog.showModal();
 }
 questionView();
}

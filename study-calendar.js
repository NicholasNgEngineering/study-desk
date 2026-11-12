import { exams } from './study-plan.js';
import { calendarWeeks, creditedMinutes, durationLabel, mockFocus, pendingStudyBlocks, saveStudyProgress, validStudyDate } from './study-progress.js';
import { studyActions } from './study-actions.js?v=move-between-weeks-20261112';

let selectedTerm;
let selectedWeek;
let selectedBlock;

const fullDate = new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
const shortDate = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const weekday = new Intl.DateTimeFormat('en-AU', { weekday: 'short', timeZone: 'UTC' });
const dateObject = date => new Date(date + 'T12:00:00Z');

function summarizeCourses(courses, progress) {
  const summaries = new Map(courses.map(({ code }) => [code, { planned: 0, credited: 0, upcoming: [] }]));
  for (const [id, block] of progress.blocks) {
    const summary = summaries.get(block.course);
    if (!summary || block.kind !== 'study') continue;
    summary.planned += block.minutes;
    summary.credited += creditedMinutes(id, progress);
  }
  for (const entry of pendingStudyBlocks(progress)) summaries.get(entry.block.course)?.upcoming.push(entry);
  return summaries;
}

function weekRange(week) {
  const start = week.days[0].date;
  const end = week.days.at(-1).date;
  const first = start.slice(0, 7) === end.slice(0, 7) ? Number(start.slice(-2)) : shortDate.format(dateObject(start));
  return first + '–' + shortDate.format(dateObject(end));
}

function courseBadge(course) {
  return course ? `<span class="study-course study-course-${course.toLowerCase()}">${course}</span>` : '';
}

function renderExam(exam) {
  return `<article class="study-exam-card">
    <h3>${courseBadge(exam.course)} <span>${shortDate.format(dateObject(exam.date))}</span></h3>
    <p>${exam.start}–${exam.end} · ${exam.room}</p>
    <small>${exam.weight} of course mark</small>
  </article>`;
}

function renderChecklist(courses, escapeText) {
  return courses.map(course => {
    const next = [...course.weeks].sort((a, b) => a.week - b.week)
      .find(week => week.status !== 'Done' && week.status !== 'N/A');
    return `<span>${courseBadge(course.code)} ${next ? 'Week ' + escapeText(next.week) + ' · ' + escapeText(next.status) : 'All weeks checked'}</span>`;
  }).join('');
}

function dayProgress(day, progress) {
  const entries = (progress.days[day.date] ?? []).map(id => {
    const block = progress.blocks.get(id);
    const credit = block.kind === 'study' ? creditedMinutes(id, progress) : 0;
    const done = progress.completed.has(id) || credit === block.minutes;
    return { id, block, credit, done };
  });
  let planned = 0;
  let completed = 0;
  for (const { block, credit } of entries) {
    if (block.kind !== 'study') continue;
    planned += block.minutes;
    completed += credit;
  }
  return { entries, planned, completed };
}

function renderBlock({ id, block, credit, done }, escapeText, result) {
  const movable = block.kind === 'study';
  const picked = selectedBlock === id;
  const title = escapeText(block.title);
  const duration = movable ? durationLabel(block.minutes) : block.start + '–' + block.end;
  const partial = movable && credit > 0 && !done;
  return `<li class="study-block study-block-${block.kind}${done ? ' study-block-done' : ''}${partial ? ' study-block-partial' : ''}${picked ? ' study-block-picked' : ''}" data-study-block="${id}">
    <div class="study-block-duration">
      ${movable ? `<button type="button" class="study-swap-handle" data-study-swap="${id}" aria-pressed="${picked}" aria-label="Move or swap ${title}" title="Drag or select to move or swap">⠿</button>` : ''}
      <span class="study-time">
        ${partial ? `<s>${duration}</s><strong>${durationLabel(block.minutes - credit)} left</strong>` : duration}
      </span>
    </div>
    <div class="study-block-body">
      <div class="study-block-heading">${courseBadge(block.course)}<strong>${title}</strong></div>
      ${block.detail ? `<p>${escapeText(block.detail)}</p>` : ''}
      ${partial ? `<span class="study-block-credit">${durationLabel(credit)} logged</span>` : ''}
      ${block.mock ? `<button type="button" class="study-mock-link" data-study-mock="${id}" aria-label="${result ? 'Edit' : 'Log'} mock result for ${title}">${result ? result.score + '% · View result' : 'Log mock result'}</button>` : ''}
    </div>
    <div class="study-block-controls">
      <label class="study-block-check">
        <input type="checkbox" data-study-check="${id}" aria-label="Complete ${title}" ${done ? 'checked' : ''}>
      </label>
      ${movable ? `<button type="button" class="study-block-options" data-study-options="${id}" aria-label="Options for ${title}" title="Edit or move block">⋯</button>` : ''}
    </div>
  </li>`;
}

function renderInsertZone(date, before, label, empty = false) {
  return `<li class="study-insert-zone${empty ? ' study-insert-empty' : ''}" data-insert-date="${date}" data-insert-before="${before}">
    ${selectedBlock ? `<button type="button" data-study-insert aria-label="${label}">Insert here</button>` : ''}
    ${empty && !selectedBlock ? '<span>Drop a study block here</span>' : ''}
  </li>`;
}

function renderDay(day, daily, tasks, currentDate, escapeText, mocks) {
  const deadlines = tasks.filter(task => task.date === day.date && task.type !== 'Exam');
  const examDay = day.sessions.some(block => block.kind === 'exam');
  const restDay = !daily.entries.length;
  const initialOrder = daily.entries.length === day.sessions.length
    && daily.entries.every((entry, index) => entry.id === day.date + '-' + index);
  const title = initialOrder || examDay ? day.title : restDay ? 'No study planned' : 'Updated study plan';
  const freeTime = !day.sessions.length && !restDay ? '' : day.free;
  return `<article class="study-day card${examDay ? ' study-exam-day' : ''}" id="study-day-${day.date}" data-study-date="${day.date}">
    <header class="study-day-header">
      <div>
        <time datetime="${day.date}">${fullDate.format(dateObject(day.date))}</time>
        <h3>${escapeText(title)}</h3>
      </div>
      <span class="study-day-hours">${restDay ? 'Rest day' : durationLabel(daily.completed) + ' / ' + durationLabel(daily.planned) + ' done'}</span>
    </header>
    ${deadlines.length ? `<ul class="study-due-list" aria-label="Assessment deadlines">
      ${deadlines.map(task => `<li>
        ${courseBadge(task.code)}
        <span>${escapeText(task.title)}</span>
        <span>${task.status === 'Done' ? 'Done' : task.status === 'N/A' ? 'N/A' : task.time ? 'Due ' + escapeText(task.time) : 'Due today · time unknown'}</span>
      </li>`).join('')}
    </ul>` : ''}
    <ol class="study-blocks" aria-label="Blocks in study order">
      ${daily.entries.map(entry =>
        renderInsertZone(day.date, entry.id, 'Insert before ' + escapeText(entry.block.title))
        + renderBlock(entry, escapeText, mocks.get(entry.id))).join('')}
      ${renderInsertZone(day.date, '', 'Insert at the end of ' + fullDate.format(dateObject(day.date)), restDay)}
    </ol>
    ${freeTime ? `<footer class="study-free">${day.date === currentDate ? '<strong>Today</strong> · ' : ''}${escapeText(freeTime)}</footer>` : ''}
  </article>`;
}

function renderCourseProgress(course, summary, escapeText) {
  const { planned, credited, upcoming } = summary;
  const next = upcoming[0];
  return `<article class="study-course-progress">
    <div class="study-course-progress-header">
      ${courseBadge(course)}
      <button type="button" data-study-log="${course}" ${next ? '' : 'disabled'}>+ Log time</button>
    </div>
    <p class="study-course-hours"><strong>${durationLabel(credited)}</strong><span> / ${durationLabel(planned)}</span></p>
    <progress class="study-course-meter study-course-meter-${course.toLowerCase()}" max="${planned || 1}" value="${credited}" aria-label="${course} study time"></progress>
    <p class="study-course-next">${next
      ? `<strong>Next · ${durationLabel(next.remaining)} left</strong><span>${escapeText(next.block.title)}</span>`
      : '<strong>All planned study complete</strong>'}</p>
  </article>`;
}

const markupCache = new WeakMap();
const rowTemplate = document.createElement('template');
const dragCleanup = new WeakMap();

function setMarkup(element, html) {
  if (markupCache.get(element) === html) return;
  element.innerHTML = html;
  markupCache.set(element, html);
}

function updateRows(container, rows) {
  let current = container.firstElementChild;
  for (const html of rows) {
    const next = current?.nextElementSibling;
    if (!current || markupCache.get(current) !== html) {
      rowTemplate.innerHTML = html;
      const replacement = rowTemplate.content.firstElementChild;
      if (current) current.replaceWith(replacement);
      else container.append(replacement);
      markupCache.set(replacement, html);
    }
    current = next;
  }
  while (current) {
    const next = current.nextElementSibling;
    current.remove();
    current = next;
  }
}

function mountCalendar(root, useSeed) {
  root.innerHTML = `<header class="page-heading study-calendar-header">
    <div>
      <div class="eyebrow" data-study-period></div>
      <h1 id="study-calendar-title">Study Calendar</h1>
      <p>Work through the blocks in order, at times that suit you.</p>
    </div>
    <div class="study-header-actions">
      <button type="button" class="primary" data-study-add>＋ Add block</button>
      <button type="button" data-study-today hidden>Go to today</button>
      <button type="button" data-study-rail>${useSeed ? 'Progress & exams' : 'Study progress'}</button>
    </div>
  </header>

  <div class="study-layout">
    <div class="study-main">
      <nav class="study-week-picker" aria-label="Study weeks"></nav>
      <div class="study-empty card empty" hidden>No study blocks yet. Add a block to start your plan.</div>
      <section class="study-week" aria-labelledby="study-week-title">
        <header class="study-week-header">
          <div><h2 id="study-week-title"></h2><p></p></div>
          <span class="study-week-total"></span>
        </header>
        <nav class="study-date-strip" aria-label="Days in this study week"></nav>
        <div class="study-swap-guide" role="status"></div>
        <div class="study-agenda"></div>
      </section>
    </div>
    <aside class="study-rail" id="study-rail" aria-label="Study progress and exams" tabindex="-1">
      <button type="button" class="study-rail-return" data-study-agenda>Back to study blocks</button>
      <section class="study-rail-card card" aria-labelledby="study-time-title">
        <h2 id="study-time-title">Study time</h2>
        <div class="study-course-progress-list"></div>
      </section>
      <details class="study-rail-details card">
        <summary>Mock results <span data-mock-count></span></summary>
        <div class="study-mocks"></div>
      </details>
      ${useSeed ? `<section class="study-rail-card card" aria-labelledby="final-exams-title">
        <h2 id="final-exams-title">Final exams</h2>
        <div class="study-exam-list">${exams.map(renderExam).join('')}</div>
      </section>` : ''}
      <details class="study-rail-details card">
        <summary>Next unchecked weeks</summary>
        <div class="study-checklist"></div>
      </details>
      ${useSeed ? `<details class="study-rail-details study-readiness card">
        <summary>Aiming for 95+ on the finals</summary>
        <div class="study-readiness-body">
          <p>Start with worked examples for unchecked topics. Then solve a few questions independently before moving on. The early Weeks 5–8 Soil Mechanics sessions are guided prep for Quiz 3.</p>
          <p>95+ in each final is a stretch while several topics are still new. Use two different timed mocks per course and mark them strictly. Scoring around 95% on both with time to check is a useful readiness check.</p>
          <p>If a mock is below 90% or the same errors recur, use the next 60–90 minutes to redo the biggest mistakes from scratch, then try fresh questions on those methods.</p>
        </div>
      </details>` : ''}
    </aside>
  </div>
  <dialog class="study-log-dialog" aria-labelledby="study-log-title"></dialog>`;
}

function renderMocks(progress, escapeText) {
  const byCourse = new Map();
  for (const [id, result] of progress.mocks) {
    const block = progress.blocks.get(id);
    const entries = byCourse.get(block.course) ?? [];
    entries.push({ id, block, result });
    byCourse.set(block.course, entries);
  }
  return [...byCourse].map(([course, entries]) => {
    entries.sort((a, b) => b.result.recordedOn.localeCompare(a.result.recordedOn)
      || (b.result.recordedAt ?? 0) - (a.result.recordedAt ?? 0));
    const focus = mockFocus(entries);
    return `<section class="study-mock-group">
      <h3>${courseBadge(course) || 'General study'}</h3>
      ${focus ? `<p class="study-mock-focus"><strong>Next practice</strong> ${escapeText(focus.label)}${focus.count > 1 ? ` <span>· ${focus.count} mocks</span>` : ''}</p>` : ''}
      ${entries.map(({ id, block, result }) => `<details class="study-mock-entry">
        <summary><strong>${result.score}%</strong> ${escapeText(block.title)}</summary>
        <p>${shortDate.format(dateObject(result.recordedOn))} · ${result.minutesLeft === null ? 'Time left unrecorded' : durationLabel(result.minutesLeft) + ' left'}</p>
        ${result.mistakes.length ? `<ul>${result.mistakes.map(mistake => `<li>${escapeText(mistake)}</li>`).join('')}</ul>` : ''}
        <button type="button" class="study-mock-link" data-study-mock="${id}" aria-label="Edit result for ${escapeText(block.title)}">Edit result</button>
      </details>`).join('')}
    </section>`;
  }).join('') || '<p class="study-mock-empty">Log a score from any timed mock block.</p>';
}

export function renderStudyCalendar(root, options, progress, jumpBlock) {
  const { tasks, courses, currentDate, escapeText, updateCalendar, notify, term, termName, useSeed } = options;
  dragCleanup.get(root)?.();
  if (selectedTerm !== term || !root.querySelector('.study-week-picker')) {
    selectedTerm = term;
    selectedWeek = undefined;
    selectedBlock = undefined;
    mountCalendar(root, useSeed);
  }
  const { blocks, mocks } = progress;
  const weeks = calendarWeeks(progress, useSeed);
  const currentWeek = weeks.find(item => item.days.some(day => day.date === currentDate));
  const jumpDate = jumpBlock ? Object.keys(progress.days).find(date => progress.days[date].includes(jumpBlock)) : undefined;
  const jumpWeek = weeks.find(item => item.days.some(day => day.date === jumpDate));
  const week = jumpWeek ?? weeks.find(item => item.key === selectedWeek) ?? currentWeek ?? weeks[0];
  selectedWeek = week?.key;

  root.querySelector('[data-study-period]').textContent = termName.toUpperCase();
  root.querySelector('[data-study-today]').hidden = !currentWeek;
  root.querySelector('.study-week').hidden = !week;
  root.querySelector('.study-empty').hidden = Boolean(week);
  root.querySelector('.study-week-picker').hidden = !week;
  setMarkup(root.querySelector('.study-week-picker'), weeks.map(item =>
    `<button type="button" data-study-week="${item.key}" aria-pressed="${item.key === selectedWeek}">${weekRange(item)}</button>`).join(''));
  root.querySelector('[data-mock-count]').textContent = mocks.size ? String(mocks.size) : '';
  setMarkup(root.querySelector('.study-mocks'), renderMocks(progress, escapeText));

  const courseSummaries = summarizeCourses(courses, progress);
  setMarkup(root.querySelector('.study-checklist'), renderChecklist(courses, escapeText)
    || '<span>Add courses from the overview to link their weekly checklists.</span>');
  updateRows(root.querySelector('.study-course-progress-list'),
    courses.map(({ code }) => renderCourseProgress(code, courseSummaries.get(code), escapeText)));
  root.querySelector('#study-time-title').parentElement.hidden = !courses.length;

  if (week) {
    const daily = week.days.map(day => dayProgress(day, progress));
    const weekPlanned = daily.reduce((sum, day) => sum + day.planned, 0);
    const weekDone = daily.reduce((sum, day) => sum + day.completed, 0);
    const picked = blocks.get(selectedBlock);
    root.querySelector('#study-week-title').textContent = week.title;
    root.querySelector('.study-week-header p').textContent = week.summary;
    root.querySelector('.study-week-total').textContent = durationLabel(weekDone) + ' / ' + durationLabel(weekPlanned) + ' done';
    const dateStrip = root.querySelector('.study-date-strip');
    dateStrip.style.setProperty('--study-days', week.days.length);
    setMarkup(dateStrip, week.days.map((day, index) => {
      const examDay = day.sessions.some(block => block.kind === 'exam');
      const date = dateObject(day.date);
      const label = examDay ? 'Exam' : daily[index].entries.length ? durationLabel(daily[index].planned) : 'Off';
      return `<button type="button" data-study-day="${day.date}" class="${examDay ? 'exam-date' : ''}" ${day.date === currentDate ? 'aria-current="date"' : ''} aria-label="${fullDate.format(date)}, ${label}">
        <span>${weekday.format(date)}</span><strong>${Number(day.date.slice(-2))}</strong><small>${label}</small>
      </button>`;
    }).join(''));

    const swapGuide = root.querySelector('.study-swap-guide');
    swapGuide.classList.toggle('study-swap-active', Boolean(picked));
    setMarkup(swapGuide, picked
      ? `<span><strong>${escapeText(picked.title)}</strong> selected. Choose a handle to swap or an insertion point.</span><div class="study-swap-actions"><button type="button" data-study-move>Move to…</button><button type="button" data-study-cancel>Cancel</button></div>`
      : '<span>Drag to reorder, or use ⋯ → Move to… to move a block to another week.</span>');
    updateRows(root.querySelector('.study-agenda'),
      week.days.map((day, index) => renderDay(day, daily[index], tasks, currentDate, escapeText, mocks)));
  }

  function refresh(focusSelector, target) {
    renderStudyCalendar(root, options, progress, target);
    if (focusSelector) root.querySelector(focusSelector)?.focus({ preventScroll: true });
  }

  function saveProgress(focusSelector, target) {
    updateCalendar(saveStudyProgress(progress), progress);
    refresh(focusSelector, target);
  }

  const actions = studyActions(root.querySelector('.study-log-dialog'), {
    courses, currentDate, progress, weeks, weekRange, placeBlock, escapeText, notify,
    defaultDate: week && currentWeek === week ? currentDate : week?.days[0].date ?? '',
    save(id, jump) {
      selectedBlock = undefined;
      saveProgress(`[data-study-options="${id}"]`, jump ? id : undefined);
    },
  });

  if (jumpWeek) {
    const target = root.querySelector(`[data-study-block="${jumpBlock}"]`);
    target?.querySelector('[data-study-check]')?.focus({ preventScroll: true });
    jumpTo(target);
  }

  function findBlock(id) {
    for (const [date, ids] of Object.entries(progress.days)) {
      const index = ids.indexOf(id);
      if (index !== -1) return { date, ids, index };
    }
  }

  function swap(from, to) {
    if (from === to || blocks.get(from)?.kind !== 'study' || blocks.get(to)?.kind !== 'study') return;
    const source = findBlock(from);
    const target = findBlock(to);
    source.ids[source.index] = to;
    target.ids[target.index] = from;
    if (progress.changes.has(from)) blocks.get(from).date = target.date;
    if (progress.changes.has(to)) blocks.get(to).date = source.date;
    selectedBlock = undefined;
    saveProgress(`[data-study-swap="${from}"]`);
    notify('Study blocks swapped.');
  }

  function placeBlock(id, date, before) {
    if (blocks.get(id)?.kind !== 'study' || id === before || !validStudyDate(date)) return false;
    const source = findBlock(id);
    const destination = progress.days[date] ?? [];
    if (!source || (before && !destination.includes(before))) return false;
    source.ids.splice(source.index, 1);
    const index = before ? destination.indexOf(before) : destination.length;
    destination.splice(index, 0, id);
    progress.days[date] = destination;
    if (progress.changes.has(id)) blocks.get(id).date = date;
    return true;
  }

  function insert(id, date, before) {
    if (!placeBlock(id, date, before)) return;
    selectedBlock = undefined;
    saveProgress(`[data-study-swap="${id}"]`);
    notify('Study block moved.');
  }

  function openLogDialog(course) {
    const { planned, credited, upcoming } = courseSummaries.get(course);
    const nextBlock = upcoming[0];
    if (!nextBlock) return;
    const remaining = planned - credited;
    const dialog = root.querySelector('.study-log-dialog');
    dialog.innerHTML = `<form>
      <h2 id="study-log-title">Log time · ${course}</h2>
      <p>Time goes to the first unfinished block in calendar order.</p>
      <p class="study-log-next"><strong>${escapeText(nextBlock.block.title)}</strong><br>${shortDate.format(dateObject(nextBlock.date))} · ${durationLabel(nextBlock.remaining)} remaining</p>
      <label class="field">Minutes studied
        <input name="minutes" type="number" inputmode="numeric" min="1" max="${remaining}" step="1" required autofocus>
      </label>
      <div class="study-log-presets" aria-label="Quick durations">
        ${[15, 30, 60].filter(minutes => minutes <= remaining).map(minutes =>
          `<button type="button" data-log-minutes="${minutes}">${durationLabel(minutes)}</button>`).join('')}
      </div>
      <p class="study-log-note">Extra minutes carry over to the following blocks. ${durationLabel(remaining)} left in the plan.</p>
      <div class="dialog-actions">
        <button type="button" data-study-log-cancel>Cancel</button>
        <button type="submit" class="primary">Log time</button>
      </div>
    </form>`;
    const form = dialog.querySelector('form');
    const minutesInput = form.elements.minutes;
    dialog.querySelector('[data-study-log-cancel]').onclick = () => dialog.close();
    for (const preset of dialog.querySelectorAll('[data-log-minutes]')) {
      preset.onclick = () => { minutesInput.value = preset.dataset.logMinutes; };
    }
    form.onsubmit = event => {
      event.preventDefault();
      const minutes = minutesInput.valueAsNumber;
      if (!Number.isInteger(minutes) || minutes <= 0 || minutes > remaining) return;
      let left = minutes;
      for (const block of upcoming) {
        const applied = Math.min(left, block.remaining);
        progress.logged.set(block.id, block.credit + applied);
        left -= applied;
        if (left === 0) break;
      }
      dialog.close();
      saveProgress(`[data-study-log="${course}"]`);
      notify('Logged ' + durationLabel(minutes) + ' for ' + course + '.');
    };
    dialog.showModal();
  }

  root.onchange = event => {
    const checkbox = event.target.closest('[data-study-check]');
    if (!checkbox) return;
    const id = checkbox.dataset.studyCheck;
    if (checkbox.checked) {
      progress.completed.add(id);
    } else {
      progress.completed.delete(id);
      if (progress.logged.get(id) === blocks.get(id).minutes) progress.logged.delete(id);
    }
    saveProgress(`[data-study-check="${id}"]`);
  };

  function jumpTo(target) {
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    target?.scrollIntoView({ block: 'start', behavior });
  }

  root.onclick = event => {
    if (suppressClick) return;
    if (event.target.closest('[data-study-add]')) {
      actions.editBlock();
      return;
    }
    const blockOptions = event.target.closest('[data-study-options]');
    if (blockOptions) {
      actions.options(blockOptions.dataset.studyOptions, blockOptions.closest('[data-study-date]').dataset.studyDate);
      return;
    }
    if (event.target.closest('[data-study-move]') && selectedBlock) {
      actions.moveBlock(selectedBlock, findBlock(selectedBlock).date);
      return;
    }
    const mock = event.target.closest('[data-study-mock]');
    if (mock) {
      actions.mockResult(mock.dataset.studyMock);
      return;
    }
    if (event.target.closest('[data-study-today]') && currentWeek) {
      if (selectedWeek !== currentWeek.key) {
        selectedWeek = currentWeek.key;
        refresh();
      }
      jumpTo(root.querySelector('#study-day-' + currentDate));
      return;
    }
    if (event.target.closest('[data-study-rail]')) {
      const rail = root.querySelector('#study-rail');
      rail.focus({ preventScroll: true });
      jumpTo(rail);
      return;
    }
    if (event.target.closest('[data-study-agenda]')) {
      const picker = root.querySelector('.study-week-picker');
      picker.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
      jumpTo(picker);
      return;
    }
    const logButton = event.target.closest('[data-study-log]');
    if (logButton) {
      openLogDialog(logButton.dataset.studyLog);
      return;
    }
    const weekButton = event.target.closest('[data-study-week]');
    if (weekButton) {
      const nextWeek = weekButton.dataset.studyWeek;
      if (nextWeek === selectedWeek) return;
      selectedWeek = nextWeek;
      refresh(`[data-study-week="${selectedWeek}"]`);
      return;
    }
    const dayButton = event.target.closest('[data-study-day]');
    if (dayButton) {
      jumpTo(root.querySelector('#study-day-' + dayButton.dataset.studyDay));
      return;
    }
    const insertButton = event.target.closest('[data-study-insert]');
    if (insertButton && selectedBlock) {
      const zone = insertButton.closest('[data-insert-date]');
      insert(selectedBlock, zone.dataset.insertDate, zone.dataset.insertBefore);
      return;
    }
    const handle = event.target.closest('[data-study-swap]');
    if (handle) {
      const slot = handle.dataset.studySwap;
      if (selectedBlock && selectedBlock !== slot) {
        swap(selectedBlock, slot);
      } else {
        selectedBlock = selectedBlock === slot ? undefined : slot;
        refresh(`[data-study-swap="${slot}"]`);
        if (selectedBlock) notify('Block selected. Choose a handle to swap or an insertion point.');
      }
      return;
    }
    if (event.target.closest('[data-study-cancel]')) {
      const slot = selectedBlock;
      selectedBlock = undefined;
      refresh(`[data-study-swap="${slot}"]`);
    }
  };

  let pointerDrag;
  let dropTarget;
  let scrollFrame;
  let suppressClick = false;

  function clearDropTarget() {
    dropTarget?.classList.remove('study-block-drop', 'study-insert-drop');
    dropTarget = undefined;
  }

  function findDropTarget(x, y) {
    const hit = document.elementFromPoint(x, y);
    const gap = hit?.closest('[data-insert-date]');
    if (gap && root.contains(gap) && gap.dataset.insertBefore !== pointerDrag.id) return gap;
    const block = hit?.closest('.study-block-study');
    if (block && root.contains(block) && block.dataset.studyBlock !== pointerDrag.id) return block;
  }

  function highlightTarget() {
    const target = findDropTarget(pointerDrag.x, pointerDrag.y);
    if (target === dropTarget) return;
    clearDropTarget();
    dropTarget = target;
    if (target) target.classList.add(target.hasAttribute('data-insert-date') ? 'study-insert-drop' : 'study-block-drop');
  }

  function movePreview() {
    const { preview, previewWidth, previewHeight, x, y } = pointerDrag;
    const left = Math.max(8, Math.min(x + 14, window.innerWidth - previewWidth - 8));
    const below = y + 14;
    const top = below + previewHeight <= window.innerHeight - 8 ? below : y - previewHeight - 14;
    preview.style.transform = `translate3d(${left}px, ${Math.max(8, top)}px, 0)`;
  }

  function startDrag() {
    pointerDrag.moved = true;
    const { row } = pointerDrag;
    const preview = document.createElement('div');
    preview.className = 'study-drag-preview';
    preview.setAttribute('aria-hidden', 'true');
    const card = document.createElement('div');
    card.className = 'study-drag-card';
    card.append(row.querySelector('.study-block-heading').cloneNode(true),
      row.querySelector('.study-time').cloneNode(true));
    preview.append(card);
    root.append(preview);
    pointerDrag.preview = preview;
    pointerDrag.previewWidth = preview.offsetWidth;
    pointerDrag.previewHeight = preview.offsetHeight;
    dragCleanup.set(root, endDrag);
    row.classList.add('study-block-dragging');
    root.classList.add('study-calendar-dragging');
  }

  function queueDragFrame() {
    if (scrollFrame === undefined) scrollFrame = requestAnimationFrame(updateDrag);
  }

  function updateDrag() {
    scrollFrame = undefined;
    if (!pointerDrag?.moved) return;
    if (root.hidden || !pointerDrag.row.isConnected) {
      endDrag();
      return;
    }
    const y = pointerDrag.y;
    const edgeScroll = y < 50 ? -12 : y > window.innerHeight - 50 ? 12 : 0;
    const previousScroll = window.scrollY;
    if (edgeScroll) window.scrollBy(0, edgeScroll);
    movePreview();
    highlightTarget();
    if (edgeScroll && window.scrollY !== previousScroll) queueDragFrame();
  }

  function endDrag() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = undefined;
    dragCleanup.delete(root);
    pointerDrag?.row.classList.remove('study-block-dragging');
    pointerDrag?.preview?.remove();
    root.classList.remove('study-calendar-dragging');
    clearDropTarget();
    const drag = pointerDrag;
    pointerDrag = undefined;
    if (drag?.handle.hasPointerCapture(drag.pointerId)) drag.handle.releasePointerCapture(drag.pointerId);
  }

  root.onkeydown = event => {
    if (event.key !== 'Escape') return;
    if (pointerDrag) endDrag();
    if (selectedBlock) {
      const id = selectedBlock;
      selectedBlock = undefined;
      refresh(`[data-study-swap="${id}"]`);
    }
  };

  root.onpointerdown = event => {
    const handle = event.target.closest('[data-study-swap]');
    if (!handle || event.button !== 0 || pointerDrag) return;
    pointerDrag = {
      pointerId: event.pointerId,
      id: handle.dataset.studySwap,
      handle,
      row: handle.closest('[data-study-block]'),
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    handle.setPointerCapture(event.pointerId);
  };

  root.onpointermove = event => {
    if (pointerDrag?.pointerId !== event.pointerId) return;
    pointerDrag.x = event.clientX;
    pointerDrag.y = event.clientY;
    if (!pointerDrag.moved) {
      const distance = Math.hypot(pointerDrag.x - pointerDrag.startX, pointerDrag.y - pointerDrag.startY);
      if (distance < 6) return;
      startDrag();
    }
    queueDragFrame();
  };

  root.onpointerup = event => {
    if (pointerDrag?.pointerId !== event.pointerId) return;
    const { id, startX, startY } = pointerDrag;
    const moved = pointerDrag.moved || Math.hypot(event.clientX - startX, event.clientY - startY) >= 6;
    const target = moved ? findDropTarget(event.clientX, event.clientY) : undefined;
    endDrag();
    if (moved) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    if (target?.hasAttribute('data-insert-date')) {
      insert(id, target.dataset.insertDate, target.dataset.insertBefore);
    } else if (target) {
      swap(id, target.dataset.studyBlock);
    }
  };

  root.onpointercancel = root.onlostpointercapture = event => {
    if (pointerDrag?.pointerId === event.pointerId) endDrag();
  };
}

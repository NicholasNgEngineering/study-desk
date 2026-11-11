import { creditedMinutes, durationLabel, shiftStudyDate, validDuration, validStudyDate } from './study-progress.js';

export function studyActions(dialog, { courses, currentDate, defaultDate, progress, escapeText, save, notify }) {
  function show(title, content, submitLabel, submit) {
    dialog.innerHTML = `<form>
      <h2 id="study-log-title">${escapeText(title)}</h2>
      ${content}
      <div class="dialog-actions">
        <button type="button" data-dialog-cancel>Cancel</button>
        ${submitLabel ? `<button type="submit" class="primary">${submitLabel}</button>` : ''}
      </div>
    </form>`;
    const form = dialog.querySelector('form');
    form.querySelector('[data-dialog-cancel]').onclick = () => dialog.close();
    form.onsubmit = event => {
      event.preventDefault();
      if (!submit) return;
      const result = submit(new FormData(form));
      if (!result) return;
      dialog.close();
      save(result.id, result.jump);
      notify(result.message);
    };
    if (!dialog.open) dialog.showModal();
    else (form.querySelector('input, select, button'))?.focus();
    return form;
  }

  function editBlock(id, date) {
    const block = progress.blocks.get(id);
    const credit = block ? creditedMinutes(id, progress) : 0;
    const firstDate = date || defaultDate;
    const form = show(block ? 'Edit study block' : 'Add study block', `
      <label class="field">Topic
        <input name="title" maxlength="150" required value="${escapeText(block?.title)}">
      </label>
      <div class="form-row">
        <label class="field">Course<select name="course">
          <option value="">General study</option>
          ${courses.map(course => `<option value="${course.code}" ${block?.course === course.code ? 'selected' : ''}>${course.code}</option>`).join('')}
        </select></label>
        <label class="field">Planned minutes
          <input name="minutes" type="number" inputmode="numeric" min="${Math.max(1, credit)}" max="1440" step="1" required value="${block?.minutes ?? 60}">
        </label>
      </div>
      ${block ? '' : `<label class="field">Study date<input name="date" type="date" required value="${firstDate}"></label>`}
      <label class="field">What to practise<textarea name="detail" maxlength="1500">${escapeText(block?.detail)}</textarea></label>
      ${credit ? `<p>${durationLabel(credit)} already credited.</p>` : ''}
      <div class="study-week-links"></div>
      <label class="study-form-check"><input name="mock" type="checkbox" ${block?.mock ? 'checked' : ''} ${progress.mocks.has(id) ? 'disabled' : ''}> Timed mock</label>
    `, block ? 'Save block' : 'Add block', values => {
      const title = values.get('title').trim();
      const minutes = Number(values.get('minutes'));
      const newDate = block ? date : values.get('date');
      const code = values.get('course');
      if (!title || !validDuration(minutes) || !validStudyDate(newDate) || minutes < credit) {
        notify('Enter a topic, a valid date and enough minutes to cover the time already studied.');
        return;
      }
      const selected = courses.find(course => course.code === code);
      const linked = values.getAll('weeks').map(Number);
      const checklistWeeks = selected?.weeks.filter(week => week.status !== 'N/A' && linked.includes(week.week))
        .map(week => week.week) ?? [];
      const blockId = id ?? 'custom-' + crypto.randomUUID();
      const updated = { kind: 'study', title, minutes, date: newDate, course: selected?.code ?? '',
        detail: values.get('detail').trim(), checklistWeeks, mock: values.has('mock') || progress.mocks.has(blockId) };
      if (block && minutes > block.minutes && progress.completed.delete(blockId)) progress.logged.set(blockId, credit);
      progress.changes.set(blockId, updated);
      progress.blocks.set(blockId, updated);
      if (!block) (progress.days[newDate] ??= []).push(blockId);
      return { id: blockId, jump: !block, message: block ? 'Study block updated.' : 'Study block added.' };
    });

    function showLinks() {
      const selected = courses.find(course => course.code === form.elements.course.value);
      const weeks = selected?.weeks.filter(week => week.status !== 'N/A') ?? [];
      const linked = selected?.code === block?.course ? block?.checklistWeeks ?? [] : [];
      form.querySelector('.study-week-links').innerHTML = weeks.length ? `<details ${linked.length ? 'open' : ''}>
        <summary>Linked checklist weeks${linked.length ? ' · ' + linked.join(', ') : ' (optional)'}</summary>
        <div class="study-week-link-options">${weeks.map(({ week, title }) => `<label class="study-form-check" title="${escapeText(title)}">
          <input type="checkbox" name="weeks" value="${week}" ${linked.includes(week) ? 'checked' : ''}> Week ${week}
        </label>`).join('')}</div>
      </details>` : '';
    }
    form.elements.course.onchange = showLinks;
    showLinks();
  }

  function moveBlock(id, date) {
    const block = progress.blocks.get(id);
    const remaining = block.minutes - creditedMinutes(id, progress);
    const tomorrow = shiftStudyDate(currentDate, 1);
    const form = show('Move study block', `
      <p><strong>${escapeText(block.title)}</strong> · ${durationLabel(remaining)} left</p>
      <label class="field">Pick a date<input name="date" type="date" required></label>
      <button type="button" data-tomorrow>Tomorrow</button>
    `, 'Move block', values => {
      const destination = values.get('date');
      if (!validStudyDate(destination) || destination === date) {
        notify('Choose a different study date.');
        return;
      }
      const source = progress.days[date];
      source.splice(source.indexOf(id), 1);
      (progress.days[destination] ??= []).push(id);
      if (progress.changes.has(id)) {
        block.date = destination;
      }
      return { id, jump: true, message: 'Study block moved.' };
    });
    form.querySelector('[data-tomorrow]').onclick = () => {
      form.elements.date.value = tomorrow;
      form.elements.date.focus();
    };
  }

  function mockResult(id) {
    const block = progress.blocks.get(id);
    const result = progress.mocks.get(id);
    show(result ? 'Edit mock result' : 'Log mock result', `
      <p>${escapeText(block.course)} · ${escapeText(block.title)}</p>
      <div class="form-row">
        <label class="field">Score (%)
          <input name="score" type="number" inputmode="decimal" min="0" max="100" step="0.01" required value="${result?.score ?? ''}">
        </label>
        <label class="field">Minutes left (optional)
          <input name="minutesLeft" type="number" inputmode="numeric" min="0" max="1440" step="1" value="${result?.minutesLeft ?? ''}">
        </label>
      </div>
      <label class="field">Mistakes to practise · one per line
        <textarea name="mistakes" maxlength="2000" placeholder="e.g. Centre of pressure setup">${escapeText(result?.mistakes.join('\n'))}</textarea>
      </label>
    `, 'Save result', values => {
      const score = Number(values.get('score'));
      const time = values.get('minutesLeft');
      const minutesLeft = time === '' ? null : Number(time);
      const mistakes = values.get('mistakes').split('\n').map(line => line.trim()).filter(Boolean);
      if (values.get('score') === '' || !Number.isFinite(score) || score < 0 || score > 100
        || (minutesLeft !== null && (!Number.isInteger(minutesLeft) || minutesLeft < 0 || minutesLeft > 1440))) return;
      progress.mocks.set(id, { score, minutesLeft, mistakes, recordedOn: result?.recordedOn ?? currentDate,
        recordedAt: result?.recordedAt ?? Date.now() });
      return { id, message: 'Mock result saved.' };
    });
  }

  function options(id, date) {
    const block = progress.blocks.get(id);
    const form = show(block.title, `<div class="study-action-list">
      <button type="button" data-action="edit">Edit block</button>
      <button type="button" data-action="move">Move to…</button>
      ${block.mock ? `<button type="button" data-action="mock">${progress.mocks.has(id) ? 'Edit mock result' : 'Log mock result'}</button>` : ''}
    </div>`);
    form.querySelector('[data-action="edit"]').onclick = () => editBlock(id, date);
    form.querySelector('[data-action="move"]').onclick = () => moveBlock(id, date);
    const mockButton = form.querySelector('[data-action="mock"]');
    if (mockButton) mockButton.onclick = () => mockResult(id);
  }

  return { editBlock, mockResult, options };
}

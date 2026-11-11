import { studyWeeks } from './study-plan.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const customId = /^custom-[a-f0-9-]{36}$/;
const coursePattern = /^(?:[A-Z]{4}\d{4})?$/;
const defaultDays = {};
const seedBlocks = new Map();
const seedDates = new Map();

for (const day of studyWeeks.flatMap(week => week.days)) {
  defaultDays[day.date] = day.sessions.map((block, index) => {
    const id = day.date + '-' + index;
    seedBlocks.set(id, { ...block, mock: /^Timed mock [12]$/.test(block.title) });
    seedDates.set(id, day.date);
    return id;
  });
}

export function validStudyDate(date) {
  if (typeof date !== 'string' || !datePattern.test(date)) return false;
  const parsed = new Date(date);
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === date;
}

export const validDuration = minutes => Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440;

export function durationLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours ? hours + 'h' : '', remainder ? remainder + 'm' : ''].filter(Boolean).join(' ') || '0m';
}

export function shiftStudyDate(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function validBlock(block) {
  return block && typeof block.title === 'string' && block.title.trim() && typeof block.detail === 'string'
    && typeof block.course === 'string' && coursePattern.test(block.course)
    && validDuration(block.minutes) && validStudyDate(block.date)
    && Array.isArray(block.checklistWeeks) && block.checklistWeeks.every(Number.isInteger);
}

function validLayout(layout, originals, blocks) {
  if (!layout || typeof layout !== 'object' || Array.isArray(layout)) return false;
  const seen = new Set();
  for (const [date, ids] of Object.entries(layout)) {
    if (!validStudyDate(date) || !Array.isArray(ids)) return false;
    const fixed = (originals[date] ?? []).filter(id => blocks.get(id).kind !== 'study');
    const scheduledFixed = ids.filter(id => blocks.get(id)?.kind !== 'study');
    if (fixed.length !== scheduledFixed.length || fixed.some((id, index) => id !== scheduledFixed[index])) return false;
    for (const id of ids) {
      if (!blocks.has(id) || seen.has(id)) return false;
      seen.add(id);
    }
  }
  return seen.size === blocks.size;
}

function validMock(result) {
  return result && typeof result.score === 'number' && result.score >= 0 && result.score <= 100
    && (result.minutesLeft === null || Number.isInteger(result.minutesLeft) && result.minutesLeft >= 0)
    && Array.isArray(result.mistakes) && result.mistakes.every(item => typeof item === 'string')
    && validStudyDate(result.recordedOn);
}

export function readStudyProgress(saved, useSeed) {
  const originals = useSeed ? defaultDays : {};
  const blocks = useSeed ? new Map(seedBlocks) : new Map();
  const changes = new Map();
  if (saved?.version === 3) {
    for (const [id, block] of Object.entries(saved.changes ?? {})) {
      if ((!customId.test(id) && blocks.get(id)?.kind !== 'study') || !validBlock(block)) continue;
      const study = { ...block, kind: 'study', mock: block.mock === true };
      blocks.set(id, study);
      changes.set(id, study);
    }
  }

  let layout = saved?.version === 2 || saved?.version === 3 ? saved.days : originals;
  if (saved?.version === 1 && useSeed) {
    layout = Object.fromEntries(Object.entries(originals).map(([date, ids]) => [
      date, ids.map(id => blocks.get(id).kind === 'study' && blocks.get(saved.order?.[id])?.kind === 'study'
        ? saved.order[id] : id),
    ]));
  }
  const valid = validLayout(layout, originals, blocks);
  const days = Object.fromEntries(Object.entries(valid ? layout : originals)
    .map(([date, ids]) => [date, [...ids]]));
  for (const date of Object.keys(originals)) days[date] ??= [];
  if (!valid) {
    for (const [id, block] of changes) {
      if (!seedDates.has(id)) (days[block.date] ??= []).push(id);
    }
  }

  const completed = new Set(Array.isArray(saved?.completed) ? saved.completed.filter(id => blocks.has(id)) : []);
  const logged = new Map();
  const mocks = new Map();
  for (const [id, block] of blocks) {
    if (block.kind !== 'study') continue;
    const minutes = saved?.logged?.[id];
    if (Number.isInteger(minutes) && minutes > 0) logged.set(id, Math.min(minutes, block.minutes));
    const result = saved?.mocks?.[id];
    if (block.mock && validMock(result)) mocks.set(id, result);
  }
  return { days, blocks, changes, completed, logged, mocks };
}

export function saveStudyProgress(progress) {
  return {
    version: 3,
    days: progress.days,
    changes: Object.fromEntries(progress.changes),
    completed: [...progress.completed],
    logged: Object.fromEntries(progress.logged),
    mocks: Object.fromEntries(progress.mocks),
  };
}

export function creditedMinutes(id, progress) {
  return progress.completed.has(id) ? progress.blocks.get(id).minutes : progress.logged.get(id) ?? 0;
}

export function pendingStudyBlocks(progress) {
  const upcoming = [];
  for (const date of Object.keys(progress.days).sort()) {
    for (const id of progress.days[date]) {
      const block = progress.blocks.get(id);
      if (block.kind !== 'study') continue;
      const credit = creditedMinutes(id, progress);
      if (credit < block.minutes) upcoming.push({ id, block, date, credit, remaining: block.minutes - credit });
    }
  }
  return upcoming;
}

export function weeklyBlockProgress(progress) {
  const weeks = new Map();
  for (const [id, block] of progress.blocks) {
    if (!block.checklistWeeks?.length) continue;
    const done = creditedMinutes(id, progress) === block.minutes;
    for (const week of new Set(block.checklistWeeks)) {
      const key = block.course + '/' + week;
      const count = weeks.get(key) ?? { done: 0, total: 0 };
      count.total++;
      if (done) count.done++;
      weeks.set(key, count);
    }
  }
  return weeks;
}

function mondayOf(date) {
  return shiftStudyDate(date, -((new Date(date).getUTCDay() + 6) % 7));
}

export function calendarWeeks(progress, useSeed) {
  const weeks = new Map();
  if (useSeed) {
    for (const week of studyWeeks) {
      const key = mondayOf(week.days[0].date);
      weeks.set(key, { ...week, key, days: [...week.days] });
    }
  }
  for (const date of Object.keys(progress.days).sort()) {
    if (!progress.days[date].length) continue;
    const key = mondayOf(date);
    const day = { date, sessions: [], title: 'No study planned', free: '' };
    const week = weeks.get(key);
    if (!week) {
      const days = Array.from({ length: 7 }, (_, index) => ({ ...day, date: shiftStudyDate(key, index) }));
      weeks.set(key, { key, title: 'Study plan', summary: '', days });
    } else if (!week.days.some(item => item.date === date)) {
      week.days.push(day);
      week.days.sort((a, b) => a.date.localeCompare(b.date));
    }
  }
  return [...weeks.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function mockFocus(results) {
  const counts = new Map();
  for (const { result } of results) {
    const unique = new Set();
    for (const mistake of result.mistakes) {
      const key = mistake.trim().toLowerCase().replace(/\s+/g, ' ');
      if (!key || unique.has(key)) continue;
      unique.add(key);
      const item = counts.get(key) ?? { label: mistake, count: 0 };
      item.count++;
      counts.set(key, item);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count)[0];
}

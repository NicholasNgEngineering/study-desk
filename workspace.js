export const baseTerm = '2026-t3';
export const nextTerm = '2027-t1';
export const statuses = ['Not started', 'In progress', 'Done', 'N/A'];
export const courseCodePattern = /^[A-Z]{4}\d{4}$/;
const baseCourses = ['CVEN3101', 'CVEN3202', 'ENGG2500'];

export const isTermId = id => /^20\d{2}-t[1-3]$/.test(id);
export const termLabel = id => 'Term ' + id.at(-1) + ', ' + id.slice(0, 4);
export const blankTerm = () => ({ version: 1, courses: [] });
export const makeWorkspace = original => ({
  version: 2,
  terms: { [baseTerm]: original, [nextTerm]: blankTerm() },
});

const validDate = date => !date || typeof date === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date));

function validItem(item) {
  return typeof item?.id === 'string' && typeof item.title === 'string' &&
    statuses.includes(item.status) && validDate(item.date);
}

export function validTerm(data, id = baseTerm) {
  if (data?.version !== 1 || !Array.isArray(data.courses)) return false;
  const codes = new Set(data.courses.map(item => item?.code));
  if (codes.size !== data.courses.length) return false;
  if (id === baseTerm && (codes.size !== baseCourses.length || !baseCourses.every(code => codes.has(code)))) return false;
  return data.courses.every(item => item && typeof item.code === 'string' && courseCodePattern.test(item.code) && typeof item.name === 'string'
    && Array.isArray(item.weeks) && item.weeks.every(week => validItem(week) && Number.isInteger(week.week))
    && Array.isArray(item.tasks) && item.tasks.every(validItem)
    && Array.isArray(item.info) && Array.isArray(item.warnings)
    && Array.isArray(item.resources) && item.resources.every(resource =>
      typeof resource?.title === 'string' && typeof resource.url === 'string'));
}

export function validWorkspace(data) {
  return data?.version === 2 && data.terms && Object.hasOwn(data.terms, baseTerm)
    && Object.entries(data.terms).every(([id, term]) => isTermId(id) && validTerm(term, id));
}

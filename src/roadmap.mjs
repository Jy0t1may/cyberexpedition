const asState = state => Array.isArray(state) ? {ids: state, done: []} : {ids: state?.ids || [], done: state?.done || []};

export function toggle(state, id) {
  const s = asState(state);
  const ids = s.ids.includes(id) ? s.ids.filter(x => x !== id) : [...s.ids, id];
  return {ids, done: s.done.filter(x => ids.includes(x))};
}

export function move(state, id, step) {
  const s = asState(state);
  const ids = [...s.ids];
  const from = ids.indexOf(id);
  const to = from + step;
  if (from >= 0 && to >= 0 && to < ids.length) {
    [ids[from], ids[to]] = [ids[to], ids[from]];
  }
  return {ids, done: [...s.done]};
}

export function complete(state, id) {
  const s = asState(state);
  if (!s.ids.includes(id)) return s;
  return {
    ids: [...s.ids],
    done: s.done.includes(id) ? s.done.filter(x => x !== id) : [...s.done, id]
  };
}

export function clearRoute() {
  return {ids: [], done: []};
}

export function calcProgress(state, certsById = new Map()) {
  const s = asState(state);
  const total = s.ids.length;
  const completed = s.done.filter(id => s.ids.includes(id)).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  let estimatedHours = 0;
  let completedHours = 0;

  for (const id of s.ids) {
    const cert = certsById instanceof Map ? certsById.get(id) : certsById?.[id];
    const hours = Number(cert?.study_hours_est) || 0;
    estimatedHours += hours;
    if (s.done.includes(id)) {
      completedHours += hours;
    }
  }

  return {
    total,
    completed,
    remaining: total - completed,
    percentage,
    estimatedHours,
    completedHours
  };
}

export function decodeRoute(saved, legacy, validIds) {
  let parsed;
  try {
    parsed = JSON.parse(saved || legacy || '[]');
  } catch {
    parsed = [];
  }
  const s = asState(Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? parsed : []));
  const ids = [...new Set(s.ids.filter(id => validIds ? validIds.has(id) : true))];
  return {ids, done: [...new Set(s.done.filter(id => ids.includes(id)))]};
}

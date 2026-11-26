import test from 'node:test';
import assert from 'node:assert/strict';
import {toggle, move, complete, decodeRoute, clearRoute, calcProgress} from '../src/roadmap.mjs';

test('old saved roadmap migrates without losing course IDs', () => {
  assert.deepEqual(decodeRoute(null, '["cert-2"]', new Set(['cert-2'])), {ids: ['cert-2'], done: []});
});

test('completion toggles independently and remove clears completed state', () => {
  const one = {ids: ['cert-2', 'cert-3'], done: []};
  assert.deepEqual(complete(one, 'cert-2'), {ids: ['cert-2', 'cert-3'], done: ['cert-2']});
  assert.deepEqual(toggle(complete(one, 'cert-2'), 'cert-2'), {ids: ['cert-3'], done: []});
});

test('reorder preserves completion state', () => {
  assert.deepEqual(move({ids: ['cert-2', 'cert-3'], done: ['cert-2']}, 'cert-2', 1), {ids: ['cert-3', 'cert-2'], done: ['cert-2']});
});

test('clearRoute returns empty roadmap state', () => {
  assert.deepEqual(clearRoute(), {ids: [], done: []});
});

test('calcProgress correctly calculates total, completed, percentage and study hours', () => {
  const certsMap = new Map([
    ['cert-1', {id: 'cert-1', study_hours_est: 40}],
    ['cert-2', {id: 'cert-2', study_hours_est: 60}],
    ['cert-3', {id: 'cert-3', study_hours_est: 100}]
  ]);

  const state = {ids: ['cert-1', 'cert-2', 'cert-3'], done: ['cert-1']};
  const progress = calcProgress(state, certsMap);

  assert.equal(progress.total, 3);
  assert.equal(progress.completed, 1);
  assert.equal(progress.remaining, 2);
  assert.equal(progress.percentage, 33);
  assert.equal(progress.estimatedHours, 200);
  assert.equal(progress.completedHours, 40);

  // Empty state handling
  const emptyProgress = calcProgress({ids: [], done: []}, certsMap);
  assert.equal(emptyProgress.total, 0);
  assert.equal(emptyProgress.percentage, 0);
  assert.equal(emptyProgress.estimatedHours, 0);
});

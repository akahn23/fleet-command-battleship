import type { Rng } from '../rng';
import type { Coord } from '../types';
import type { TargetingView } from './targetingView';

export type TargetingStrategy = (view: TargetingView, rng: Rng) => Coord;

/** Milestone 1 opponent: a uniformly random square it has not fired on yet. */
export const randomAI: TargetingStrategy = (view, rng) => {
  const open: Coord[] = [];
  view.cells.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === 'unknown') open.push({ row: r, col: c });
    }),
  );
  return rng.pick(open);
};

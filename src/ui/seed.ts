import { randomSeed } from '../engine';

/**
 * `?seed=N` replays a fixed game for automated tests and bug reproduction.
 * It is ignored in production builds so players can't replay a known enemy layout.
 */
export function initialSeed(search = window.location.search): number {
  if (import.meta.env.MODE !== 'production') {
    const raw = new URLSearchParams(search).get('seed');
    if (raw !== null && /^\d+$/.test(raw)) return Number(raw) >>> 0;
  }
  return randomSeed();
}

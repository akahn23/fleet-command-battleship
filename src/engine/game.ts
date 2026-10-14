import {
  emptyBoard,
  isFleetComplete,
  isFleetDestroyed,
  placeShip,
  receiveShot,
  removeShip,
} from './board';
import { buildTargetingView } from './ai/targetingView';
import { huntTargetAI } from './ai/huntTargetAI';
import type { TargetingStrategy } from './ai/randomAI';
import { randomFleet } from './placement';
import { Rng } from './rng';
import type { Coord, GameState, LogEvent, ShipId, ShipPlacement, Side } from './types';

export type GameAction =
  | { type: 'PLACE_SHIP'; placement: ShipPlacement }
  | { type: 'REMOVE_SHIP'; shipId: ShipId }
  | { type: 'AUTO_PLACE' }
  | { type: 'CLEAR_FLEET' }
  | { type: 'START_BATTLE' }
  | { type: 'PLAYER_FIRE'; coord: Coord }
  | { type: 'COMPUTER_FIRE'; gameId: number }
  | { type: 'NEW_GAME'; seed?: number };

export interface GameOptions {
  seed: number;
  gameId?: number;
}

export function createGame({ seed, gameId = 1 }: GameOptions): GameState {
  const rng = new Rng(seed);
  return {
    gameId,
    phase: 'placement',
    turn: 'player',
    boards: { player: emptyBoard(), computer: { ships: randomFleet(rng), shots: [] } },
    winner: null,
    log: [],
    rngState: rng.state,
  };
}

const opponent = (side: Side): Side => (side === 'player' ? 'computer' : 'player');

function appendLog(state: GameState, ...events: LogEvent[]): GameState['log'] {
  let nextId = (state.log[state.log.length - 1]?.id ?? 0) + 1;
  return [...state.log, ...events.map((event) => ({ ...event, id: nextId++ }))];
}

/** Resolves `attacker`'s shot at `coord`. Returns the same state if the shot is illegal. */
function fire(
  state: GameState,
  attacker: Side,
  coord: Coord,
  rngState = state.rngState,
): GameState {
  if (state.phase !== 'battle' || state.turn !== attacker) return state;
  const defender = opponent(attacker);
  const outcome = receiveShot(state.boards[defender], coord);
  if (!outcome) return state;

  const shotEvent: LogEvent = {
    kind: 'shot',
    attacker,
    coord: outcome.shot.coord,
    result: outcome.shot.result,
    ...(outcome.sunk ? { sunk: outcome.sunk } : {}),
  };
  const boards = { ...state.boards, [defender]: outcome.board };
  const won = isFleetDestroyed(outcome.board);

  return {
    ...state,
    boards,
    rngState,
    phase: won ? 'gameOver' : 'battle',
    turn: won ? state.turn : defender,
    winner: won ? attacker : null,
    log: won
      ? appendLog(state, shotEvent, { kind: 'gameOver', winner: attacker })
      : appendLog(state, shotEvent),
  };
}

export function createReducer(strategy: TargetingStrategy = huntTargetAI) {
  return function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'PLACE_SHIP': {
        if (state.phase !== 'placement') return state;
        const board = placeShip(state.boards.player, action.placement);
        return board ? { ...state, boards: { ...state.boards, player: board } } : state;
      }
      case 'REMOVE_SHIP': {
        if (state.phase !== 'placement') return state;
        const board = removeShip(state.boards.player, action.shipId);
        return board ? { ...state, boards: { ...state.boards, player: board } } : state;
      }
      case 'AUTO_PLACE': {
        if (state.phase !== 'placement') return state;
        const rng = new Rng(state.rngState);
        const ships = randomFleet(rng);
        return {
          ...state,
          rngState: rng.state,
          boards: { ...state.boards, player: { ships, shots: [] } },
        };
      }
      case 'CLEAR_FLEET': {
        if (state.phase !== 'placement' || state.boards.player.ships.length === 0) return state;
        return { ...state, boards: { ...state.boards, player: emptyBoard() } };
      }
      case 'START_BATTLE': {
        if (state.phase !== 'placement' || !isFleetComplete(state.boards.player)) return state;
        return {
          ...state,
          phase: 'battle',
          turn: 'player',
          log: appendLog(state, { kind: 'battleStart' }),
        };
      }
      case 'PLAYER_FIRE':
        return fire(state, 'player', action.coord);
      case 'COMPUTER_FIRE': {
        if (action.gameId !== state.gameId) return state;
        if (state.phase !== 'battle' || state.turn !== 'computer') return state;
        const rng = new Rng(state.rngState);
        const target = strategy(buildTargetingView(state.boards.player), rng);
        return fire(state, 'computer', target, rng.state);
      }
      case 'NEW_GAME': {
        const seed = action.seed ?? new Rng(state.rngState).int(2 ** 32);
        return createGame({ seed, gameId: state.gameId + 1 });
      }
      default:
        return state;
    }
  };
}

export const gameReducer = createReducer();

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { BattleLog } from './components/BattleLog/BattleLog';
import { Backdrop } from './components/Backdrop/Backdrop';
import { Board, type BoardPreview, type CellState } from './components/Board/Board';
import { GameOverDialog } from './components/Dialog/GameOverDialog';
import { FleetStatus } from './components/FleetStatus/FleetStatus';
import { Header, NEW_BATTLE_BUTTON_ID } from './components/Header/Header';
import { PlacementDock } from './components/PlacementDock/PlacementDock';
import { TurnBanner } from './components/TurnBanner/TurnBanner';
import {
  FLEET,
  canPlaceShip,
  createGame,
  formatCoord,
  gameReducer,
  getShip,
  isInBounds,
  isShipSunk,
  shipAt,
  shipCells,
  sunkShips,
  type Board as BoardModel,
  type Coord,
  type Orientation,
  type ShipId,
  type ShipPlacement,
} from './engine';
import { COMPUTER_TURN_DELAY_MS, useComputerTurn } from './hooks/useComputerTurn';
import { PLACEMENT_ERRORS } from './ui/messages';
import { initialSeed } from './ui/seed';
import './App.css';

export interface AppProps {
  seed?: number;
  computerDelayMs?: number;
}

const firstUnplaced = (board: BoardModel, exclude?: ShipId): ShipId | null =>
  FLEET.find((s) => s.id !== exclude && !board.ships.some((p) => p.shipId === s.id))?.id ?? null;

const SHOT_WORDS: Record<CellState, string> = {
  open: 'unexplored',
  miss: 'miss',
  hit: 'hit',
  sunk: 'sunk',
};

export default function App({ seed, computerDelayMs = COMPUTER_TURN_DELAY_MS }: AppProps) {
  const [state, dispatch] = useReducer(gameReducer, seed, (s) =>
    createGame({ seed: s ?? initialSeed() }),
  );
  useComputerTurn(state, dispatch, computerDelayMs);

  const [selected, setSelected] = useState<ShipId | null>(FLEET[0]!.id);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hover, setHover] = useState<Coord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dismissedGameId, setDismissedGameId] = useState<number | null>(null);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const { phase, boards } = state;
  const playerBoard = boards.player;
  const enemyBoard = boards.computer;

  const rotate = useCallback(
    () => setOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal')),
    [],
  );

  useEffect(() => {
    if (phase !== 'placement') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        rotate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, rotate]);

  const dialogOpen = phase === 'gameOver' && dismissedGameId !== state.gameId;
  const dialogWasOpen = useRef(false);

  // While the result dialog is open, the page behind it is inert so focus can't reach it.
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    main.toggleAttribute('inert', dialogOpen);
    if (dialogWasOpen.current && !dialogOpen)
      document.getElementById(NEW_BATTLE_BUTTON_ID)?.focus();
    dialogWasOpen.current = dialogOpen;
  }, [dialogOpen]);

  const newGame = () => {
    setConfirmingRestart(false);
    dispatch({ type: 'NEW_GAME' });
    setSelected(FLEET[0]!.id);
    setOrientation('horizontal');
    setHover(null);
    setNotice(null);
    setDismissedGameId(null);
  };

  const liftShip = (ship: ShipPlacement) => {
    dispatch({ type: 'REMOVE_SHIP', shipId: ship.shipId });
    setSelected(ship.shipId);
    setOrientation(ship.orientation);
    setNotice(`The ${getShip(ship.shipId).name} is hauled back to harbour.`);
  };

  const selectShip = (shipId: ShipId) => {
    const moored = playerBoard.ships.find((ship) => ship.shipId === shipId);
    if (moored) liftShip(moored);
    else {
      setSelected(shipId);
      setNotice(null);
    }
  };

  const onPlayerCell = (coord: Coord) => {
    if (phase !== 'placement') return;
    const moored = shipAt(playerBoard, coord);
    if (moored) return liftShip(moored);
    if (!selected) return setNotice('Choose a vessel from the harbour first.');
    const placement: ShipPlacement = { shipId: selected, origin: coord, orientation };
    const check = canPlaceShip(playerBoard, placement);
    const name = getShip(selected).name;
    if (!check.ok) {
      return setNotice(
        check.reason === 'overlap' && check.conflictsWith
          ? PLACEMENT_ERRORS.overlap(name, getShip(check.conflictsWith).name)
          : check.reason === 'alreadyPlaced'
            ? PLACEMENT_ERRORS.alreadyPlaced(name)
            : PLACEMENT_ERRORS.outOfBounds(name),
      );
    }
    dispatch({ type: 'PLACE_SHIP', placement });
    setSelected(firstUnplaced(playerBoard, selected));
    setNotice(`The ${name} is moored at ${formatCoord(coord)}.`);
  };

  let preview: BoardPreview | null = null;
  if (phase === 'placement' && selected && hover && !shipAt(playerBoard, hover)) {
    const placement: ShipPlacement = { shipId: selected, origin: hover, orientation };
    preview = {
      cells: shipCells(placement).filter(isInBounds),
      valid: canPlaceShip(playerBoard, placement).ok,
    };
  }

  const describePlayerCell = (coord: Coord, cell: CellState) => {
    const ship = shipAt(playerBoard, coord);
    const what = ship ? getShip(ship.shipId).name : 'open water';
    const shot =
      phase === 'placement' ? '' : `, ${cell === 'open' ? 'untouched' : SHOT_WORDS[cell]}`;
    return `Your waters ${formatCoord(coord)}: ${what}${shot}`;
  };

  const describeEnemyCell = (coord: Coord, cell: CellState) => {
    const sunk = cell === 'sunk' ? shipAt(enemyBoard, coord) : undefined;
    return `Enemy waters ${formatCoord(coord)}: ${SHOT_WORDS[cell]}${sunk ? ` ${getShip(sunk.shipId).name}` : ''}`;
  };

  const playerBoardView = (
    <section className="board-section" aria-labelledby="player-waters">
      <h2 id="player-waters">Your Waters</h2>
      <Board
        title="Your waters"
        testId="player-board"
        board={playerBoard}
        ships={playerBoard.ships}
        preview={preview}
        active={phase === 'placement'}
        describeCell={describePlayerCell}
        onCellActivate={onPlayerCell}
        onCellHover={phase === 'placement' ? setHover : undefined}
      />
    </section>
  );

  const enemyBoardView = (
    <section className="board-section" aria-labelledby="enemy-waters">
      <h2 id="enemy-waters">Enemy Waters</h2>
      <Board
        title="Enemy waters"
        testId="enemy-board"
        board={enemyBoard}
        ships={sunkShips(enemyBoard)}
        revealSunk
        ghostShips={
          phase === 'gameOver'
            ? enemyBoard.ships.filter((ship) => !isShipSunk(enemyBoard, ship.shipId))
            : []
        }
        active={phase === 'battle' && state.turn === 'player'}
        describeCell={describeEnemyCell}
        isCellUnavailable={(cell) => cell !== 'open'}
        onCellActivate={(coord) => dispatch({ type: 'PLAYER_FIRE', coord })}
      />
    </section>
  );

  return (
    <>
      <Backdrop />
      <main className={`app${phase !== 'placement' ? ' app--battle' : ''}`} ref={mainRef}>
        <Header
          confirming={confirmingRestart && phase === 'battle'}
          onNewGame={() => (phase === 'battle' ? setConfirmingRestart(true) : newGame())}
          onConfirm={newGame}
          onCancel={() => setConfirmingRestart(false)}
        />
        <TurnBanner state={state} />

        {phase === 'placement' ? (
          <div className="placement-layout">
            {playerBoardView}
            <PlacementDock
              board={playerBoard}
              selected={selected}
              orientation={orientation}
              notice={notice}
              onSelect={selectShip}
              onRotate={rotate}
              onAutoPlace={() => {
                dispatch({ type: 'AUTO_PLACE' });
                setSelected(null);
                setNotice('The fleet is moored. Adjust any ship, or start the battle.');
              }}
              onClear={() => {
                dispatch({ type: 'CLEAR_FLEET' });
                setSelected(FLEET[0]!.id);
                setNotice('All ships hauled back to harbour.');
              }}
              onStart={() => {
                dispatch({ type: 'START_BATTLE' });
                setHover(null);
                setNotice(null);
              }}
            />
          </div>
        ) : (
          <div className="battle-stage">
            <div className="battle-layout">
              {enemyBoardView}
              {playerBoardView}
            </div>
            <div className="battle-panels">
              <FleetStatus title="Enemy Fleet" board={enemyBoard} showDamage={false} />
              <FleetStatus title="Your Fleet" board={playerBoard} showDamage />
              <BattleLog log={state.log} />
            </div>
          </div>
        )}
      </main>

      {dialogOpen && (
        <GameOverDialog
          state={state}
          onNewGame={newGame}
          onDismiss={() => setDismissedGameId(state.gameId)}
        />
      )}
    </>
  );
}

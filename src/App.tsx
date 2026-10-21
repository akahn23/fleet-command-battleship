import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { BattleLog } from './components/BattleLog/BattleLog';
import { Backdrop } from './components/Backdrop/Backdrop';
import { Board, type BoardPreview, type CellState, type ShipDrag } from './components/Board/Board';
import { GameOverDialog } from './components/Dialog/GameOverDialog';
import { IntroDialog } from './components/Dialog/IntroDialog';
import { FleetStatus } from './components/FleetStatus/FleetStatus';
import { Header, HOW_TO_PLAY_BUTTON_ID, NEW_BATTLE_BUTTON_ID } from './components/Header/Header';
import { PlacementDock } from './components/PlacementDock/PlacementDock';
import { TurnBanner } from './components/TurnBanner/TurnBanner';
import { createSoundscape, isSoundAvailable, type Soundscape } from './audio/soundscape';
import {
  FLEET,
  canPlaceShip,
  createGame,
  formatCoord,
  gameReducer,
  getShip,
  isInBounds,
  isShipSunk,
  removeShip,
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
import { useBattleSounds } from './hooks/useBattleSounds';
import { PLACEMENT_ERRORS } from './ui/messages';
import { initialSeed } from './ui/seed';
import './App.css';

export interface AppProps {
  seed?: number;
  computerDelayMs?: number;
  showIntro?: boolean;
}

const introSeen = () => {
  try {
    return window.localStorage.getItem('ravenfjord.introSeen') === '1';
  } catch {
    return false;
  }
};

const markIntroSeen = () => {
  try {
    window.localStorage.setItem('ravenfjord.introSeen', '1');
  } catch {
    return;
  }
};

const soundPreference = () => {
  try {
    return window.localStorage.getItem('ravenfjord.sound') === '1';
  } catch {
    return false;
  }
};

const storeSoundPreference = (enabled: boolean) => {
  try {
    window.localStorage.setItem('ravenfjord.sound', enabled ? '1' : '0');
  } catch {
    return;
  }
};

const firstUnplaced = (board: BoardModel, exclude?: ShipId): ShipId | null =>
  FLEET.find((s) => s.id !== exclude && !board.ships.some((p) => p.shipId === s.id))?.id ?? null;

const placementError = (name: string, check: ReturnType<typeof canPlaceShip>): string | null => {
  if (check.ok) return null;
  if (check.reason === 'overlap' && check.conflictsWith) {
    return PLACEMENT_ERRORS.overlap(name, getShip(check.conflictsWith).name);
  }
  if (check.reason === 'alreadyPlaced') return PLACEMENT_ERRORS.alreadyPlaced(name);
  return PLACEMENT_ERRORS.outOfBounds(name);
};

const SHOT_WORDS: Record<CellState, string> = {
  open: 'unexplored',
  miss: 'miss',
  hit: 'hit',
  sunk: 'sunk',
};

export default function App({
  seed,
  computerDelayMs = COMPUTER_TURN_DELAY_MS,
  showIntro,
}: AppProps) {
  const [state, dispatch] = useReducer(gameReducer, seed, (s) =>
    createGame({ seed: s ?? initialSeed() }),
  );

  const [selected, setSelected] = useState<ShipId | null>(FLEET[0]!.id);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hover, setHover] = useState<Coord | null>(null);
  const [drag, setDrag] = useState<ShipDrag | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dismissedGameId, setDismissedGameId] = useState<number | null>(null);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const [introOpen, setIntroOpen] = useState(() => showIntro ?? !introSeen());
  const [soundAvailable] = useState(isSoundAvailable);
  const [soundEnabled, setSoundEnabled] = useState(() => soundAvailable && soundPreference());
  const mainRef = useRef<HTMLElement>(null);
  const soundscapeRef = useRef<Soundscape | null>(null);

  useComputerTurn(state, dispatch, computerDelayMs);
  useBattleSounds(state, soundAvailable && soundEnabled ? soundscapeRef.current : null);

  useEffect(() => () => soundscapeRef.current?.dispose(), []);

  const ensureSoundscape = () => {
    if (!soundAvailable || !soundEnabled || soundscapeRef.current) return;
    soundscapeRef.current = createSoundscape();
    soundscapeRef.current.setEnabled(true);
  };

  const toggleSound = () => {
    if (!soundAvailable) return;
    const next = !soundEnabled;
    storeSoundPreference(next);
    setSoundEnabled(next);
    if (next) {
      soundscapeRef.current ??= createSoundscape();
      soundscapeRef.current.setEnabled(true);
    } else {
      soundscapeRef.current?.setEnabled(false);
    }
  };
  const introWasOpen = useRef(false);
  const introReturnFocus = useRef(false);

  const { phase, boards } = state;
  const playerBoard = boards.player;
  const enemyBoard = boards.computer;

  const rotate = useCallback(
    () => setOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal')),
    [],
  );

  useEffect(() => {
    if (showIntro !== undefined) setIntroOpen(showIntro);
  }, [showIntro]);

  const closeIntro = useCallback(() => {
    markIntroSeen();
    setIntroOpen(false);
  }, []);

  const openIntro = () => {
    introReturnFocus.current = true;
    setIntroOpen(true);
  };

  const dialogOpen = phase === 'gameOver' && dismissedGameId !== state.gameId;
  const pageInert = dialogOpen || introOpen;

  useEffect(() => {
    if (phase !== 'placement' || pageInert) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        rotate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pageInert, phase, rotate]);

  const dialogWasOpen = useRef(false);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    main.toggleAttribute('inert', pageInert);
    if (dialogWasOpen.current && !dialogOpen)
      document.getElementById(NEW_BATTLE_BUTTON_ID)?.focus();
    dialogWasOpen.current = dialogOpen;
  }, [dialogOpen, pageInert]);

  useEffect(() => {
    if (introWasOpen.current && !introOpen && introReturnFocus.current) {
      document.getElementById(HOW_TO_PLAY_BUTTON_ID)?.focus();
      introReturnFocus.current = false;
    }
    introWasOpen.current = introOpen;
  }, [introOpen]);

  const newGame = () => {
    setConfirmingRestart(false);
    dispatch({ type: 'NEW_GAME' });
    setSelected(FLEET[0]!.id);
    setOrientation('horizontal');
    setHover(null);
    setDrag(null);
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
      return setNotice(placementError(name, check));
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

  const draggedShip = drag
    ? playerBoard.ships.find((ship) => ship.shipId === drag.shipId)
    : undefined;
  const dragPlacement =
    drag?.hovered && draggedShip
      ? {
          shipId: drag.shipId,
          origin:
            draggedShip.orientation === 'horizontal'
              ? { row: drag.hovered.row, col: drag.hovered.col - drag.offset }
              : { row: drag.hovered.row - drag.offset, col: drag.hovered.col },
          orientation: draggedShip.orientation,
        }
      : null;
  const activePreview = drag
    ? {
        cells: dragPlacement ? shipCells(dragPlacement).filter(isInBounds) : [],
        valid: Boolean(
          dragPlacement &&
          draggedShip &&
          canPlaceShip(removeShip(playerBoard, drag.shipId) ?? playerBoard, dragPlacement).ok,
        ),
      }
    : preview;

  const moveShip = (dragged: ShipDrag) => {
    const ship = playerBoard.ships.find((placement) => placement.shipId === dragged.shipId);
    const name = getShip(dragged.shipId).name;
    if (!ship || !dragged.hovered) {
      setNotice(PLACEMENT_ERRORS.outOfBounds(name));
      return;
    }
    const placement: ShipPlacement = {
      shipId: dragged.shipId,
      origin:
        ship.orientation === 'horizontal'
          ? { row: dragged.hovered.row, col: dragged.hovered.col - dragged.offset }
          : { row: dragged.hovered.row - dragged.offset, col: dragged.hovered.col },
      orientation: ship.orientation,
    };
    const boardWithoutShip = removeShip(playerBoard, dragged.shipId);
    if (!boardWithoutShip) {
      setNotice(PLACEMENT_ERRORS.alreadyPlaced(name));
      return;
    }
    const check = canPlaceShip(boardWithoutShip, placement);
    if (!check.ok) {
      setNotice(placementError(name, check));
      return;
    }
    dispatch({ type: 'MOVE_SHIP', shipId: dragged.shipId, placement });
    setNotice(`The ${name} is moved to ${formatCoord(placement.origin)}.`);
  };

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
        preview={activePreview}
        draggingShipId={drag?.shipId}
        onShipDrag={setDrag}
        onShipDrop={moveShip}
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
    <div className="app-shell" onClickCapture={ensureSoundscape}>
      <Backdrop />
      <main className={`app${phase !== 'placement' ? ' app--battle' : ''}`} ref={mainRef}>
        <Header
          confirming={confirmingRestart && phase === 'battle'}
          soundAvailable={soundAvailable}
          soundEnabled={soundEnabled}
          onHowToPlay={openIntro}
          onToggleSound={toggleSound}
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
                setDrag(null);
                setNotice('The fleet is moored. Adjust any ship, or start the battle.');
              }}
              onClear={() => {
                dispatch({ type: 'CLEAR_FLEET' });
                setSelected(FLEET[0]!.id);
                setDrag(null);
                setNotice('All ships hauled back to harbour.');
              }}
              onStart={() => {
                dispatch({ type: 'START_BATTLE' });
                setHover(null);
                setDrag(null);
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

      {introOpen && <IntroDialog onClose={closeIntro} />}
      {dialogOpen && (
        <GameOverDialog
          state={state}
          onNewGame={newGame}
          onDismiss={() => setDismissedGameId(state.gameId)}
        />
      )}
    </div>
  );
}

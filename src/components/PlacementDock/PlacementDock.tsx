import { FLEET, isFleetComplete, type Board, type Orientation, type ShipId } from '../../engine';
import './PlacementDock.css';

interface PlacementDockProps {
  board: Board;
  selected: ShipId | null;
  orientation: Orientation;
  notice: string | null;
  onSelect: (shipId: ShipId) => void;
  onRotate: () => void;
  onAutoPlace: () => void;
  onClear: () => void;
  onStart: () => void;
}

export function PlacementDock({
  board,
  selected,
  orientation,
  notice,
  onSelect,
  onRotate,
  onAutoPlace,
  onClear,
  onStart,
}: PlacementDockProps) {
  const moored = new Set(board.ships.map((ship) => ship.shipId));
  const ready = isFleetComplete(board);

  return (
    <aside className="dock panel" aria-labelledby="dock-heading">
      <h2 id="dock-heading">Muster Your Fleet</h2>
      <p className="dock__help">
        Choose a vessel, then click your waters to moor it. Press <kbd>R</kbd> or{' '}
        <em>Rotate Ship</em> to turn its prow. Click a moored ship to haul it back to harbour.
      </p>

      <ul className="dock__ships" aria-label="Your fleet">
        {FLEET.map((ship) => {
          const isMoored = moored.has(ship.id);
          return (
            <li key={ship.id}>
              <button
                type="button"
                className="dock__ship"
                aria-pressed={selected === ship.id}
                onClick={() => onSelect(ship.id)}
              >
                <span className="dock__ship-name">{ship.name}</span>
                <span className="pips" aria-label={`${ship.length} squares`}>
                  {Array.from({ length: ship.length }, (_, i) => (
                    <span key={i} className="pip" />
                  ))}
                </span>
                <span className={`dock__ship-status${isMoored ? ' is-moored' : ''}`}>
                  {isMoored ? 'Moored' : 'In harbour'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="dock__actions">
        <button type="button" className="btn" onClick={onRotate}>
          Rotate Ship <span className="btn__hint">({orientation})</span>
        </button>
        <button type="button" className="btn" onClick={onAutoPlace}>
          Auto-Place Fleet
        </button>
        <button type="button" className="btn" onClick={onClear} disabled={moored.size === 0}>
          Clear Fleet
        </button>
      </div>

      <p className="dock__notice" role="status" aria-live="polite">
        {notice ?? ''}
      </p>

      <button
        type="button"
        className="btn btn--primary btn--large"
        onClick={onStart}
        disabled={!ready}
      >
        Start Battle
      </button>
      {!ready && (
        <p className="dock__hint">
          {moored.size} of {FLEET.length} ships moored. All must be in position before battle.
        </p>
      )}
    </aside>
  );
}

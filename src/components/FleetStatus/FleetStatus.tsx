import { FLEET, isShipSunk, type Board } from '../../engine';
import './FleetStatus.css';

interface FleetStatusProps {
  title: string;
  board: Board;
  /** The enemy fleet only reveals afloat/sunk; per-ship damage would leak which ship was hit. */
  showDamage: boolean;
}

export function FleetStatus({ title, board, showDamage }: FleetStatusProps) {
  const afloat = FLEET.filter((ship) => !isShipSunk(board, ship.id)).length;
  const hitsOn = (id: string) => board.shots.filter((shot) => shot.shipId === id).length;

  return (
    <section className="fleet-status panel" aria-label={title}>
      <h3>
        {title}{' '}
        <span className="fleet-status__count">
          {afloat} of {FLEET.length} afloat
        </span>
      </h3>
      <ul>
        {FLEET.map((ship) => {
          const sunk = isShipSunk(board, ship.id);
          const hits = showDamage ? hitsOn(ship.id) : sunk ? ship.length : 0;
          return (
            <li key={ship.id} className={sunk ? 'is-sunk' : undefined} data-ship={ship.id}>
              <span className="fleet-status__name">{ship.name}</span>
              <span className="pips" aria-hidden="true">
                {Array.from({ length: ship.length }, (_, i) => (
                  <span key={i} className={`pip${i < hits ? ' pip--hit' : ''}`} />
                ))}
              </span>
              <span className="fleet-status__state">
                {sunk
                  ? 'Sunk'
                  : showDamage && hits > 0
                    ? `Damaged ${hits}/${ship.length}`
                    : 'Afloat'}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

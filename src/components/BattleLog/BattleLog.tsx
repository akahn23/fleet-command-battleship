import type { LogEntry } from '../../engine';
import { describeEvent, eventTone } from '../../ui/messages';
import './BattleLog.css';

export function BattleLog({ log }: { log: LogEntry[] }) {
  const newestFirst = [...log].reverse();
  return (
    <section className="battle-log panel" aria-labelledby="log-heading">
      <h3 id="log-heading">Saga of the Battle</h3>
      {newestFirst.length === 0 ? (
        <p className="battle-log__empty">The saga is yet unwritten.</p>
      ) : (
        <ol aria-label="Battle log">
          {newestFirst.map((entry) => (
            <li key={entry.id} className={`tone-${eventTone(entry)}`}>
              {describeEvent(entry)}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

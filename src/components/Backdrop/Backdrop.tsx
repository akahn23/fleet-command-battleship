import './Backdrop.css';

/** Fjord artwork and drifting mist behind the game; purely decorative. */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__mist backdrop__mist--a" />
      <div className="backdrop__mist backdrop__mist--b" />
    </div>
  );
}

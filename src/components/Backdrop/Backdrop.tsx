import './Backdrop.css';

/** Fjord silhouettes and drifting mist behind the game; purely decorative. */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg className="backdrop__fjord" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path
          d="M0 320 V140 L90 80 L170 130 L260 40 L360 120 L430 90 L520 160 L600 150 L640 200 L800 200 L860 150 L940 170 L1030 70 L1120 130 L1200 60 L1300 120 L1380 90 L1440 120 V320 Z"
          fill="#0c1820"
        />
        <path
          d="M0 320 V210 L120 170 L220 200 L330 150 L450 210 L560 230 L880 230 L980 190 L1100 210 L1220 160 L1340 200 L1440 180 V320 Z"
          fill="#0a141b"
        />
      </svg>
      <div className="backdrop__mist backdrop__mist--a" />
      <div className="backdrop__mist backdrop__mist--b" />
    </div>
  );
}

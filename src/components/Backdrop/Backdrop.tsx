import './Backdrop.css';

/** Fjord silhouettes and drifting mist behind the game; purely decorative. */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg className="backdrop__fjord" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path
          className="backdrop__ridge backdrop__ridge--far"
          d="M0 320 V172 L92 107 L163 151 L270 34 L362 146 L434 92 L531 174 L617 124 L707 181 L825 85 L904 150 L1014 38 L1117 137 L1190 81 L1284 160 L1370 101 L1440 142 V320 Z"
        />
        <path
          className="backdrop__ridge backdrop__ridge--middle"
          d="M0 320 V218 L110 174 L206 215 L327 142 L445 208 L540 188 L650 244 L780 218 L886 240 L1001 175 L1101 223 L1222 158 L1344 216 L1440 190 V320 Z"
        />
        <path
          className="backdrop__ridge backdrop__ridge--near"
          d="M0 320 V254 L115 232 L223 258 L355 215 L480 270 L625 237 L754 276 L890 226 L1012 255 L1150 217 L1296 258 L1440 226 V320 Z"
        />
      </svg>
      <div className="backdrop__mist backdrop__mist--a" />
      <div className="backdrop__mist backdrop__mist--b" />
      <div className="backdrop__mist backdrop__mist--c" />
    </div>
  );
}

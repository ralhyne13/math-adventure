import TopBar from "./TopBar";

export default function MobileGameShell({
  floaters,
  topBarProps,
  activeRoute,
  onGoHome,
  onGoPlay,
  onGoRush,
  onGoArena,
  children,
}) {
  const arcadeSymbols = ["+", "-", "x", "/", "=", "\u03A3", "\u221A", "\u03C0", "%", "4", "5", "6"];

  return (
    <div className={`shell mobileShellFrame mobileShellFrame-${activeRoute}`}>
      <div className="mathBg" aria-hidden="true">
        {(floaters ?? []).map((t, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 19) % 100}%`,
              fontSize: `${14 + (i % 8) * 6}px`,
              animationDuration: `${10 + (i % 10) * 2.2}s`,
              animationDelay: `${-(i % 10) * 1.1}s`,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mobileMathWindowFx mobileMathWindowFxGame" aria-hidden="true">
        {arcadeSymbols.map((symbol, idx) => (
          <span key={`${symbol}-${idx}`} style={{ "--i": idx }}>
            {symbol}
          </span>
        ))}
      </div>

      <TopBar {...topBarProps} compact />

      {children}

    </div>
  );
}

import TopBar from "./TopBar";

export default function MobileGameShell({
  floaters,
  topBarProps,
  activeRoute,
  onGoHome,
  onGoPlay,
  onGoRush,
  onGoArena,
  onOpenShop,
  onOpenProfile,
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

      <div className="mobileDock" aria-label="Navigation mobile">
        <button className={`mobileDockBtn route-home ${activeRoute === "home" ? "isActive" : ""}`} onClick={onGoHome}>
          <span className="mobileDockIcon" aria-hidden="true">
            {"\uD83C\uDFE0"}
          </span>
          <span>Accueil</span>
        </button>
        <button className={`mobileDockBtn route-play ${activeRoute === "classic-play" ? "isActive" : ""}`} onClick={onGoPlay}>
          <span className="mobileDockIcon" aria-hidden="true">
            {"\uD83C\uDFAF"}
          </span>
          <span>Jouer</span>
        </button>
        <button className={`mobileDockBtn route-rush ${activeRoute === "rush" ? "isActive" : ""}`} onClick={onGoRush}>
          <span className="mobileDockIcon" aria-hidden="true">
            {"\u26A1"}
          </span>
          <span>Rush</span>
        </button>
        <button className={`mobileDockBtn route-arena ${activeRoute === "arena" ? "isActive" : ""}`} onClick={onGoArena}>
          <span className="mobileDockIcon" aria-hidden="true">
            {"\u2694\uFE0F"}
          </span>
          <span>Arena</span>
        </button>
        <button className={`mobileDockBtn route-shop ${activeRoute === "shop" ? "isActive" : ""}`} onClick={onOpenShop}>
          <span className="mobileDockIcon" aria-hidden="true">
            {"\uD83D\uDED2"}
          </span>
          <span>Boutique</span>
        </button>
        <button className={`mobileDockBtn route-profile ${activeRoute === "profile" ? "isActive" : ""}`} onClick={onOpenProfile}>
          <span className="mobileDockIcon" aria-hidden="true">
            {"\uD83D\uDC64"}
          </span>
          <span>Profil</span>
        </button>
      </div>
    </div>
  );
}

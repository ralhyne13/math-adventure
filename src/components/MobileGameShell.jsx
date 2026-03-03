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
  return (
    <div className="shell">
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

      <TopBar {...topBarProps} compact />

      {children}

      <div className="mobileDock" aria-label="Navigation mobile">
        <button className={`mobileDockBtn ${activeRoute === "home" ? "isActive" : ""}`} onClick={onGoHome}>
          <span className="mobileDockIcon">Accueil</span>
          <span>Accueil</span>
        </button>
        <button className={`mobileDockBtn ${activeRoute === "classic-play" ? "isActive" : ""}`} onClick={onGoPlay}>
          <span className="mobileDockIcon">Jouer</span>
          <span>Jouer</span>
        </button>
        <button className={`mobileDockBtn ${activeRoute === "rush" ? "isActive" : ""}`} onClick={onGoRush}>
          <span className="mobileDockIcon">Rush</span>
          <span>Rush</span>
        </button>
        <button className={`mobileDockBtn ${activeRoute === "arena" ? "isActive" : ""}`} onClick={onGoArena}>
          <span className="mobileDockIcon">Arene</span>
          <span>Arene</span>
        </button>
        <button className={`mobileDockBtn ${activeRoute === "shop" ? "isActive" : ""}`} onClick={onOpenShop}>
          <span className="mobileDockIcon">Boutique</span>
          <span>Boutique</span>
        </button>
        <button className={`mobileDockBtn ${activeRoute === "profile" ? "isActive" : ""}`} onClick={onOpenProfile}>
          <span className="mobileDockIcon">Profil</span>
          <span>Profil</span>
        </button>
      </div>
    </div>
  );
}

import TopBar from "./TopBar";
import MobileHomeScreen from "./MobileHomeScreen";
import Shop from "./Shop";
import Profile from "./Profile";
import Settings from "./Settings";

export default function MobileAppView({
  topBarProps,
  mobileRoute,
  onNavigateHome,
  onNavigatePlay,
  onNavigateRush,
  onOpenArena,
  homeProps,
  shopProps,
  profileProps,
  settingsProps,
}) {
  const arcadeSymbols = ["+", "-", "x", "/", "=", "\u03A3", "\u221A", "\u03C0", "%", "7", "8", "9"];

  return (
    <div className={`mobileViewFrame mobileViewFrame-${mobileRoute}`}>
      <div className="mobileMathWindowFx" aria-hidden="true">
        {arcadeSymbols.map((symbol, idx) => (
          <span key={`${symbol}-${idx}`} style={{ "--i": idx }}>
            {symbol}
          </span>
        ))}
      </div>

      <TopBar {...topBarProps} compact />

      {mobileRoute === "home" && (
        <div className="appFrame mobileRouteScreen mobileRouteScreen-home">
          <MobileHomeScreen {...homeProps} />
        </div>
      )}

      <Shop {...shopProps} />
      <Profile {...profileProps} />
      <Settings {...settingsProps} />

      <div className="mobileDock" aria-label="Navigation mobile">
        <button className={`mobileDockBtn route-home ${mobileRoute === "home" ? "isActive" : ""}`} onClick={onNavigateHome}>
          <span className="mobileDockIcon" aria-hidden="true">
            {"\uD83C\uDFE0"}
          </span>
          <span>Accueil</span>
        </button>
        <button className={`mobileDockBtn route-play ${mobileRoute === "classic-play" ? "isActive" : ""}`} onClick={onNavigatePlay}>
          <span className="mobileDockIcon" aria-hidden="true">
            {"\uD83C\uDFAF"}
          </span>
          <span>Jouer</span>
        </button>
        <button className={`mobileDockBtn route-arena ${mobileRoute === "arena" ? "isActive" : ""}`} onClick={onOpenArena}>
          <span className="mobileDockIcon" aria-hidden="true">
            {"\u2694\uFE0F"}
          </span>
          <span>Arena</span>
        </button>
        <button className={`mobileDockBtn route-rush ${mobileRoute === "rush" ? "isActive" : ""}`} onClick={onNavigateRush}>
          <span className="mobileDockIcon" aria-hidden="true">
            {"\u26A1"}
          </span>
          <span>Rush</span>
        </button>
      </div>

    </div>
  );
}

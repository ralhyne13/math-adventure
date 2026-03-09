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

    </div>
  );
}

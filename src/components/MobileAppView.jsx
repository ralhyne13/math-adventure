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
  onOpenChest,
  onOpenChestBatch,
  chestPending = 0,
  chestProgress = 0,
  chestTypeCounts = {},
  chestGainPulse = false,
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

      {mobileRoute === "chest" && (
        <div className="appFrame mobileRouteScreen mobileRouteScreen-chest">
          <section className="card smooth mobileChestPage">
            <div className="cardTitle">
              <span>Coffres</span>
              <span className="pill">en attente: {chestPending}</span>
            </div>
            <div className="mobileChestGrid">
              <div className="mobileChestStat">
                <strong>Commun</strong>
                <span>{chestTypeCounts.common ?? 0}</span>
              </div>
              <div className="mobileChestStat">
                <strong>Rare</strong>
                <span>{chestTypeCounts.rare ?? 0}</span>
              </div>
              <div className="mobileChestStat">
                <strong>Epique</strong>
                <span>{chestTypeCounts.epic ?? 0}</span>
              </div>
              <div className="mobileChestStat">
                <strong>Legendaire</strong>
                <span>{chestTypeCounts.legendary ?? 0}</span>
              </div>
            </div>
            <div className="small mobileChestHint">
              Prochain coffre gagne dans {(() => {
                const step = (Number(chestProgress) || 0) % 15;
                return step === 0 ? 15 : 15 - step;
              })()} bonnes reponses.
            </div>
            <div className="mobileChestActions">
              <button className="btn btnPrimary smooth hover-lift press" onClick={() => onOpenChestBatch?.(1)} disabled={chestPending <= 0}>
                Ouvrir x1
              </button>
              <button className="btn smooth hover-lift press" onClick={() => onOpenChestBatch?.(3)} disabled={chestPending <= 0}>
                Ouvrir x3
              </button>
              <button className="btn smooth hover-lift press" onClick={() => onOpenChestBatch?.(Math.max(1, chestPending))} disabled={chestPending <= 0}>
                Tout ouvrir
              </button>
            </div>
            <div className="mobileChestShowcase" aria-hidden="true">
              <span>🎁</span>
              <span>🌟</span>
              <span>✨</span>
              <span>👑</span>
            </div>
          </section>
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
        <button className={`mobileDockBtn route-chest ${mobileRoute === "chest" ? "isActive" : ""} ${chestGainPulse ? "gainPulse" : ""}`} onClick={onOpenChest}>
          <span className="mobileDockIcon" aria-hidden="true">
            {"\uD83C\uDF81"}
          </span>
          <span>Coffre</span>
          {chestPending > 0 ? <span className="mobileDockBadge">{Math.min(99, chestPending)}</span> : null}
        </button>
      </div>

    </div>
  );
}

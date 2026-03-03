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
  onOpenShop,
  onOpenProfile,
  onOpenSettings,
  homeProps,
  shopProps,
  profileProps,
  settingsProps,
}) {
  return (
    <div className={`mobileViewFrame mobileViewFrame-${mobileRoute}`}>
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
          <span className="mobileDockGlyph">Home</span>
          <span>Accueil</span>
        </button>
        <button className={`mobileDockBtn route-play ${mobileRoute === "classic-play" ? "isActive" : ""}`} onClick={onNavigatePlay}>
          <span className="mobileDockGlyph">Play</span>
          <span>Jouer</span>
        </button>
        <button className={`mobileDockBtn route-arena ${mobileRoute === "arena" ? "isActive" : ""}`} onClick={onOpenArena}>
          <span className="mobileDockGlyph">Arena</span>
          <span>Arena</span>
        </button>
        <button className={`mobileDockBtn route-rush ${mobileRoute === "rush" ? "isActive" : ""}`} onClick={onNavigateRush}>
          <span className="mobileDockGlyph">Rush</span>
          <span>Rush</span>
        </button>
        <button className={`mobileDockBtn route-shop ${mobileRoute === "shop" ? "isActive" : ""}`} onClick={onOpenShop}>
          <span className="mobileDockGlyph">Shop</span>
          <span>Boutique</span>
        </button>
        <button className={`mobileDockBtn route-profile ${mobileRoute === "profile" ? "isActive" : ""}`} onClick={onOpenProfile}>
          <span className="mobileDockGlyph">Profile</span>
          <span>Profil</span>
        </button>
        <button className={`mobileDockBtn route-settings ${mobileRoute === "settings" ? "isActive" : ""}`} onClick={onOpenSettings}>
          <span className="mobileDockGlyph">Setup</span>
          <span>Reglages</span>
        </button>
      </div>
    </div>
  );
}

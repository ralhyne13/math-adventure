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
    <>
      <TopBar {...topBarProps} compact />

      {mobileRoute === "home" && (
        <div className="appFrame">
          <MobileHomeScreen {...homeProps} />
        </div>
      )}

      <Shop {...shopProps} />
      <Profile {...profileProps} />
      <Settings {...settingsProps} />

      <div className="mobileDock" aria-label="Navigation mobile">
        <button className={`mobileDockBtn ${mobileRoute === "home" ? "isActive" : ""}`} onClick={onNavigateHome}>
          <span>Accueil</span>
        </button>
        <button className={`mobileDockBtn ${mobileRoute === "classic-play" ? "isActive" : ""}`} onClick={onNavigatePlay}>
          <span>Jouer</span>
        </button>
        <button className={`mobileDockBtn ${mobileRoute === "arena" ? "isActive" : ""}`} onClick={onOpenArena}>
          <span>Arene</span>
        </button>
        <button className={`mobileDockBtn ${mobileRoute === "rush" ? "isActive" : ""}`} onClick={onNavigateRush}>
          <span>Rush</span>
        </button>
        <button className={`mobileDockBtn ${mobileRoute === "shop" ? "isActive" : ""}`} onClick={onOpenShop}>
          <span>Boutique</span>
        </button>
        <button className={`mobileDockBtn ${mobileRoute === "profile" ? "isActive" : ""}`} onClick={onOpenProfile}>
          <span>Profil</span>
        </button>
        <button className={`mobileDockBtn ${mobileRoute === "settings" ? "isActive" : ""}`} onClick={onOpenSettings}>
          <span>Reglages</span>
        </button>
      </div>
    </>
  );
}

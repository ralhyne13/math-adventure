import { ACHIEVEMENTS } from "../config/gameData";

export default function TopBar({
  avatar,
  authUser,
  loginStreak,
  profileRank,
  coins,
  level,
  xp,
  questionIndex,
  bestScore,
  unlockedCount,
  onOpenSettings,
  onOpenProfile,
  onOpenShop,
  canInstallApp,
  onInstallApp,
  onLogout,
  compact = false,
}) {
  if (compact) {
    return (
      <div className="topbar topbarCompact">
        <div className="topbarCompactLeft">
          <div className="mobileAvatar topbarCompactAvatar">{avatar.emoji}</div>
          <div>
            <div className="topbarCompactTitle">Math Royale</div>
            <div className="small">
              <b>{authUser.pseudoDisplay}</b> | {profileRank.icon} {profileRank.label}
            </div>
          </div>
        </div>

        <div className="topbarCompactRight">
          <div className="mobileStatPill">P {coins}</div>
          <div className="mobileStatPill">Lv {level}</div>
          {canInstallApp && (
            <button className="btn btnPrimary smooth hover-lift press topbarCompactBtn" onClick={onInstallApp} aria-label="Installer l'app">
              DL
            </button>
          )}
          <button className="btn smooth hover-lift press topbarCompactBtn" onClick={onOpenSettings} aria-label="Reglages">
            Cfg
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="topbar">
      <div className="brand">
        <div className="logo smooth" />
        <div>
          <div className="h1">
            Math Royale <span style={{ opacity: 0.92 }}>{avatar.emoji}</span>
          </div>
          <div className="sub">
            Connecte : <b>{authUser.pseudoDisplay}</b> | Streak login : <b>{loginStreak}/7</b>
          </div>
          <div className="rankTag">
            {profileRank.icon} {profileRank.label}
          </div>
        </div>
      </div>

      <div className="hud">
        <div className="hudLeft">
          <div className="coins chip coinChip smooth" title="Pieces">
            <span className="coinDot" />
            <span>{coins}</span>
            <span className="chipLabel">pieces</span>
          </div>

          <div className="chip smooth" title="Niveau">
            <span className="chipIcon">Lv</span>
            <span>
              Lv <b>{level}</b>
            </span>
          </div>

          <div className="chip smooth" title="XP">
            <span className="chipIcon">XP</span>
            <span className="mono">{xp}</span>
          </div>
        </div>

        <div className="hudPills" aria-label="informations">
          <span className="pill">Q#{questionIndex}</span>
          <span className="pill">Record: {bestScore}</span>
          <span className="pill">
            Badges: {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="hudRight">
          {canInstallApp && (
            <button className="btn btnPrimary smooth hover-lift press" onClick={onInstallApp} title="Installer l'application">
              Installer l'app
            </button>
          )}
          <button className="btn smooth hover-lift press" onClick={onOpenSettings}>
            Reglages
          </button>
          <button className="btn smooth hover-lift press" onClick={onOpenProfile}>
            Profil
          </button>
          <button className="btn btnPrimary smooth hover-lift press" onClick={onOpenShop}>
            Boutique
          </button>
          <button className="btn smooth hover-lift press" onClick={onLogout} title="Se deconnecter">
            Deconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

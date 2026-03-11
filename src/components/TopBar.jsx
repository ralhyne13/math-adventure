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
      <section className="topbar topbarCompact">
        <div className="topbarCompactShell">
          <div className="topbarCompactHead">
            <div className="topbarCompactLeft">
              <div className="mobileAvatar topbarCompactAvatar">{avatar.emoji}</div>
              <div className="topbarCompactIdentity">
                <div className="topbarCompactEyebrow">Mobile</div>
                <div className="topbarCompactTitle">Math Royale</div>
                <div className="small">
                  <span className="topbarInlineIcon" aria-hidden="true">
                    {"\uD83D\uDC64"}
                  </span>{" "}
                  <b>{authUser.pseudoDisplay}</b> | {profileRank.icon} {profileRank.label}
                </div>
              </div>
            </div>
            <button className="btn smooth hover-lift press topbarCompactBtn topbarCompactProfileBtn" onClick={onOpenProfile}>
              {"\uD83D\uDC64"} Profil
            </button>
          </div>

          <div className="topbarCompactStats">
            <div className="topbarCompactChip">
              <span className="topbarInlineIcon" aria-hidden="true">
                {"\uD83E\uDE99"}
              </span>
              Pieces {coins}
            </div>
            <div className="topbarCompactChip">Niv. {level}</div>
            <div className="topbarCompactChip">
              <span className="topbarInlineIcon" aria-hidden="true">
                {"\u2728"}
              </span>
              XP {xp}
            </div>
            <div className="topbarCompactChip">Login {loginStreak}/7</div>
          </div>

          <div className="topbarCompactActions">
            {canInstallApp && (
              <button className="btn btnPrimary smooth hover-lift press topbarCompactBtn" onClick={onInstallApp} aria-label="Installer l'app">
                App
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="topbar topbarRefresh">
      <div className="brand brandRefresh">
        <div className="logo smooth" />
        <div className="brandCopy">
          <div className="h1">
            Math Royale <span style={{ opacity: 0.92 }}>{avatar.emoji}</span>
          </div>
          <div className="sub brandSub">
            Profil: <b>{authUser.pseudoDisplay}</b> | Presence: <b>{loginStreak}/7</b>
          </div>
          <div className="rankTag">
            {profileRank.icon} {profileRank.label}
          </div>
        </div>
      </div>

      <div className="hud hudRefresh">
        <div className="hudLeft hudPanel">
          <div className="coins chip coinChip smooth" title="Pieces">
            <span className="coinDot" />
            <span>{coins}</span>
            <span className="chipLabel">pieces</span>
          </div>

          <div className="chip smooth" title="Niveau">
            <span className="chipIcon">Niv.</span>
            <span>
              Niv. <b>{level}</b>
            </span>
          </div>

          <div className="chip smooth" title="XP">
            <span className="chipIcon">XP</span>
            <span className="mono">{xp}</span>
          </div>
        </div>

        <div className="hudPills hudPanel" aria-label="informations">
          <span className="pill">Q#{questionIndex}</span>
          <span className="pill">Record: {bestScore}</span>
          <span className="pill">
            Badges: {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="hudRight hudActions">
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

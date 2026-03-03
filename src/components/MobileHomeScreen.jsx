export default function MobileHomeScreen({
  avatar,
  authUser,
  profileRank,
  coins,
  level,
  xp,
  streak,
  accuracy,
  loginStreak,
  currentWorld,
  worldLevel,
  worldBossReady,
  worldBossDone,
  chestPending,
  chestProgress,
  dailyChallenge,
  dailyProgress,
  canInstallApp,
  onInstallApp,
  onOpenPlay,
  onOpenArena,
  onOpenRush,
  onOpenShop,
  onOpenProfile,
  onOpenSettings,
  onStartStudy5,
  onOpenChest,
}) {
  const dailyPct = Math.round(((dailyProgress || 0) / Math.max(1, dailyChallenge?.target ?? 1)) * 100);

  return (
    <div className="mobileStack">
      <div className="card smooth mobileHomeHero">
        <div className="mobileHomeRow">
          <div className="mobileHomeIdentity">
            <div className="mobileAvatar">{avatar.emoji}</div>
            <div>
              <div className="mobileHomeTitle">Math Royale</div>
              <div className="small">
                <b>{authUser.pseudoDisplay}</b> | {profileRank.icon} {profileRank.label}
              </div>
              <div className="small">🔥 Streak login: {loginStreak}/7</div>
            </div>
          </div>
          <button className="btn smooth hover-lift press" onClick={onOpenSettings}>
            Réglages
          </button>
        </div>

        <div className="mobileQuickStats">
          <div className="mobileStatPill">🪙 {coins} pieces</div>
          <div className="mobileStatPill">Lv {level}</div>
          <div className="mobileStatPill">XP {xp}</div>
          <div className="mobileStatPill">Combo {streak}</div>
          <div className="mobileStatPill">Precision {accuracy}%</div>
        </div>

        <div className="mobileActionRow">
          <button className="btn btnPrimary smooth hover-lift press" onClick={onOpenPlay}>
            ▶️ Jouer
          </button>
          <button className="btn smooth hover-lift press" onClick={onOpenArena}>
            🏟️ Mode Arena
          </button>
          <button className="btn btnPrimary smooth hover-lift press" onClick={onOpenRush}>
            ⚡ Rush 60s
          </button>
          <button className="btn smooth hover-lift press" onClick={onOpenShop}>
            🛍️ Boutique
          </button>
          <button className="btn smooth hover-lift press" onClick={onOpenProfile}>
            👤 Profil
          </button>
        </div>
      </div>

      {canInstallApp && (
        <div className="card smooth mobileInstallBanner">
          <div>
            <div className="cardTitle">
              <span>Installer l’app</span>
              <span className="pill">mobile</span>
            </div>
            <div className="small" style={{ marginTop: 8 }}>
              Ajoute Math Royale a ton ecran d'accueil pour jouer en plein ecran, avec un lancement plus rapide et un rendu
              plus proche d'une vraie app mobile.
            </div>
          </div>
          <button className="btn btnPrimary smooth hover-lift press mobileInstallBtn" onClick={onInstallApp}>
            Installer maintenant
          </button>
        </div>
      )}

      <div className="card smooth">
        <div className="cardTitle">
          <span>
            {currentWorld.icon} {currentWorld.name}
          </span>
          <span className="pill">Niv. {worldLevel}/30</span>
        </div>
        <div className="small" style={{ marginTop: 8 }}>
          Boss final: <b>{worldBossDone ? "Vaincu" : worldBossReady ? "Prêt" : "En progression"}</b>
        </div>
      </div>

      <div className="card smooth">
        <div className="cardTitle">
          <span>Défi du jour</span>
          <span className="pill">+{dailyChallenge?.rewardXp ?? 0} XP</span>
        </div>
        <div className="small" style={{ marginTop: 8 }}>{dailyChallenge?.desc}</div>
        <div className="barWrap" style={{ marginTop: 10 }}>
          <div className="bar" style={{ width: `${dailyPct}%` }} />
        </div>
        <div className="small" style={{ marginTop: 8 }}>
          {Math.min(dailyProgress, dailyChallenge?.target ?? 0)} / {dailyChallenge?.target ?? 0}
        </div>
      </div>

      <div className="card smooth">
        <div className="cardTitle">
          <span>Récompenses</span>
          <span className="pill">{chestPending} coffre(s)</span>
        </div>
        <div className="small" style={{ marginTop: 8 }}>
          Progression coffre: <b>{chestProgress}/15</b> bonnes reponses
        </div>
        <div className="mobileActionRow" style={{ marginTop: 12 }}>
          <button className="btn btnPrimary smooth hover-lift press" onClick={onOpenChest} disabled={chestPending <= 0}>
            Ouvrir coffre
          </button>
          <button className="btn smooth hover-lift press" onClick={onStartStudy5}>
            Défi 5 min
          </button>
        </div>
      </div>
    </div>
  );
}




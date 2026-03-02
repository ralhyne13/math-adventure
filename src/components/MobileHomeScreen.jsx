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
  onOpenPlay,
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
                <b>{authUser.pseudoDisplay}</b> • {profileRank.icon} {profileRank.label}
              </div>
              <div className="small">Streak login: {loginStreak}/7</div>
            </div>
          </div>
          <button className="btn smooth hover-lift press" onClick={onOpenSettings}>
            Reglages
          </button>
        </div>

        <div className="mobileQuickStats">
          <div className="mobileStatPill">🪙 {coins} pieces</div>
          <div className="mobileStatPill">⬆️ Lv {level}</div>
          <div className="mobileStatPill">✨ {xp}</div>
          <div className="mobileStatPill">🔥 {streak}</div>
          <div className="mobileStatPill">🎯 {accuracy}%</div>
        </div>

        <div className="mobileActionRow">
          <button className="btn btnPrimary smooth hover-lift press" onClick={onOpenPlay}>
            ▶ Jouer
          </button>
          <button className="btn btnPrimary smooth hover-lift press" onClick={onOpenRush}>
            ⚡ Rush
          </button>
          <button className="btn smooth hover-lift press" onClick={onOpenShop}>
            🛍 Boutique
          </button>
          <button className="btn smooth hover-lift press" onClick={onOpenProfile}>
            👤 Profil
          </button>
        </div>
      </div>

      <div className="card smooth">
        <div className="cardTitle">
          <span>
            {currentWorld.icon} {currentWorld.name}
          </span>
          <span className="pill">Niv. {worldLevel}/30</span>
        </div>
        <div className="small" style={{ marginTop: 8 }}>
          Boss final: <b>{worldBossDone ? "Vaincu" : worldBossReady ? "Pret" : "En progression"}</b>
        </div>
      </div>

      <div className="card smooth">
        <div className="cardTitle">
          <span>Defi du jour</span>
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
          <span>Recompenses</span>
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
            Defi 5 min
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const dailyTarget = Math.max(1, dailyChallenge?.target ?? 1);
  const dailyPct = Math.round(((dailyProgress || 0) / dailyTarget) * 100);
  const chestPct = Math.round(((chestProgress || 0) / 15) * 100);

  return (
    <div className="mobileStack mobileHomeRefresh mobileHomeTotalRefresh">
      <section className="card smooth mobileHomeHero mobileHomeHeroRefresh mobileHeroPanel">
        <div className="mobileHeroGlow" aria-hidden="true" />

        <div className="mobileHomeRow mobileHeroTopRow">
          <div className="mobileHomeIdentity">
            <div className="mobileAvatar mobileHeroAvatar">{avatar.emoji}</div>
            <div>
              <div className="mobileHomeEyebrow">Experience mobile</div>
              <div className="mobileHomeTitle mobileHeroMainTitle">Math Royale</div>
              <div className="small">
                <b>{authUser.pseudoDisplay}</b> | {profileRank.icon} {profileRank.label}
              </div>
            </div>
          </div>

          <button className="btn smooth hover-lift press mobileHeroSettingsBtn" onClick={onOpenSettings}>
            Reglages
          </button>
        </div>

        <div className="mobileHeroHeadline">
          <div className="mobileHeroKicker">Hub principal</div>
          <div className="mobileHeroSentence">Tout le parcours mobile est centre ici: lancer, progresser, ouvrir, rejouer.</div>
        </div>

        <div className="mobileDashboardGrid">
          <div className="mobileDashboardCard">
            <span className="mobileDashboardLabel">Pieces</span>
            <b>{coins}</b>
          </div>
          <div className="mobileDashboardCard">
            <span className="mobileDashboardLabel">Niveau</span>
            <b>{level}</b>
          </div>
          <div className="mobileDashboardCard">
            <span className="mobileDashboardLabel">Combo</span>
            <b>{streak}</b>
          </div>
          <div className="mobileDashboardCard">
            <span className="mobileDashboardLabel">Precision</span>
            <b>{accuracy}%</b>
          </div>
        </div>

        <div className="mobileHeroMetaStrip">
          <div className="mobileHeroMetaChip">XP {xp}</div>
          <div className="mobileHeroMetaChip">Login {loginStreak}/7</div>
          <div className="mobileHeroMetaChip">{currentWorld.icon} {currentWorld.name}</div>
        </div>

        <div className="mobilePrimaryGrid">
          <button className="btn btnPrimary smooth hover-lift press mobilePrimaryBtn" onClick={onOpenPlay}>
            Jouer maintenant
          </button>
          <button className="btn smooth hover-lift press mobilePrimaryBtn" onClick={onOpenRush}>
            Rush 60s
          </button>
          <button className="btn smooth hover-lift press mobilePrimaryBtn" onClick={onOpenArena}>
            Mode Arena
          </button>
        </div>
      </section>

      {canInstallApp && (
        <section className="card smooth mobileInstallBanner mobileSurfaceCard mobileAnnouncementCard">
          <div>
            <div className="mobileSectionEyebrow">PWA</div>
            <div className="mobileSectionTitle">Installer la version mobile</div>
            <div className="small" style={{ marginTop: 8 }}>
              Ajoute l'app a l'ecran d'accueil pour un demarrage plus rapide, une interface plus propre et une sensation
              plus native.
            </div>
          </div>
          <button className="btn btnPrimary smooth hover-lift press mobileInstallBtn" onClick={onInstallApp}>
            Installer
          </button>
        </section>
      )}

      <section className="card smooth mobileSurfaceCard mobileFeaturePanel">
        <div className="mobileSectionHead">
          <div>
            <div className="mobileSectionEyebrow">Progression</div>
            <div className="mobileSectionTitle">
              {currentWorld.icon} {currentWorld.name}
            </div>
          </div>
          <span className="pill">Niv. {worldLevel}/30</span>
        </div>

        <div className="mobileFeatureGrid">
          <div className="mobileFeatureCell">
            <span className="small">Boss final</span>
            <b>{worldBossDone ? "Vaincu" : worldBossReady ? "Pret" : "En progression"}</b>
          </div>
          <div className="mobileFeatureCell">
            <span className="small">Objectif</span>
            <b>{worldBossDone ? "Badge gagne" : "Monter niveau 30"}</b>
          </div>
        </div>
      </section>

      <section className="card smooth mobileSurfaceCard mobileFeaturePanel">
        <div className="mobileSectionHead">
          <div>
            <div className="mobileSectionEyebrow">Mission</div>
            <div className="mobileSectionTitle">Defi du jour</div>
          </div>
          <span className="pill">+{dailyChallenge?.rewardXp ?? 0} XP</span>
        </div>

        <div className="small" style={{ marginTop: 8 }}>{dailyChallenge?.desc}</div>
        <div className="barWrap mobileBarWide" style={{ marginTop: 12 }}>
          <div className="bar" style={{ width: `${Math.min(100, dailyPct)}%` }} />
        </div>
        <div className="mobileSplitMeta">
          <span>{Math.min(dailyProgress || 0, dailyTarget)} / {dailyTarget}</span>
          <span>{dailyPct}%</span>
        </div>
      </section>

      <section className="card smooth mobileSurfaceCard mobileFeaturePanel">
        <div className="mobileSectionHead">
          <div>
            <div className="mobileSectionEyebrow">Recompenses</div>
            <div className="mobileSectionTitle">Coffres et boost</div>
          </div>
          <span className="pill">{chestPending} dispo</span>
        </div>

        <div className="barWrap mobileBarWide" style={{ marginTop: 12 }}>
          <div className="bar" style={{ width: `${Math.min(100, chestPct)}%` }} />
        </div>
        <div className="mobileSplitMeta">
          <span>Progression coffre</span>
          <span>{chestProgress}/15</span>
        </div>

        <div className="mobileSecondaryGrid">
          <button className="btn btnPrimary smooth hover-lift press mobileSecondaryBtn" onClick={onOpenChest} disabled={chestPending <= 0}>
            Ouvrir un coffre
          </button>
          <button className="btn smooth hover-lift press mobileSecondaryBtn" onClick={onStartStudy5}>
            Defi 5 min
          </button>
        </div>
      </section>

      <section className="card smooth mobileSurfaceCard mobileFeaturePanel">
        <div className="mobileSectionHead">
          <div>
            <div className="mobileSectionEyebrow">Navigation</div>
            <div className="mobileSectionTitle">Raccourcis utiles</div>
          </div>
        </div>

        <div className="mobileQuickLinkGrid">
          <button className="btn smooth hover-lift press mobileQuickLinkBtn" onClick={onOpenShop}>
            Boutique
          </button>
          <button className="btn smooth hover-lift press mobileQuickLinkBtn" onClick={onOpenProfile}>
            Profil
          </button>
          <button className="btn smooth hover-lift press mobileQuickLinkBtn" onClick={onOpenSettings}>
            Reglages
          </button>
        </div>
      </section>
    </div>
  );
}

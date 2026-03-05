export default function MobileHomeScreen({
  chestPending,
  chestProgress,
  dailyChallenge,
  dailyProgress,
  canInstallApp,
  onInstallApp,
  onStartStudy5,
  onOpenChest,
}) {
  const dailyTarget = Math.max(1, dailyChallenge?.target ?? 1);
  const dailyPct = Math.round(((dailyProgress || 0) / dailyTarget) * 100);
  const chestPct = Math.round(((chestProgress || 0) / 15) * 100);

  return (
    <div className="mobileStack mobileHomeRefresh mobileHomeTotalRefresh">
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
    </div>
  );
}

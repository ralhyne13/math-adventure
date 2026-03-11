export default function MobileHomeScreen({
  worlds = [],
  selectedWorldId,
  onSelectWorld,
  ageBand,
  ageProfiles = [],
  onSelectAgeBand,
  kidModeOn,
  readAloudOn,
  worldProgress = {},
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
  const activeAge = ageProfiles.find((p) => p.id === ageBand);

  return (
    <div className="mobileStack mobileHomeRefresh mobileHomeTotalRefresh">
      {worlds.length > 0 && (
        <section className="card smooth mobileSurfaceCard mobileFeaturePanel mobileWorldSelectPanel">
          <div className="mobileSectionHead">
            <div>
              <div className="mobileSectionEyebrow">Aventure</div>
              <div className="mobileSectionTitle">Choisis ton monde</div>
            </div>
          </div>

          <div className="mobileWorldGrid">
            {worlds.map((w) => {
              const isCurrent = w.id === selectedWorldId;
              return (
                <button
                  key={w.id}
                  className={`btn smooth hover-lift press mobileWorldChip ${isCurrent ? "isActive" : ""}`}
                  onClick={() => onSelectWorld?.(w.id)}
                  aria-pressed={isCurrent}
                >
                  <span>{w.icon}</span>
                  <span>{w.gradeId}</span>
                </button>
              );
            })}
          </div>

          {ageProfiles.length > 0 && (
            <>
              <div className="mobileSectionHead" style={{ marginTop: 12 }}>
                <div>
                  <div className="mobileSectionEyebrow">Parcours</div>
                  <div className="mobileSectionTitle">Tranche d'age</div>
                </div>
                <span className="pill">{activeAge?.label ?? "6-8 ans"}</span>
              </div>
              <div className="mobileWorldGrid">
                {ageProfiles.map((p) => {
                  const active = p.id === ageBand;
                  return (
                    <button
                      key={p.id}
                      className={`btn smooth hover-lift press mobileWorldChip ${active ? "isActive" : ""}`}
                      onClick={() => onSelectAgeBand?.(p.id, { forceWorld: true })}
                      aria-pressed={active}
                    >
                      <span>🎯</span>
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                Mode enfant: <b>{kidModeOn ? "actif" : "off"}</b> | Lecture audio: <b>{readAloudOn ? "active" : "off"}</b>
              </div>
            </>
          )}
        </section>
      )}

      {worlds.length > 0 && (
        <section className="card smooth mobileSurfaceCard mobileFeaturePanel">
          <div className="mobileSectionHead">
            <div>
              <div className="mobileSectionEyebrow">Carte</div>
              <div className="mobileSectionTitle">Chemin des mondes</div>
            </div>
          </div>
          <div className="mobileWorldPath">
            {worlds.map((w, idx) => {
              const st = worldProgress?.[w.id] ?? { level: 1, badgeWon: false };
              const stars = st.badgeWon ? 3 : st.level >= 20 ? 2 : st.level >= 10 ? 1 : 0;
              const active = w.id === selectedWorldId;
              return (
                <div key={w.id} className={`mobileWorldNode ${active ? "isActive" : ""}`}>
                  <button type="button" className="mobileWorldNodeBtn" onClick={() => onSelectWorld?.(w.id)}>
                    <span className="mobileWorldNodeIcon">{w.icon}</span>
                    <span className="mobileWorldNodeLabel">{w.gradeId}</span>
                  </button>
                  <div className="mobileWorldNodeMeta">
                    <span>Niv {Math.max(1, st.level || 1)}/30</span>
                    <span>{"⭐".repeat(stars) || "☆"}</span>
                  </div>
                  {idx < worlds.length - 1 ? <span className="mobileWorldLink" aria-hidden="true" /> : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

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

import Modal from "./Modal";
import { formatDateFR } from "../hooks/useAchievements";

export default function Profile({
  show,
  onClose,
  profileTab,
  setProfileTab,
  coins,
  authUser,
  level,
  loginStreak,
  totalRight,
  totalWrong,
  accuracy,
  totalQuestions,
  bestStreak,
  GRADES,
  DIFFS,
  MODES,
  records,
  unlockedCount,
  ACHIEVEMENTS,
  isUnlocked,
  achievements,
}) {
  if (!show) return null;

  return (
    <Modal title="Profil — Stats & Badges" onClose={onClose}>
      <div className="tabs">
        <button className={`btn smooth hover-lift press ${profileTab === "stats" ? "btnPrimary" : ""}`} onClick={() => setProfileTab("stats")}>
          📊 Stats
        </button>
        <button className={`btn smooth hover-lift press ${profileTab === "badges" ? "btnPrimary" : ""}`} onClick={() => setProfileTab("badges")}>
          🏅 Badges
        </button>
        <div className="coins" style={{ marginLeft: "auto" }}>
          <span className="coinDot" />
          <span>{coins} coins</span>
        </div>
      </div>

      {profileTab === "stats" && (
        <>
          <div className="toast" style={{ marginTop: 0 }}>
            <div>
              <strong>Global</strong>
              <div className="sub" style={{ marginTop: 8 }}>
                Joueur : <b>{authUser.pseudoDisplay}</b>
                <br />
                Niveau : <b>{level}</b> • Coins : <b>{coins}</b> • Streak login : <b>{loginStreak}/7</b>
                <br />
                Bonnes : <b>{totalRight}</b> • Erreurs : <b>{totalWrong}</b> • Précision : <b>{accuracy}%</b>
                <br />
                Questions : <b>{totalQuestions}</b> • Meilleur combo : <b>{bestStreak}</b>
              </div>
            </div>
          </div>

          <div className="small" style={{ marginTop: 12 }}>
            Records par classe → difficulté → mode (best score session):
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {GRADES.map((g) => (
              <div key={g.id} className="shopCard">
                <div style={{ fontWeight: 1100, marginBottom: 6 }}>{g.label}</div>
                {DIFFS.map((d) => (
                  <div key={d.id} style={{ marginBottom: 10 }}>
                    <div className="small" style={{ marginBottom: 6 }}>
                      • {d.label}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                      {MODES.map((m) => {
                        const v = records?.[g.id]?.[d.id]?.[m.id]?.bestScore ?? 0;
                        return (
                          <div key={m.id} className="statBox" style={{ padding: 10 }}>
                            <div className="statLabel">{m.label}</div>
                            <div className="statValue" style={{ fontSize: 18 }}>
                              {v}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {profileTab === "badges" && (
        <>
          <div className="toast" style={{ marginTop: 0 }}>
            <div>
              <strong>Badges</strong>
              <div className="sub" style={{ marginTop: 8 }}>
                Débloqués : <b>{unlockedCount}</b> / <b>{ACHIEVEMENTS.length}</b>
                <br />
                Astuce : vise les combos 🔥 et la précision 🎖️
              </div>
            </div>
            <span className="pill">+ coins</span>
          </div>

          <div className="badgeGrid">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = isUnlocked(a.id);
              const dateIso = achievements?.[a.id]?.date;
              return (
                <div key={a.id} className={`badgeCard smooth hover-lift ${unlocked ? "" : "badgeLocked"}`}>
                  <div className="badgeIcon">{unlocked ? a.icon : "🔒"}</div>
                  <div style={{ flex: 1 }}>
                    <div className="badgeTitle">{unlocked ? a.title : "Badge verrouillé"}</div>
                    <div className="badgeDesc">{unlocked ? a.desc : "Continue à jouer pour le débloquer."}</div>

                    <div className="badgeMeta">
                      <span className="badgeProgress">🎁 +{a.reward} coins</span>
                      {unlocked && dateIso && <span className="badgeProgress">📅 {formatDateFR(dateIso)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}

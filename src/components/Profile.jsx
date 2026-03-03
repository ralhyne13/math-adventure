import Modal from "./Modal";
import { formatDateFR } from "../hooks/useAchievements";

export default function Profile({
  show,
  onClose,
  presentation = "modal",
  profileTab,
  setProfileTab,
  coins,
  cosmeticDust,
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
  SKINS,
  AVATARS,
  answerEffects,
  ownedSkins,
  ownedAvatars,
  ownedEffects,
  skinId,
  avatarId,
  answerEffectId,
  unlockEffectWithDust,
}) {
  if (!show) return null;

  return (
    <Modal title="Profil - Stats, Badges, Album" onClose={onClose} presentation={presentation}>
      <div className="tabs">
        <button className={`btn smooth hover-lift press ${profileTab === "stats" ? "btnPrimary" : ""}`} onClick={() => setProfileTab("stats")}>
          Stats
        </button>
        <button className={`btn smooth hover-lift press ${profileTab === "badges" ? "btnPrimary" : ""}`} onClick={() => setProfileTab("badges")}>
          Badges
        </button>
        <button className={`btn smooth hover-lift press ${profileTab === "album" ? "btnPrimary" : ""}`} onClick={() => setProfileTab("album")}>
          Album
        </button>
        <div className="coins" style={{ marginLeft: "auto" }}>
          <span className="coinDot" />
          <span>{coins} pieces</span>
        </div>
        <div className="chip smooth">
          <span className="chipIcon">ðŸ§©</span>
          <span>{cosmeticDust} diamants</span>
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
                Niveau : <b>{level}</b> - Pieces : <b>{coins}</b> - Diamants : <b>{cosmeticDust}</b> - Streak login : <b>{loginStreak}/7</b>
                <br />
                Bonnes : <b>{totalRight}</b> - Erreurs : <b>{totalWrong}</b> - Precision : <b>{accuracy}%</b>
                <br />
                Questions : <b>{totalQuestions}</b> - Meilleur combo : <b>{bestStreak}</b>
              </div>
            </div>
          </div>

          <div className="small" style={{ marginTop: 12 }}>
            Records par classe {"->"} difficulte {"->"} mode (best score session):
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {GRADES.map((g) => (
              <div key={g.id} className="shopCard">
                <div style={{ fontWeight: 1100, marginBottom: 6 }}>{g.label}</div>
                {DIFFS.map((d) => (
                  <div key={d.id} style={{ marginBottom: 10 }}>
                    <div className="small" style={{ marginBottom: 6 }}>
                      - {d.label}
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
                Debloques : <b>{unlockedCount}</b> / <b>{ACHIEVEMENTS.length}</b>
                <br />
                Astuce : vise les combos et la precision.
              </div>
            </div>
            <span className="pill">+ pieces</span>
          </div>

          <div className="badgeGrid">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = isUnlocked(a.id);
              const dateIso = achievements?.[a.id]?.date;
              return (
                <div key={a.id} className={`badgeCard smooth hover-lift ${unlocked ? "" : "badgeLocked"}`}>
                  <div className="badgeIcon">{unlocked ? a.icon : "ðŸ”’"}</div>
                  <div style={{ flex: 1 }}>
                    <div className="badgeTitle">{unlocked ? a.title : "Badge verrouille"}</div>
                    <div className="badgeDesc">{unlocked ? a.desc : "Continue a jouer pour le debloquer."}</div>
                    <div className="badgeMeta">
                      <span className="badgeProgress">+{a.reward} pieces</span>
                      {unlocked && dateIso && <span className="badgeProgress">{formatDateFR(dateIso)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {profileTab === "album" && (
        <>
          <div className="toast" style={{ marginTop: 0 }}>
            <div>
              <strong>Album collection</strong>
              <div className="sub" style={{ marginTop: 8 }}>
                Skins : <b>{ownedSkins.length}</b> / <b>{SKINS.length}</b> - Avatars : <b>{ownedAvatars.length}</b> / <b>{AVATARS.length}</b> - Effets : <b>{ownedEffects.length}</b> /{" "}
                <b>{answerEffects.length}</b>
              </div>
            </div>
            <span className="pill">{cosmeticDust} diamants</span>
          </div>

          <div className="small" style={{ marginTop: 12 }}>Skins</div>
          <div className="shopGrid" style={{ marginTop: 10 }}>
            {SKINS.map((s) => {
              const owned = ownedSkins.includes(s.id);
              const equipped = skinId === s.id;
              return (
                <div key={s.id} className={`shopCard ${owned ? "" : "badgeLocked"}`}>
                  <div className="preview" style={{ background: `linear-gradient(135deg, ${s.vars["--accent"]}, ${s.vars["--accent2"]})` }} />
                  <div className="shopTitle">{owned ? s.name : "Skin verrouille"}</div>
                  <div className="small" style={{ marginTop: 6 }}>{owned ? s.desc : `Prix boutique: ${s.price} pieces`}</div>
                  {equipped && <div className="badgeMeta"><span className="badgeProgress">Équipé</span></div>}
                </div>
              );
            })}
          </div>

          <div className="small" style={{ marginTop: 12 }}>Avatars</div>
          <div className="shopGrid" style={{ marginTop: 10 }}>
            {AVATARS.map((a) => {
              const owned = ownedAvatars.includes(a.id);
              const equipped = avatarId === a.id;
              return (
                <div key={a.id} className={`shopCard ${owned ? "" : "badgeLocked"}`}>
                  <div className="avatarBig">{owned ? a.emoji : "ðŸ”’"}</div>
                  <div className="shopTitle">{owned ? a.name : "Avatar verrouille"}</div>
                  <div className="small" style={{ marginTop: 6 }}>{owned ? a.rarity : `Prix boutique: ${a.price} pieces`}</div>
                  {equipped && <div className="badgeMeta"><span className="badgeProgress">Équipé</span></div>}
                </div>
              );
            })}
          </div>

          <div className="small" style={{ marginTop: 12 }}>Effets</div>
          <div className="shopGrid" style={{ marginTop: 10 }}>
            {answerEffects.map((fx) => {
              const owned = ownedEffects.includes(fx.id);
              const equipped = answerEffectId === fx.id;
              const cost = fx.dustCost ?? 0;
              return (
                <div key={fx.id} className={`shopCard ${owned ? "" : "badgeLocked"}`}>
                  <div className="badgeIcon">{fx.id === "default" ? "âœ¨" : "ðŸ’¥"}</div>
                  <div className="shopTitle">{owned ? fx.label : "Effet verrouille"}</div>
                  <div className="small" style={{ marginTop: 6 }}>{owned ? fx.desc : `Deblocage: ${cost} diamants`}</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {equipped && <span className="badgeProgress">Équipé</span>}
                    {!owned && fx.id !== "default" && (
                      <button className="btn btnPrimary smooth hover-lift press" onClick={() => unlockEffectWithDust(fx.id)} disabled={cosmeticDust < cost}>
                        Debloquer
                      </button>
                    )}
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


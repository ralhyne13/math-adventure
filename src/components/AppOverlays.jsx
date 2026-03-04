export default function AppOverlays({
  loginRewardPop,
  onCloseLoginReward,
  levelPop,
  onCloseLevelPop,
  coachPop,
  onCloseCoachPop,
  adSim,
  isPremium,
  onSkipOptionalAd,
  badgePop,
  onCloseBadgePop,
  chestPop,
  onCloseChestPop,
  onEquipChestReward,
}) {
  return (
    <>
      {loginRewardPop && (
        <div className="levelPop levelPopLogin" role="status" aria-live="polite">
          <div className="levelPopInner smooth feedbackPanel feedbackLoginPanel">
            <div style={{ flex: 1 }}>
              <div className="levelPopTitle">Connexion quotidienne</div>
              <div className="levelPopSub">
                Jour <b>{loginRewardPop.day}</b>/7 | <span className="levelCoins">{loginRewardPop.text}</span>
              </div>
              <div className="small" style={{ marginTop: 6 }}>
                {loginRewardPop.detail}
              </div>
            </div>
            <button className="btn btnPrimary smooth hover-lift press" onClick={onCloseLoginReward}>
              OK
            </button>
          </div>
        </div>
      )}

      {levelPop && (
        <div className="levelPop levelPopLevel" role="status" aria-live="polite">
          <div className="levelPopInner smooth feedbackPanel feedbackLevelPanel">
            <div style={{ flex: 1 }}>
              <div className="levelPopTitle">NIVEAU SUPERIEUR !</div>
              <div className="levelPopSub">
                Niveau <b>{levelPop.toLevel}</b>
                {levelPop.gainedLevels > 1 ? ` (+${levelPop.gainedLevels})` : ""} |
                <span className="levelCoins">
                  <span className="coinDot" /> +{levelPop.gainedCoins} pieces
                </span>
              </div>
              <div className="small" style={{ marginTop: 6 }}>
                Continue comme ca !
              </div>
            </div>
            <button className="btn btnPrimary smooth hover-lift press" onClick={onCloseLevelPop}>
              OK
            </button>
          </div>
        </div>
      )}

      {coachPop && (
        <div className="coachPop coachPopRefresh" role="status" aria-live="polite">
          <div className="coachPopInner smooth feedbackPanel feedbackCoachPanel">
            <div style={{ flex: 1 }}>
              <div className="coachPopTitle">{coachPop.title}</div>
              <div className="coachPopSub" style={{ marginTop: 6 }}>
                {coachPop.lines?.map((t, i) => (
                  <div key={i}>{t}</div>
                ))}
              </div>
              {coachPop.hint && (
                <div className="small" style={{ marginTop: 8 }}>
                  {coachPop.hint}
                </div>
              )}
            </div>
            <button className="btn btnPrimary smooth hover-lift press" onClick={onCloseCoachPop}>
              OK
            </button>
          </div>
        </div>
      )}

      {adSim && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal" style={{ width: "min(560px, 100%)" }}>
            <div className="modalHead">
              <div className="modalTitle">Publicite optionnelle</div>
              <span className="pill">{adSim.provider === "regie_externe" ? "regie externe" : "video sponsorisee"}</span>
            </div>
            <div className="modalBody">
              <div className="toast" style={{ marginTop: 0 }}>
                <div style={{ width: "100%" }}>
                  <strong>{adSim.title}</strong>
                  <div className="small" style={{ marginTop: 6 }}>
                    Source: <b>{adSim.provider === "regie_externe" ? "Regie configuree" : "Simulation locale"}</b> | Format:{" "}
                    <b>{adSim.provider === "regie_externe" ? "recompensee" : "3 s"}</b>
                  </div>
                  <div className="small" style={{ marginTop: 8 }}>
                    {adSim.lines?.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                  <div className="barWrap" style={{ marginTop: 12 }}>
                    <div className="bar" style={{ width: `${((3 - (adSim.secondsLeft ?? 0)) / 3) * 100}%` }} />
                  </div>
                  <div className="small" style={{ marginTop: 8 }}>
                    Recompense accordee dans <b>{adSim.secondsLeft}</b>s.
                  </div>
                  {!isPremium && (
                    <div className="small" style={{ marginTop: 6 }}>
                      Quota du jour: <b>{adSim.usedAfterStart}/6</b>
                    </div>
                  )}
                  {isPremium && (
                    <div style={{ marginTop: 12 }}>
                      <button className="btn btnPrimary smooth hover-lift press" onClick={onSkipOptionalAd}>
                        Passer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {badgePop && (
        <div className="badgePop badgePopRefresh">
          <div className="badgePopInner smooth feedbackPanel feedbackBadgePanel">
            {badgePop.icon ? <div className="badgeIcon" style={{ background: "rgba(0,0,0,.22)" }}>{badgePop.icon}</div> : null}
            <div style={{ flex: 1 }}>
              <div className="badgePopTitle">{badgePop.title}</div>
              <div className="badgePopSub">{badgePop.desc}</div>
            </div>
            <button className="btn btnPrimary smooth hover-lift press" onClick={onCloseBadgePop}>
              OK
            </button>
          </div>
        </div>
      )}

      {chestPop && (
        <div className="chestPop chestPopRefresh" role="status" aria-live="polite" onMouseDown={onCloseChestPop}>
          <div
            className={`chestPopInner smooth chest-${chestPop.chestType} reward-${chestPop.leadRewardKind ?? "coins"} phase-${chestPop.phase ?? "reveal"}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="chestBurst" aria-hidden="true" />
            {chestPop.phase === "rolling" ? (
              <>
                <div className="chestIconBig chestRolling" aria-hidden="true" />
                <div className="chestPopTitle">Ouverture...</div>
                <div className="chestPopSub">Le coffre tourne avant la revelation.</div>
              </>
            ) : (
              <>
                {chestPop.chestIcon ? <div className="chestIconBig" aria-hidden="true">{chestPop.chestIcon}</div> : null}
                <div className="chestPopTitle">{chestPop.chestLabel}</div>
                <div className="chestRewardsList">
                  {(chestPop.rewards ?? []).map((item, idx) => (
                    <div
                      key={`${item.chestType}-${item.reward.kind}-${idx}`}
                      className={`chestRewardRow tone-${item.visual.tone} reward-${item.reward.kind} ${
                        item.reward.kind === "skin" || item.reward.kind === "avatar" || item.reward.kind === "effect" ? "is-card" : ""
                      }`}
                    >
                      <span
                        className={`chestRewardPreview preview-${item.visual.preview?.type ?? "gift"}`}
                        aria-hidden="true"
                        style={
                          item.visual.preview?.type === "skin"
                            ? { background: `linear-gradient(135deg, ${item.visual.preview?.accent || "#5b7cfa"}, ${item.visual.preview?.accent2 || "#f59e0b"})` }
                            : undefined
                        }
                      >
                        {item.visual.preview?.type === "emoji" ? item.visual.preview?.value : null}
                        {item.visual.preview?.type === "gift" ? item.visual.icon : null}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div className="chestRewardText">{item.visual.label}</div>
                        <div className="chestRewardMeta">
                          <span className={`chestRarity tone-${item.visual.tone}`}>{item.visual.rarity}</span>
                          {(item.reward.kind === "skin" || item.reward.kind === "effect") && (
                            <button className="btn smooth press chestEquipBtn" onClick={() => onEquipChestReward(item)}>
                              Equiper maintenant
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div style={{ marginTop: 12 }}>
              <button className="btn btnPrimary smooth hover-lift press" onClick={onCloseChestPop}>
                Super
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

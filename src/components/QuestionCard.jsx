import Fraction from "./Fraction";

import { useEffect, useState } from "react";

export default function QuestionCard({
  status,
  fx,
  spark,
  compact = false,
  modeId,
  setModeId,
  selectedWorldId,
  onSelectWorld,
  worlds,
  worldLevel,
  worldBossReady,
  worldBossDone,
  diffId,
  setDiffId,
  DIFFS,
  MODES,
  resetSession,
  adaptiveOn,
  xpPct,
  sessionAnswered,
  lastAnswers,
  q,
  streak,
  accuracy,
  hintLevel,
  hintList,
  canAskHint,
  getHintCost,
  useHint,
  hintMsg,
  visibleHints,
  picked,
  showExplain,
  submit,
  disableChoices,
  goNext,
  explain,
  methodSteps,
  showMethod,
  setShowMethod,
  rushOn,
  rushTimeLeft,
  rushDanger,
  rushMultNow,
  rushFeedback,
  arenaOn,
  arenaMultNow,
  bossActive,
  bossRemaining,
  bossHpPct,
  bossProfile,
  bossHitFx,
  bossAttackFx,
  bossImpactRingFx,
  bossAttackFlashFx,
  bossCalloutText,
  errorShakeFx,
  answerEffectId,
  answerInput,
  setAnswerInput,
  worldProgressCurrent = 0,
  worldStepTarget = 3,
  chestProgress = 0,
  sessionChallenge = null,
  sessionChallengeProgress = 0,
  sessionChallengeDone = false,
  mascotGuide = null,
}) {
  const bossPhaseClass = bossRemaining <= 30 ? "phase-final" : bossRemaining <= 60 ? "phase-mid" : "phase-open";
  const historySlots = compact ? 5 : 10;
  const modeLabel = MODES.find((m) => m.id === modeId)?.label ?? modeId;
  const worldLabel = worlds.find((w) => w.id === selectedWorldId);
  const diffLabel = DIFFS.find((d) => d.id === diffId)?.label ?? diffId;
  const modeThemeClass = rushOn ? "theme-rush" : arenaOn ? "theme-arena" : "theme-classic";
  const comboTierClass = streak >= 10 ? "combo-fever" : streak >= 5 ? "combo-hot" : "";
  const worldQuestTarget = Math.max(1, Number(worldStepTarget) || 3);
  const worldQuestProgress = Math.max(0, Math.min(worldQuestTarget, Number(worldProgressCurrent) || 0));
  const worldQuestPercent = Math.round((worldQuestProgress / worldQuestTarget) * 100);
  const chestCycleBase = Math.max(0, Number(chestProgress) || 0);
  const chestCycleProgress = chestCycleBase % 15;
  const chestRemaining = chestCycleProgress === 0 ? 15 : 15 - chestCycleProgress;
  const challengeTarget = Math.max(0, Number(sessionChallenge?.target) || 0);
  const challengeProgress = Math.max(0, Math.min(challengeTarget, Number(sessionChallengeProgress) || 0));
  const challengePercent = challengeTarget ? Math.round((challengeProgress / challengeTarget) * 100) : 0;
  const missionLabel = sessionChallenge
    ? `${sessionChallenge.title}: ${challengeDoneText(sessionChallenge, challengeProgress, challengeTarget, sessionChallengeDone)}`
    : bossActive
    ? "Défie le boss d'arène"
    : worldBossReady
    ? "Boss final prêt à lancer"
    : `Progression monde : étape ${worldLevel}`;
  const missionProgressPercent = sessionChallenge ? challengePercent : worldQuestPercent;
  const missionProgressText = sessionChallenge
    ? `${challengeProgress}/${challengeTarget}`
    : bossActive
    ? `${Math.max(0, bossRemaining)}%`
    : `${worldQuestProgress}/${worldQuestTarget}`;
  const kidRank =
    accuracy >= 95 ? "Génie des maths" : accuracy >= 85 ? "Super calculateur" : accuracy >= 70 ? "Explorateur malin" : "Petit champion";
  const comboMood = streak >= 10 ? "Feu d'artifice" : streak >= 5 ? "Combo turbo" : "Échauffement";
  const chestStarCount = chestRemaining <= 3 ? 3 : chestRemaining <= 7 ? 2 : 1;
  const [mascotTypedText, setMascotTypedText] = useState("");

  useEffect(() => {
    const full = String(mascotGuide?.text || "");
    if (!full) {
      setMascotTypedText("");
      return undefined;
    }
    let i = 0;
    setMascotTypedText("");
    const id = setInterval(() => {
      i += 1;
      setMascotTypedText(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [mascotGuide?.text]);

  function challengeDoneText(challenge, current, target, done) {
    if (!challenge) return "";
    if (done) return "Mission validée !";
    if (target <= 0) return challenge.description ?? "";
    if (challenge.kind === "hard") {
      return `Objectif: ${current}/${target} bonnes en difficile`;
    }
    if (challenge.kind === "streak") {
      return `Objectif: ${current}/${target} réponses consécutives`;
    }
    return `Objectif: ${current}/${target} bonnes`;
  }

  return (
    <div
      className={`card smooth questionCard ${compact ? "questionCardCompact" : ""} ${modeThemeClass} ${status === "ok" ? "pulse-ok" : status === "bad" ? "pulse-bad" : ""} ${bossAttackFx ? "bossAttackFx" : ""} ${
        bossHitFx ? "bossHitFx" : ""
      } ${errorShakeFx ? "screenShakeFx" : ""} ${comboTierClass}`}
    >
      {bossAttackFlashFx && <div className="bossAttackFlashLayer" aria-hidden="true" />}
      {bossImpactRingFx && <div className="bossImpactRingLayer" aria-hidden="true" />}
      {bossCalloutText && <div className={`bossCallout ${bossAttackFx ? "attack" : "hit"}`}>{bossCalloutText}</div>}
      <div className={`fx effect-${answerEffectId} ${fx === "ok" ? "fxOk" : fx === "bad" ? "fxBad" : ""}`} />
      <div className={`sparkles effect-${answerEffectId} ${spark ? "on" : ""}`}>
        {[...Array(10)].map((_, i) => (
          <i
            key={i}
            style={{
              left: `${12 + i * 8}%`,
              top: `${62 - (i % 4) * 10}%`,
              animationDelay: `${i * 22}ms`,
            }}
          />
        ))}
      </div>
      <div className={`arcadeFireworks ${fx === "ok" ? "on" : ""}`} aria-hidden="true">
        {[...Array(18)].map((_, i) => (
          <i key={i} style={{ "--i": i }} />
        ))}
      </div>
      <div className={`arcadeShockRing ${fx === "ok" ? "on" : ""}`} aria-hidden="true" />

      <div className={`cardTitle questionHeader questionHeaderRefresh ${compact ? "cardTitleCompact questionHeaderCompactRefresh" : ""}`}>
        <span>{compact ? "Session" : "Session active"}</span>
        {compact ? <span className="pill">Question</span> : <span className="pill">reponse rapide</span>}
      </div>

      {!compact ? (
        <div className="questionPanelShell">
          <div className="questionControlDeck">
            <div className="questionControlIntro">
              <div className="questionEyebrow">Configuration rapide</div>
              <div className="questionControlTitle">Ajuste la session avant chaque serie.</div>
            </div>
            <div className="questionToolbar">
              <div className="questionToolbarGroup">
                <label className="questionSelectLabel">
                  <span>Mode</span>
                  <select className="select smooth" value={modeId} onChange={(e) => setModeId(e.target.value)}>
                    {MODES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.icon} {m.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="questionSelectLabel">
                  <span>Monde</span>
                  <select className="select smooth" value={selectedWorldId} onChange={(e) => onSelectWorld?.(e.target.value)}>
                    {worlds.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.icon} {w.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="questionSelectLabel">
                  <span>Difficulte</span>
                  <select className="select smooth" value={diffId} onChange={(e) => setDiffId(e.target.value)}>
                    {DIFFS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button className="btn smooth hover-lift press" onClick={resetSession}>
                Recommencer
              </button>
            </div>
          </div>

          <div className="questionStatusStrip">
            <div className="questionStatusRow questionStatusGrid">
              <span className="pill">Adaptatif {adaptiveOn ? "actif" : "off"}</span>
              <span className="pill">Monde {worldLevel}/30</span>
              <span className="pill">{modeLabel}</span>
              {worldBossDone ? <span className="pill">Boss final vaincu</span> : worldBossReady ? <span className="pill">Boss final pret</span> : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="questionCompactStats questionCompactStatsRefresh">
          <div className="questionCompactTop">
            <span className="pill">{worldLabel?.icon} {worldLevel}/30</span>
            <span className="pill">{diffLabel}</span>
            <span className="pill">{modeLabel}</span>
          </div>
          <div className="questionCompactMetaRow questionCompactKpis">
            <span className="questionCompactKpi">Precision {accuracy}%</span>
            <span className="questionCompactKpi">Combo {streak}</span>
            {rushOn ? <span className="questionCompactKpi">Rush {Math.max(0, Math.ceil(rushTimeLeft / 1000))}s</span> : null}
          </div>
          <div className="kidBadgeRow" aria-live="polite">
            <span className="kidBadgeChip">🏅 {kidRank}</span>
            <span className="kidBadgeChip">⚡ {comboMood}</span>
            <span className="kidBadgeChip">🎁 {"⭐".repeat(chestStarCount)}</span>
          </div>
        </div>
      )}

      <div className={`progressPanel ${compact ? "progressPanelCompact" : ""}`}>
        <div className={`barWrap ${compact ? "barWrapCompact" : ""}`} aria-label="xp">
          <div className="bar" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {!compact ? (
        <div className={`missionPanel ${compact ? "missionPanelCompact" : ""}`}>
          <div className="missionHead">
            <span className="small missionTitle">Mission actuelle</span>
            <span className="pill missionModePill">Mode {rushOn ? "Rush" : arenaOn ? "Arena" : "Classique"}</span>
          </div>
          <div className="small missionText">{missionLabel}</div>
          <div className="barWrap missionBarWrap" aria-label="progression mission">
            <div className="bar" style={{ width: `${sessionChallenge ? missionProgressPercent : bossActive ? Math.max(0, Math.min(100, bossRemaining)) : worldQuestPercent}%` }} />
          </div>
          <div className="miniQuestMeta">
            {sessionChallenge ? <span>Mission : {missionProgressText}</span> : bossActive ? <span>Boss : {Math.max(0, bossRemaining)}%</span> : <span>Monde : {worldQuestProgress}/{worldQuestTarget}</span>}
            <span>Coffre : {chestCycleProgress}/15 (plus {chestRemaining} bonnes)</span>
          </div>
        </div>
      ) : (
        <div className="compactFocusStrip" role="status" aria-live="polite">
          <span>{missionLabel}</span>
          <span>Coffre {chestCycleProgress}/15</span>
        </div>
      )}

      {!compact && (
      <div className={`historyPanel ${compact ? "historyPanelCompact" : ""}`}>
        <div className={`miniHistoryWrap ${compact ? "miniHistoryCompact" : ""}`} aria-label="historique des 10 dernières réponses">
          <div className="miniHistoryLabel">
            {compact ? "Récent" : "Rythme"} : <span className="miniHistoryCount">{Math.min(sessionAnswered, historySlots)}/{historySlots}</span>
          </div>
          <div className="miniHistory">
            {[...Array(historySlots)].map((_, i) => {
              const item = lastAnswers[i];
              const cls = item ? (item.ok ? "ok" : "bad") : "empty";
              return <span key={i} className={`miniDot ${cls}`} />;
            })}
          </div>
        </div>
      </div>
      )}

      {mascotGuide && (
        <div className={`owlGuide ${mascotGuide.mood || "coach"}`} role="status" aria-live="polite">
          <div className="owlGuideAvatar" aria-hidden="true">
            🦉
          </div>
          <div className="owlGuideBubble">
            {mascotTypedText}
            <span className="owlGuideCursor" aria-hidden="true">
              |
            </span>
          </div>
        </div>
      )}

      <div className={`heroQuestion questionHeroRefresh ${compact ? "heroQuestionCompact" : ""} ${modeThemeClass} ${rushDanger ? "rushDanger" : ""}`} data-status={status}>
        <div className="heroTop heroTopRefresh">
          <div className="questionPromptBlock">
            <div className="questionEyebrow">Question en cours</div>
            <div className="qPrompt">{q.prompt}</div>
          </div>
          <div className="heroMeta heroMetaRefresh">
            <span className="metaPill comboPill">
              <span className="metaIcon">Combo</span> <b>{streak}</b>
            </span>
            {!compact && !rushOn && !bossActive && (
              <span className="metaPill">
                <span className="metaIcon">{modeLabel}</span> <b>{accuracy}%</b>
              </span>
            )}
            {arenaOn && !rushOn && !compact && (
              <span className="metaPill arenaMultPill">
                <span className="metaIcon">Arène</span> <b>x{arenaMultNow}</b>
              </span>
            )}
            {rushOn && (
              <span className="metaPill rushTimePill">
                <span className="metaIcon">Rush</span> <b>{Math.max(0, Math.ceil(rushTimeLeft / 1000))}s</b> <b>x{rushMultNow}</b>
              </span>
            )}
            {rushOn && rushFeedback && (
              <span className={`metaPill rushFeedbackPill ${rushFeedback.tone}`}>
                <span className="metaIcon">{rushFeedback.label}</span>
                {rushFeedback.bonus > 0 ? <b>+{rushFeedback.bonus}</b> : null}
              </span>
            )}
            {bossActive && (
              <span className="metaPill">
                <span className="metaIcon">Boss</span> <b>{bossRemaining}%</b>
              </span>
            )}
          </div>
        </div>

        {bossActive && (
          <>
            <div className={`bossPanel ${bossPhaseClass} ${bossHitFx ? "hit" : ""} ${bossAttackFx ? "attack" : ""}`}>
              <div className="bossAvatar" aria-hidden="true">{bossProfile?.emoji ?? "👑"}</div>
              <div style={{ flex: 1 }}>
                <div className="small" style={{ color: "rgba(234,240,255,.92)" }}>
                  Boss d'arène
                </div>
                <div style={{ fontWeight: 1100 }}>{bossProfile?.name ?? "Boss mystère"}</div>
              </div>
              <span className="pill">PV {bossRemaining}%</span>
            </div>
            <div className="bossBarWrap" aria-label="points de vie du boss">
              <div className="bossBar" style={{ width: `${bossHpPct}%` }} />
            </div>
          </>
        )}

        <div className="qStage">
          <div className="qRow">
          {q.row.kind === "op" && (
            <>
              <div className="bigOp">{q.row.a}</div>
              <div className="bigOp opSep">{q.row.op}</div>
              <div className="bigOp">{q.row.b}</div>
            </>
          )}
          {q.row.kind === "fracCmp" && (
            <>
              <Fraction n={q.row.aN} d={q.row.aD} />
              <div className="bigOp opSep">?</div>
              <Fraction n={q.row.bN} d={q.row.bD} />
            </>
          )}
          {q.row.kind === "fracEq" && (
            <>
              <Fraction n={q.row.aN} d={q.row.aD} />
              <div className="bigOp opSep">=</div>
              <Fraction n={q.row.bN} d={q.row.bD} />
            </>
          )}
          {q.row.kind === "fracOp" && (
            <>
              <Fraction n={q.row.aN} d={q.row.aD} />
              <div className="bigOp opSep">{q.row.op}</div>
              <Fraction n={q.row.bN} d={q.row.bD} />
            </>
          )}
          {q.row.kind === "fracSimp" && <Fraction n={q.row.n} d={q.row.d} />}
          {q.row.kind === "fracVsNum" && (
            <>
              <Fraction n={q.row.aN} d={q.row.aD} />
              <div className="bigOp opSep">?</div>
              <div className="bigOp">{q.row.numLabel}</div>
            </>
          )}
          {q.row.kind === "storyFrac" && (
            <>
              <Fraction n={q.row.aN} d={q.row.aD} />
              <div className="bigOp opSep">{q.row.op}</div>
              <Fraction n={q.row.bN} d={q.row.bD} />
            </>
          )}
          {q.row.kind === "storyOp" && (
            <>
              <div className="bigOp">{q.row.a}</div>
              <div className="bigOp opSep">{q.row.op}</div>
              <div className="bigOp">{q.row.b}</div>
            </>
          )}
          </div>
        </div>

        <div className="questionActionStack">
        <div className={`learningRow questionHintBar ${compact ? "learningRowCompact questionHintBarCompactRefresh" : ""}`}>
            <button className="btn smooth hover-lift press" onClick={useHint} disabled={!canAskHint}>
              {compact ? "Indice" : `Indice ${hintLevel + 1}/${hintList.length}`}
              {!compact && canAskHint && ` (${getHintCost(hintLevel + 1) === 0 ? "gratuit" : `-${getHintCost(hintLevel + 1)} pièce${getHintCost(hintLevel + 1) > 1 ? "s" : ""}`})`}
            </button>
            {!compact && <span className="small">Les indices t'aident a avancer sans casser le rythme.</span>}
          </div>
          {hintMsg && !visibleHints.length && <div className="small" style={{ marginTop: 8 }}>{hintMsg}</div>}

          {!!visibleHints.length && (
            <div className="hintBox">
              {visibleHints.map((h, i) => (
                <div key={i} className="small">
                  <b>Indice {i + 1}.</b> {h}
                </div>
              ))}
              {hintMsg && <div className="small" style={{ marginTop: 8 }}>{hintMsg}</div>}
            </div>
          )}

          <div className={`controls controlsRefresh choiceGridCard ${compact ? "controlsCompact controlsCompactRefresh" : ""}`}>
            <div className="answerEntry">
              <input
                className="input smooth answerInputField"
                placeholder="Ta réponse..."
                value={answerInput}
                onChange={(e) => setAnswerInput?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !disableChoices) submit(answerInput);
                }}
                disabled={disableChoices}
              />
              <button className="btn btnPrimary smooth hover-lift press" onClick={() => submit(answerInput)} disabled={disableChoices || !String(answerInput || "").trim()}>
                Valider
              </button>
            </div>

            {showExplain && (
              <button className="btn btnPrimary smooth hover-lift press" onClick={goNext}>
                Suivant
              </button>
            )}
          </div>
        </div>

        {showExplain && (
          <div className={`toast questionResultToast ${status === "ok" ? "ok" : "bad"}`}>
            <div>
              {status === "ok" ? <strong>Bien joué</strong> : <strong>Oups</strong>}
              <div className="sub" style={{ marginTop: 4 }}>
                Bonne réponse : <b>{String(q.correct)}</b>
              </div>
              <div className="sub" style={{ marginTop: 8 }}>
                {explain}
              </div>
              {status === "bad" && methodSteps.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <button className="btn smooth hover-lift press" onClick={() => setShowMethod((v) => !v)}>
                    {showMethod ? "Masquer la méthode" : "Voir la méthode"}
                  </button>
                </div>
              )}
              {status === "bad" && showMethod && methodSteps.length > 0 && (
                <div className="methodBox">
                  {methodSteps.map((s, i) => (
                    <div key={i} className="small">
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="pill">Combo: {streak}</span>
          </div>
        )}
      </div>
    </div>
  );
}



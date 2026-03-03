import Fraction from "./Fraction";

export default function QuestionCard({
  status,
  fx,
  spark,
  compact = false,
  modeId,
  setModeId,
  selectedWorldId,
  setSelectedWorldId,
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
  bossTimeLeft,
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
}) {
  const bossPhaseClass = bossRemaining <= 30 ? "phase-final" : bossRemaining <= 60 ? "phase-mid" : "phase-open";

  return (
    <div
      className={`card smooth questionCard ${compact ? "questionCardCompact" : ""} ${status === "ok" ? "pulse-ok" : status === "bad" ? "pulse-bad" : ""} ${bossAttackFx ? "bossAttackFx" : ""} ${
        bossHitFx ? "bossHitFx" : ""
      } ${errorShakeFx ? "screenShakeFx" : ""}`}
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

      <div className={`cardTitle ${compact ? "cardTitleCompact" : ""}`}>
        <span>Choisis la bonne reponse</span>
        {!compact && <span className="pill">explication puis Suivant</span>}
      </div>

      {!compact ? (
        <div className="filters" style={{ marginTop: 10 }}>
          <select className="select smooth" value={modeId} onChange={(e) => setModeId(e.target.value)}>
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.label}
              </option>
            ))}
          </select>
          <select className="select smooth" value={selectedWorldId} onChange={(e) => setSelectedWorldId(e.target.value)}>
            {worlds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.icon} {w.name}
              </option>
            ))}
          </select>
          <select className="select smooth" value={diffId} onChange={(e) => setDiffId(e.target.value)}>
            {DIFFS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <button className="btn smooth hover-lift press" onClick={resetSession}>
            Réinitialiser la session
          </button>
          <span className="pill">Adaptatif : {adaptiveOn ? "Activé" : "Désactivé"}</span>
          <span className="pill">Niveau monde: {worldLevel}/30</span>
          {worldBossDone ? <span className="pill">Boss final vaincu</span> : worldBossReady ? <span className="pill">Boss final prêt</span> : null}
        </div>
      ) : (
        <div className="questionCompactTop">
          <span className="pill">{MODES.find((m) => m.id === modeId)?.label ?? modeId}</span>
          <span className="pill">{worlds.find((w) => w.id === selectedWorldId)?.icon} {worldLevel}/30</span>
          <span className="pill">{DIFFS.find((d) => d.id === diffId)?.label ?? diffId}</span>
        </div>
      )}

      <div className={`barWrap ${compact ? "barWrapCompact" : ""}`} aria-label="xp">
        <div className="bar" style={{ width: `${xpPct}%` }} />
      </div>

      <div className={`miniHistoryWrap ${compact ? "miniHistoryCompact" : ""}`} aria-label="historique des 10 dernières réponses">
        <div className="miniHistoryLabel">
          10 dernières : <span className="miniHistoryCount">{sessionAnswered}/10</span>
        </div>
        <div className="miniHistory">
          {[...Array(10)].map((_, i) => {
            const item = lastAnswers[i];
            const cls = item ? (item.ok ? "ok" : "bad") : "empty";
            return <span key={i} className={`miniDot ${cls}`} />;
          })}
        </div>
      </div>

      <div className={`heroQuestion ${compact ? "heroQuestionCompact" : ""} ${rushDanger ? "rushDanger" : ""}`} data-status={status}>
        <div className="heroTop">
          <div className="qPrompt">{q.prompt}</div>
          <div className="heroMeta">
            <span className="metaPill">
              <span className="metaIcon">Combo</span> <b>{streak}</b>
            </span>
            {arenaOn && !rushOn && (
              <span className="metaPill">
                <span className="metaIcon">Arène</span> <b>x{arenaMultNow}</b>
              </span>
            )}
            <span className="metaPill">
              <span className="metaIcon">Précision</span> <b>{accuracy}%</b>
            </span>
            {rushOn && (
              <span className="metaPill">
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
                <span className="metaIcon">Boss</span> <b>{bossRemaining}%</b> <b>{bossTimeLeft}s</b>
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
              <div className="bigOp opSep">â‰¡</div>
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

        <div className={`learningRow ${compact ? "learningRowCompact" : ""}`}>
          <button className="btn smooth hover-lift press" onClick={useHint} disabled={!canAskHint}>
            Indice {hintLevel + 1}/{hintList.length}
            {canAskHint && ` (${getHintCost(hintLevel + 1) === 0 ? "gratuit" : `-${getHintCost(hintLevel + 1)} pièce${getHintCost(hintLevel + 1) > 1 ? "s" : ""}`})`}
          </button>
          {!compact && <span className="small">Les indices aident, mais coûtent des pièces (sauf le 1er en facile).</span>}
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

        <div className={`controls ${compact ? "controlsCompact" : ""}`}>
          {q.choices.map((c) => {
            const isPressed = picked === c;
            const stateCls = showExplain && isPressed ? (c === q.correct ? "isRight" : "isWrong") : "";
            return (
              <button key={String(c)} className={`choice choiceCard smooth press ${stateCls}`} onClick={() => submit(c)} aria-pressed={isPressed} disabled={disableChoices}>
                <span className="choiceValue">{String(c)}</span>
              </button>
            );
          })}

          <button className="btn btnPrimary smooth hover-lift press" onClick={goNext} disabled={!showExplain}>
            Suivant
          </button>
        </div>

        {showExplain && (
          <div className={`toast ${status === "ok" ? "ok" : "bad"}`}>
            <div>
              {status === "ok" ? <strong>Bien joue</strong> : <strong>Oups</strong>}
              <div className="sub" style={{ marginTop: 4 }}>
                Bonne reponse : <b>{String(q.correct)}</b>
              </div>
              <div className="sub" style={{ marginTop: 8 }}>
                {explain}
              </div>
              {status === "bad" && methodSteps.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <button className="btn smooth hover-lift press" onClick={() => setShowMethod((v) => !v)}>
                    {showMethod ? "Masquer la methode" : "Voir la methode"}
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



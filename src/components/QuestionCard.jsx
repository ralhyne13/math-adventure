import Fraction from "./Fraction";

export default function QuestionCard({
  status,
  fx,
  spark,
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
  arenaOn,
  arenaMultNow,
  bossActive,
  bossTimeLeft,
  bossRemaining,
  bossHpPct,
  bossProfile,
  bossHitFx,
  bossAttackFx,
  answerEffectId,
}) {
  return (
    <div className={`card smooth ${status === "ok" ? "pulse-ok" : status === "bad" ? "pulse-bad" : ""} ${bossAttackFx ? "bossAttackFx" : ""} ${bossHitFx ? "bossHitFx" : ""}`}>
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

      <div className="cardTitle">
        <span>Choisis la bonne reponse</span>
        <span className="pill">explication puis Suivant</span>
      </div>

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
          Reset session
        </button>
        <span className="pill">Adaptatif: {adaptiveOn ? "ON" : "OFF"}</span>
        <span className="pill">Niveau monde: {worldLevel}/30</span>
        {worldBossDone ? <span className="pill">Boss final vaincu</span> : worldBossReady ? <span className="pill">Boss final pret</span> : null}
      </div>

      <div className="barWrap" aria-label="xp">
        <div className="bar" style={{ width: `${xpPct}%` }} />
      </div>

      <div className="miniHistoryWrap" aria-label="historique des 10 dernieres reponses">
        <div className="miniHistoryLabel">
          10 dernieres : <span className="miniHistoryCount">{sessionAnswered}/10</span>
        </div>
        <div className="miniHistory">
          {[...Array(10)].map((_, i) => {
            const item = lastAnswers[i];
            const cls = item ? (item.ok ? "ok" : "bad") : "empty";
            return <span key={i} className={`miniDot ${cls}`} />;
          })}
        </div>
      </div>

      <div className={`heroQuestion ${rushDanger ? "rushDanger" : ""}`} data-status={status}>
        <div className="heroTop">
          <div className="qPrompt">{q.prompt}</div>
          <div className="heroMeta">
            <span className="metaPill">
              <span className="metaIcon">Combo</span> <b>{streak}</b>
            </span>
            {arenaOn && !rushOn && (
              <span className="metaPill">
                <span className="metaIcon">Arena</span> <b>x{arenaMultNow}</b>
              </span>
            )}
            <span className="metaPill">
              <span className="metaIcon">Precision</span> <b>{accuracy}%</b>
            </span>
            {rushOn && (
              <span className="metaPill">
                <span className="metaIcon">Rush</span> <b>{rushTimeLeft}s</b> <b>x{rushMultNow}</b>
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
            <div className={`bossPanel ${bossHitFx ? "hit" : ""} ${bossAttackFx ? "attack" : ""}`}>
              <div className="bossAvatar" aria-hidden="true">{bossProfile?.emoji ?? "👹"}</div>
              <div style={{ flex: 1 }}>
                <div className="small" style={{ color: "rgba(234,240,255,.92)" }}>
                  Boss Arena
                </div>
                <div style={{ fontWeight: 1100 }}>{bossProfile?.name ?? "Boss mystere"}</div>
              </div>
              <span className="pill">HP {bossRemaining}%</span>
            </div>
            <div className="bossBarWrap" aria-label="boss hp">
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
              <div className="bigOp opSep">≡</div>
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

        <div className="learningRow">
          <button className="btn smooth hover-lift press" onClick={useHint} disabled={!canAskHint}>
            Indice {hintLevel + 1}/{hintList.length}
            {canAskHint && ` (${getHintCost(hintLevel + 1) === 0 ? "gratuit" : `-${getHintCost(hintLevel + 1)} coin`})`}
          </button>
          <span className="small">Les indices aident, mais coutent des coins (sauf le 1er en facile).</span>
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

        <div className="controls">
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

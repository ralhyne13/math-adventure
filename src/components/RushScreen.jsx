import { useEffect, useRef, useState } from "react";
import { clamp } from "../utils/math";
import { playBeep } from "../utils/audio";
import { DIFFS, GRADES, MODES, questionSignature } from "../questions";
import { AVATARS, SKINS } from "../config/gameData";
import Fraction from "./Fraction";

function getRushMultiplier(combo) {
  if (combo >= 15) return 5;
  if (combo >= 10) return 4;
  if (combo >= 6) return 3;
  if (combo >= 3) return 2;
  return 1;
}

function basePoints(diffId) {
  if (diffId === "facile") return 10;
  if (diffId === "moyen") return 14;
  return 18;
}

function speedBonus(rtMs) {
  if (rtMs < 1200) return 6;
  if (rtMs < 2000) return 3;
  return 0;
}

const LEAGUES = [
  { id: "bronze", name: "Bronze", icon: "🥉", min: 0 },
  { id: "silver", name: "Argent", icon: "🥈", min: 1200 },
  { id: "gold", name: "Or", icon: "🥇", min: 2600 },
  { id: "diamond", name: "Diamant", icon: "💎", min: 4200 },
];

function leagueFromScore(score) {
  let cur = LEAGUES[0];
  for (const league of LEAGUES) {
    if (score >= league.min) cur = league;
  }
  return cur;
}

function rollChestRarity(score) {
  const base = clamp((Number(score) || 0) / 5000, 0, 1);
  const r = Math.random();
  const epicChance = 0.06 + base * 0.06;
  const rareChance = 0.22 + base * 0.1;
  if (r < epicChance) return "epic";
  if (r < epicChance + rareChance) return "rare";
  return "common";
}

function coinsForChest(rarity) {
  if (rarity === "epic") return 140 + Math.floor(Math.random() * 81);
  if (rarity === "rare") return 70 + Math.floor(Math.random() * 51);
  return 25 + Math.floor(Math.random() * 31);
}

function pickSkinReward(rarity, ownedSkins) {
  const pool =
    rarity === "epic"
      ? SKINS.filter((s) => s.price >= 180)
      : rarity === "rare"
        ? SKINS.filter((s) => s.price >= 120)
        : SKINS.filter((s) => s.price >= 0);

  const notOwned = pool.filter((s) => !ownedSkins.includes(s.id));
  if (!notOwned.length) return null;
  return notOwned[Math.floor(Math.random() * notOwned.length)];
}

function pickAvatarReward(rarity, ownedAvatars) {
  const pool =
    rarity === "epic"
      ? AVATARS.filter((a) => a.rarity === "Épique" || a.rarity === "Exclusif")
      : rarity === "rare"
        ? AVATARS.filter((a) => a.rarity === "Rare" || a.rarity === "Épique")
        : AVATARS.filter((a) => a.rarity === "Commun" || a.rarity === "Rare");

  const notOwned = pool.filter((a) => !ownedAvatars.includes(a.id));
  if (!notOwned.length) return null;
  return notOwned[Math.floor(Math.random() * notOwned.length)];
}

function rollChestReward({ score, ownedSkins, ownedAvatars }) {
  const rarity = rollChestRarity(score);
  const skinChance = rarity === "epic" ? 0.4 : rarity === "rare" ? 0.26 : 0.12;
  const avatarChance = rarity === "epic" ? 0.45 : rarity === "rare" ? 0.28 : 0.14;

  const r = Math.random();
  if (r < skinChance) {
    const skin = pickSkinReward(rarity, ownedSkins);
    if (skin) return { rarity, kind: "skin", skinId: skin.id, label: `Skin : ${skin.name}` };
  }
  if (r < skinChance + avatarChance) {
    const avatar = pickAvatarReward(rarity, ownedAvatars);
    if (avatar) return { rarity, kind: "avatar", avatarId: avatar.id, label: `Avatar : ${avatar.emoji} ${avatar.name}` };
  }

  const coins = coinsForChest(rarity);
  return { rarity, kind: "coins", coins, label: `+${coins} pieces` };
}

function pushQuestionHistory(historyRef, q, modeId, gradeId, diffId) {
  const sig = questionSignature(q, modeId, gradeId, diffId);
  historyRef.current = [sig, ...(historyRef.current ?? [])].slice(0, 25);
}

function renderQuestionRow(q) {
  if (!q?.row) return null;

  if (q.row.kind === "op") {
    return (
      <>
        <div className="bigOp">{q.row.a}</div>
        <div className="bigOp opSep">{q.row.op}</div>
        <div className="bigOp">{q.row.b}</div>
      </>
    );
  }

  if (q.row.kind === "fracCmp") {
    return (
      <>
        <Fraction n={q.row.aN} d={q.row.aD} />
        <div className="bigOp opSep">?</div>
        <Fraction n={q.row.bN} d={q.row.bD} />
      </>
    );
  }

  if (q.row.kind === "fracEq") {
    return (
      <>
        <Fraction n={q.row.aN} d={q.row.aD} />
        <div className="bigOp opSep">≡</div>
        <Fraction n={q.row.bN} d={q.row.bD} />
      </>
    );
  }

  if (q.row.kind === "fracOp") {
    return (
      <>
        <Fraction n={q.row.aN} d={q.row.aD} />
        <div className="bigOp opSep">{q.row.op}</div>
        <Fraction n={q.row.bN} d={q.row.bD} />
      </>
    );
  }

  if (q.row.kind === "fracSimp") {
    return <Fraction n={q.row.n} d={q.row.d} />;
  }

  if (q.row.kind === "fracVsNum") {
    return (
      <>
        <Fraction n={q.row.aN} d={q.row.aD} />
        <div className="bigOp opSep">?</div>
        <div className="bigOp">{q.row.numLabel}</div>
      </>
    );
  }

  return null;
}

export default function RushScreen({
  onExit,
  gradeId,
  diffId,
  modeId,
  setModeId,
  setGradeId,
  setDiffId,
  audioOn,
  vibrateOn,
  reduceMotion,
  setCoins,
  setOwnedSkins,
  setOwnedAvatars,
  ownedSkins,
  ownedAvatars,
  makeQuestionFn,
}) {
  const qHistoryRef = useRef([]);
  const rafRef = useRef(null);
  const lastTsRef = useRef(0);

  const [phase, setPhase] = useState("start");
  const [timeLeft, setTimeLeft] = useState(60000);
  const [rushScore, setRushScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [mult, setMult] = useState(1);
  const [picked, setPicked] = useState(null);
  const [lock, setLock] = useState(false);
  const [q, setQ] = useState(() => {
    const first = makeQuestionFn(modeId, gradeId, diffId, qHistoryRef);
    pushQuestionHistory(qHistoryRef, first, modeId, gradeId, diffId);
    return first;
  });
  const [qStartedAt, setQStartedAt] = useState(() => performance.now());
  const [floatText, setFloatText] = useState(null);
  const [dangerTime, setDangerTime] = useState(false);
  const [chest, setChest] = useState(null);
  const [chestPhase, setChestPhase] = useState("closed");
  const [newBest, setNewBest] = useState(false);
  const [leagueUp, setLeagueUp] = useState(null);
  const [rushBest, setRushBest] = useState(0);
  const [rushLeague, setRushLeague] = useState("bronze");

  function vibrate(ms) {
    if (!vibrateOn) return;
    try {
      navigator.vibrate?.(ms);
    } catch {}
  }

  function stopLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = 0;
  }

  function newRushQuestion(nextModeId = modeId, nextGradeId = gradeId, nextDiffId = diffId) {
    const qNew = makeQuestionFn(nextModeId, nextGradeId, nextDiffId, qHistoryRef);
    pushQuestionHistory(qHistoryRef, qNew, nextModeId, nextGradeId, nextDiffId);
    setQ(qNew);
    setPicked(null);
    setLock(false);
    setQStartedAt(performance.now());
  }

  function resetRush() {
    stopLoop();
    qHistoryRef.current = [];
    setPhase("start");
    setTimeLeft(60000);
    setRushScore(0);
    setCombo(0);
    setBestCombo(0);
    setMult(1);
    setPicked(null);
    setLock(false);
    setDangerTime(false);
    setFloatText(null);
    setChest(null);
    setChestPhase("closed");
    setNewBest(false);
    setLeagueUp(null);
    newRushQuestion();
  }

  function startRush() {
    stopLoop();
    qHistoryRef.current = [];
    setPhase("play");
    setTimeLeft(60000);
    setRushScore(0);
    setCombo(0);
    setBestCombo(0);
    setMult(1);
    setPicked(null);
    setLock(false);
    setDangerTime(false);
    setFloatText(null);
    setChest(null);
    setChestPhase("closed");
    setNewBest(false);
    setLeagueUp(null);
    newRushQuestion();

    const tick = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      setTimeLeft((t) => Math.max(0, t - dt));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (phase !== "play") return;
    if (timeLeft <= 0) {
      stopLoop();
      setDangerTime(false);
      setPhase("end");
      return;
    }
    setDangerTime(timeLeft <= 10000);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase !== "start") return;
    resetRush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeId, gradeId, diffId]);

  useEffect(() => () => stopLoop(), []);

  useEffect(() => {
    if (phase !== "end") return;

    const isNew = rushScore > (rushBest ?? 0);
    setNewBest(isNew);
    if (isNew) setRushBest(rushScore);

    const prev = rushLeague || "bronze";
    const next = leagueFromScore(rushScore).id;
    if (next !== prev) {
      setLeagueUp({ from: prev, to: next });
      setRushLeague(next);
    }

    const reward = rollChestReward({
      score: rushScore,
      ownedSkins: ownedSkins ?? [],
      ownedAvatars: ownedAvatars ?? [],
    });
    setChest(reward);
    setChestPhase("closed");
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function submitRush(choice) {
    if (phase !== "play" || lock) return;
    setLock(true);

    const now = performance.now();
    const rt = now - qStartedAt;
    const ok = choice === q.correct;
    setPicked(choice);

    if (ok) {
      const nextCombo = combo + 1;
      const nextMult = getRushMultiplier(nextCombo);
      const pts = (basePoints(diffId) + speedBonus(rt)) * nextMult;

      setTimeLeft((t) => Math.min(75000, t + 900));
      setRushScore((s) => s + pts);
      setCombo(nextCombo);
      setBestCombo((b) => Math.max(b, nextCombo));
      setMult(nextMult);

      playBeep("ok", audioOn);
      vibrate(12);
      setFloatText(`+${pts}`);

      setTimeout(() => {
        setFloatText(null);
        newRushQuestion();
      }, reduceMotion ? 0 : 140);
    } else {
      const subMs = 1400;
      setTimeLeft((t) => Math.max(0, t - subMs));
      setCombo(0);
      setMult(1);

      playBeep("bad", audioOn);
      vibrate(40);
      setFloatText(`-${(subMs / 1000).toFixed(1)}s`);

      setTimeout(() => {
        setFloatText(null);
        newRushQuestion();
      }, reduceMotion ? 0 : 180);
    }
  }

  function openChest() {
    if (!chest || chestPhase !== "closed") return;
    setChestPhase("opening");

    setTimeout(() => {
      if (chest.kind === "coins") {
        setCoins?.((c) => c + chest.coins);
      } else if (chest.kind === "skin") {
        setOwnedSkins?.((s) => (s.includes(chest.skinId) ? s : [...s, chest.skinId]));
      } else if (chest.kind === "avatar") {
        setOwnedAvatars?.((a) => (a.includes(chest.avatarId) ? a : [...a, chest.avatarId]));
      }

      playBeep("ok", audioOn);
      vibrate(16);
      setChestPhase("opened");
    }, reduceMotion ? 0 : 520);
  }

  const timePct = Math.round((timeLeft / 60000) * 100);

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <div className="logo smooth" />
          <div>
            <div className="h1">Rush 60s</div>
            <div className="sub">Score max, combo et multiplicateur</div>
          </div>
        </div>

        <div className="hudRight">
          <button className="btn smooth hover-lift press" onClick={onExit}>
            Retour
          </button>
          <button className="btn smooth hover-lift press" onClick={resetRush}>
            Reset
          </button>
        </div>
      </div>

      {phase === "start" && (
        <div className="card smooth">
          <div className="cardTitle">
            <span>Pret ?</span>
            <span className="pill">Mode arcade</span>
          </div>

          <div className="filters" style={{ marginTop: 12 }}>
            <select className="select smooth" value={modeId} onChange={(e) => setModeId(e.target.value)}>
              {MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.icon} {m.label}
                </option>
              ))}
            </select>

            <select className="select smooth" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
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
          </div>

          <div className="toast" style={{ marginTop: 14 }}>
            <div>
              <strong>Regles</strong>
              <div className="sub" style={{ marginTop: 8 }}>
                Bonne reponse : +0.9s et points x multiplicateur
                <br />
                Erreur : -1.4s et combo reset
                <br />
                Combo : x2 a 3, x3 a 6, x4 a 10, x5 a 15
              </div>
            </div>
            <span className="pill">60s</span>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btnPrimary smooth hover-lift press" onClick={startRush}>
              Lancer le Rush
            </button>
          </div>
        </div>
      )}

      {phase === "play" && (
        <div className="card smooth">
          <div className="rushHud">
            <div className="rushHudLeft">
              <div className={`rushTime ${dangerTime ? "danger" : ""}`}>⏱ {(timeLeft / 1000).toFixed(1)}s</div>
              <div className={`rushBarWrap ${dangerTime ? "danger" : ""}`}>
                <div
                  className="rushBar"
                  style={{
                    width: `${clamp(timePct, 0, 100)}%`,
                    background: dangerTime ? "linear-gradient(90deg, #ef4444, #f97316)" : undefined,
                  }}
                />
              </div>
            </div>

            <div className="rushHudMid">
              <div className="rushCombo">Combo {combo}</div>
              <div className="rushMult">x{mult}</div>
            </div>

            <div className="rushHudRight">
              <div className="rushScore">{rushScore}</div>
              <div className="small">
                Best combo: <b>{bestCombo}</b>
              </div>
            </div>
          </div>

          <div className="heroQuestion" style={{ marginTop: 12 }}>
            <div className="heroTop">
              <div className="qPrompt">{q.prompt}</div>
              <div className="heroMeta">
                <span className="metaPill">Rush</span>
              </div>
            </div>

            <div className="qRow">{renderQuestionRow(q)}</div>

            {floatText && <div className={`rushFloat ${floatText.startsWith("+") ? "ok" : "bad"}`}>{floatText}</div>}

            <div className="controls">
              {q.choices.map((c) => (
                <button
                  key={String(c)}
                  className={`choice choiceCard smooth press ${picked === c ? "isWrong" : ""}`}
                  onClick={() => submitRush(c)}
                  disabled={lock}
                >
                  <span className="choiceValue">{String(c)}</span>
                </button>
              ))}
            </div>

            {dangerTime && (
              <div className="small" style={{ marginTop: 12, color: "rgba(255,170,170,.95)", fontWeight: 1100 }}>
                Zone critique: moins de 10 secondes.
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "end" && (
        <div className="card smooth">
          <div className="cardTitle">
            <span>Fin du Rush</span>
            <span className="pill">resultats</span>
          </div>

          <div className="stats" style={{ marginTop: 12 }}>
            <div className="statBox smooth">
              <div className="statLabel">Score</div>
              <div className="statValue">{rushScore}</div>
            </div>
            <div className="statBox smooth">
              <div className="statLabel">Meilleur combo</div>
              <div className="statValue">{bestCombo}</div>
            </div>
          </div>

          <div className="toast" style={{ marginTop: 14 }}>
            <div>
              <strong>🏆 Record Rush</strong>
              <div className="sub" style={{ marginTop: 8 }}>
                Record : <b>{rushBest}</b>
                {newBest && <span className="pill" style={{ marginLeft: 8 }}>NOUVEAU !</span>}
              </div>
            </div>
            <span className="pill">⚡ Rush</span>
          </div>

          <div className="toast" style={{ marginTop: 12 }}>
            <div>
              <strong>🥇 Ligue</strong>
              <div className="sub" style={{ marginTop: 8 }}>
                Actuelle :{" "}
                <b>
                  {leagueFromScore(rushBest ?? 0).icon} {leagueFromScore(rushBest ?? 0).name}
                </b>
                {leagueUp && (
                  <div className="small" style={{ marginTop: 6 }}>
                    Promotion : {LEAGUES.find((l) => l.id === leagueUp.from)?.icon} → {LEAGUES.find((l) => l.id === leagueUp.to)?.icon}
                  </div>
                )}
              </div>
            </div>
            <span className="pill">Saison local</span>
          </div>

          {chest && (
            <div className="chestCard smooth" style={{ marginTop: 12 }}>
              <div className="chestTop">
                <div>
                  <div style={{ fontWeight: 1100 }}>
                    🎁 Coffre {chest.rarity === "epic" ? "Epique" : chest.rarity === "rare" ? "Rare" : "Commun"}
                  </div>
                  <div className="small" style={{ marginTop: 6 }}>
                    Ouvre pour recuperer ta recompense.
                  </div>
                </div>
                <span className="pill">{chest.rarity === "epic" ? "✨" : chest.rarity === "rare" ? "🌟" : "🎈"}</span>
              </div>

              <div className={`chestBox ${chestPhase}`} aria-live="polite">
                <div className="chestEmoji">🧰</div>
                {chestPhase === "opened" ? (
                  <div className="chestReward">
                    <div style={{ fontWeight: 1200 }}>{chest.label}</div>
                    <div className="small" style={{ marginTop: 6 }}>Recompense ajoutee ✅</div>
                  </div>
                ) : (
                  <button className="btn btnPrimary smooth hover-lift press" onClick={openChest} disabled={chestPhase !== "closed"}>
                    {chestPhase === "opening" ? "Ouverture..." : "Ouvrir"}
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btnPrimary smooth hover-lift press" onClick={startRush}>
              Rejouer
            </button>
            <button className="btn smooth hover-lift press" onClick={resetRush}>
              Retour menu Rush
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

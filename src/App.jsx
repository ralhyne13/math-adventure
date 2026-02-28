import { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";

/* ------------------------ Utils ------------------------ */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b !== 0) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}

function simplify(n, d) {
  const g = gcd(n, d);
  return [n / g, d / g];
}

function cmpFractions(aN, aD, bN, bD) {
  const left = aN * bD;
  const right = bN * aD;
  if (left > right) return ">";
  if (left < right) return "<";
  return "=";
}

function safeLSGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function safeLSSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/* ------------------------ Skins (visuel) ------------------------ */
const SKINS = [
  {
    id: "neon-night",
    name: "Neon Night",
    desc: "Violet + vert, premium",
    vars: {
      "--bg1": "#0b1020",
      "--bg2": "#0b1228",
      "--accent": "#7c3aed",
      "--accent2": "#22c55e",
      "--text": "#eaf0ff",
      "--muted": "rgba(234,240,255,.72)",
    },
  },
  {
    id: "ocean-glass",
    name: "Ocean Glass",
    desc: "Bleu + cyan, calme",
    vars: {
      "--bg1": "#071523",
      "--bg2": "#071a2b",
      "--accent": "#3b82f6",
      "--accent2": "#22d3ee",
      "--text": "#eaf6ff",
      "--muted": "rgba(234,246,255,.70)",
    },
  },
  {
    id: "sunset-luxe",
    name: "Sunset Luxe",
    desc: "Rose + ambre, punchy",
    vars: {
      "--bg1": "#1a0b1d",
      "--bg2": "#140a16",
      "--accent": "#ec4899",
      "--accent2": "#f59e0b",
      "--text": "#fff0fb",
      "--muted": "rgba(255,240,251,.70)",
    },
  },
  {
    id: "mint-minimal",
    name: "Mint Minimal",
    desc: "Vert menthe, très clean",
    vars: {
      "--bg1": "#071a16",
      "--bg2": "#04110f",
      "--accent": "#10b981",
      "--accent2": "#a7f3d0",
      "--text": "#eafff9",
      "--muted": "rgba(234,255,249,.70)",
    },
  },
  {
    id: "mono-premium",
    name: "Mono Premium",
    desc: "Noir + argent, sobre",
    vars: {
      "--bg1": "#090b10",
      "--bg2": "#06070b",
      "--accent": "#a3a3a3",
      "--accent2": "#ffffff",
      "--text": "#f5f7ff",
      "--muted": "rgba(245,247,255,.68)",
    },
  },
  {
    id: "candy-play",
    name: "Candy Play",
    desc: "Ludique, coloré",
    vars: {
      "--bg1": "#0a0f25",
      "--bg2": "#070b1a",
      "--accent": "#a855f7",
      "--accent2": "#60a5fa",
      "--text": "#eef2ff",
      "--muted": "rgba(238,242,255,.72)",
    },
  },
];

const LS_KEY = "math-duel-v1";

/* ------------------------ Grades + difficulté ------------------------ */
const GRADES = [
  { id: "CP", label: "CP" },
  { id: "CE1", label: "CE1" },
  { id: "CE2", label: "CE2" },
  { id: "CM1", label: "CM1" },
  { id: "CM2", label: "CM2" },
];

const DIFFS = [
  { id: "facile", label: "Facile" },
  { id: "moyen", label: "Moyen" },
  { id: "difficile", label: "Difficile" },
];

const MODES = [
  { id: "add", label: "Addition", icon: "+" },
  { id: "sub", label: "Soustraction", icon: "−" },
  { id: "mul", label: "Multiplication", icon: "×" },
  { id: "div", label: "Division", icon: "÷" },
  { id: "cmpFrac", label: "Comparer fractions", icon: "?" },
  { id: "eqFrac", label: "Équivalences", icon: "≡" },
];

function gradeBase(gradeId) {
  // Bornes de base (ajustées par difficulté)
  switch (gradeId) {
    case "CP":  return { addMax: 20, subMax: 20, mulMaxA: 5, mulMaxB: 5, divMaxB: 5, fracDen: 6 };
    case "CE1": return { addMax: 100, subMax: 100, mulMaxA: 7, mulMaxB: 7, divMaxB: 7, fracDen: 9 };
    case "CE2": return { addMax: 500, subMax: 500, mulMaxA: 10, mulMaxB: 10, divMaxB: 10, fracDen: 12 };
    case "CM1": return { addMax: 2000, subMax: 2000, mulMaxA: 12, mulMaxB: 12, divMaxB: 12, fracDen: 14 };
    case "CM2": return { addMax: 5000, subMax: 5000, mulMaxA: 15, mulMaxB: 15, divMaxB: 15, fracDen: 18 };
    default:    return { addMax: 100, subMax: 100, mulMaxA: 10, mulMaxB: 10, divMaxB: 10, fracDen: 12 };
  }
}

function diffFactor(diffId) {
  if (diffId === "facile") return 0.7;
  if (diffId === "moyen") return 1.0;
  return 1.35;
}

/* ------------------------ Générateurs de questions ------------------------ */
function makeChoicesNumber(correct, spread = 10) {
  const s = Math.max(3, spread);
  const set = new Set([correct]);
  while (set.size < 4) {
    const delta = randInt(-s, s);
    const v = correct + delta;
    if (v >= 0) set.add(v);
  }
  return shuffle([...set]);
}

function makeQAdd(cfg) {
  const max = Math.max(10, Math.round(cfg.addMax));
  const a = randInt(0, max);
  const b = randInt(0, max);
  const correct = a + b;
  const choices = makeChoicesNumber(correct, Math.max(6, Math.round(max * 0.12)));
  return {
    type: "number",
    prompt: "Calcule :",
    row: { kind: "op", a, op: "+", b },
    correct,
    choices,
    explain: (picked) => {
      const ok = picked === correct;
      return ok
        ? `✅ ${a} + ${b} = ${correct}.`
        : `❌ On additionne : ${a} + ${b} = ${correct}. Tu as choisi ${picked}.`;
    },
  };
}

function makeQSub(cfg) {
  const max = Math.max(10, Math.round(cfg.subMax));
  let a = randInt(0, max);
  let b = randInt(0, max);
  if (b > a) [a, b] = [b, a]; // pas de négatif
  const correct = a - b;
  const choices = makeChoicesNumber(correct, Math.max(6, Math.round(max * 0.12)));
  return {
    type: "number",
    prompt: "Calcule :",
    row: { kind: "op", a, op: "−", b },
    correct,
    choices,
    explain: (picked) => {
      const ok = picked === correct;
      return ok
        ? `✅ ${a} − ${b} = ${correct}.`
        : `❌ On soustrait : ${a} − ${b} = ${correct}. Tu as choisi ${picked}.`;
    },
  };
}

function makeQMul(cfg) {
  const aMax = Math.max(3, Math.round(cfg.mulMaxA));
  const bMax = Math.max(3, Math.round(cfg.mulMaxB));
  const a = randInt(0, aMax);
  const b = randInt(0, bMax);
  const correct = a * b;
  const choices = makeChoicesNumber(correct, Math.max(6, Math.round((aMax * bMax) * 0.08)));
  return {
    type: "number",
    prompt: "Calcule :",
    row: { kind: "op", a, op: "×", b },
    correct,
    choices,
    explain: (picked) => {
      const ok = picked === correct;
      const repeated = b <= 12 ? `${a} × ${b} = ${a} + ${a} + … (${b} fois)` : `${a} × ${b}`;
      return ok
        ? `✅ ${a} × ${b} = ${correct}.`
        : `❌ Multiplication : ${repeated} = ${correct}. Tu as choisi ${picked}.`;
    },
  };
}

function makeQDiv(cfg) {
  const bMax = Math.max(2, Math.round(cfg.divMaxB));
  const b = randInt(2, bMax);
  const q = randInt(1, Math.max(6, Math.round(bMax * 1.2))); // quotient
  const a = b * q; // division entière
  const correct = q;
  const choices = makeChoicesNumber(correct, Math.max(4, Math.round(q * 0.8 + 6)));
  return {
    type: "number",
    prompt: "Calcule :",
    row: { kind: "op", a, op: "÷", b },
    correct,
    choices,
    explain: (picked) => {
      const ok = picked === correct;
      return ok
        ? `✅ ${a} ÷ ${b} = ${correct} car ${b} × ${correct} = ${a}.`
        : `❌ Pour diviser, on cherche le nombre qui multiplié par ${b} donne ${a}. Ici ${b} × ${correct} = ${a}. Tu as choisi ${picked}.`;
    },
  };
}

function makeQCmpFrac(cfg) {
  const denMax = Math.max(6, Math.round(cfg.fracDen));
  const aD = randInt(2, denMax);
  const bD = randInt(2, denMax);
  const aN = randInt(1, aD - 1);
  const bN = randInt(1, bD - 1);

  const [saN, saD] = simplify(aN, aD);
  const [sbN, sbD] = simplify(bN, bD);

  const correct = cmpFractions(saN, saD, sbN, sbD);

  return {
    type: "symbol",
    prompt: "Compare :",
    row: { kind: "fracCmp", aN: saN, aD: saD, bN: sbN, bD: sbD },
    correct,
    choices: ["<", "=", ">"],
    explain: (picked) => {
      const left = saN * sbD;
      const right = sbN * saD;
      const cmp = left > right ? ">" : left < right ? "<" : "=";
      if (picked === correct) {
        return `✅ Produit en croix : ${saN}×${sbD} = ${left} et ${sbN}×${saD} = ${right}. Donc ${saN}/${saD} ${cmp} ${sbN}/${sbD}.`;
      }
      return `❌ Produit en croix : ${saN}×${sbD} = ${left} et ${sbN}×${saD} = ${right}. Comme ${left} ${cmp} ${right}, on a ${saN}/${saD} ${cmp} ${sbN}/${sbD}.`;
    },
  };
}

function makeQEqFrac(cfg) {
  const denMax = Math.max(6, Math.round(cfg.fracDen));
  let aD = randInt(2, denMax);
  let aN = randInt(1, aD - 1);
  [aN, aD] = simplify(aN, aD);

  const k = randInt(2, clamp(Math.round(denMax / 4), 3, 6));
  const isEquivalent = Math.random() < 0.5;

  let bN, bD;
  if (isEquivalent) {
    bN = aN * k;
    bD = aD * k;
  } else {
    // proche mais pas équivalent
    bN = aN * k + randInt(1, 2);
    bD = aD * k;
  }

  const correctBool = isEquivalent ? "Oui" : "Non";
  const left = aN * bD;
  const right = bN * aD;

  return {
    type: "yesno",
    prompt: "Ces fractions sont-elles équivalentes ?",
    row: { kind: "fracEq", aN, aD, bN, bD },
    correct: correctBool,
    choices: ["Oui", "Non"],
    explain: (picked) => {
      const ok = picked === correctBool;
      const eq = left === right ? "équivalentes" : "pas équivalentes";
      const method = `Test (produit en croix) : ${aN}×${bD}=${left} et ${bN}×${aD}=${right}.`;
      if (ok) {
        if (isEquivalent) {
          return `✅ Oui, elles sont équivalentes. ${method} (égalité) → fractions équivalentes.`;
        }
        return `✅ Non, elles ne sont pas équivalentes. ${method} (pas égal) → pas équivalentes.`;
      }
      return `❌ Réponse attendue : ${correctBool}. ${method} Donc elles sont ${eq}.`;
    },
  };
}

function makeQuestion(modeId, gradeId, diffId) {
  const base = gradeBase(gradeId);
  const f = diffFactor(diffId);

  const cfg = {
    addMax: Math.round(base.addMax * f),
    subMax: Math.round(base.subMax * f),
    mulMaxA: Math.round(base.mulMaxA * f),
    mulMaxB: Math.round(base.mulMaxB * f),
    divMaxB: Math.round(base.divMaxB * f),
    fracDen: Math.round(base.fracDen * f),
  };

  switch (modeId) {
    case "add": return makeQAdd(cfg);
    case "sub": return makeQSub(cfg);
    case "mul": return makeQMul(cfg);
    case "div": return makeQDiv(cfg);
    case "cmpFrac": return makeQCmpFrac(cfg);
    case "eqFrac": return makeQEqFrac(cfg);
    default: return makeQAdd(cfg);
  }
}

/* ------------------------ UI pieces ------------------------ */
function Fraction({ n, d }) {
  return (
    <div className="fraction" aria-label={`${n} sur ${d}`}>
      <span>{n}</span>
      <span>{d}</span>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div className="modalTitle">{title}</div>
          <button className="btn btnGhost smooth hover-lift press" onClick={onClose}>Fermer</button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------ App ------------------------ */
export default function App() {
  const TOTAL = 10;

  // Load settings/profile
  const initial = useMemo(() => {
    const saved = safeLSGet(LS_KEY, null);
    return {
      skinId: saved?.skinId ?? "neon-night",
      gradeId: saved?.gradeId ?? "CE1",
      diffId: saved?.diffId ?? "moyen",
      modeId: saved?.modeId ?? "add",
      records: saved?.records ?? {}, // nested
      bestStreak: saved?.bestStreak ?? 0,
      totalGames: saved?.totalGames ?? 0,
      totalRight: saved?.totalRight ?? 0,
      totalWrong: saved?.totalWrong ?? 0,
    };
  }, []);

  const [skinId, setSkinId] = useState(initial.skinId);
  const [gradeId, setGradeId] = useState(initial.gradeId);
  const [diffId, setDiffId] = useState(initial.diffId);
  const [modeId, setModeId] = useState(initial.modeId);

  const [records, setRecords] = useState(initial.records);
  const [bestStreak, setBestStreak] = useState(initial.bestStreak);
  const [totalGames, setTotalGames] = useState(initial.totalGames);
  const [totalRight, setTotalRight] = useState(initial.totalRight);
  const [totalWrong, setTotalWrong] = useState(initial.totalWrong);

  // Game state
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const [q, setQ] = useState(() => makeQuestion(modeId, gradeId, diffId));
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | ok | bad
  const [lastExplain, setLastExplain] = useState("");

  const lockRef = useRef(false);

  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const progressPct = useMemo(() => Math.round(((round - 1) / TOTAL) * 100), [round]);
  const isGameOver = round > TOTAL;

  // Apply skin vars
  useEffect(() => {
    const skin = SKINS.find(s => s.id === skinId) ?? SKINS[0];
    Object.entries(skin.vars).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
  }, [skinId]);

  // Persist to localStorage
  useEffect(() => {
    safeLSSet(LS_KEY, {
      skinId, gradeId, diffId, modeId,
      records, bestStreak,
      totalGames, totalRight, totalWrong,
    });
  }, [skinId, gradeId, diffId, modeId, records, bestStreak, totalGames, totalRight, totalWrong]);

  // Reset game when mode/grade/diff change
  useEffect(() => {
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeId, gradeId, diffId]);

  function restart() {
    lockRef.current = false;
    setRound(1);
    setScore(0);
    setStreak(0);
    setPicked(null);
    setStatus("idle");
    setLastExplain("");
    setQ(makeQuestion(modeId, gradeId, diffId));
  }

  function getBestScoreFor(mId, gId, dId) {
    return records?.[gId]?.[dId]?.[mId]?.bestScore ?? 0;
  }

  function updateRecordIfNeeded(finalScore) {
    setRecords(prev => {
      const next = structuredClone(prev ?? {});
      next[gradeId] ??= {};
      next[gradeId][diffId] ??= {};
      next[gradeId][diffId][modeId] ??= { bestScore: 0 };
      next[gradeId][diffId][modeId].bestScore = Math.max(
        next[gradeId][diffId][modeId].bestScore ?? 0,
        finalScore
      );
      return next;
    });
  }

  function finishGame(finalScore) {
    setTotalGames(g => g + 1);
    updateRecordIfNeeded(finalScore);
  }

  function nextQuestion() {
    setQ(makeQuestion(modeId, gradeId, diffId));
    setPicked(null);
    setStatus("idle");
    setLastExplain("");
  }

  function submit(choice) {
    if (lockRef.current || isGameOver) return;
    lockRef.current = true;

    setPicked(choice);

    const isCorrect = choice === q.correct;

    if (isCorrect) {
      setStatus("ok");
      setTotalRight(x => x + 1);

      setScore(s => s + 10 + Math.min(15, streak * 2)); // bonus combo
      setStreak(st => {
        const ns = st + 1;
        setBestStreak(bs => Math.max(bs, ns));
        return ns;
      });

      setLastExplain(q.explain(choice));
    } else {
      setStatus("bad");
      setTotalWrong(x => x + 1);
      setStreak(0);
      setLastExplain(q.explain(choice));
    }

    setTimeout(() => {
      const nr = round + 1;
      if (nr <= TOTAL) {
        setRound(nr);
        setQ(makeQuestion(modeId, gradeId, diffId));
        setPicked(null);
        setStatus("idle");
        // On garde l’explication un peu ? -> on l’efface pour la prochaine question
        setLastExplain("");
      } else {
        setRound(nr); // game over
        finishGame(score + (isCorrect ? (10 + Math.min(15, streak * 2)) : 0));
      }
      lockRef.current = false;
    }, 750);
  }

  const modeLabel = MODES.find(m => m.id === modeId)?.label ?? "Mode";
  const gradeLabel = gradeId;
  const diffLabel = DIFFS.find(d => d.id === diffId)?.label ?? diffId;

  const bestScore = getBestScoreFor(modeId, gradeId, diffId);

  const skin = SKINS.find(s => s.id === skinId) ?? SKINS[0];

  const accuracy = useMemo(() => {
    const total = totalRight + totalWrong;
    if (!total) return 0;
    return Math.round((totalRight / total) * 100);
  }, [totalRight, totalWrong]);

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <div className="logo smooth hover-lift" />
          <div>
            <div className="h1">Math Duel</div>
            <div className="sub">Jeu de maths • {modeLabel} • {gradeLabel} • {diffLabel}</div>
          </div>
        </div>

        <div className="row">
          <span className="pill">Manche {Math.min(round, TOTAL)}/{TOTAL}</span>
          <span className="pill">Record: {bestScore}</span>

          <button className="btn smooth hover-lift press" onClick={() => setShowProfile(true)}>
            Profil
          </button>
          <button className="btn btnPrimary smooth hover-lift press" onClick={() => setShowShop(true)}>
            Boutique
          </button>
        </div>
      </div>

      <div className="grid">
        {/* MAIN */}
        <div className={`card smooth ${status === "ok" ? "pulse-ok" : status === "bad" ? "pulse-bad" : ""}`}>
          <div className="cardTitle">
            <span>Mode</span>
            <span className="pill">+10 pts (bonus combo)</span>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select className="select smooth hover-lift" value={modeId} onChange={(e) => setModeId(e.target.value)}>
              {MODES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
            </select>

            <select className="select smooth hover-lift" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              {GRADES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>

            <select className="select smooth hover-lift" value={diffId} onChange={(e) => setDiffId(e.target.value)}>
              {DIFFS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>

            <button className="btn smooth hover-lift press" onClick={restart}>Rejouer</button>
            <button className="btn smooth hover-lift press" onClick={nextQuestion} disabled={isGameOver}>
              Nouvelle question
            </button>
          </div>

          <div className="progressWrap" aria-label="progression">
            <div className="progressBar" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="question">
            <div className="qPrompt">{q.prompt}</div>

            <div className="qRow">
              {q.row.kind === "op" && (
                <>
                  <div className="bigOp">{q.row.a}</div>
                  <div className="bigOp">{q.row.op}</div>
                  <div className="bigOp">{q.row.b}</div>
                </>
              )}

              {q.row.kind === "fracCmp" && (
                <>
                  <Fraction n={q.row.aN} d={q.row.aD} />
                  <div className="bigOp">?</div>
                  <Fraction n={q.row.bN} d={q.row.bD} />
                </>
              )}

              {q.row.kind === "fracEq" && (
                <>
                  <Fraction n={q.row.aN} d={q.row.aD} />
                  <div className="bigOp">≡</div>
                  <Fraction n={q.row.bN} d={q.row.bD} />
                </>
              )}
            </div>

            {/* Choices */}
            <div className="controls">
              {q.choices.map((c) => (
                <button
                  key={String(c)}
                  className="choice smooth hover-lift press"
                  onClick={() => submit(c)}
                  aria-pressed={picked === c}
                  disabled={isGameOver}
                >
                  {String(c)}
                </button>
              ))}
            </div>

            {/* Feedback + explication */}
            {(status !== "idle" || isGameOver) && (
              <div className={`toast ${status === "ok" ? "ok" : status === "bad" ? "bad" : ""}`}>
                <div>
                  {status === "ok" ? <strong>✅ Bien joué !</strong> : status === "bad" ? <strong>❌ Oups…</strong> : <strong>🏁 Fin de partie</strong>}
                  <div className="sub">
                    {status === "idle" && isGameOver
                      ? `Score final: ${score}. Record actuel: ${Math.max(bestScore, score)}.`
                      : `Bonne réponse : ${String(q.correct)}.`}
                  </div>
                  {lastExplain && (
                    <div className="sub" style={{ marginTop: 6 }}>
                      {lastExplain}
                    </div>
                  )}
                </div>

                <span className="pill">Combo: {streak}</span>
              </div>
            )}
          </div>
        </div>

        {/* SIDE */}
        <div className="card smooth">
          <div className="cardTitle">
            <span>Tableau de bord</span>
            <span className="pill">{skin.name}</span>
          </div>

          <div className="stats">
            <div className="statBox smooth hover-lift">
              <div className="statLabel">Score</div>
              <div className="statValue">{score}</div>
            </div>
            <div className="statBox smooth hover-lift">
              <div className="statLabel">Combo</div>
              <div className="statValue">{streak}</div>
            </div>
            <div className="statBox smooth hover-lift">
              <div className="statLabel">Record (mode)</div>
              <div className="statValue">{bestScore}</div>
            </div>
            <div className="statBox smooth hover-lift">
              <div className="statLabel">Précision</div>
              <div className="statValue">{accuracy}%</div>
            </div>
          </div>

          <div className="toast" style={{ marginTop: 14 }}>
            <div>
              <strong>Tips</strong>
              <div className="sub" style={{ marginTop: 2 }}>
                Fractions : compare avec <b>produit en croix</b> (a×d et c×b).<br/>
                Division : vérifie avec <b>diviseur × quotient</b>.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn smooth hover-lift press"
              onClick={() => navigator.clipboard?.writeText(String(score)).catch(() => {})}
              title="Copier le score"
            >
              Copier score
            </button>
            <button
              className="btn smooth hover-lift press"
              onClick={() => {
                safeLSSet(LS_KEY, {
                  skinId, gradeId, diffId, modeId,
                  records: {},
                  bestStreak: 0,
                  totalGames: 0,
                  totalRight: 0,
                  totalWrong: 0,
                });
                setRecords({});
                setBestStreak(0);
                setTotalGames(0);
                setTotalRight(0);
                setTotalWrong(0);
              }}
              title="Reset profil"
            >
              Reset profil
            </button>
          </div>
        </div>
      </div>

      {/* Boutique */}
      {showShop && (
        <Modal title="Boutique — Skins (visuel)" onClose={() => setShowShop(false)}>
          <div className="small" style={{ marginBottom: 12 }}>
            Choisis un skin : ça change uniquement le style (pas de monnaie, juste fun ✨).
          </div>

          <div className="skinGrid">
            {SKINS.map(s => (
              <div key={s.id} className="skinCard smooth hover-lift">
                <div
                  className="skinPreview"
                  style={{
                    background: `linear-gradient(135deg, ${s.vars["--accent"]}, ${s.vars["--accent2"]})`,
                  }}
                />
                <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight: 1000 }}>{s.name}</div>
                    <div className="small">{s.desc}</div>
                  </div>
                  <button
                    className={`btn smooth hover-lift press ${skinId === s.id ? "btnPrimary" : ""}`}
                    onClick={() => setSkinId(s.id)}
                  >
                    {skinId === s.id ? "Équipé" : "Équiper"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Profil */}
      {showProfile && (
        <Modal title="Profil — Records" onClose={() => setShowProfile(false)}>
          <div className="toast" style={{ marginTop: 0 }}>
            <div>
              <strong>Statistiques globales</strong>
              <div className="sub" style={{ marginTop: 6 }}>
                Parties : <b>{totalGames}</b> • Bonnes réponses : <b>{totalRight}</b> • Erreurs : <b>{totalWrong}</b> • Précision : <b>{accuracy}%</b><br/>
                Meilleur combo (streak) : <b>{bestStreak}</b>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }} className="small">
            Records par <b>classe</b> → <b>difficulté</b> → <b>mode</b> :
          </div>

          <div style={{ marginTop: 10, display:"grid", gap: 10 }}>
            {GRADES.map(g => (
              <div key={g.id} className="skinCard">
                <div style={{ fontWeight: 1000, marginBottom: 6 }}>{g.label}</div>
                {DIFFS.map(d => (
                  <div key={d.id} style={{ marginBottom: 8 }}>
                    <div className="small" style={{ marginBottom: 6 }}>• {d.label}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap: 8 }}>
                      {MODES.map(m => {
                        const v = records?.[g.id]?.[d.id]?.[m.id]?.bestScore ?? 0;
                        return (
                          <div key={m.id} className="statBox" style={{ padding: 10 }}>
                            <div className="statLabel">{m.label}</div>
                            <div className="statValue" style={{ fontSize: 18 }}>{v}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
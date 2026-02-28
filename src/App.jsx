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
function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
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

function parisDayKey() {
  return new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}

/* ------------------------ WebAudio (sons) ------------------------ */
function playBeep(kind = "ok", enabled = true) {
  if (!enabled) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;

    if (kind === "ok") {
      o.type = "sine";
      o.frequency.setValueAtTime(740, now);
      o.frequency.exponentialRampToValueAtTime(980, now + 0.08);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      o.start(now);
      o.stop(now + 0.18);
    } else {
      o.type = "square";
      o.frequency.setValueAtTime(180, now);
      o.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.20, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      o.start(now);
      o.stop(now + 0.22);
    }

    setTimeout(() => ctx.close().catch(() => {}), 300);
  } catch {}
}

/* ------------------------ Skins + Avatars ------------------------ */
const SKINS = [
  { id: "neon-night", name: "Neon Night", price: 0, desc: "Violet + vert, premium", animated: true,
    vars: { "--bg1":"#0b1020","--bg2":"#0b1228","--accent":"#7c3aed","--accent2":"#22c55e","--text":"#eaf0ff","--muted":"rgba(234,240,255,.72)" } },
  { id: "ocean-glass", name: "Ocean Glass", price: 120, desc: "Bleu + cyan, calme", animated: true,
    vars: { "--bg1":"#071523","--bg2":"#071a2b","--accent":"#3b82f6","--accent2":"#22d3ee","--text":"#eaf6ff","--muted":"rgba(234,246,255,.70)" } },
  { id: "sunset-luxe", name: "Sunset Luxe", price: 180, desc: "Rose + ambre, punchy", animated: true,
    vars: { "--bg1":"#1a0b1d","--bg2":"#140a16","--accent":"#ec4899","--accent2":"#f59e0b","--text":"#fff0fb","--muted":"rgba(255,240,251,.70)" } },
  { id: "mint-minimal", name: "Mint Minimal", price: 150, desc: "Menthe, ultra clean", animated: false,
    vars: { "--bg1":"#071a16","--bg2":"#04110f","--accent":"#10b981","--accent2":"#a7f3d0","--text":"#eafff9","--muted":"rgba(234,255,249,.70)" } },
  { id: "mono-premium", name: "Mono Premium", price: 220, desc: "Noir + argent, sobre", animated: false,
    vars: { "--bg1":"#090b10","--bg2":"#06070b","--accent":"#a3a3a3","--accent2":"#ffffff","--text":"#f5f7ff","--muted":"rgba(245,247,255,.68)" } },
  { id: "candy-play", name: "Candy Play", price: 160, desc: "Ludique, coloré", animated: true,
    vars: { "--bg1":"#0a0f25","--bg2":"#070b1a","--accent":"#a855f7","--accent2":"#60a5fa","--text":"#eef2ff","--muted":"rgba(238,242,255,.72)" } },
];

const AVATARS = [
  { id: "owl",   name: "Hibou",   emoji: "🦉", price: 0 },
  { id: "robot", name: "Robot",   emoji: "🤖", price: 120 },
  { id: "fox",   name: "Renard",  emoji: "🦊", price: 140 },
  { id: "astro", name: "Astronaute", emoji: "🧑‍🚀", price: 200 },
  { id: "dragon",name: "Dragon",  emoji: "🐉", price: 260 },
  { id: "ninja", name: "Ninja",   emoji: "🥷", price: 220 },
];

/* ------------------------ Grades + difficulté + modes ------------------------ */
const GRADES = [
  { id: "CP", label: "CP" },
  { id: "CE1", label: "CE1" },
  { id: "CE2", label: "CE2" },
  { id: "CM1", label: "CM1" },
  { id: "CM2", label: "CM2" },
  { id: "6e", label: "6e" },
  { id: "5e", label: "5e" },
  { id: "4e", label: "4e" },
  { id: "3e", label: "3e" },
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
  switch (gradeId) {
    case "CP":  return { addMax: 20, subMax: 20, mulA: 5,  mulB: 5,  divB: 5,  fracDen: 6 };
    case "CE1": return { addMax: 100, subMax: 100, mulA: 7,  mulB: 7,  divB: 7,  fracDen: 9 };
    case "CE2": return { addMax: 500, subMax: 500, mulA: 10, mulB: 10, divB: 10, fracDen: 12 };
    case "CM1": return { addMax: 2000, subMax: 2000, mulA: 12, mulB: 12, divB: 12, fracDen: 14 };
    case "CM2": return { addMax: 5000, subMax: 5000, mulA: 15, mulB: 15, divB: 15, fracDen: 18 };
    case "6e":  return { addMax: 20000, subMax: 20000, mulA: 20, mulB: 20, divB: 20, fracDen: 20 };
    case "5e":  return { addMax: 50000, subMax: 50000, mulA: 30, mulB: 30, divB: 30, fracDen: 24 };
    case "4e":  return { addMax: 100000, subMax: 100000, mulA: 50, mulB: 50, divB: 50, fracDen: 30 };
    case "3e":  return { addMax: 200000, subMax: 200000, mulA: 80, mulB: 80, divB: 80, fracDen: 36 };
    default:    return { addMax: 100, subMax: 100, mulA: 10, mulB: 10, divB: 10, fracDen: 12 };
  }
}
function diffFactor(diffId) {
  if (diffId === "facile") return 0.7;
  if (diffId === "moyen") return 1.0;
  return 1.35;
}

/* ------------------------ XP / Level ------------------------ */
function xpToNext(level) {
  return 120 + level * 35;
}
function awardLevelCoins(levelGained) {
  return 25 + levelGained * 5;
}

/* ------------------------ (1) Ligues (6) ------------------------ */
/* Mix score session + précision globale + combo max (léger) */
const LEAGUES = [
  { id: "bronze",   name: "Bronze",   icon: "🥉", min: 0 },
  { id: "silver",   name: "Argent",   icon: "🥈", min: 260 },
  { id: "gold",     name: "Or",       icon: "🥇", min: 520 },
  { id: "plat",     name: "Platine",  icon: "💠", min: 820 },
  { id: "diamond",  name: "Diamant",  icon: "💎", min: 1150 },
  { id: "master",   name: "Master",   icon: "👑", min: 1500 },
];

function computeRating({ score, accuracy, bestStreak, level }) {
  // score session = principal, précision = gros bonus, streak = petit bonus, niveau = mini bonus
  const v =
    score * 1.15 +
    accuracy * 6 +
    Math.min(60, bestStreak * 2) +
    Math.min(80, level * 1.5);
  return Math.max(0, Math.round(v));
}
function leagueFromRating(rating) {
  let idx = 0;
  for (let i = 0; i < LEAGUES.length; i++) {
    if (rating >= LEAGUES[i].min) idx = i;
  }
  return { ...LEAGUES[idx], rank: idx };
}
function leagueReward(rankGained) {
  // oui : bonus coins quand tu montes
  return 80 + rankGained * 60;
}

/* ------------------------ Anti répétitions (6) ------------------------ */
function questionSignature(q, modeId, gradeId, diffId) {
  const base = `${modeId}|${gradeId}|${diffId}|${q.row.kind}|${q.correct}`;
  if (q.row.kind === "op") return `${base}|${q.row.a}|${q.row.op}|${q.row.b}`;
  if (q.row.kind === "fracCmp") return `${base}|${q.row.aN}/${q.row.aD}|${q.row.bN}/${q.row.bD}`;
  if (q.row.kind === "fracEq") return `${base}|${q.row.aN}/${q.row.aD}|${q.row.bN}/${q.row.bD}`;
  return base;
}

/* ------------------------ Questions ------------------------ */
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
  const max = Math.max(10, cfg.addMax);
  const a = randInt(0, max);
  const b = randInt(0, max);
  const correct = a + b;
  return {
    prompt: "Calcule :",
    row: { kind: "op", a, op: "+", b },
    correct,
    choices: makeChoicesNumber(correct, Math.max(6, Math.round(max * 0.12))),
    explain: (picked) => picked === correct
      ? `✅ ${a} + ${b} = ${correct}.`
      : `❌ Addition : ${a} + ${b} = ${correct}. Tu as choisi ${picked}.`,
  };
}

function makeQSub(cfg) {
  const max = Math.max(10, cfg.subMax);
  let a = randInt(0, max);
  let b = randInt(0, max);
  if (b > a) [a, b] = [b, a];
  const correct = a - b;
  return {
    prompt: "Calcule :",
    row: { kind: "op", a, op: "−", b },
    correct,
    choices: makeChoicesNumber(correct, Math.max(6, Math.round(max * 0.12))),
    explain: (picked) => picked === correct
      ? `✅ ${a} − ${b} = ${correct}.`
      : `❌ Soustraction : ${a} − ${b} = ${correct}. Tu as choisi ${picked}.`,
  };
}

function makeQMul(cfg) {
  const aMax = Math.max(3, cfg.mulA);
  const bMax = Math.max(3, cfg.mulB);
  const a = randInt(0, aMax);
  const b = randInt(0, bMax);
  const correct = a * b;
  return {
    prompt: "Calcule :",
    row: { kind: "op", a, op: "×", b },
    correct,
    choices: makeChoicesNumber(correct, Math.max(6, Math.round((aMax * bMax) * 0.08))),
    explain: (picked) => picked === correct
      ? `✅ ${a} × ${b} = ${correct}.`
      : `❌ Multiplication : ${a} × ${b} = ${correct}. Tu as choisi ${picked}.`,
  };
}

function makeQDiv(cfg) {
  const bMax = Math.max(2, cfg.divB);
  const b = randInt(2, bMax);
  const q = randInt(1, Math.max(8, Math.round(bMax * 1.3)));
  const a = b * q;
  const correct = q;
  return {
    prompt: "Calcule :",
    row: { kind: "op", a, op: "÷", b },
    correct,
    choices: makeChoicesNumber(correct, Math.max(4, Math.round(q * 0.8 + 8))),
    explain: (picked) => picked === correct
      ? `✅ ${a} ÷ ${b} = ${correct} car ${b} × ${correct} = ${a}.`
      : `❌ Division : on cherche x tel que ${b}×x=${a}. Ici x=${correct}. Tu as choisi ${picked}.`,
  };
}

/* (7) Explications fractions adaptées au niveau */
function fracCompareExplain({ aN, aD, bN, bD }, picked, correct, gradeId) {
  const isMiddleSchool = ["6e","5e","4e","3e"].includes(gradeId);

  if (isMiddleSchool) {
    const left = aN * bD;
    const right = bN * aD;
    const cmp = left > right ? ">" : left < right ? "<" : "=";
    if (picked === correct) {
      return `✅ Produit en croix : ${aN}×${bD}=${left} et ${bN}×${aD}=${right}. Donc ${aN}/${aD} ${cmp} ${bN}/${bD}.`;
    }
    return `❌ Produit en croix : ${aN}×${bD}=${left} et ${bN}×${aD}=${right}. Comme ${left} ${cmp} ${right}, la bonne réponse est "${correct}".`;
  }

  const common = lcm(aD, bD);
  const aMul = common / aD;
  const bMul = common / bD;
  const aEq = aN * aMul;
  const bEq = bN * bMul;
  const cmp = aEq > bEq ? ">" : aEq < bEq ? "<" : "=";

  const line = `On met au même dénominateur ${common} : ${aN}/${aD} = ${aEq}/${common} et ${bN}/${bD} = ${bEq}/${common}.`;
  if (picked === correct) return `✅ ${line} Puis on compare ${aEq} et ${bEq} → ${aEq} ${cmp} ${bEq}.`;
  return `❌ ${line} Comme ${aEq} ${cmp} ${bEq}, la bonne réponse est "${correct}".`;
}

function makeQCmpFrac(cfg, gradeId) {
  const denMax = Math.max(6, cfg.fracDen);
  const aD = randInt(2, denMax);
  const bD = randInt(2, denMax);
  const aN = randInt(1, aD - 1);
  const bN = randInt(1, bD - 1);

  const [saN, saD] = simplify(aN, aD);
  const [sbN, sbD] = simplify(bN, bD);
  const correct = cmpFractions(saN, saD, sbN, sbD);

  return {
    prompt: "Compare :",
    row: { kind: "fracCmp", aN: saN, aD: saD, bN: sbN, bD: sbD },
    correct,
    choices: ["<", "=", ">"],
    explain: (picked) => fracCompareExplain({ aN: saN, aD: saD, bN: sbN, bD: sbD }, picked, correct, gradeId),
  };
}

function makeQEqFrac(cfg, gradeId) {
  const denMax = Math.max(6, cfg.fracDen);
  let aD = randInt(2, denMax);
  let aN = randInt(1, aD - 1);
  [aN, aD] = simplify(aN, aD);

  const k = randInt(2, clamp(Math.round(denMax / 4), 3, 7));
  const isEq = Math.random() < 0.5;

  let bN, bD;
  if (isEq) {
    bN = aN * k;
    bD = aD * k;
  } else {
    bN = aN * k + randInt(1, 2);
    bD = aD * k;
  }

  const correct = isEq ? "Oui" : "Non";
  const left = aN * bD;
  const right = bN * aD;

  const isMiddleSchool = ["6e","5e","4e","3e"].includes(gradeId);

  return {
    prompt: "Ces fractions sont-elles équivalentes ?",
    row: { kind: "fracEq", aN, aD, bN, bD },
    correct,
    choices: ["Oui", "Non"],
    explain: (picked) => {
      const ok = picked === correct;
      const eq = left === right;

      if (isMiddleSchool) {
        const test = `Test : ${aN}×${bD}=${left} et ${bN}×${aD}=${right}.`;
        if (ok && eq) return `✅ Oui. ${test} (égalité) → équivalentes.`;
        if (ok && !eq) return `✅ Non. ${test} (différent) → pas équivalentes.`;
        return `❌ Réponse attendue : ${correct}. ${test} → ${eq ? "équivalentes" : "pas équivalentes"}.`;
      }

      const factN = bN / aN;
      const factD = bD / aD;
      const sameFactor = Number.isFinite(factN) && Number.isFinite(factD) && Math.abs(factN - factD) < 1e-9;

      if (ok && eq) {
        return sameFactor
          ? `✅ Oui. On multiplie ${aN}/${aD} par ${Math.round(factN)} : ${aN}×${Math.round(factN)}/${aD}×${Math.round(factN)} = ${bN}/${bD}.`
          : `✅ Oui. Les deux fractions représentent la même valeur.`;
      }
      if (ok && !eq) return `✅ Non. Elles ne donnent pas la même valeur.`;

      return `❌ Réponse attendue : ${correct}. ${eq ? "Elles sont équivalentes." : "Elles ne sont pas équivalentes."}`;
    },
  };
}

function makeQuestionCore(modeId, gradeId, diffId) {
  const base = gradeBase(gradeId);
  const f = diffFactor(diffId);
  const cfg = {
    addMax: Math.round(base.addMax * f),
    subMax: Math.round(base.subMax * f),
    mulA: Math.round(base.mulA * f),
    mulB: Math.round(base.mulB * f),
    divB: Math.round(base.divB * f),
    fracDen: Math.round(base.fracDen * f),
  };

  switch (modeId) {
    case "add": return makeQAdd(cfg);
    case "sub": return makeQSub(cfg);
    case "mul": return makeQMul(cfg);
    case "div": return makeQDiv(cfg);
    case "cmpFrac": return makeQCmpFrac(cfg, gradeId);
    case "eqFrac": return makeQEqFrac(cfg, gradeId);
    default: return makeQAdd(cfg);
  }
}

function makeQuestion(modeId, gradeId, diffId, historyRef) {
  const hist = historyRef?.current ?? [];
  for (let tries = 0; tries < 20; tries++) {
    const q = makeQuestionCore(modeId, gradeId, diffId);
    const sig = questionSignature(q, modeId, gradeId, diffId);
    if (!hist.includes(sig)) return q;
  }
  return makeQuestionCore(modeId, gradeId, diffId);
}

/* ------------------------ UI components ------------------------ */
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

/* ------------------------ Daily missions ------------------------ */
function generateDailyMissions() {
  const pool = [
    { id: "right15", text: "Fais 15 bonnes réponses", type: "right", target: 15, reward: 80 },
    { id: "right30", text: "Fais 30 bonnes réponses", type: "right", target: 30, reward: 150 },
    { id: "streak5", text: "Atteins un combo de 5", type: "streak", target: 5, reward: 100 },
    { id: "streak10", text: "Atteins un combo de 10", type: "streak", target: 10, reward: 190 },
    { id: "q40", text: "Réponds à 40 questions", type: "questions", target: 40, reward: 120 },
    { id: "q80", text: "Réponds à 80 questions", type: "questions", target: 80, reward: 220 },
  ];
  return shuffle(pool).slice(0, 3).map(m => ({ ...m, progress: 0, claimed: false }));
}

const LS_KEY = "math-duel-v5";

/* ------------------------ Achievements (Badges) ------------------------ */
const ACHIEVEMENTS = [
  { id: "streak5",  icon: "🔥", title: "Combo 5",  desc: "Atteins un combo de 5.", reward: 50,  type: "streak", target: 5 },
  { id: "streak10", icon: "🔥", title: "Combo 10", desc: "Atteins un combo de 10.", reward: 90, type: "streak", target: 10 },
  { id: "streak20", icon: "🔥", title: "Combo 20", desc: "Atteins un combo de 20.", reward: 160, type: "streak", target: 20 },

  { id: "right50",  icon: "✅", title: "50 bonnes",  desc: "Totalise 50 bonnes réponses.", reward: 80,  type: "right", target: 50 },
  { id: "right100", icon: "✅", title: "100 bonnes", desc: "Totalise 100 bonnes réponses.", reward: 140, type: "right", target: 100 },
  { id: "right300", icon: "✅", title: "300 bonnes", desc: "Totalise 300 bonnes réponses.", reward: 260, type: "right", target: 300 },

  { id: "q100",  icon: "🎯", title: "100 questions",  desc: "Réponds à 100 questions.", reward: 90,  type: "questions", target: 100 },
  { id: "q500",  icon: "🎯", title: "500 questions",  desc: "Réponds à 500 questions.", reward: 220, type: "questions", target: 500 },
  { id: "q1000", icon: "🎯", title: "1000 questions", desc: "Réponds à 1000 questions.", reward: 400, type: "questions", target: 1000 },

  { id: "acc90_50", icon: "🎖️", title: "Précision 90%", desc: "Atteins 90% de précision sur au moins 50 réponses.", reward: 200, type: "accuracy", target: 90 },
];

function formatDateFR(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR");
  } catch {
    return "";
  }
}

/* ------------------------ App ------------------------ */
export default function App() {
  const qHistoryRef = useRef([]);
  const autoTimerRef = useRef(null);
  const badgeTimerRef = useRef(null);

  // refs XP
  const levelRef = useRef(1);
  const xpRef = useRef(0);

  const initial = useMemo(() => {
    const saved = safeLSGet(LS_KEY, null);
    return {
      skinId: saved?.skinId ?? "neon-night",
      gradeId: saved?.gradeId ?? "CE1",
      diffId: saved?.diffId ?? "moyen",
      modeId: saved?.modeId ?? "add",

      coins: saved?.coins ?? 120,
      avatarId: saved?.avatarId ?? "owl",
      ownedSkins: saved?.ownedSkins ?? ["neon-night"],
      ownedAvatars: saved?.ownedAvatars ?? ["owl"],

      // XP
      level: saved?.level ?? 1,
      xp: saved?.xp ?? 0,

      // records
      records: saved?.records ?? {},
      bestStreak: saved?.bestStreak ?? 0,
      totalRight: saved?.totalRight ?? 0,
      totalWrong: saved?.totalWrong ?? 0,
      totalQuestions: saved?.totalQuestions ?? 0,

      // settings
      audioOn: saved?.audioOn ?? true,
      vibrateOn: saved?.vibrateOn ?? true,
      autoNextOn: saved?.autoNextOn ?? false,
      autoNextMs: saved?.autoNextMs ?? 1800,
      reduceMotion: saved?.reduceMotion ?? false,

      // daily
      dayKey: saved?.dayKey ?? null,
      dailyGiftClaimed: saved?.dailyGiftClaimed ?? false,
      dailyMissions: saved?.dailyMissions ?? null,
      dailyStats: saved?.dailyStats ?? { right: 0, questions: 0, bestStreak: 0 },

      // achievements
      achievements: saved?.achievements ?? {},

      // (1) ligues
      bestLeagueRank: saved?.bestLeagueRank ?? 0,
    };
  }, []);

  const [skinId, setSkinId] = useState(initial.skinId);
  const [gradeId, setGradeId] = useState(initial.gradeId);
  const [diffId, setDiffId] = useState(initial.diffId);
  const [modeId, setModeId] = useState(initial.modeId);

  const [coins, setCoins] = useState(initial.coins);
  const [avatarId, setAvatarId] = useState(initial.avatarId);
  const [ownedSkins, setOwnedSkins] = useState(initial.ownedSkins);
  const [ownedAvatars, setOwnedAvatars] = useState(initial.ownedAvatars);

  const [level, setLevel] = useState(initial.level);
  const [xp, setXp] = useState(initial.xp);

  const [records, setRecords] = useState(initial.records);
  const [bestStreak, setBestStreak] = useState(initial.bestStreak);
  const [totalRight, setTotalRight] = useState(initial.totalRight);
  const [totalWrong, setTotalWrong] = useState(initial.totalWrong);
  const [totalQuestions, setTotalQuestions] = useState(initial.totalQuestions);

  const [audioOn, setAudioOn] = useState(initial.audioOn);
  const [vibrateOn, setVibrateOn] = useState(initial.vibrateOn);
  const [autoNextOn, setAutoNextOn] = useState(initial.autoNextOn);
  const [autoNextMs, setAutoNextMs] = useState(initial.autoNextMs);
  const [reduceMotion, setReduceMotion] = useState(initial.reduceMotion);

  const [dayKey, setDayKey] = useState(initial.dayKey);
  const [dailyGiftClaimed, setDailyGiftClaimed] = useState(initial.dailyGiftClaimed);
  const [dailyMissions, setDailyMissions] = useState(initial.dailyMissions);
  const [dailyStats, setDailyStats] = useState(initial.dailyStats);

  const [achievements, setAchievements] = useState(initial.achievements);
  const [badgePop, setBadgePop] = useState(null);

  // (1) ligue : meilleure ligue atteinte (rank)
  const [bestLeagueRank, setBestLeagueRank] = useState(initial.bestLeagueRank);

  // Session
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(1);

  const [q, setQ] = useState(() => makeQuestion(modeId, gradeId, diffId, qHistoryRef));
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState("idle");
  const [explain, setExplain] = useState("");
  const [showExplain, setShowExplain] = useState(false);

  // lock anti double-clic
  const [isLocked, setIsLocked] = useState(false);

  // FX
  const [fx, setFx] = useState("none");
  const [spark, setSpark] = useState(false);

  // Modals
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shopTab, setShopTab] = useState("skins");
  const [profileTab, setProfileTab] = useState("stats");

  const avatar = AVATARS.find(a => a.id === avatarId) ?? AVATARS[0];
  const skin = SKINS.find(s => s.id === skinId) ?? SKINS[0];

  // sync refs XP
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { xpRef.current = xp; }, [xp]);

  // Apply skin vars
  useEffect(() => {
    Object.entries(skin.vars).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
  }, [skin]);

  // Reduce motion toggle
  useEffect(() => {
    document.body.classList.toggle("reduce-motion", !!reduceMotion);
  }, [reduceMotion]);

  // (10) skins animés : active body.anim-skin si skin.animated et pas reduce-motion
  useEffect(() => {
    const on = !!skin.animated && !reduceMotion;
    document.body.classList.toggle("anim-skin", on);
  }, [skin.animated, reduceMotion]);

  function resetDailyFor(today) {
    setDayKey(today);
    setDailyGiftClaimed(false);
    setDailyMissions(generateDailyMissions());
    setDailyStats({ right: 0, questions: 0, bestStreak: 0 });
  }

  // Daily init + auto-check
  useEffect(() => {
    const today = parisDayKey();
    if (dayKey !== today) {
      resetDailyFor(today);
    } else {
      if (!dailyMissions) setDailyMissions(generateDailyMissions());
    }

    const t = setInterval(() => {
      const nowKey = parisDayKey();
      setDayKey((prev) => {
        if (prev !== nowKey) {
          resetDailyFor(nowKey);
          return nowKey;
        }
        return prev;
      });
    }, 60_000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist
  useEffect(() => {
    safeLSSet(LS_KEY, {
      skinId, gradeId, diffId, modeId,
      coins, avatarId, ownedSkins, ownedAvatars,
      level, xp,
      records, bestStreak, totalRight, totalWrong, totalQuestions,
      audioOn, vibrateOn, autoNextOn, autoNextMs, reduceMotion,
      dayKey, dailyGiftClaimed, dailyMissions, dailyStats,
      achievements,
      bestLeagueRank,
    });
  }, [
    skinId, gradeId, diffId, modeId,
    coins, avatarId, ownedSkins, ownedAvatars,
    level, xp,
    records, bestStreak, totalRight, totalWrong, totalQuestions,
    audioOn, vibrateOn, autoNextOn, autoNextMs, reduceMotion,
    dayKey, dailyGiftClaimed, dailyMissions, dailyStats,
    achievements,
    bestLeagueRank,
  ]);

  // Reset question when mode/grade/diff change
  useEffect(() => {
    newQuestion(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeId, gradeId, diffId]);

  function vibrate(ms) {
    if (!vibrateOn) return;
    try { navigator.vibrate?.(ms); } catch {}
  }

  function clearAutoTimer() {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }

  function showBadgePopup(payload) {
    setBadgePop(payload);
    if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    badgeTimerRef.current = setTimeout(() => setBadgePop(null), 2600);
  }

  function awardCoins(amount) {
    setCoins(c => c + Math.max(0, amount));
  }

  // XP robuste
  function awardXp(amount) {
    const add = Math.max(0, amount);

    let lvl = levelRef.current;
    let xpNow = xpRef.current + add;

    while (xpNow >= xpToNext(lvl)) {
      xpNow -= xpToNext(lvl);
      lvl += 1;
      awardCoins(awardLevelCoins(lvl));
    }

    levelRef.current = lvl;
    xpRef.current = xpNow;
    setLevel(lvl);
    setXp(xpNow);
  }

  function updateDailyMissions(nextDailyStats) {
    setDailyMissions(prev => {
      const missions = prev ?? generateDailyMissions();
      return missions.map(m => {
        let progress = m.progress;
        if (m.type === "right") progress = nextDailyStats.right;
        if (m.type === "questions") progress = nextDailyStats.questions;
        if (m.type === "streak") progress = nextDailyStats.bestStreak;
        return { ...m, progress };
      });
    });
  }

  function claimMission(missionId) {
    setDailyMissions(prev => {
      const missions = prev ?? [];
      const idx = missions.findIndex(m => m.id === missionId);
      if (idx < 0) return missions;

      const m = missions[idx];
      const done = m.progress >= m.target;
      if (!done || m.claimed) return missions;

      awardCoins(m.reward);
      const next = [...missions];
      next[idx] = { ...m, claimed: true };
      return next;
    });
  }

  function claimDailyGift() {
    if (dailyGiftClaimed) return;
    const gift = randInt(40, 90);
    awardCoins(gift);
    setDailyGiftClaimed(true);
  }

  function getBestScoreFor(mId, gId, dId) {
    return records?.[gId]?.[dId]?.[mId]?.bestScore ?? 0;
  }

  // plus de structuredClone
  function updateRecordIfNeeded(finalScore) {
    setRecords(prev => {
      const next = JSON.parse(JSON.stringify(prev ?? {}));
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

  function triggerFx(kind) {
    setFx(kind);
    if (kind === "ok") {
      setSpark(true);
      setTimeout(() => setSpark(false), 850);
    }
    setTimeout(() => setFx("none"), 750);
  }

  function pushHistory(qNew) {
    const sig = questionSignature(qNew, modeId, gradeId, diffId);
    const arr = qHistoryRef.current ?? [];
    const next = [sig, ...arr];
    qHistoryRef.current = next.slice(0, 12);
  }

  function newQuestion(resetPick = false) {
    clearAutoTimer();
    const qNew = makeQuestion(modeId, gradeId, diffId, qHistoryRef);
    pushHistory(qNew);

    setQ(qNew);
    setStatus("idle");
    setExplain("");
    setShowExplain(false);
    setFx("none");
    setSpark(false);
    setIsLocked(false);
    if (resetPick) setPicked(null);
  }

  function resetSession() {
    clearAutoTimer();
    setScore(0);
    setStreak(0);
    setQuestionIndex(1);
    newQuestion(true);
  }

  function isUnlocked(achId) {
    return !!achievements?.[achId]?.unlocked;
  }

  function unlockAchievement(a) {
    if (isUnlocked(a.id)) return;
    const iso = new Date().toISOString();
    setAchievements(prev => ({
      ...(prev ?? {}),
      [a.id]: { unlocked: true, date: iso },
    }));
    awardCoins(a.reward);
    showBadgePopup({
      icon: a.icon,
      title: `Badge débloqué : ${a.title}`,
      desc: `+${a.reward} coins • ${a.desc}`,
      reward: a.reward,
    });
  }

  function checkAchievements(snapshot) {
    for (const a of ACHIEVEMENTS) {
      if (isUnlocked(a.id)) continue;

      if (a.type === "streak" && snapshot.streak >= a.target) unlockAchievement(a);
      if (a.type === "right" && snapshot.totalRight >= a.target) unlockAchievement(a);
      if (a.type === "questions" && snapshot.totalQuestions >= a.target) unlockAchievement(a);
      if (a.type === "accuracy" && snapshot.totalAnswers >= 50 && snapshot.accuracy >= a.target) unlockAchievement(a);
    }
  }

  function submit(choice) {
    if (isLocked || showExplain) return;
    setIsLocked(true);
    clearAutoTimer();

    setPicked(choice);
    const isCorrect = choice === q.correct;

    const nextTotalQuestions = totalQuestions + 1;
    const nextTotalRight = totalRight + (isCorrect ? 1 : 0);
    const nextTotalWrong = totalWrong + (isCorrect ? 0 : 1);
    const nextStreak = isCorrect ? (streak + 1) : 0;
    const nextScoreAdd = isCorrect ? (10 + Math.min(18, streak * 2)) : 0;

    const nextTotalAnswers = nextTotalRight + nextTotalWrong;
    const nextAccuracy = nextTotalAnswers ? Math.round((nextTotalRight / nextTotalAnswers) * 100) : 0;

    setTotalQuestions(x => x + 1);

    if (isCorrect) {
      setStatus("ok");
      playBeep("ok", audioOn);
      vibrate(20);
      triggerFx("ok");

      awardCoins(3);
      setTotalRight(x => x + 1);

      setScore(s => s + nextScoreAdd);

      setStreak(st => {
        const ns = st + 1;
        setBestStreak(bs => Math.max(bs, ns));
        return ns;
      });

      awardXp(10 + Math.min(8, streak));

      setExplain(q.explain(choice));
      setShowExplain(true);

      updateRecordIfNeeded(score + nextScoreAdd);
    } else {
      setStatus("bad");
      playBeep("bad", audioOn);
      vibrate(60);
      triggerFx("bad");

      setCoins(c => Math.max(0, c - 1));

      setTotalWrong(x => x + 1);
      setStreak(0);

      awardXp(4);

      setExplain(q.explain(choice));
      setShowExplain(true);
    }

    // daily stats
    setDailyStats(ds => {
      const next = {
        ...ds,
        questions: ds.questions + 1,
        right: ds.right + (isCorrect ? 1 : 0),
        bestStreak: Math.max(ds.bestStreak, nextStreak),
      };
      updateDailyMissions(next);
      return next;
    });

    // achievements
    checkAchievements({
      streak: nextStreak,
      totalRight: nextTotalRight,
      totalQuestions: nextTotalQuestions,
      totalAnswers: nextTotalAnswers,
      accuracy: nextAccuracy,
    });

    // Auto-next
    if (autoNextOn) {
      autoTimerRef.current = setTimeout(() => {
        goNext();
      }, clamp(autoNextMs, 600, 6000));
    }
  }

  function goNext() {
    setQuestionIndex(i => i + 1);
    newQuestion(true);
  }

  function canBuy(price) {
    return coins >= price;
  }

  function buySkin(s) {
    if (ownedSkins.includes(s.id)) return;
    if (!canBuy(s.price)) return;
    setCoins(c => c - s.price);
    setOwnedSkins(list => [...list, s.id]);
    setSkinId(s.id);
  }

  function buyAvatar(a) {
    if (ownedAvatars.includes(a.id)) return;
    if (!canBuy(a.price)) return;
    setCoins(c => c - a.price);
    setOwnedAvatars(list => [...list, a.id]);
    setAvatarId(a.id);
  }

  function equipSkin(sid) {
    if (!ownedSkins.includes(sid)) return;
    setSkinId(sid);
  }

  function equipAvatar(aid) {
    if (!ownedAvatars.includes(aid)) return;
    setAvatarId(aid);
  }

  const bestScore = getBestScoreFor(modeId, gradeId, diffId);
  const modeLabel = MODES.find(m => m.id === modeId)?.label ?? "Mode";
  const diffLabel = DIFFS.find(d => d.id === diffId)?.label ?? diffId;

  const accuracy = useMemo(() => {
    const total = totalRight + totalWrong;
    if (!total) return 0;
    return Math.round((totalRight / total) * 100);
  }, [totalRight, totalWrong]);

  const xpNeed = xpToNext(level);
  const xpPct = Math.round((xp / xpNeed) * 100);

  const unlockedCount = useMemo(() => {
    return ACHIEVEMENTS.filter(a => isUnlocked(a.id)).length;
  }, [achievements]);

  // (1) ligue courante + best ligue
  const rating = useMemo(() => {
    return computeRating({ score, accuracy, bestStreak, level });
  }, [score, accuracy, bestStreak, level]);

  const league = useMemo(() => leagueFromRating(rating), [rating]);
  const bestLeague = useMemo(() => ({ ...LEAGUES[Math.max(0, Math.min(bestLeagueRank, LEAGUES.length - 1))], rank: bestLeagueRank }), [bestLeagueRank]);

  // (1) si tu montes de ligue : bonus coins + pop
  useEffect(() => {
    if (league.rank > bestLeagueRank) {
      const gained = league.rank - bestLeagueRank;
      const reward = leagueReward(gained);
      setBestLeagueRank(league.rank);
      awardCoins(reward);
      showBadgePopup({
        icon: league.icon,
        title: `Promotion : ${league.name} !`,
        desc: `Score ligue: ${rating} • +${reward} coins`,
        reward,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league.rank]);

  const disableChoices = isLocked || showExplain;

  return (
    <div className="shell">
      {/* Badge popup */}
      {badgePop && (
        <div className="badgePop">
          <div className="badgePopInner smooth">
            <div className="badgeIcon" style={{ background: "rgba(0,0,0,.22)" }}>{badgePop.icon}</div>
            <div style={{ flex: 1 }}>
              <div className="badgePopTitle">{badgePop.title}</div>
              <div className="badgePopSub">{badgePop.desc}</div>
            </div>
            <button className="btn btnPrimary smooth hover-lift press" onClick={() => setBadgePop(null)}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className="topbar">
        <div className="brand">
          <div className="logo smooth hover-lift" />
          <div>
            <div className="h1">Math Duel <span style={{ opacity: .85 }}>{avatar.emoji}</span></div>
            <div className="sub">
              Illimité • {modeLabel} • {gradeId} • {diffLabel} • Ligue: <b>{league.icon} {league.name}</b>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="coins smooth hover-lift" title="Monnaie virtuelle">
            <span className="coinDot" />
            <span>{coins} coins</span>
          </div>

          <span className="pill">Q#{questionIndex}</span>
          <span className="pill">Record: {bestScore}</span>
          <span className="pill">Badges: {unlockedCount}/{ACHIEVEMENTS.length}</span>
          <span className="pill">Ligue: {league.icon} {league.name} • {rating}</span>

          <button className="btn smooth hover-lift press" onClick={() => setShowSettings(true)}>
            Réglages
          </button>
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
        <div className={`card smooth ${status === "ok" ? "pulse-ok" : status === "bad" ? "pulse-bad shake" : ""}`}>
          {/* FX overlays */}
          <div className={`fx ${fx === "ok" ? "fxOk" : fx === "bad" ? "fxBad" : ""}`} />
          <div className={`sparkles ${spark ? "on" : ""}`}>
            {[...Array(10)].map((_, i) => (
              <i
                key={i}
                style={{
                  left: `${10 + (i * 9)}%`,
                  top: `${60 - (i % 4) * 10}%`,
                  animationDelay: `${i * 20}ms`,
                }}
              />
            ))}
          </div>

          <div className="cardTitle">
            <span>Choisis la bonne réponse</span>
            <span className="pill">XP + coins • explication puis Suivant</span>
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

            <button className="btn smooth hover-lift press" onClick={resetSession}>Reset session</button>
          </div>

          {/* XP bar */}
          <div className="barWrap" aria-label="xp">
            <div className="bar" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="small" style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span>Niveau <b>{level}</b></span>
            <span>XP <b>{xp}</b>/<b>{xpNeed}</b></span>
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

            <div className="controls">
              {q.choices.map((c) => (
                <button
                  key={String(c)}
                  className="choice smooth hover-lift press"
                  onClick={() => submit(c)}
                  aria-pressed={picked === c}
                  disabled={disableChoices}
                >
                  {String(c)}
                </button>
              ))}
              <button
                className="btn btnPrimary smooth hover-lift press"
                onClick={goNext}
                disabled={!showExplain}
                title={autoNextOn ? "Auto-suivant activé aussi" : "Passe à la question suivante"}
              >
                Suivant
              </button>
            </div>

            {showExplain && (
              <div className={`toast ${status === "ok" ? "ok" : "bad"}`}>
                <div>
                  {status === "ok" ? <strong>✅ Bien joué !</strong> : <strong>❌ Oups…</strong>}
                  <div className="sub" style={{ marginTop: 4 }}>
                    Bonne réponse : <b>{String(q.correct)}</b>
                  </div>
                  <div className="sub" style={{ marginTop: 8 }}>
                    {explain}
                  </div>
                  <div className="small" style={{ marginTop: 8 }}>
                    Tu peux lire tranquillement, puis appuyer sur <b>Suivant</b>
                    {autoNextOn ? ` (auto dans ${Math.round(autoNextMs / 1000)}s).` : "."}
                  </div>
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
            <span className="pill">{skin.name}{skin.animated ? " ✨" : ""}</span>
          </div>

          <div className="stats">
            <div className="statBox smooth hover-lift">
              <div className="statLabel">Score session</div>
              <div className="statValue">{score}</div>
            </div>
            <div className="statBox smooth hover-lift">
              <div className="statLabel">Combo</div>
              <div className="statValue">{streak}</div>
            </div>
            <div className="statBox smooth hover-lift">
              <div className="statLabel">Précision</div>
              <div className="statValue">{accuracy}%</div>
            </div>
            <div className="statBox smooth hover-lift">
              <div className="statLabel">Ligue</div>
              <div className="statValue" style={{ fontSize: 18 }}>{league.icon} {league.name}</div>
              <div className="small" style={{ marginTop: 6 }}>Score ligue : <b>{rating}</b></div>
            </div>
          </div>

          <div className="toast" style={{ marginTop: 14 }}>
            <div>
              <strong>Quotidien — {dayKey || parisDayKey()}</strong>
              <div className="sub" style={{ marginTop: 6 }}>
                Cadeau quotidien : {dailyGiftClaimed ? <b>déjà récupéré</b> : <b>disponible</b>}
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn btnPrimary smooth hover-lift press" onClick={claimDailyGift} disabled={dailyGiftClaimed}>
                  🎁 Récupérer le cadeau
                </button>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {(dailyMissions ?? []).map(m => {
                  const done = m.progress >= m.target;
                  return (
                    <div key={m.id} className="shopCard">
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 1100 }}>{m.text}</div>
                          <div className="small">
                            Progression : <b>{Math.min(m.progress, m.target)}/{m.target}</b>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span className="price"><span className="coinDot" /> {m.reward}</span>
                          <button
                            className={`btn smooth hover-lift press ${done && !m.claimed ? "btnPrimary" : ""}`}
                            disabled={!done || m.claimed}
                            onClick={() => claimMission(m.id)}
                          >
                            {m.claimed ? "✅ Pris" : done ? "Réclamer" : "En cours"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn smooth hover-lift press" onClick={() => navigator.clipboard?.writeText(String(score)).catch(() => {})}>
              Copier score
            </button>
            <button
              className="btn smooth hover-lift press"
              onClick={() => {
                localStorage.removeItem(LS_KEY);
                window.location.reload();
              }}
            >
              Reset complet
            </button>
          </div>
        </div>
      </div>

      {/* Boutique */}
      {showShop && (
        <Modal title="Boutique — Skins & Avatars" onClose={() => setShowShop(false)}>
          <div className="tabs">
            <button className={`btn smooth hover-lift press ${shopTab === "skins" ? "btnPrimary" : ""}`} onClick={() => setShopTab("skins")}>
              🎨 Skins
            </button>
            <button className={`btn smooth hover-lift press ${shopTab === "avatars" ? "btnPrimary" : ""}`} onClick={() => setShopTab("avatars")}>
              🧑‍🚀 Avatars
            </button>
            <div className="coins" style={{ marginLeft: "auto" }}>
              <span className="coinDot" />
              <span>{coins} coins</span>
            </div>
          </div>

          {shopTab === "skins" && (
            <>
              <div className="small" style={{ marginBottom: 12 }}>
                Achète des skins avec tes coins. Ensuite tu peux les équiper.
              </div>

              <div className="shopGrid">
                {SKINS.map(s => {
                  const owned = ownedSkins.includes(s.id);
                  const equipped = skinId === s.id;
                  return (
                    <div key={s.id} className="shopCard smooth hover-lift">
                      <div className="preview" style={{ background: `linear-gradient(135deg, ${s.vars["--accent"]}, ${s.vars["--accent2"]})` }} />
                      <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                        <div>
                          <div style={{ fontWeight: 1100 }}>{s.name} {s.animated ? "✨" : ""}</div>
                          <div className="small">{s.desc}</div>
                        </div>
                        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end" }}>
                          <span className="price"><span className="coinDot" /> {s.price}</span>
                          {owned ? (
                            <button
                              className={`btn smooth hover-lift press ${equipped ? "btnPrimary" : ""}`}
                              onClick={() => equipSkin(s.id)}
                            >
                              {equipped ? "Équipé" : "Équiper"}
                            </button>
                          ) : (
                            <button
                              className="btn btnPrimary smooth hover-lift press"
                              disabled={!canBuy(s.price)}
                              onClick={() => buySkin(s)}
                            >
                              Acheter
                            </button>
                          )}
                        </div>
                      </div>
                      {!owned && !canBuy(s.price) && (
                        <div className="small" style={{ marginTop: 10 }}>Pas assez de coins : missions + cadeau 👀</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {shopTab === "avatars" && (
            <>
              <div className="small" style={{ marginBottom: 12 }}>
                Achète et équipe un avatar (affiché dans le header).
              </div>

              <div className="shopGrid">
                {AVATARS.map(a => {
                  const owned = ownedAvatars.includes(a.id);
                  const equipped = avatarId === a.id;
                  return (
                    <div key={a.id} className="shopCard smooth hover-lift">
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                        <div>
                          <div className="avatarBig">{a.emoji}</div>
                          <div style={{ fontWeight: 1100 }}>{a.name}</div>
                          <div className="small">Cosmétique</div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"flex-end" }}>
                          <span className="price"><span className="coinDot" /> {a.price}</span>
                          {owned ? (
                            <button
                              className={`btn smooth hover-lift press ${equipped ? "btnPrimary" : ""}`}
                              onClick={() => equipAvatar(a.id)}
                            >
                              {equipped ? "Équipé" : "Équiper"}
                            </button>
                          ) : (
                            <button
                              className="btn btnPrimary smooth hover-lift press"
                              disabled={!canBuy(a.price)}
                              onClick={() => buyAvatar(a)}
                            >
                              Acheter
                            </button>
                          )}
                        </div>
                      </div>
                      {!owned && !canBuy(a.price) && (
                        <div className="small" style={{ marginTop: 10 }}>Continue à jouer pour gagner des coins 💰</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Profil */}
      {showProfile && (
        <Modal title="Profil — Stats & Badges" onClose={() => setShowProfile(false)}>
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
                    Niveau : <b>{level}</b> • Coins : <b>{coins}</b><br />
                    Bonnes : <b>{totalRight}</b> • Erreurs : <b>{totalWrong}</b> • Précision : <b>{accuracy}%</b><br />
                    Questions : <b>{totalQuestions}</b> • Meilleur combo : <b>{bestStreak}</b><br />
                    Meilleure ligue : <b>{bestLeague.icon} {bestLeague.name}</b>
                  </div>
                </div>
              </div>

              <div className="small" style={{ marginTop: 12 }}>
                Records par classe → difficulté → mode (best score session):
              </div>

              <div style={{ marginTop: 10, display:"grid", gap: 10 }}>
                {GRADES.map(g => (
                  <div key={g.id} className="shopCard">
                    <div style={{ fontWeight: 1100, marginBottom: 6 }}>{g.label}</div>
                    {DIFFS.map(d => (
                      <div key={d.id} style={{ marginBottom: 10 }}>
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
            </>
          )}

          {profileTab === "badges" && (
            <>
              <div className="toast" style={{ marginTop: 0 }}>
                <div>
                  <strong>Badges</strong>
                  <div className="sub" style={{ marginTop: 8 }}>
                    Débloqués : <b>{unlockedCount}</b> / <b>{ACHIEVEMENTS.length}</b><br/>
                    Astuce : vise les combos 🔥 et la précision 🎖️
                  </div>
                </div>
                <span className="pill">+ coins</span>
              </div>

              <div className="badgeGrid">
                {ACHIEVEMENTS.map(a => {
                  const unlocked = isUnlocked(a.id);
                  const dateIso = achievements?.[a.id]?.date;
                  return (
                    <div key={a.id} className={`badgeCard smooth hover-lift ${unlocked ? "" : "badgeLocked"}`}>
                      <div className="badgeIcon">
                        {unlocked ? a.icon : "🔒"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="badgeTitle">{unlocked ? a.title : "Badge verrouillé"}</div>
                        <div className="badgeDesc">{unlocked ? a.desc : "Continue à jouer pour le débloquer."}</div>

                        <div className="badgeMeta">
                          <span className="badgeProgress">🎁 +{a.reward} coins</span>
                          {unlocked && dateIso && (
                            <span className="badgeProgress">📅 {formatDateFR(dateIso)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Réglages */}
      {showSettings && (
        <Modal title="Réglages" onClose={() => setShowSettings(false)}>
          <div className="shopCard">
            <div style={{ fontWeight: 1100, marginBottom: 8 }}>Audio & vibrations</div>

            <div style={{ display:"grid", gap: 10 }}>
              <label style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 10 }}>
                <span>Sons</span>
                <input type="checkbox" checked={audioOn} onChange={(e) => setAudioOn(e.target.checked)} />
              </label>

              <label style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 10 }}>
                <span>Vibrations (mobile)</span>
                <input type="checkbox" checked={vibrateOn} onChange={(e) => setVibrateOn(e.target.checked)} />
              </label>
            </div>
          </div>

          <div className="shopCard" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 1100, marginBottom: 8 }}>Rythme</div>

            <label style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 10 }}>
              <span>Auto-suivant après explication</span>
              <input type="checkbox" checked={autoNextOn} onChange={(e) => setAutoNextOn(e.target.checked)} />
            </label>

            <div className="small" style={{ marginTop: 8 }}>
              Délai (ms) : {autoNextMs}
            </div>

            <input
              type="range"
              min={600}
              max={6000}
              step={200}
              value={autoNextMs}
              onChange={(e) => setAutoNextMs(Number(e.target.value))}
              style={{ width: "100%", marginTop: 8 }}
            />
          </div>

          <div className="shopCard" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 1100, marginBottom: 8 }}>Accessibilité</div>

            <label style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 10 }}>
              <span>Réduire les animations</span>
              <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} />
            </label>

            <div className="small" style={{ marginTop: 8 }}>
              Skins animés : {skin.animated ? <b>disponible</b> : <b>skin statique</b>} (désactivé si “réduire” activé)
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
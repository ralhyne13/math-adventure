// App.jsx
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
  a = Math.abs(a);
  b = Math.abs(b);
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
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function parisDayKey(date = new Date()) {
  return date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}
function dayKeyToDate(dayKey) {
  // dayKey fr-FR ex: "01/03/2026"
  const parts = String(dayKey).split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map((x) => parseInt(x, 10));
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd, 12, 0, 0);
}
function isYesterdayKey(prevKey, todayKey) {
  const prev = dayKeyToDate(prevKey);
  const today = dayKeyToDate(todayKey);
  if (!prev || !today) return false;
  const diff = Math.round((today.getTime() - prev.getTime()) / (24 * 3600 * 1000));
  return diff === 1;
}

/* ------------------------ Password hashing (SHA-256) ------------------------ */
async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(buf);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
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
      g.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.start(now);
      o.stop(now + 0.22);
    }

    setTimeout(() => ctx.close().catch(() => {}), 300);
  } catch {}
}

/* ------------------------ Skins + Avatars ------------------------ */
const SKINS = [
  {
    id: "neon-night",
    name: "Neon Night",
    price: 0,
    desc: "Violet + vert, premium",
    animated: true,
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
    price: 120,
    desc: "Bleu + cyan, calme",
    animated: true,
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
    price: 180,
    desc: "Rose + ambre, punchy",
    animated: true,
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
    price: 150,
    desc: "Menthe, ultra clean",
    animated: false,
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
    price: 220,
    desc: "Noir + argent, sobre",
    animated: false,
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
    price: 160,
    desc: "Ludique, coloré",
    animated: true,
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

const AVATARS = [
  // COMMUNS
  { id: "owl", name: "Hibou", emoji: "🦉", price: 0, rarity: "Commun" },
  { id: "cat", name: "Chat", emoji: "🐱", price: 20, rarity: "Commun" },
  { id: "dog", name: "Chien", emoji: "🐶", price: 20, rarity: "Commun" },
  { id: "panda", name: "Panda", emoji: "🐼", price: 30, rarity: "Commun" },
  { id: "koala", name: "Koala", emoji: "🐨", price: 30, rarity: "Commun" },
  { id: "tiger", name: "Tigre", emoji: "🐯", price: 35, rarity: "Commun" },
  { id: "penguin", name: "Pingouin", emoji: "🐧", price: 35, rarity: "Commun" },
  { id: "frog", name: "Grenouille", emoji: "🐸", price: 25, rarity: "Commun" },
  { id: "unicorn", name: "Licorne", emoji: "🦄", price: 60, rarity: "Commun" },
  { id: "star", name: "Étoile", emoji: "⭐", price: 25, rarity: "Commun" },
  { id: "rocket", name: "Fusée", emoji: "🚀", price: 40, rarity: "Commun" },
  { id: "dice", name: "Dé", emoji: "🎲", price: 25, rarity: "Commun" },
  { id: "math", name: "Math", emoji: "🧮", price: 35, rarity: "Commun" },

  // RARES
  { id: "robot", name: "Robot", emoji: "🤖", price: 120, rarity: "Rare" },
  { id: "fox", name: "Renard", emoji: "🦊", price: 140, rarity: "Rare" },
  { id: "pirate", name: "Pirate", emoji: "🏴‍☠️", price: 140, rarity: "Rare" },

  // ÉPIQUES
  { id: "astro", name: "Astronaute", emoji: "🧑‍🚀", price: 200, rarity: "Épique" },
  { id: "ninja", name: "Ninja", emoji: "🥷", price: 220, rarity: "Épique" },
  { id: "dragon", name: "Dragon", emoji: "🐉", price: 260, rarity: "Épique" },

  // EXCLUSIFS
  { id: "king", name: "Roi des Maths", emoji: "👑", price: 420, rarity: "Exclusif" },
  { id: "wizard", name: "Magicien ∑", emoji: "🧙‍♂️", price: 520, rarity: "Exclusif" },
  { id: "genius", name: "Génie π", emoji: "🧠", price: 650, rarity: "Exclusif" },
  { id: "mecha", name: "Mecha Calcul", emoji: "🦾", price: 780, rarity: "Exclusif" },
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

function modeName(mId) {
  return MODES.find((m) => m.id === mId)?.label ?? mId;
}

function gradeBase(gradeId) {
  switch (gradeId) {
    case "CP":
      return { addMax: 20, subMax: 20, mulA: 5, mulB: 5, divB: 5, fracDen: 6 };
    case "CE1":
      return { addMax: 100, subMax: 100, mulA: 7, mulB: 7, divB: 7, fracDen: 9 };
    case "CE2":
      return { addMax: 500, subMax: 500, mulA: 10, mulB: 10, divB: 10, fracDen: 12 };
    case "CM1":
      return { addMax: 2000, subMax: 2000, mulA: 12, mulB: 12, divB: 12, fracDen: 14 };
    case "CM2":
      return { addMax: 5000, subMax: 5000, mulA: 15, mulB: 15, divB: 15, fracDen: 18 };
    case "6e":
      return { addMax: 20000, subMax: 20000, mulA: 20, mulB: 20, divB: 20, fracDen: 20 };
    case "5e":
      return { addMax: 50000, subMax: 50000, mulA: 30, mulB: 30, divB: 30, fracDen: 24 };
    case "4e":
      return { addMax: 100000, subMax: 100000, mulA: 50, mulB: 50, divB: 50, fracDen: 30 };
    case "3e":
      return { addMax: 200000, subMax: 200000, mulA: 80, mulB: 80, divB: 80, fracDen: 36 };
    default:
      return { addMax: 100, subMax: 100, mulA: 10, mulB: 10, divB: 10, fracDen: 12 };
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

/* ------------------------ Anti répétitions ------------------------ */
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
    explain: (picked) =>
      picked === correct
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
    explain: (picked) =>
      picked === correct
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
    choices: makeChoicesNumber(correct, Math.max(6, Math.round(aMax * bMax * 0.08))),
    explain: (picked) =>
      picked === correct
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
    explain: (picked) =>
      picked === correct
        ? `✅ ${a} ÷ ${b} = ${correct} car ${b} × ${correct} = ${a}.`
        : `❌ Division : on cherche x tel que ${b}×x=${a}. Ici x=${correct}. Tu as choisi ${picked}.`,
  };
}

function fracCompareExplain({ aN, aD, bN, bD }, picked, correct, gradeId) {
  const isMiddleSchool = ["6e", "5e", "4e", "3e"].includes(gradeId);

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

  const isMiddleSchool = ["6e", "5e", "4e", "3e"].includes(gradeId);

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
    case "add":
      return makeQAdd(cfg);
    case "sub":
      return makeQSub(cfg);
    case "mul":
      return makeQMul(cfg);
    case "div":
      return makeQDiv(cfg);
    case "cmpFrac":
      return makeQCmpFrac(cfg, gradeId);
    case "eqFrac":
      return makeQEqFrac(cfg, gradeId);
    default:
      return makeQAdd(cfg);
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
          <button className="btn btnGhost smooth hover-lift press" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------ Achievements (Badges) ------------------------ */
const ACHIEVEMENTS = [
  { id: "streak5", icon: "🔥", title: "Combo 5", desc: "Atteins un combo de 5.", reward: 50, type: "streak", target: 5 },
  { id: "streak10", icon: "🔥", title: "Combo 10", desc: "Atteins un combo de 10.", reward: 90, type: "streak", target: 10 },
  { id: "streak20", icon: "🔥", title: "Combo 20", desc: "Atteins un combo de 20.", reward: 160, type: "streak", target: 20 },

  { id: "right50", icon: "✅", title: "50 bonnes", desc: "Totalise 50 bonnes réponses.", reward: 80, type: "right", target: 50 },
  { id: "right100", icon: "✅", title: "100 bonnes", desc: "Totalise 100 bonnes réponses.", reward: 140, type: "right", target: 100 },
  { id: "right300", icon: "✅", title: "300 bonnes", desc: "Totalise 300 bonnes réponses.", reward: 260, type: "right", target: 300 },

  { id: "q100", icon: "🎯", title: "100 questions", desc: "Réponds à 100 questions.", reward: 90, type: "questions", target: 100 },
  { id: "q500", icon: "🎯", title: "500 questions", desc: "Réponds à 500 questions.", reward: 220, type: "questions", target: 500 },
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

/* ------------------------ Coach helpers ------------------------ */
function modeHint(modeId) {
  switch (modeId) {
    case "div":
      return "Astuce division : vérifie ton résultat avec × (diviseur × quotient = dividende).";
    case "sub":
      return "Astuce soustraction : aligne bien les unités/dizaines et vérifie si tu peux faire l’opération inverse (+).";
    case "mul":
      return "Astuce multiplication : utilise les tables / décompose (ex: 7×12 = 7×10 + 7×2).";
    case "cmpFrac":
      return "Astuce fractions : mets au même dénominateur OU fais un produit en croix.";
    case "eqFrac":
      return "Astuce équivalences : multiplie/divise numérateur et dénominateur par le même nombre.";
    case "add":
    default:
      return "Astuce addition : vérifie vite avec l’opération inverse (−) si tu doutes.";
  }
}
function buildCoachSummary(perfByMode) {
  const rows = Object.entries(perfByMode || {})
    .map(([mId, v]) => {
      const total = v?.total ?? 0;
      const right = v?.right ?? 0;
      const acc = total ? Math.round((right / total) * 100) : 0;
      return { mId, total, right, acc };
    })
    .filter((r) => r.total > 0);

  if (!rows.length) {
    return { title: "Coach", lines: ["Joue encore un peu et je te fais un bilan 👍"], hint: null };
  }

  const eligible = rows.filter((r) => r.total >= 3);
  const used = eligible.length ? eligible : rows;

  const best = [...used].sort((a, b) => b.acc - a.acc || b.total - a.total)[0];
  const worst = [...used].sort((a, b) => a.acc - b.acc || b.total - a.total)[0];

  const lines = [];
  lines.push(`Top : ${modeName(best.mId)} — ${best.acc}% (${best.right}/${best.total})`);
  if (worst.mId !== best.mId) lines.push(`À bosser : ${modeName(worst.mId)} — ${worst.acc}% (${worst.right}/${worst.total})`);

  return { title: "Coach (bilan 10)", lines, hint: worst.mId !== best.mId ? modeHint(worst.mId) : null };
}

/* ------------------------ Login / Users storage ------------------------ */
const USERS_KEY = "math-adventure-users-v1";
function normalizePseudo(p) {
  return String(p || "").trim().toLowerCase();
}
function userKey(pseudo) {
  return `math-adventure-user:${normalizePseudo(pseudo)}`;
}
function getUsersIndex() {
  return safeLSGet(USERS_KEY, { users: {} });
}
function setUsersIndex(next) {
  safeLSSet(USERS_KEY, next);
}
function safeName(pseudo) {
  return String(pseudo || "").trim();
}

/* ------------------------ Login Streak Rewards (7 jours) ------------------------ */
function rewardRoll(streakDay, ownedAvatars) {
  const baseCoins = 30 + (streakDay - 1) * 18;
  const coinReward = randInt(baseCoins, baseCoins + 45);

  const avatarChance = clamp(0.18 + (streakDay - 1) * 0.07, 0.18, 0.62);
  const roll = Math.random();

  if (roll < avatarChance) {
    const commons = AVATARS.filter((a) => a.rarity === "Commun");
    const rares = AVATARS.filter((a) => a.rarity === "Rare");
    const epics = AVATARS.filter((a) => a.rarity === "Épique");

    const tierRoll = Math.random();
    let pool = commons;
    if (streakDay >= 4 && tierRoll < 0.18) pool = rares;
    if (streakDay === 7 && tierRoll < 0.08) pool = epics;

    const notOwned = pool.filter((a) => !ownedAvatars.includes(a.id));
    if (notOwned.length) {
      const picked = notOwned[randInt(0, notOwned.length - 1)];
      return { kind: "avatar", avatarId: picked.id, label: `Avatar : ${picked.emoji} ${picked.name}` };
    }
    return { kind: "coins", coins: coinReward + 40, label: `Coins : +${coinReward + 40}` };
  }

  return { kind: "coins", coins: coinReward, label: `Coins : +${coinReward}` };
}

/* ------------------------ App ------------------------ */
export default function App() {
  const qHistoryRef = useRef([]);
  const autoTimerRef = useRef(null);
  const badgeTimerRef = useRef(null);
  const levelTimerRef = useRef(null);
  const coachTimerRef = useRef(null);

  const levelRef = useRef(1);
  const xpRef = useRef(0);

  /* ------------------------ Auth state ------------------------ */
  const [authUser, setAuthUser] = useState(() => safeLSGet("math-adventure-auth", null)); // { pseudoDisplay, pseudoKey }
  const [authMode, setAuthMode] = useState("login"); // login/register
  const [authPseudo, setAuthPseudo] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  // Forgot/reset password UI (only on login screen)
  const [pwMode, setPwMode] = useState("none"); // none | forgot
  const [pwTargetPseudo, setPwTargetPseudo] = useState("");
  const [pwRecovery, setPwRecovery] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwNew2, setPwNew2] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  // Change password (logged in, settings)
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwChangeNew, setPwChangeNew] = useState("");
  const [pwChangeNew2, setPwChangeNew2] = useState("");
  const [pwChangeMsg, setPwChangeMsg] = useState("");

  const isLoggedIn = !!authUser?.pseudoKey;

  /* ------------------------ Load per-user save ------------------------ */
  const initial = useMemo(() => {
    if (!isLoggedIn) {
      return {
        skinId: "neon-night",
        gradeId: "CE1",
        diffId: "moyen",
        modeId: "add",
        coins: 120,
        avatarId: "owl",
        ownedSkins: ["neon-night"],
        ownedAvatars: ["owl"],
        level: 1,
        xp: 0,
        records: {},
        bestStreak: 0,
        totalRight: 0,
        totalWrong: 0,
        totalQuestions: 0,
        audioOn: true,
        vibrateOn: true,
        autoNextOn: false,
        autoNextMs: 1800,
        reduceMotion: false,
        achievements: {},
        lastLoginDayKey: null,
        loginStreak: 0,
      };
    }

    const saved = safeLSGet(userKey(authUser.pseudoKey), null);
    return {
      skinId: saved?.skinId ?? "neon-night",
      gradeId: saved?.gradeId ?? "CE1",
      diffId: saved?.diffId ?? "moyen",
      modeId: saved?.modeId ?? "add",
      coins: saved?.coins ?? 120,
      avatarId: saved?.avatarId ?? "owl",
      ownedSkins: saved?.ownedSkins ?? ["neon-night"],
      ownedAvatars: saved?.ownedAvatars ?? ["owl"],
      level: saved?.level ?? 1,
      xp: saved?.xp ?? 0,
      records: saved?.records ?? {},
      bestStreak: saved?.bestStreak ?? 0,
      totalRight: saved?.totalRight ?? 0,
      totalWrong: saved?.totalWrong ?? 0,
      totalQuestions: saved?.totalQuestions ?? 0,
      audioOn: saved?.audioOn ?? true,
      vibrateOn: saved?.vibrateOn ?? true,
      autoNextOn: saved?.autoNextOn ?? false,
      autoNextMs: saved?.autoNextMs ?? 1800,
      reduceMotion: saved?.reduceMotion ?? false,
      achievements: saved?.achievements ?? {},
      lastLoginDayKey: saved?.lastLoginDayKey ?? null,
      loginStreak: saved?.loginStreak ?? 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, authUser?.pseudoKey]);

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

  const [achievements, setAchievements] = useState(initial.achievements);
  const [badgePop, setBadgePop] = useState(null);

  const [levelPop, setLevelPop] = useState(null);
  const [coachPop, setCoachPop] = useState(null);

  const [lastLoginDayKey, setLastLoginDayKey] = useState(initial.lastLoginDayKey);
  const [loginStreak, setLoginStreak] = useState(initial.loginStreak);
  const [loginRewardPop, setLoginRewardPop] = useState(null);

  // Session
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(1);

  const [q, setQ] = useState(() => makeQuestion(modeId, gradeId, diffId, qHistoryRef));
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState("idle");
  const [explain, setExplain] = useState("");
  const [showExplain, setShowExplain] = useState(false);

  const [isLocked, setIsLocked] = useState(false);

  const [fx, setFx] = useState("none");
  const [spark, setSpark] = useState(false);

  // Modals
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shopTab, setShopTab] = useState("skins");
  const [profileTab, setProfileTab] = useState("stats");

  // historique réponses
  const [lastAnswers, setLastAnswers] = useState([]);
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [sessionPerf, setSessionPerf] = useState(() => {
    const o = {};
    for (const m of MODES) o[m.id] = { right: 0, total: 0 };
    return o;
  });

  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0];
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];

  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    xpRef.current = xp;
  }, [xp]);

  useEffect(() => {
    Object.entries(skin.vars).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
  }, [skin]);

  useEffect(() => {
    document.body.classList.toggle("reduce-motion", !!reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    const on = !!skin.animated && !reduceMotion;
    document.body.classList.toggle("anim-skin", on);
  }, [skin.animated, reduceMotion]);

  /* ------------------------ Save per-user ------------------------ */
  useEffect(() => {
    if (!isLoggedIn) return;
    safeLSSet(userKey(authUser.pseudoKey), {
      skinId,
      gradeId,
      diffId,
      modeId,
      coins,
      avatarId,
      ownedSkins,
      ownedAvatars,
      level,
      xp,
      records,
      bestStreak,
      totalRight,
      totalWrong,
      totalQuestions,
      audioOn,
      vibrateOn,
      autoNextOn,
      autoNextMs,
      reduceMotion,
      achievements,
      lastLoginDayKey,
      loginStreak,
    });
  }, [
    isLoggedIn,
    authUser?.pseudoKey,
    skinId,
    gradeId,
    diffId,
    modeId,
    coins,
    avatarId,
    ownedSkins,
    ownedAvatars,
    level,
    xp,
    records,
    bestStreak,
    totalRight,
    totalWrong,
    totalQuestions,
    audioOn,
    vibrateOn,
    autoNextOn,
    autoNextMs,
    reduceMotion,
    achievements,
    lastLoginDayKey,
    loginStreak,
  ]);

  useEffect(() => {
    newQuestion(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeId, gradeId, diffId]);

  function vibrate(ms) {
    if (!vibrateOn) return;
    try {
      navigator.vibrate?.(ms);
    } catch {}
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
  function showLevelPopup(payload) {
    setLevelPop(payload);
    if (levelTimerRef.current) clearTimeout(levelTimerRef.current);
    levelTimerRef.current = setTimeout(() => setLevelPop(null), 2800);
  }
  function showCoachPopup(payload) {
    setCoachPop(payload);
    if (coachTimerRef.current) clearTimeout(coachTimerRef.current);
    coachTimerRef.current = setTimeout(() => setCoachPop(null), 4200);
  }

  function awardCoins(amount) {
    setCoins((c) => c + Math.max(0, amount));
  }

  function awardXp(amount) {
    const add = Math.max(0, amount);
    const startLevel = levelRef.current;

    let lvl = levelRef.current;
    let xpNow = xpRef.current + add;

    let levelsGained = 0;
    let coinsGained = 0;

    while (xpNow >= xpToNext(lvl)) {
      xpNow -= xpToNext(lvl);
      lvl += 1;
      levelsGained += 1;

      const c = awardLevelCoins(lvl);
      coinsGained += c;
      awardCoins(c);
    }

    levelRef.current = lvl;
    xpRef.current = xpNow;
    setLevel(lvl);
    setXp(xpNow);

    if (lvl > startLevel) {
      vibrate(30);
      playBeep("ok", audioOn);
      showLevelPopup({
        toLevel: lvl,
        gainedLevels: levelsGained,
        gainedCoins: coinsGained,
      });
    }
  }

  function getBestScoreFor(mId, gId, dId) {
    return records?.[gId]?.[dId]?.[mId]?.bestScore ?? 0;
  }

  function updateRecordIfNeeded(finalScore) {
    setRecords((prev) => {
      const next = JSON.parse(JSON.stringify(prev ?? {}));
      next[gradeId] ??= {};
      next[gradeId][diffId] ??= {};
      next[gradeId][diffId][modeId] ??= { bestScore: 0 };
      next[gradeId][diffId][modeId].bestScore = Math.max(next[gradeId][diffId][modeId].bestScore ?? 0, finalScore);
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

    setLastAnswers([]);
    setSessionAnswered(0);
    setSessionPerf(() => {
      const o = {};
      for (const m of MODES) o[m.id] = { right: 0, total: 0 };
      return o;
    });
    setCoachPop(null);
  }

  function isUnlocked(achId) {
    return !!achievements?.[achId]?.unlocked;
  }

  function unlockAchievement(a) {
    if (isUnlocked(a.id)) return;
    const iso = new Date().toISOString();
    setAchievements((prev) => ({
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

  function maybeCoach(afterCount, nextPerf) {
    if (afterCount > 0 && afterCount % 10 === 0) {
      const summary = buildCoachSummary(nextPerf);
      showCoachPopup(summary);
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
    const nextStreak = isCorrect ? streak + 1 : 0;

    const nextScoreAdd = isCorrect ? 10 + Math.min(18, streak * 2) : 0;

    const nextTotalAnswers = nextTotalRight + nextTotalWrong;
    const nextAccuracy = nextTotalAnswers ? Math.round((nextTotalRight / nextTotalAnswers) * 100) : 0;

    setTotalQuestions((x) => x + 1);

    setLastAnswers((prev) => [{ ok: isCorrect }, ...(prev ?? [])].slice(0, 10));

    setSessionPerf((prev) => {
      const base = prev ?? {};
      const cur = base[modeId] ?? { right: 0, total: 0 };
      return {
        ...base,
        [modeId]: {
          right: cur.right + (isCorrect ? 1 : 0),
          total: cur.total + 1,
        },
      };
    });

    setSessionAnswered((n) => {
      const nextCount = n + 1;
      const nextPerf = (() => {
        const base = sessionPerf ?? {};
        const cur = base[modeId] ?? { right: 0, total: 0 };
        return {
          ...base,
          [modeId]: {
            right: cur.right + (isCorrect ? 1 : 0),
            total: cur.total + 1,
          },
        };
      })();
      maybeCoach(nextCount, nextPerf);
      return nextCount;
    });

    if (isCorrect) {
      setStatus("ok");
      playBeep("ok", audioOn);
      vibrate(20);
      triggerFx("ok");

      awardCoins(3);
      setTotalRight((x) => x + 1);

      setScore((s) => s + nextScoreAdd);

      setStreak((st) => {
        const ns = st + 1;
        setBestStreak((bs) => Math.max(bs, ns));
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

      setCoins((c) => Math.max(0, c - 1));

      setTotalWrong((x) => x + 1);
      setStreak(0);

      awardXp(4);

      setExplain(q.explain(choice));
      setShowExplain(true);
    }

    checkAchievements({
      streak: nextStreak,
      totalRight: nextTotalRight,
      totalQuestions: nextTotalQuestions,
      totalAnswers: nextTotalAnswers,
      accuracy: nextAccuracy,
    });

    if (autoNextOn) {
      autoTimerRef.current = setTimeout(() => {
        goNext();
      }, clamp(autoNextMs, 600, 6000));
    }
  }

  function goNext() {
    setQuestionIndex((i) => i + 1);
    newQuestion(true);
  }

  function canBuy(price) {
    return coins >= price;
  }

  function buySkin(s) {
    if (ownedSkins.includes(s.id)) return;
    if (!canBuy(s.price)) return;
    setCoins((c) => c - s.price);
    setOwnedSkins((list) => [...list, s.id]);
    setSkinId(s.id);
  }
  function buyAvatar(a) {
    if (ownedAvatars.includes(a.id)) return;
    if (!canBuy(a.price)) return;
    setCoins((c) => c - a.price);
    setOwnedAvatars((list) => [...list, a.id]);
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

  const accuracy = useMemo(() => {
    const total = totalRight + totalWrong;
    if (!total) return 0;
    return Math.round((totalRight / total) * 100);
  }, [totalRight, totalWrong]);

  const xpNeed = xpToNext(level);
  const xpPct = Math.round((xp / xpNeed) * 100);

  const unlockedCount = useMemo(() => ACHIEVEMENTS.filter((a) => isUnlocked(a.id)).length, [achievements]);

  const disableChoices = isLocked || showExplain;

  const FLOATERS = useMemo(
    () => ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "+", "−", "×", "÷", "=", "<", ">", "∑", "π", "%", "🧮", "⭐"],
    []
  );

  /* ------------------------ Login reward on login (once/day) ------------------------ */
  function applyLoginRewardIfNeeded(userPseudoKey) {
    const today = parisDayKey();
    const saved = safeLSGet(userKey(userPseudoKey), null);

    const ownedA = saved?.ownedAvatars ?? ["owl"];
    const prevDay = saved?.lastLoginDayKey ?? null;
    const prevStreak = saved?.loginStreak ?? 0;

    if (prevDay === today) return;

    let nextStreak = 1;
    if (prevDay && isYesterdayKey(prevDay, today)) nextStreak = clamp(prevStreak + 1, 1, 7);
    else nextStreak = 1;

    const reward = rewardRoll(nextStreak, ownedA);

    let nextCoins = saved?.coins ?? 120;
    let nextOwnedAv = [...(saved?.ownedAvatars ?? ["owl"])];
    let rewardText = "";

    if (reward.kind === "coins") {
      nextCoins += reward.coins;
      rewardText = `+${reward.coins} coins`;
    } else {
      if (!nextOwnedAv.includes(reward.avatarId)) nextOwnedAv.push(reward.avatarId);
      rewardText = `NOUVEL AVATAR : ${AVATARS.find((a) => a.id === reward.avatarId)?.emoji ?? "✨"} ${
        AVATARS.find((a) => a.id === reward.avatarId)?.name ?? "Avatar"
      }`;
    }

    const nextSaved = {
      ...(saved ?? {}),
      coins: nextCoins,
      ownedAvatars: nextOwnedAv,
      lastLoginDayKey: today,
      loginStreak: nextStreak,
    };
    safeLSSet(userKey(userPseudoKey), nextSaved);

    setCoins(nextCoins);
    setOwnedAvatars(nextOwnedAv);
    setLastLoginDayKey(today);
    setLoginStreak(nextStreak);

    setLoginRewardPop({
      day: nextStreak,
      text: rewardText,
      detail: reward.label,
    });

    playBeep("ok", saved?.audioOn ?? true);
    vibrate(18);
  }

  /* ------------------------ Auth actions ------------------------ */
  async function doRegister() {
    setAuthMsg("");
    const pseudoDisplay = safeName(authPseudo);
    const pseudoKey = normalizePseudo(authPseudo);
    const pass = String(authPass || "");

    if (pseudoKey.length < 3) return setAuthMsg("Pseudo trop court (min 3).");
    if (pass.length < 4) return setAuthMsg("Mot de passe trop court (min 4).");
    if (!crypto?.subtle) return setAuthMsg("Ton navigateur ne supporte pas crypto.subtle.");

    const idx = getUsersIndex();
    if (idx.users?.[pseudoKey]) return setAuthMsg("Pseudo déjà pris.");

    const hash = await sha256Hex(pass);

    // ✅ code de récupération (front-only)
    const recoveryCode = `${randInt(100000, 999999)}-${randInt(100000, 999999)}`;

    const nextIdx = {
      ...idx,
      users: {
        ...(idx.users ?? {}),
        [pseudoKey]: { pseudoDisplay, passHash: hash, recoveryCode, createdAt: new Date().toISOString() },
      },
    };
    setUsersIndex(nextIdx);

    safeLSSet(userKey(pseudoKey), {
      skinId: "neon-night",
      gradeId: "CE1",
      diffId: "moyen",
      modeId: "add",
      coins: 120,
      avatarId: "owl",
      ownedSkins: ["neon-night"],
      ownedAvatars: ["owl"],
      level: 1,
      xp: 0,
      records: {},
      bestStreak: 0,
      totalRight: 0,
      totalWrong: 0,
      totalQuestions: 0,
      audioOn: true,
      vibrateOn: true,
      autoNextOn: false,
      autoNextMs: 1800,
      reduceMotion: false,
      achievements: {},
      lastLoginDayKey: null,
      loginStreak: 0,
    });

    // Info recovery code
    alert(`IMPORTANT : garde ce code de récupération (si tu oublies ton mot de passe) :\n\n${recoveryCode}\n\nNote-le quelque part ✅`);

    const au = { pseudoDisplay, pseudoKey };
    safeLSSet("math-adventure-auth", au);
    setAuthUser(au);

    window.location.reload();
  }

  async function doLogin() {
    setAuthMsg("");
    const pseudoDisplay = safeName(authPseudo);
    const pseudoKey = normalizePseudo(authPseudo);
    const pass = String(authPass || "");

    if (pseudoKey.length < 3) return setAuthMsg("Pseudo invalide.");
    if (pass.length < 1) return setAuthMsg("Mot de passe manquant.");
    if (!crypto?.subtle) return setAuthMsg("Ton navigateur ne supporte pas crypto.subtle.");

    const idx = getUsersIndex();
    const user = idx.users?.[pseudoKey];
    if (!user) return setAuthMsg("Utilisateur introuvable.");

    const hash = await sha256Hex(pass);
    if (hash !== user.passHash) return setAuthMsg("Mot de passe incorrect.");

    const au = { pseudoDisplay: user.pseudoDisplay || pseudoDisplay, pseudoKey };
    safeLSSet("math-adventure-auth", au);
    setAuthUser(au);

    window.location.reload();
  }

  function doLogout() {
    safeLSSet("math-adventure-auth", null);
    setAuthUser(null);
    window.location.reload();
  }

  // ✅ Reset password via recovery code (login screen)
  async function resetPasswordWithRecovery() {
    setPwMsg("");
    if (!crypto?.subtle) return setPwMsg("Ton navigateur ne supporte pas crypto.subtle.");

    const pseudoKey = normalizePseudo(pwTargetPseudo);
    const rec = String(pwRecovery || "").trim();
    const next = String(pwNew || "");
    const next2 = String(pwNew2 || "");

    if (pseudoKey.length < 3) return setPwMsg("Pseudo invalide.");
    if (rec.length < 3) return setPwMsg("Code de récupération manquant.");
    if (next.length < 4) return setPwMsg("Nouveau mot de passe trop court (min 4).");
    if (next !== next2) return setPwMsg("Confirmation différente.");

    const idx = getUsersIndex();
    const u = idx.users?.[pseudoKey];
    if (!u) return setPwMsg("Utilisateur introuvable.");

    if (String(u.recoveryCode || "").trim() !== rec) return setPwMsg("Code de récupération incorrect.");

    const nextHash = await sha256Hex(next);

    setUsersIndex({
      ...idx,
      users: {
        ...(idx.users ?? {}),
        [pseudoKey]: { ...u, passHash: nextHash, updatedAt: new Date().toISOString() },
      },
    });

    setPwTargetPseudo("");
    setPwRecovery("");
    setPwNew("");
    setPwNew2("");
    setPwMsg("✅ Mot de passe réinitialisé. Tu peux te connecter.");
    setAuthMode("login");
    setPwMode("none");
  }

  // ✅ Change password (logged in)
  async function changePasswordLoggedIn() {
    setPwChangeMsg("");
    if (!authUser?.pseudoKey) return;
    if (!crypto?.subtle) return setPwChangeMsg("Ton navigateur ne supporte pas crypto.subtle.");

    const cur = String(pwCurrent || "");
    const next = String(pwChangeNew || "");
    const next2 = String(pwChangeNew2 || "");

    if (!cur) return setPwChangeMsg("Mot de passe actuel manquant.");
    if (next.length < 4) return setPwChangeMsg("Nouveau mot de passe trop court (min 4).");
    if (next !== next2) return setPwChangeMsg("Confirmation différente.");

    const idx = getUsersIndex();
    const u = idx.users?.[authUser.pseudoKey];
    if (!u) return setPwChangeMsg("Utilisateur introuvable.");

    const curHash = await sha256Hex(cur);
    if (curHash !== u.passHash) return setPwChangeMsg("Mot de passe actuel incorrect.");

    const nextHash = await sha256Hex(next);

    setUsersIndex({
      ...idx,
      users: {
        ...(idx.users ?? {}),
        [authUser.pseudoKey]: { ...u, passHash: nextHash, updatedAt: new Date().toISOString() },
      },
    });

    setPwCurrent("");
    setPwChangeNew("");
    setPwChangeNew2("");
    setPwChangeMsg("✅ Mot de passe mis à jour.");
  }

  /* ------------------------ Apply login reward after login ------------------------ */
  useEffect(() => {
    if (!isLoggedIn) return;
    applyLoginRewardIfNeeded(authUser.pseudoKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, authUser?.pseudoKey]);

  useEffect(() => {
    if (!loginRewardPop) return;
    const t = setTimeout(() => setLoginRewardPop(null), 3800);
    return () => clearTimeout(t);
  }, [loginRewardPop]);

  /* ------------------------ Not logged in screen ------------------------ */
  if (!isLoggedIn) {
    return (
      <div className="shell">
        <div className="mathBg" aria-hidden="true">
          {FLOATERS.map((t, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 19) % 100}%`,
                fontSize: `${14 + (i % 8) * 6}px`,
                animationDuration: `${10 + (i % 10) * 2.2}s`,
                animationDelay: `${-(i % 10) * 1.1}s`,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="topbar">
          <div className="brand">
            <div className="logo smooth" />
            <div>
              <div className="h1">Math Adventure</div>
              <div className="sub">Connecte-toi pour accéder à ton profil</div>
            </div>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="card smooth">
            <div className="cardTitle">
              <span>{authMode === "login" ? "Connexion" : "Inscription"}</span>
              <span className="pill">pseudo + mot de passe</span>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 520 }}>
              <input className="input smooth" placeholder="Pseudo" value={authPseudo} onChange={(e) => setAuthPseudo(e.target.value)} />
              <input
                className="input smooth"
                placeholder="Mot de passe"
                type="password"
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
              />

              {authMsg && <div className="authMsg">{authMsg}</div>}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {authMode === "login" ? (
                  <button className="btn btnPrimary smooth hover-lift press" onClick={doLogin}>
                    Se connecter
                  </button>
                ) : (
                  <button className="btn btnPrimary smooth hover-lift press" onClick={doRegister}>
                    Créer le compte
                  </button>
                )}

                <button
                  className="btn smooth hover-lift press"
                  onClick={() => {
                    setAuthMsg("");
                    setPwMode("none");
                    setPwMsg("");
                    setAuthMode((m) => (m === "login" ? "register" : "login"));
                  }}
                >
                  {authMode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
                </button>

                {authMode === "login" && (
                  <button
                    className="btn smooth hover-lift press"
                    onClick={() => {
                      setPwMsg("");
                      setAuthMsg("");
                      setPwMode((m) => (m === "forgot" ? "none" : "forgot"));
                    }}
                  >
                    {pwMode === "forgot" ? "Retour" : "Mot de passe oublié"}
                  </button>
                )}
              </div>

              {pwMode === "forgot" && (
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div className="toast" style={{ marginTop: 0 }}>
                    <div>
                      <strong>Réinitialiser (front-only)</strong>
                      <div className="sub" style={{ marginTop: 6 }}>
                        Utilise ton <b>code de récupération</b> (donné à l’inscription).
                      </div>
                    </div>
                    <span className="pill">🔑 recovery</span>
                  </div>

                  <input
                    className="input smooth"
                    placeholder="Pseudo"
                    value={pwTargetPseudo}
                    onChange={(e) => setPwTargetPseudo(e.target.value)}
                  />
                  <input
                    className="input smooth"
                    placeholder="Code de récupération (ex: 123456-654321)"
                    value={pwRecovery}
                    onChange={(e) => setPwRecovery(e.target.value)}
                  />
                  <input
                    className="input smooth"
                    placeholder="Nouveau mot de passe"
                    type="password"
                    value={pwNew}
                    onChange={(e) => setPwNew(e.target.value)}
                  />
                  <input
                    className="input smooth"
                    placeholder="Confirmer nouveau mot de passe"
                    type="password"
                    value={pwNew2}
                    onChange={(e) => setPwNew2(e.target.value)}
                  />

                  {pwMsg && <div className={pwMsg.startsWith("✅") ? "authMsg authMsgOk" : "authMsg"}>{pwMsg}</div>}

                  <button className="btn btnPrimary smooth hover-lift press" onClick={resetPasswordWithRecovery}>
                    Réinitialiser
                  </button>
                </div>
              )}

              <div className="small">
                Note : stockage local (front). Pour une vraie sécurité multi-utilisateurs, il faut un serveur.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------ Main app render ------------------------ */
  return (
    <div className="shell">
      <div className="mathBg" aria-hidden="true">
        {FLOATERS.map((t, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 19) % 100}%`,
              fontSize: `${14 + (i % 8) * 6}px`,
              animationDuration: `${10 + (i % 10) * 2.2}s`,
              animationDelay: `${-(i % 10) * 1.1}s`,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {loginRewardPop && (
        <div className="levelPop" role="status" aria-live="polite">
          <div className="levelPopInner smooth">
            <div className="levelBadge" aria-hidden="true">
              🎁
            </div>
            <div style={{ flex: 1 }}>
              <div className="levelPopTitle">Connexion quotidienne</div>
              <div className="levelPopSub">
                Jour <b>{loginRewardPop.day}</b>/7 • <span className="levelCoins">{loginRewardPop.text}</span>
              </div>
              <div className="small" style={{ marginTop: 6 }}>
                {loginRewardPop.detail}
              </div>
            </div>
            <button className="btn btnPrimary smooth hover-lift press" onClick={() => setLoginRewardPop(null)}>
              OK
            </button>
          </div>
        </div>
      )}

      {levelPop && (
        <div className="levelPop" role="status" aria-live="polite">
          <div className="levelPopInner smooth">
            <div className="levelBadge" aria-hidden="true">
              ⬆️
            </div>
            <div style={{ flex: 1 }}>
              <div className="levelPopTitle">LEVEL UP !</div>
              <div className="levelPopSub">
                Niveau <b>{levelPop.toLevel}</b>
                {levelPop.gainedLevels > 1 ? ` (+${levelPop.gainedLevels})` : ""} •
                <span className="levelCoins">
                  <span className="coinDot" /> +{levelPop.gainedCoins} coins
                </span>
              </div>
              <div className="small" style={{ marginTop: 6 }}>
                Continue comme ça 🚀
              </div>
            </div>
            <button className="btn btnPrimary smooth hover-lift press" onClick={() => setLevelPop(null)}>
              OK
            </button>
          </div>
        </div>
      )}

      {coachPop && (
        <div className="coachPop" role="status" aria-live="polite">
          <div className="coachPopInner smooth">
            <div className="coachBadge" aria-hidden="true">
              🧠
            </div>
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
            <button className="btn btnPrimary smooth hover-lift press" onClick={() => setCoachPop(null)}>
              OK
            </button>
          </div>
        </div>
      )}

      {badgePop && (
        <div className="badgePop">
          <div className="badgePopInner smooth">
            <div className="badgeIcon" style={{ background: "rgba(0,0,0,.22)" }}>
              {badgePop.icon}
            </div>
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
          <div className="logo smooth" />
          <div>
            <div className="h1">
              Math Adventure <span style={{ opacity: 0.92 }}>{avatar.emoji}</span>
            </div>
            <div className="sub">
              Connecté : <b>{authUser.pseudoDisplay}</b> • Streak login : <b>{loginStreak}/7</b>
            </div>
          </div>
        </div>

        <div className="hud">
          <div className="hudLeft">
            <div className="coins chip coinChip smooth" title="Monnaie virtuelle">
              <span className="coinDot" />
              <span>{coins}</span>
              <span className="chipLabel">coins</span>
            </div>

            <div className="chip smooth" title="Niveau">
              <span className="chipIcon">⬆️</span>
              <span>
                Lv <b>{level}</b>
              </span>
            </div>

            <div className="chip smooth" title="XP">
              <span className="chipIcon">✨</span>
              <span className="mono">
                {xp}/{xpNeed}
              </span>
            </div>
          </div>

          <div className="hudPills" aria-label="informations">
            <span className="pill">Q#{questionIndex}</span>
            <span className="pill">Record: {bestScore}</span>
            <span className="pill">
              Badges: {unlockedCount}/{ACHIEVEMENTS.length}
            </span>
          </div>

          <div className="hudRight">
            <button className="btn smooth hover-lift press" onClick={() => setShowSettings(true)}>
              Réglages
            </button>
            <button className="btn smooth hover-lift press" onClick={() => setShowProfile(true)}>
              Profil
            </button>
            <button className="btn btnPrimary smooth hover-lift press" onClick={() => setShowShop(true)}>
              Boutique
            </button>
            <button className="btn smooth hover-lift press" onClick={doLogout} title="Se déconnecter">
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className={`card smooth ${status === "ok" ? "pulse-ok" : status === "bad" ? "pulse-bad" : ""}`}>
          <div className={`fx ${fx === "ok" ? "fxOk" : fx === "bad" ? "fxBad" : ""}`} />
          <div className={`sparkles ${spark ? "on" : ""}`}>
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
            <span>Choisis la bonne réponse</span>
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

            <button className="btn smooth hover-lift press" onClick={resetSession}>
              Reset session
            </button>
          </div>

          <div className="barWrap" aria-label="xp">
            <div className="bar" style={{ width: `${xpPct}%` }} />
          </div>

          <div className="miniHistoryWrap" aria-label="historique des 10 dernières réponses">
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

          <div className="heroQuestion" data-status={status}>
            <div className="heroTop">
              <div className="qPrompt">{q.prompt}</div>
              <div className="heroMeta">
                <span className="metaPill">
                  <span className="metaIcon">🎯</span> Combo <b>{streak}</b>
                </span>
                <span className="metaPill">
                  <span className="metaIcon">📊</span> Précision <b>{accuracy}%</b>
                </span>
              </div>
            </div>

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
            </div>

            <div className="controls">
              {q.choices.map((c) => {
                const isPressed = picked === c;
                const stateCls = showExplain && isPressed ? (c === q.correct ? "isRight" : "isWrong") : "";
                return (
                  <button
                    key={String(c)}
                    className={`choice choiceCard smooth press ${stateCls}`}
                    onClick={() => submit(c)}
                    aria-pressed={isPressed}
                    disabled={disableChoices}
                  >
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
                  {status === "ok" ? <strong>✅ Bien joué !</strong> : <strong>❌ Oups…</strong>}
                  <div className="sub" style={{ marginTop: 4 }}>
                    Bonne réponse : <b>{String(q.correct)}</b>
                  </div>
                  <div className="sub" style={{ marginTop: 8 }}>
                    {explain}
                  </div>
                </div>
                <span className="pill">Combo: {streak}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card smooth">
          <div className="cardTitle">
            <span>Tableau de bord</span>
            <span className="pill">
              {skin.name}
              {skin.animated ? " ✨" : ""}
            </span>
          </div>

          <div className="stats">
            <div className="statBox smooth">
              <div className="statLabel">Score session</div>
              <div className="statValue">{score}</div>
            </div>
            <div className="statBox smooth">
              <div className="statLabel">Combo</div>
              <div className="statValue">{streak}</div>
            </div>
            <div className="statBox smooth">
              <div className="statLabel">Précision</div>
              <div className="statValue">{accuracy}%</div>
            </div>
            <div className="statBox smooth">
              <div className="statLabel">Connexion (7 jours)</div>
              <div className="statValue" style={{ fontSize: 18 }}>
                🔥 {loginStreak}/7
              </div>
              <div className="small" style={{ marginTop: 6 }}>
                Dernière connexion : <b>{lastLoginDayKey ?? "—"}</b>
              </div>
            </div>
          </div>

          <div className="toast" style={{ marginTop: 14 }}>
            <div>
              <strong>Récompense quotidienne</strong>
              <div className="sub" style={{ marginTop: 8 }}>
                Connecte-toi 7 jours d’affilée pour maximiser les récompenses. Récompense donnée automatiquement au 1er lancement du jour.
              </div>
            </div>
            <span className="pill">🎁 aléatoire</span>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn smooth hover-lift press" onClick={() => navigator.clipboard?.writeText(String(score)).catch(() => {})}>
              Copier score
            </button>
            <button
              className="btn smooth hover-lift press"
              onClick={() => {
                localStorage.removeItem(userKey(authUser.pseudoKey));
                window.location.reload();
              }}
            >
              Reset profil
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
                {SKINS.map((s) => {
                  const owned = ownedSkins.includes(s.id);
                  const equipped = skinId === s.id;
                  return (
                    <div key={s.id} className="shopCard smooth hover-lift">
                      <div className="preview" style={{ background: `linear-gradient(135deg, ${s.vars["--accent"]}, ${s.vars["--accent2"]})` }} />
                      <div className="shopRow">
                        <div className="shopLeft">
                          <div className="shopTitle">
                            {s.name} {s.animated ? "✨" : ""}
                          </div>
                          <div className="small">{s.desc}</div>
                        </div>
                        <div className="shopRight">
                          <span className="price">
                            <span className="coinDot" /> {s.price}
                          </span>
                          {owned ? (
                            <button className={`btn smooth hover-lift press ${equipped ? "btnPrimary" : ""}`} onClick={() => equipSkin(s.id)}>
                              {equipped ? "Équipé" : "Équiper"}
                            </button>
                          ) : (
                            <button className="btn btnPrimary smooth hover-lift press" disabled={!canBuy(s.price)} onClick={() => buySkin(s)}>
                              Acheter
                            </button>
                          )}
                        </div>
                      </div>
                      {!owned && !canBuy(s.price) && <div className="small" style={{ marginTop: 10 }}>Pas assez de coins 👀</div>}
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
                {AVATARS.map((a) => {
                  const owned = ownedAvatars.includes(a.id);
                  const equipped = avatarId === a.id;
                  const isExclusive = a.rarity === "Exclusif";

                  return (
                    <div key={a.id} className={`shopCard smooth hover-lift ${isExclusive ? "premium" : ""}`}>
                      <div className="shopRibbonWrap">{isExclusive && <div className="ribbon">Exclusif</div>}</div>

                      <div className="shopRow">
                        <div className="shopLeft">
                          <div className="avatarBig">{a.emoji}</div>
                          <div className="shopTitle">{a.name}</div>
                          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span className="rarity">{a.rarity}</span>
                            <span className="small">Cosmétique</span>
                          </div>
                        </div>

                        <div className="shopRight">
                          <span className="price">
                            <span className="coinDot" /> {a.price}
                          </span>

                          {owned ? (
                            <button className={`btn smooth hover-lift press ${equipped ? "btnPrimary" : ""}`} onClick={() => equipAvatar(a.id)}>
                              {equipped ? "Équipé" : "Équiper"}
                            </button>
                          ) : (
                            <button className="btn btnPrimary smooth hover-lift press" disabled={!canBuy(a.price)} onClick={() => buyAvatar(a)}>
                              Acheter
                            </button>
                          )}
                        </div>
                      </div>

                      {!owned && !canBuy(a.price) && <div className="small" style={{ marginTop: 10 }}>Continue à jouer pour gagner des coins 💰</div>}
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
      )}

      {/* Réglages */}
      {showSettings && (
        <Modal title="Réglages" onClose={() => setShowSettings(false)}>
          <div className="shopCard">
            <div style={{ fontWeight: 1100, marginBottom: 8 }}>Audio & vibrations</div>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span>Sons</span>
                <input type="checkbox" checked={audioOn} onChange={(e) => setAudioOn(e.target.checked)} />
              </label>

              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span>Vibrations (mobile)</span>
                <input type="checkbox" checked={vibrateOn} onChange={(e) => setVibrateOn(e.target.checked)} />
              </label>
            </div>
          </div>

          <div className="shopCard" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 1100, marginBottom: 8 }}>Rythme</div>

            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span>Auto-suivant après explication</span>
              <input type="checkbox" checked={autoNextOn} onChange={(e) => setAutoNextOn(e.target.checked)} />
            </label>

            <div className="small" style={{ marginTop: 8 }}>Délai (ms) : {autoNextMs}</div>

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

            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span>Réduire les animations</span>
              <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} />
            </label>

            <div className="small" style={{ marginTop: 8 }}>
              Skins animés : {skin.animated ? <b>disponible</b> : <b>skin statique</b>} (désactivé si “réduire” activé)
            </div>
          </div>

          {/* ✅ Sécurité : changement de mot de passe */}
          <div className="shopCard" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 1100, marginBottom: 8 }}>Sécurité</div>
            <div className="small" style={{ marginBottom: 10 }}>
              Changer ton mot de passe (stocké hashé en local).
            </div>

            <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
              <input
                className="input smooth"
                placeholder="Mot de passe actuel"
                type="password"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
              />
              <input
                className="input smooth"
                placeholder="Nouveau mot de passe"
                type="password"
                value={pwChangeNew}
                onChange={(e) => setPwChangeNew(e.target.value)}
              />
              <input
                className="input smooth"
                placeholder="Confirmer nouveau mot de passe"
                type="password"
                value={pwChangeNew2}
                onChange={(e) => setPwChangeNew2(e.target.value)}
              />

              {pwChangeMsg && <div className={pwChangeMsg.startsWith("✅") ? "authMsg authMsgOk" : "authMsg"}>{pwChangeMsg}</div>}

              <button className="btn btnPrimary smooth hover-lift press" onClick={changePasswordLoggedIn}>
                Mettre à jour
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
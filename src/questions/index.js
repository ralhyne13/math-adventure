import { clamp, randInt, shuffle, gcd, lcm, simplify, cmpFractions } from "../utils/math";
import { parisDayKey, parisWeekKey, hashString } from "../storage";

export const GRADES = [
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

export const WORLDS = [
  { id: "cp", gradeId: "CP", name: "Monde CP", icon: "ðŸŒ³", badge: "Badge Foret" },
  { id: "ce1", gradeId: "CE1", name: "Monde CE1", icon: "ðŸ°", badge: "Badge Chateau" },
  { id: "ce2", gradeId: "CE2", name: "Monde CE2", icon: "ðŸ”", badge: "Badge Montagne" },
  { id: "cm1", gradeId: "CM1", name: "Monde CM1", icon: "ðŸŒ‹", badge: "Badge Volcan" },
  { id: "cm2", gradeId: "CM2", name: "Monde CM2", icon: "ðŸš€", badge: "Badge Fusee" },
];

export const DIFFS = [
  { id: "facile", label: "Facile" },
  { id: "moyen", label: "Moyen" },
  { id: "difficile", label: "Difficile" },
];

export const MODES = [
  { id: "add", label: "Addition", icon: "+" },
  { id: "sub", label: "Soustraction", icon: "âˆ’" },
  { id: "mul", label: "Multiplication", icon: "Ã—" },
  { id: "div", label: "Division", icon: "Ã·" },
  { id: "cmpFrac", label: "Comparer des fractions", icon: "?" },
  { id: "eqFrac", label: "Ã‰quivalences", icon: "â‰¡" },
  { id: "fracOp", label: "Addition/soustraction de fractions", icon: "Â±" },
  { id: "simpFrac", label: "Simplifier fraction", icon: "ðŸ§¹" },
  { id: "fracVsNum", label: "Fraction vs nombre", icon: "â†”" },
  { id: "word", label: "Problèmes", icon: "ðŸ§ " },
];

export function modeName(mId) {
  return MODES.find((m) => m.id === mId)?.label ?? mId;
}

export const DAILY_CHALLENGES = [
  {
    id: "day-frac-20",
    title: "Fractions du jour",
    desc: "Réussis 20 questions de fractions aujourd'hui.",
    type: "modeRightCount",
    modeIds: ["cmpFrac", "eqFrac"],
    target: 20,
    rewardCoins: 60,
    rewardXp: 80,
    icon: "ðŸ§©",
  },
  {
    id: "day-mul-streak-10",
    title: "Combo multiplication",
    desc: "Fais 10 bonnes d'affilée en multiplication.",
    type: "modeBestStreak",
    modeIds: ["mul"],
    target: 10,
    rewardCoins: 70,
    rewardXp: 90,
    icon: "ðŸ”¥",
  },
  {
    id: "day-div-15",
    title: "Division sprint",
    desc: "Réussis 15 divisions aujourd'hui.",
    type: "modeRightCount",
    modeIds: ["div"],
    target: 15,
    rewardCoins: 65,
    rewardXp: 85,
    icon: "âž—",
  },
];

export const WEEKLY_CHALLENGES = [
  {
    id: "week-frac-100",
    title: "Semaine fractions",
    desc: "Réussis 100 questions de fractions cette semaine.",
    type: "modeRightCount",
    modeIds: ["cmpFrac", "eqFrac"],
    target: 100,
    rewardCoins: 220,
    rewardXp: 280,
    icon: "ðŸ†",
  },
  {
    id: "week-mul-60",
    title: "Maître des tables",
    desc: "Réussis 60 multiplications cette semaine.",
    type: "modeRightCount",
    modeIds: ["mul"],
    target: 60,
    rewardCoins: 210,
    rewardXp: 260,
    icon: "âœ–ï¸",
  },
  {
    id: "week-streak-15",
    title: "Série pro",
    desc: "Atteins 15 de série dans un mode cette semaine.",
    type: "anyBestStreak",
    target: 15,
    rewardCoins: 240,
    rewardXp: 320,
    icon: "âš¡",
  },
];

function emptyModeValueMap() {
  const out = {};
  for (const m of MODES) out[m.id] = 0;
  return out;
}

function createChallengeStats() {
  return {
    modeRight: emptyModeValueMap(),
    modeRun: emptyModeValueMap(),
    modeBestRun: emptyModeValueMap(),
  };
}

function pickChallengeId(pool, keySeed) {
  if (!pool.length) return null;
  const idx = hashString(keySeed) % pool.length;
  return pool[idx].id;
}

function hydrateChallengeStats(raw) {
  const base = createChallengeStats();
  const modeRight = { ...base.modeRight, ...(raw?.modeRight ?? {}) };
  const modeRun = { ...base.modeRun, ...(raw?.modeRun ?? {}) };
  const modeBestRun = { ...base.modeBestRun, ...(raw?.modeBestRun ?? {}) };
  return { modeRight, modeRun, modeBestRun };
}

export function createChallengeProgress(saved) {
  const dayKey = parisDayKey();
  const weekKey = parisWeekKey();
  const sameDay = saved?.dayKey === dayKey;
  const sameWeek = saved?.weekKey === weekKey;

  return {
    dayKey,
    weekKey,
    dailyId: sameDay ? saved?.dailyId ?? pickChallengeId(DAILY_CHALLENGES, dayKey) : pickChallengeId(DAILY_CHALLENGES, dayKey),
    weeklyId: sameWeek ? saved?.weeklyId ?? pickChallengeId(WEEKLY_CHALLENGES, weekKey) : pickChallengeId(WEEKLY_CHALLENGES, weekKey),
    dailyStats: sameDay ? hydrateChallengeStats(saved?.dailyStats) : createChallengeStats(),
    weeklyStats: sameWeek ? hydrateChallengeStats(saved?.weeklyStats) : createChallengeStats(),
    claimedDaily: sameDay ? !!saved?.claimedDaily : false,
    claimedWeekly: sameWeek ? !!saved?.claimedWeekly : false,
  };
}

export function challengeById(pool, id, fallbackSeed) {
  return pool.find((c) => c.id === id) ?? pool.find((c) => c.id === pickChallengeId(pool, fallbackSeed)) ?? pool[0];
}

export function challengeProgressValue(challenge, stats) {
  if (!challenge || !stats) return 0;
  const ids = challenge.modeIds ?? [];
  if (challenge.type === "modeRightCount") return ids.reduce((sum, id) => sum + (stats.modeRight?.[id] ?? 0), 0);
  if (challenge.type === "modeBestStreak") return ids.reduce((best, id) => Math.max(best, stats.modeBestRun?.[id] ?? 0), 0);
  if (challenge.type === "anyBestStreak") return Object.values(stats.modeBestRun ?? {}).reduce((best, v) => Math.max(best, Number(v) || 0), 0);
  return 0;
}

export function applyAnswerToChallengeStats(prevStats, modeId, isCorrect) {
  const next = hydrateChallengeStats(prevStats);
  if (isCorrect) {
    next.modeRight[modeId] = (next.modeRight[modeId] ?? 0) + 1;
    next.modeRun[modeId] = (next.modeRun[modeId] ?? 0) + 1;
  } else {
    next.modeRun[modeId] = 0;
  }
  next.modeBestRun[modeId] = Math.max(next.modeBestRun[modeId] ?? 0, next.modeRun[modeId] ?? 0);
  return next;
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

export function questionSignature(q, modeId, gradeId, diffId) {
  const base = `${modeId}|${gradeId}|${diffId}|${q.row.kind}|${q.correct}`;
  if (q.row.kind === "op") return `${base}|${q.row.a}|${q.row.op}|${q.row.b}`;
  if (q.row.kind === "fracCmp") return `${base}|${q.row.aN}/${q.row.aD}|${q.row.bN}/${q.row.bD}`;
  if (q.row.kind === "fracEq") return `${base}|${q.row.aN}/${q.row.aD}|${q.row.bN}/${q.row.bD}`;
  if (q.row.kind === "fracOp") return `${base}|${q.row.aN}/${q.row.aD}|${q.row.op}|${q.row.bN}/${q.row.bD}`;
  if (q.row.kind === "fracSimp") return `${base}|${q.row.n}/${q.row.d}`;
  if (q.row.kind === "fracVsNum") return `${base}|${q.row.aN}/${q.row.aD}|${q.row.numLabel}`;
  if (q.row.kind === "storyFrac") return `${base}|${q.row.aN}/${q.row.aD}|${q.row.op}|${q.row.bN}/${q.row.bD}`;
  if (q.row.kind === "storyOp") return `${base}|${q.row.a}|${q.row.op}|${q.row.b}`;
  return base;
}

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

function makeChoicesFraction(correct, distractors = []) {
  const set = new Set([correct, ...distractors].filter(Boolean));
  while (set.size < 4) {
    const d = randInt(2, 12);
    const n = randInt(0, d * 2);
    set.add(`${n}/${d}`);
  }
  return shuffle([...set].slice(0, 4));
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
    explain: (picked) => (picked === correct ? `âœ… ${a} + ${b} = ${correct}.` : `âŒ Addition : ${a} + ${b} = ${correct}. Tu as choisi ${picked}.`),
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
    row: { kind: "op", a, op: "âˆ’", b },
    correct,
    choices: makeChoicesNumber(correct, Math.max(6, Math.round(max * 0.12))),
    explain: (picked) => (picked === correct ? `âœ… ${a} âˆ’ ${b} = ${correct}.` : `âŒ Soustraction : ${a} âˆ’ ${b} = ${correct}. Tu as choisi ${picked}.`),
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
    row: { kind: "op", a, op: "Ã—", b },
    correct,
    choices: makeChoicesNumber(correct, Math.max(6, Math.round(aMax * bMax * 0.08))),
    explain: (picked) => (picked === correct ? `âœ… ${a} Ã— ${b} = ${correct}.` : `âŒ Multiplication : ${a} Ã— ${b} = ${correct}. Tu as choisi ${picked}.`),
  };
}

function makeQDiv(cfg) {
  const bMax = Math.max(2, cfg.divB);
  const b = randInt(2, bMax);
  const q = randInt(2, Math.max(9, Math.round(bMax * 1.35)));
  const a = b * q;
  const correct = q;
  return {
    prompt: "Calcule :",
    row: { kind: "op", a, op: "Ã·", b },
    correct,
    choices: makeChoicesNumber(correct, Math.max(4, Math.round(q * 0.8 + 8))),
    explain: (picked) =>
      picked === correct
        ? `âœ… ${a} Ã· ${b} = ${correct} car ${b} Ã— ${correct} = ${a}.`
        : `âŒ Division : on cherche x tel que ${b}Ã—x=${a}. Ici x=${correct}. Tu as choisi ${picked}.`,
  };
}

function fracCompareExplain({ aN, aD, bN, bD }, picked, correct, gradeId) {
  const isMiddleSchool = ["6e", "5e", "4e", "3e"].includes(gradeId);
  if (isMiddleSchool) {
    const left = aN * bD;
    const right = bN * aD;
    const cmp = left > right ? ">" : left < right ? "<" : "=";
    if (picked === correct) return `âœ… Produit en croix : ${aN}Ã—${bD}=${left} et ${bN}Ã—${aD}=${right}. Donc ${aN}/${aD} ${cmp} ${bN}/${bD}.`;
    return `âŒ Produit en croix : ${aN}Ã—${bD}=${left} et ${bN}Ã—${aD}=${right}. Comme ${left} ${cmp} ${right}, la bonne rÃ©ponse est "${correct}".`;
  }
  const common = lcm(aD, bD);
  const aEq = aN * (common / aD);
  const bEq = bN * (common / bD);
  const cmp = aEq > bEq ? ">" : aEq < bEq ? "<" : "=";
  const line = `On met au mÃªme dÃ©nominateur ${common} : ${aN}/${aD} = ${aEq}/${common} et ${bN}/${bD} = ${bEq}/${common}.`;
  if (picked === correct) return `âœ… ${line} Puis on compare ${aEq} et ${bEq} â†’ ${aEq} ${cmp} ${bEq}.`;
  return `âŒ ${line} Comme ${aEq} ${cmp} ${bEq}, la bonne rÃ©ponse est "${correct}".`;
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
  let bN;
  let bD;
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
    prompt: "Ces fractions sont-elles Ã©quivalentes ?",
    row: { kind: "fracEq", aN, aD, bN, bD },
    correct,
    choices: ["Oui", "Non"],
    explain: (picked) => {
      const ok = picked === correct;
      const eq = left === right;
      if (isMiddleSchool) {
        const test = `Test : ${aN}Ã—${bD}=${left} et ${bN}Ã—${aD}=${right}.`;
        if (ok && eq) return `âœ… Oui. ${test} (Ã©galitÃ©) â†’ Ã©quivalentes.`;
        if (ok && !eq) return `âœ… Non. ${test} (diffÃ©rent) â†’ pas Ã©quivalentes.`;
        return `âŒ RÃ©ponse attendue : ${correct}. ${test} â†’ ${eq ? "Ã©quivalentes" : "pas Ã©quivalentes"}.`;
      }
      const factN = bN / aN;
      const factD = bD / aD;
      const sameFactor = Number.isFinite(factN) && Number.isFinite(factD) && Math.abs(factN - factD) < 1e-9;
      if (ok && eq) {
        return sameFactor
          ? `âœ… Oui. On multiplie ${aN}/${aD} par ${Math.round(factN)} : ${aN}Ã—${Math.round(factN)}/${aD}Ã—${Math.round(factN)} = ${bN}/${bD}.`
          : "âœ… Oui. Les deux fractions reprÃ©sentent la mÃªme valeur.";
      }
      if (ok && !eq) return "âœ… Non. Elles ne donnent pas la mÃªme valeur.";
      return `âŒ RÃ©ponse attendue : ${correct}. ${eq ? "Elles sont Ã©quivalentes." : "Elles ne sont pas Ã©quivalentes."}`;
    },
  };
}

function makeQFracOp(cfg) {
  const denMax = Math.max(8, cfg.fracDen);
  let aD = randInt(2, denMax);
  let bD = randInt(2, denMax);
  let aN = randInt(1, aD - 1);
  let bN = randInt(1, bD - 1);
  const op = Math.random() < 0.5 ? "+" : "âˆ’";
  if (op === "âˆ’" && cmpFractions(aN, aD, bN, bD) === "<") {
    [aN, bN] = [bN, aN];
    [aD, bD] = [bD, aD];
  }
  const common = lcm(aD, bD);
  const aEq = aN * (common / aD);
  const bEq = bN * (common / bD);
  const rawN = op === "+" ? aEq + bEq : aEq - bEq;
  const [sN, sD] = simplify(rawN, common);
  const correct = `${sN}/${sD}`;
  const wrong1 = `${rawN}/${common}`;
  const wrong2 = `${op === "+" ? aN + bN : Math.max(0, aN - bN)}/${aD + bD}`;
  const wrong3 = `${op === "+" ? aN + bN : Math.max(0, aN - bN)}/${common}`;
  return {
    prompt: "Calcule :",
    row: { kind: "fracOp", aN, aD, bN, bD, op },
    correct,
    choices: makeChoicesFraction(correct, [wrong1, wrong2, wrong3]),
    explain: (picked) => {
      const base = `Dénominateur commun ${common} : ${aN}/${aD} = ${aEq}/${common}, ${bN}/${bD} = ${bEq}/${common}.`;
      const calc = `Puis ${aEq} ${op === "+" ? "+" : "âˆ’"} ${bEq} = ${rawN}, donc ${rawN}/${common}.`;
      const simp = `On simplifie -> ${sN}/${sD}.`;
      if (picked === correct) return `âœ… ${base} ${calc} ${simp}`;
      return `âŒ ${base} ${calc} ${simp} Bonne réponse : ${correct}.`;
    },
  };
}

function makeQSimplifyFrac(cfg) {
  const denMax = Math.max(8, cfg.fracDen);
  const baseD = randInt(2, denMax);
  const baseN = randInt(1, baseD - 1);
  const [sBaseN, sBaseD] = simplify(baseN, baseD);
  const k = randInt(2, 9);
  const n = sBaseN * k;
  const d = sBaseD * k;
  const g = gcd(n, d);
  const correct = `${n / g}/${d / g}`;
  const properDivs = [];
  for (let i = 2; i < k; i++) if (k % i === 0) properDivs.push(i);
  const midDiv = properDivs.length ? properDivs[randInt(0, properDivs.length - 1)] : null;
  const wrong1 = `${n}/${d}`;
  const wrong2 = midDiv ? `${n / midDiv}/${d / midDiv}` : `${(n / g) * 2}/${(d / g) * 2}`;
  const wrong3 = `${(n / g) * 3}/${(d / g) * 3}`;
  return {
    prompt: "Simplifie :",
    row: { kind: "fracSimp", n, d },
    correct,
    choices: makeChoicesFraction(correct, [wrong1, wrong2, wrong3]),
    explain: (picked) => {
      const line = `PGCD(${n}, ${d}) = ${g}. On divise numérateur et dénominateur par ${g}.`;
      if (picked === correct) return `âœ… ${line} Résultat : ${correct}.`;
      return `âŒ ${line} Bonne réponse : ${correct}.`;
    },
  };
}

function makeQFracVsNum(cfg) {
  const denMax = Math.max(8, cfg.fracDen);
  const aD = randInt(2, denMax);
  const aN = randInt(1, Math.max(3, aD * 2));
  const useDecimal = Math.random() < 0.55;
  let numLabel;
  let bN;
  let bD;
  if (useDecimal) {
    const tenth = randInt(1, 35);
    numLabel = (tenth / 10).toFixed(1);
    bN = tenth;
    bD = 10;
  } else {
    const iv = randInt(0, 4);
    numLabel = String(iv);
    bN = iv;
    bD = 1;
  }
  const correct = cmpFractions(aN, aD, bN, bD);
  const bAsFrac = `${bN}/${bD}`;
  const left = aN * bD;
  const right = bN * aD;
  return {
    prompt: "Compare :",
    row: { kind: "fracVsNum", aN, aD, numLabel },
    correct,
    choices: ["<", "=", ">"],
    explain: (picked) => {
      const line = `${numLabel} = ${bAsFrac}. Produit en croix: ${aN}Ã—${bD}=${left} et ${bN}Ã—${aD}=${right}.`;
      if (picked === correct) return `âœ… ${line} Donc ${aN}/${aD} ${correct} ${numLabel}.`;
      return `âŒ ${line} Bonne réponse : "${correct}".`;
    },
  };
}

function makeQWord(cfg) {
  const useFractionStory = Math.random() < 0.45;
  if (!useFractionStory) {
    const opRoll = Math.random();
    let op = "+";
    if (opRoll < 0.25) op = "+";
    else if (opRoll < 0.5) op = "âˆ’";
    else if (opRoll < 0.75) op = "Ã—";
    else op = "Ã·";

    const addMax = Math.max(20, cfg.addMax);
    const subMax = Math.max(20, cfg.subMax);
    const mulA = Math.max(3, cfg.mulA);
    const mulB = Math.max(3, cfg.mulB);
    const divB = Math.max(3, cfg.divB);

    let a = 0;
    let b = 0;
    let correct = 0;
    let prompt = "";

    if (op === "+") {
      a = randInt(2, addMax);
      b = randInt(2, addMax);
      correct = a + b;
      prompt = `Emma a ${a} billes et en gagne ${b}. Combien en a-t-elle maintenant ?`;
    } else if (op === "âˆ’") {
      a = randInt(8, subMax);
      b = randInt(2, Math.max(2, Math.min(a - 1, Math.round(subMax * 0.7))));
      if (b > a) [a, b] = [b, a];
      correct = a - b;
      prompt = `Il y a ${a} livres sur une etagere. On en retire ${b}. Combien en reste-t-il ?`;
    } else if (op === "Ã—") {
      a = randInt(2, mulA);
      b = randInt(2, mulB);
      correct = a * b;
      prompt = `Il y a ${a} boites avec ${b} crayons chacune. Combien de crayons au total ?`;
    } else {
      b = randInt(2, divB);
      correct = randInt(2, Math.max(8, Math.round(divB * 1.3)));
      a = b * correct;
      prompt = `${a} bonbons sont partages en ${b} paquets égaux. Combien dans chaque paquet ?`;
    }

    return {
      prompt,
      row: { kind: "storyOp", a, op, b },
      correct,
      choices: makeChoicesNumber(correct, Math.max(4, Math.round(Math.abs(correct) * 0.2 + 8))),
      explain: (picked) => {
        const calc = `${a} ${op} ${b} = ${correct}.`;
        if (picked === correct) return `âœ… ${calc}`;
        return `âŒ ${calc} Bonne réponse : ${correct}.`;
      },
    };
  }

  const denMax = Math.max(8, cfg.fracDen);
  const template = randInt(1, 3);
  let op = "âˆ’";
  let aD = randInt(3, denMax);
  let bD = randInt(3, denMax);
  let aN = randInt(1, aD - 1);
  let bN = randInt(1, bD - 1);
  if (template === 2) op = "+";
  if (op === "âˆ’" && cmpFractions(aN, aD, bN, bD) === "<") {
    [aN, bN] = [bN, aN];
    [aD, bD] = [bD, aD];
  }
  const common = lcm(aD, bD);
  const aEq = aN * (common / aD);
  const bEq = bN * (common / bD);
  const rawN = op === "+" ? aEq + bEq : aEq - bEq;
  const [sN, sD] = simplify(rawN, common);
  const correct = `${sN}/${sD}`;
  const wrong1 = `${rawN}/${common}`;
  const wrong2 = `${op === "+" ? aN + bN : Math.max(0, aN - bN)}/${aD + bD}`;
  const wrong3 = `${Math.max(1, sN + 1)}/${sD}`;
  let prompt = "";
  if (template === 1) {
    prompt = `LÃ©o a ${aN}/${aD} d'une pizza et mange ${bN}/${bD}. Quelle fraction lui reste-t-il ?`;
  } else if (template === 2) {
    prompt = `Nina boit ${aN}/${aD} L le matin et ${bN}/${bD} L l'apres-midi. Quelle quantite boit-elle au total ?`;
  } else {
    prompt = `Une bouteille contient ${aN}/${aD} L de jus. On retire ${bN}/${bD} L. Quelle quantite reste ?`;
  }
  return {
    prompt,
    row: { kind: "storyFrac", aN, aD, bN, bD, op },
    correct,
    choices: makeChoicesFraction(correct, [wrong1, wrong2, wrong3]),
    explain: (picked) => {
      const e1 = `On met au même dénominateur ${common}: ${aN}/${aD} = ${aEq}/${common}, ${bN}/${bD} = ${bEq}/${common}.`;
      const e2 = `Puis ${aEq} ${op} ${bEq} = ${rawN}, donc ${rawN}/${common}.`;
      const e3 = `On simplifie: ${sN}/${sD}.`;
      if (picked === correct) return `âœ… ${e1} ${e2} ${e3}`;
      return `âŒ ${e1} ${e2} ${e3} Bonne réponse: ${correct}.`;
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
    case "fracOp":
      return makeQFracOp(cfg);
    case "simpFrac":
      return makeQSimplifyFrac(cfg);
    case "fracVsNum":
      return makeQFracVsNum(cfg);
    case "word":
      return makeQWord(cfg);
    default:
      return makeQAdd(cfg);
  }
}

export function makeQuestion(modeId, gradeId, diffId, historyRef) {
  const hist = historyRef?.current ?? [];
  for (let tries = 0; tries < 20; tries++) {
    const q = makeQuestionCore(modeId, gradeId, diffId);
    const sig = questionSignature(q, modeId, gradeId, diffId);
    if (!hist.includes(sig)) return q;
  }
  return makeQuestionCore(modeId, gradeId, diffId);
}

const DIFF_ORDER = ["facile", "moyen", "difficile"];

export function stepDiff(diffId, dir) {
  const idx = DIFF_ORDER.indexOf(diffId);
  if (idx < 0) return diffId;
  if (dir > 0) return DIFF_ORDER[Math.min(DIFF_ORDER.length - 1, idx + 1)];
  if (dir < 0) return DIFF_ORDER[Math.max(0, idx - 1)];
  return diffId;
}

export function buildHints(question, gradeId) {
  if (!question?.row) return [];
  const r = question.row;
  const mid = ["6e", "5e", "4e", "3e"].includes(gradeId);
  if (r.kind === "op") {
    if (r.op === "+") return ["Additionne les unités puis les dizaines.", `Calcule ${r.a} + ${r.b} par morceaux.`, `Résultat attendu : ${question.correct}.`];
    if (r.op === "âˆ’") return ["Soustrais en partant des unites.", `Pense à l'opération inverse : ${question.correct} + ${r.b} = ${r.a}.`, `Résultat attendu : ${question.correct}.`];
    if (r.op === "Ã—") return ["Découpe la multiplication (ex: x10 puis x2).", `Tu peux faire ${r.a} Ã— ${r.b}.`, `Résultat attendu : ${question.correct}.`];
    if (r.op === "Ã·") return ["Transforme la division en equation.", `On cherche x tel que ${r.b} Ã— x = ${r.a}.`, `Donc x = ${question.correct}.`];
  }
  if (r.kind === "fracCmp") {
    if (mid) {
      const left = r.aN * r.bD;
      const right = r.bN * r.aD;
      return ["Utilise le produit en croix.", `Compare ${r.aN}Ã—${r.bD} et ${r.bN}Ã—${r.aD}.`, `Tu obtiens ${left} et ${right}, donc le signe est "${question.correct}".`];
    }
    const common = lcm(r.aD, r.bD);
    const aEq = r.aN * (common / r.aD);
    const bEq = r.bN * (common / r.bD);
    return ["Mets les fractions au même dénominateur.", `Dénominateur commun = ${common}.`, `Compare ${aEq}/${common} et ${bEq}/${common} -> "${question.correct}".`];
  }
  if (r.kind === "fracEq") {
    return [
      "Vérifie si on peut multiplier numérateur et dénominateur par le même nombre.",
      "Sinon, utilise le produit en croix.",
      `Conclusion : "${question.correct}".`,
    ];
  }
  if (r.kind === "fracOp") {
    const common = lcm(r.aD, r.bD);
    return ["Mets les deux fractions au même dénominateur.", `Dénominateur commun = ${common}.`, "Additionne/soustrais les numérateurs puis simplifie."];
  }
  if (r.kind === "fracSimp") return ["Cherche le PGCD du numérateur et du dénominateur.", "Divise les deux par ce PGCD.", `Résultat simplifie : ${question.correct}.`];
  if (r.kind === "fracVsNum")
    return ['Transforme le nombre en fraction (ex: 0.7 -> 7/10, 2 -> 2/1).', "Compare ensuite avec produit en croix.", `Le bon signe est "${question.correct}".`];
  if (r.kind === "storyFrac") {
    const common = lcm(r.aD, r.bD);
    return ["Repère les fractions dans l'énoncé.", `Mets-les au même dénominateur (ici ${common}).`, "Fais l'operation puis simplifie."];
  }
  if (r.kind === "storyOp") {
    if (r.op === "Ã·") return ["Repere l'operation de partage.", "Pose la division.", "Verifie avec l'operation inverse (Ã—)."];
    return ["Repère l'opération dans l'énoncé.", `Pose ${r.a} ${r.op} ${r.b}.`, "Calcule le résultat."];
  }
  return [];
}

export function buildMethodSteps(question, gradeId) {
  if (!question?.row) return [];
  const r = question.row;
  const mid = ["6e", "5e", "4e", "3e"].includes(gradeId);
  if (r.kind === "op") {
    if (r.op === "+") return [`Étape 1 : on pose ${r.a} + ${r.b}.`, "Étape 2 : on additionne.", `Étape 3 : resultat = ${question.correct}.`];
    if (r.op === "âˆ’") return [`Étape 1 : on pose ${r.a} âˆ’ ${r.b}.`, "Étape 2 : on soustrait.", `Étape 3 : resultat = ${question.correct}.`];
    if (r.op === "Ã—") return [`Étape 1 : on pose ${r.a} Ã— ${r.b}.`, "Étape 2 : on calcule le produit.", `Étape 3 : resultat = ${question.correct}.`];
    if (r.op === "Ã·") return [`Étape 1 : division ${r.a} Ã· ${r.b}.`, `Étape 2 : on cherche x tel que ${r.b} Ã— x = ${r.a}.`, `Étape 3 : x = ${question.correct}.`];
  }
  if (r.kind === "fracCmp") {
    if (mid) {
      const left = r.aN * r.bD;
      const right = r.bN * r.aD;
      return [
        `Étape 1 : produit en croix (${r.aN}Ã—${r.bD}) et (${r.bN}Ã—${r.aD}).`,
        `Étape 2 : on obtient ${left} et ${right}.`,
        `Étape 3 : ${left > right ? ">" : left < right ? "<" : "="} donc réponse "${question.correct}".`,
      ];
    }
    const common = lcm(r.aD, r.bD);
    const aEq = r.aN * (common / r.aD);
    const bEq = r.bN * (common / r.bD);
    return [`Étape 1 : dénominateur commun = ${common}.`, `Étape 2 : ${r.aN}/${r.aD} = ${aEq}/${common} et ${r.bN}/${r.bD} = ${bEq}/${common}.`, `Étape 3 : on compare ${aEq} et ${bEq}, donc "${question.correct}".`];
  }
  if (r.kind === "fracEq") {
    const left = r.aN * r.bD;
    const right = r.bN * r.aD;
    return [`Étape 1 : teste ${r.aN}Ã—${r.bD} et ${r.bN}Ã—${r.aD}.`, `Étape 2 : on obtient ${left} et ${right}.`, `Étape 3 : ${left === right ? "égaux" : "différents"}, réponse "${question.correct}".`];
  }
  if (r.kind === "fracOp") {
    const common = lcm(r.aD, r.bD);
    const aEq = r.aN * (common / r.aD);
    const bEq = r.bN * (common / r.bD);
    const rawN = r.op === "+" ? aEq + bEq : aEq - bEq;
    const [sN, sD] = simplify(rawN, common);
    return [`Étape 1 : dénominateur commun = ${common}.`, `Étape 2 : ${aEq} ${r.op} ${bEq} = ${rawN}, donc ${rawN}/${common}.`, `Étape 3 : simplification -> ${sN}/${sD}.`];
  }
  if (r.kind === "fracSimp") {
    const g = gcd(r.n, r.d);
    return [`Étape 1 : PGCD(${r.n}, ${r.d}) = ${g}.`, `Étape 2 : ${r.n} Ã· ${g} / ${r.d} Ã· ${g}.`, `Étape 3 : resultat = ${question.correct}.`];
  }
  if (r.kind === "fracVsNum") {
    const isDecimal = String(r.numLabel).includes(".");
    const bN = isDecimal ? Math.round(Number(r.numLabel) * 10) : parseInt(r.numLabel, 10);
    const bD = isDecimal ? 10 : 1;
    const left = r.aN * bD;
    const right = bN * r.aD;
    return [`Étape 1 : transforme ${r.numLabel} en ${bN}/${bD}.`, `Étape 2 : compare ${r.aN}Ã—${bD}=${left} et ${bN}Ã—${r.aD}=${right}.`, `Étape 3 : signe correct = "${question.correct}".`];
  }
  if (r.kind === "storyFrac") {
    const common = lcm(r.aD, r.bD);
    const aEq = r.aN * (common / r.aD);
    const bEq = r.bN * (common / r.bD);
    const rawN = r.op === "+" ? aEq + bEq : aEq - bEq;
    const [sN, sD] = simplify(rawN, common);
    return [
      `Étape 1 : dénominateur commun = ${common}.`,
      `Étape 2 : ${aEq} ${r.op} ${bEq} = ${rawN}, donc ${rawN}/${common}.`,
      `Étape 3 : simplification -> ${sN}/${sD}.`,
    ];
  }
  if (r.kind === "storyOp") {
    return [
      `Étape 1 : operation ${r.a} ${r.op} ${r.b}.`,
      `Étape 2 : calcul -> ${question.correct}.`,
      r.op === "Ã·" ? `Étape 3 : verification ${r.b} Ã— ${question.correct} = ${r.a}.` : "Étape 3 : resultat final.",
    ];
  }
  return [];
}

export function weakestMode(perfByMode) {
  const rows = Object.entries(perfByMode ?? {})
    .map(([mId, v]) => {
      const total = v?.total ?? 0;
      const right = v?.right ?? 0;
      const acc = total ? right / total : 0;
      return { mId, total, acc };
    })
    .filter((r) => r.total >= 3);
  if (!rows.length) return null;
  return rows.sort((a, b) => a.acc - b.acc || b.total - a.total)[0]?.mId ?? null;
}

export function modeHint(modeId) {
  switch (modeId) {
    case "div":
      return "Astuce division : vérifie ton résultat avec Ã— (diviseur Ã— quotient = dividende).";
    case "sub":
      return "Astuce soustraction : aligne bien les unites/dizaines et verifie l'operation inverse (+).";
    case "mul":
      return "Astuce multiplication : utilise les tables / decompose (ex: 7Ã—12 = 7Ã—10 + 7Ã—2).";
    case "cmpFrac":
      return "Astuce fractions : mets au même dénominateur OU fais un produit en croix.";
    case "eqFrac":
      return "Astuce equivalences : multiplie/divise numérateur et dénominateur par le même nombre.";
    case "fracOp":
      return "Astuce fractions : trouve le dénominateur commun, calcule le numérateur, puis simplifie.";
    case "simpFrac":
      return "Astuce simplification : cherche le PGCD du numérateur et du dénominateur.";
    case "fracVsNum":
      return "Astuce comparaison : transforme le nombre en fraction puis compare (ou produit en croix).";
    case "word":
      return "Astuce problème : traduis l'énoncé en opération sur fractions, puis simplifie.";
    case "add":
    default:
      return "Astuce addition : verifie vite avec l'operation inverse (âˆ’) si tu doutes.";
  }
}

export function buildCoachSummary(perfByMode) {
  const rows = Object.entries(perfByMode || {})
    .map(([mId, v]) => {
      const total = v?.total ?? 0;
      const right = v?.right ?? 0;
      const acc = total ? Math.round((right / total) * 100) : 0;
      return { mId, total, right, acc };
    })
    .filter((r) => r.total > 0);
  if (!rows.length) return { title: "Coach", lines: ["Joue encore un peu et je te fais un bilan ðŸ‘"], hint: null };
  const eligible = rows.filter((r) => r.total >= 3);
  const used = eligible.length ? eligible : rows;
  const best = [...used].sort((a, b) => b.acc - a.acc || b.total - a.total)[0];
  const worst = [...used].sort((a, b) => a.acc - b.acc || b.total - a.total)[0];
  const lines = [];
  lines.push(`Top : ${modeName(best.mId)} â€” ${best.acc}% (${best.right}/${best.total})`);
  if (worst.mId !== best.mId) lines.push(`Ã€ bosser : ${modeName(worst.mId)} â€” ${worst.acc}% (${worst.right}/${worst.total})`);
  return { title: "Coach (bilan 10)", lines, hint: worst.mId !== best.mId ? modeHint(worst.mId) : null };
}



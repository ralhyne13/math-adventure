import React, { useEffect, useMemo, useRef, useState } from "react";

/* =======================
   📱 PWA install hook
======================= */
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallable(false);
  };

  return { installable, install };
}

/* =======================
   🔊 Simple sounds
   Put files in /public:
   - /sfx-correct.mp3
   - /sfx-wrong.mp3
======================= */
function useSfx(enabled) {
  const okRef = useRef(null);
  const badRef = useRef(null);

  useEffect(() => {
    okRef.current = new Audio("/sfx-correct.mp3");
    badRef.current = new Audio("/sfx-wrong.mp3");
  }, []);

  const playOk = () => {
    if (!enabled || !okRef.current) return;
    okRef.current.currentTime = 0;
    okRef.current.play().catch(() => {});
  };
  const playBad = () => {
    if (!enabled || !badRef.current) return;
    badRef.current.currentTime = 0;
    badRef.current.play().catch(() => {});
  };

  return { playOk, playBad };
}

/* =======================
   🧠 Question generators
======================= */
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function addition(level) {
  const max = level * 5 + 10;
  const a = rand(1, max);
  const b = rand(1, max);
  return {
    type: "addition",
    text: `${a} + ${b}`,
    answer: a + b,
    steps: [`On additionne les deux nombres.`, `${a} + ${b} = ${a + b}`],
    reward: 5,
  };
}

function subtraction(level) {
  const max = level * 5 + 10;
  const a = rand(5, max);
  const b = rand(1, a);
  return {
    type: "subtraction",
    text: `${a} - ${b}`,
    answer: a - b,
    steps: [`On retire ${b} à ${a}.`, `${a} - ${b} = ${a - b}`],
    reward: 6,
  };
}

function multiplication(level) {
  const max = Math.min(12, level + 5);
  const a = rand(2, max);
  const b = rand(2, max);
  return {
    type: "multiplication",
    text: `${a} × ${b}`,
    answer: a * b,
    steps: [
      `Multiplier = addition répétée.`,
      `${a} × ${b} = ${a} ajouté ${b} fois`,
      `Résultat : ${a * b}`,
    ],
    reward: 8,
  };
}

function division(level) {
  const b = rand(2, Math.min(10, level + 3));
  const result = rand(2, 12);
  const a = b * result;
  return {
    type: "division",
    text: `${a} ÷ ${b}`,
    answer: result,
    steps: [
      `Diviser = partager en parts égales.`,
      `On cherche combien de fois ${b} rentre dans ${a}.`,
      `${a} ÷ ${b} = ${result}`,
    ],
    reward: 10,
  };
}

function fraction() {
  const d = rand(2, 10);
  const n1 = rand(1, d);
  const n2 = rand(1, d);
  const num = n1 + n2;
  return {
    type: "fraction",
    text: `${n1}/${d} + ${n2}/${d}`,
    answer: num / d,
    steps: [
      `Les dénominateurs sont identiques (${d}).`,
      `On additionne les numérateurs : ${n1} + ${n2} = ${num}.`,
      `Résultat : ${num}/${d}`,
    ],
    reward: 12,
  };
}

function wordProblem(level) {
  const apples = rand(3, 10 + level);
  const eaten = rand(1, apples - 1);
  return {
    type: "problem",
    text: `Tu as ${apples} pommes. Tu en manges ${eaten}. Combien reste-t-il ?`,
    answer: apples - eaten,
    steps: [
      `On part de ${apples}.`,
      `On enlève ${eaten}.`,
      `${apples} - ${eaten} = ${apples - eaten}`,
    ],
    reward: 15,
  };
}

const GEN_MAP = {
  addition,
  subtraction,
  multiplication,
  division,
  fraction,
  problem: wordProblem,
};

/* =======================
   🎨 Themes
======================= */
const THEMES = [
  {
    id: "space",
    name: "Espace 🚀",
    bg: "linear-gradient(135deg,#0b1020,#1d2b64,#6a11cb)",
    card: "rgba(255,255,255,0.95)",
    accent: "#7c3aed",
    sparkle: "✨",
  },
  {
    id: "jungle",
    name: "Jungle 🐒",
    bg: "linear-gradient(135deg,#064e3b,#10b981,#a7f3d0)",
    card: "rgba(255,255,255,0.95)",
    accent: "#059669",
    sparkle: "🌿",
  },
  {
    id: "magic",
    name: "Magie 🪄",
    bg: "linear-gradient(135deg,#111827,#7c3aed,#f472b6)",
    card: "rgba(255,255,255,0.95)",
    accent: "#ec4899",
    sparkle: "🪄",
  },
];

/* =======================
   🧍 Avatars & Shop
======================= */
const AVATARS = [
  { id: "cat", emoji: "🐱", price: 0 },
  { id: "robot", emoji: "🤖", price: 40 },
  { id: "alien", emoji: "👽", price: 80 },
  { id: "wizard", emoji: "🧙", price: 120 },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* =======================
   📊 Pedagogical stats helpers
======================= */
const TYPE_LABEL = {
  addition: "Addition",
  subtraction: "Soustraction",
  multiplication: "Multiplication",
  division: "Division",
  fraction: "Fractions",
  problem: "Problèmes",
};

function emptyStats() {
  const base = {};
  Object.keys(TYPE_LABEL).forEach((k) => {
    base[k] = { attempts: 0, correct: 0, wrong: 0 };
  });
  return {
    byType: base,
    totalAttempts: 0,
    totalCorrect: 0,
    streak: 0,
    bestStreak: 0,
    starsTotal: 0,
    starsMax: 0,
    badges: [],
  };
}

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

/* =======================
   🏅 Badges
======================= */
const BADGES = [
  { id: "first_win", name: "Premier succès 🥉", desc: "Réussir 1 question." },
  { id: "streak_5", name: "Combo x5 🔥", desc: "Faire 5 bonnes réponses d’affilée." },
  { id: "streak_10", name: "Combo x10 🔥🔥", desc: "Faire 10 bonnes réponses d’affilée." },
  { id: "total_50", name: "50 réussites 🎯", desc: "Réussir 50 questions." },
  { id: "master_add", name: "Roi des additions 👑", desc: "20 additions réussies." },
  { id: "master_mul", name: "Maître des multiplications 🏆", desc: "20 multiplications réussies." },
  { id: "master_frac", name: "Champion des fractions 🧩", desc: "20 fractions réussies." },
];

function hasBadge(badges, id) {
  return badges.includes(id);
}

export default function App() {
  const { installable, install } = usePWAInstall();

  /* =======================
     👧 Multi-profils
  ====================== */
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);

  /* =======================
     ⚙️ Global settings
  ====================== */
  const [themeId, setThemeId] = useState("space");
  const [soundOn, setSoundOn] = useState(true);

  /* =======================
     🎮 Game state (per profile)
  ====================== */
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);

  const [ownedAvatars, setOwnedAvatars] = useState(["cat"]);
  const [currentAvatar, setCurrentAvatar] = useState("cat");
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  /* =======================
     🧠 Pedagogy settings
  ====================== */
  const [exerciseTypes, setExerciseTypes] = useState({
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
    fraction: true,
    problem: true,
  });

  // Mode adaptatif : le jeu propose + souvent les catégories où l’enfant se trompe.
  const [adaptiveMode, setAdaptiveMode] = useState(true);

  /* =======================
     📊 Stats / fun (per profile)
  ====================== */
  const [stats, setStats] = useState(emptyStats());

  /* =======================
     UI
  ====================== */
  const [question, setQuestion] = useState(() => addition(1));
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [showSteps, setShowSteps] = useState(false);

  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showParents, setShowParents] = useState(false);

  const [shake, setShake] = useState(false);
  const [burst, setBurst] = useState(false);

  // Pour les étoiles
  const [hintUsed, setHintUsed] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);

  const theme = useMemo(() => THEMES.find((t) => t.id === themeId) ?? THEMES[0], [themeId]);
  const avatarEmoji = useMemo(() => AVATARS.find((a) => a.id === currentAvatar)?.emoji ?? "🐱", [currentAvatar]);
  const progress = (xp % (level * 50)) / (level * 50) * 100;

  const { playOk, playBad } = useSfx(soundOn);

  /* =======================
     Load global + profiles
  ====================== */
  useEffect(() => {
    const saved = localStorage.getItem("mathAdventureGlobal");
    if (saved) {
      const d = JSON.parse(saved);
      setThemeId(d.themeId ?? "space");
      setSoundOn(d.soundOn ?? true);
    }

    const p = localStorage.getItem("mathAdventureProfiles");
    if (p) {
      const d = JSON.parse(p);
      setProfiles(d.profiles ?? []);
      setActiveProfileId(d.activeProfileId ?? null);
    } else {
      const defaultId = uid();
      const defaultProfile = { id: defaultId, name: "Joueur 1", data: null };
      setProfiles([defaultProfile]);
      setActiveProfileId(defaultId);
    }
  }, []);

  /* =======================
     Save global + profiles
  ====================== */
  useEffect(() => {
    localStorage.setItem("mathAdventureGlobal", JSON.stringify({ themeId, soundOn }));
  }, [themeId, soundOn]);

  useEffect(() => {
    localStorage.setItem("mathAdventureProfiles", JSON.stringify({ profiles, activeProfileId }));
  }, [profiles, activeProfileId]);

  /* =======================
     Apply active profile data
  ====================== */
  useEffect(() => {
    if (!activeProfileId) return;
    const p = profiles.find((x) => x.id === activeProfileId);
    if (!p) return;

    const data = p.data;
    if (!data) {
      // Defaults
      setLevel(1);
      setXp(0);
      setCoins(0);
      setLives(3);
      setOwnedAvatars(["cat"]);
      setCurrentAvatar("cat");
      setDailyRewardClaimed(false);

      setExerciseTypes({
        addition: true,
        subtraction: true,
        multiplication: true,
        division: true,
        fraction: true,
        problem: true,
      });
      setAdaptiveMode(true);

      setStats(emptyStats());

      setQuestion(addition(1));
      setInput("");
      setMessage("");
      setShowSteps(false);
      setHintUsed(false);
      setAnswerRevealed(false);
      return;
    }

    setLevel(data.level ?? 1);
    setXp(data.xp ?? 0);
    setCoins(data.coins ?? 0);
    setLives(data.lives ?? 3);

    setOwnedAvatars(data.ownedAvatars ?? ["cat"]);
    setCurrentAvatar(data.currentAvatar ?? "cat");

    setDailyRewardClaimed(data.dailyRewardClaimed ?? false);
    setExerciseTypes(data.exerciseTypes ?? exerciseTypes);
    setAdaptiveMode(data.adaptiveMode ?? true);

    setStats(data.stats ?? emptyStats());

    setQuestion(data.question ?? addition(data.level ?? 1));
    setInput("");
    setMessage("");
    setShowSteps(false);
    setHintUsed(false);
    setAnswerRevealed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId]);

  /* =======================
     Persist current profile state
  ====================== */
  useEffect(() => {
    if (!activeProfileId) return;

    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== activeProfileId) return p;
        return {
          ...p,
          data: {
            level,
            xp,
            coins,
            lives,
            ownedAvatars,
            currentAvatar,
            dailyRewardClaimed,
            exerciseTypes,
            adaptiveMode,
            stats,
            question,
          },
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    level,
    xp,
    coins,
    lives,
    ownedAvatars,
    currentAvatar,
    dailyRewardClaimed,
    exerciseTypes,
    adaptiveMode,
    stats,
    question,
    activeProfileId,
  ]);

  function getEnabledTypes() {
    const enabled = Object.entries(exerciseTypes)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (enabled.length === 0) return ["addition"];
    return enabled;
  }

  // Tirage adaptatif : plus de poids aux catégories avec plus d'erreurs
  function weightedPick(enabledTypes) {
    if (!adaptiveMode) {
      return enabledTypes[rand(0, enabledTypes.length - 1)];
    }

    // Poids = 1 + taux d'erreur * 4 + petit bonus si peu tenté
    // (pour rééquilibrer doucement)
    const weights = enabledTypes.map((t) => {
      const s = stats.byType?.[t] ?? { attempts: 0, wrong: 0 };
      const attempts = s.attempts || 0;
      const wrong = s.wrong || 0;
      const errRate = attempts ? wrong / attempts : 0.25; // défaut = 25%
      const lowDataBoost = attempts < 5 ? 0.5 : 0;
      return 1 + errRate * 4 + lowDataBoost;
    });

    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < enabledTypes.length; i++) {
      r -= weights[i];
      if (r <= 0) return enabledTypes[i];
    }
    return enabledTypes[enabledTypes.length - 1];
  }

  function newQuestion(nextLevel = level) {
    const enabled = getEnabledTypes();
    const pick = weightedPick(enabled);
    const gen = GEN_MAP[pick] || addition;

    const q = gen(nextLevel);
    setQuestion(q);

    setInput("");
    setShowSteps(false);
    setHintUsed(false);
    setAnswerRevealed(false);
  }

  function resetGame() {
    setLevel(1);
    setXp(0);
    setCoins(0);
    setLives(3);
    setDailyRewardClaimed(false);

    setStats(emptyStats());
    newQuestion(1);
  }

  function calcStars({ correct, hintUsedLocal, revealedLocal }) {
    if (!correct) return 0;
    if (revealedLocal) return 1;
    if (hintUsedLocal) return 2;
    return 3;
  }

  function maybeUnlockBadges(nextStats) {
    const b = nextStats.badges ?? [];

    // 1ère réussite
    if (nextStats.totalCorrect >= 1 && !hasBadge(b, "first_win")) b.push("first_win");

    // streaks
    if (nextStats.bestStreak >= 5 && !hasBadge(b, "streak_5")) b.push("streak_5");
    if (nextStats.bestStreak >= 10 && !hasBadge(b, "streak_10")) b.push("streak_10");

    // totals
    if (nextStats.totalCorrect >= 50 && !hasBadge(b, "total_50")) b.push("total_50");

    // masteries
    const addC = nextStats.byType.addition?.correct ?? 0;
    const mulC = nextStats.byType.multiplication?.correct ?? 0;
    const fracC = nextStats.byType.fraction?.correct ?? 0;

    if (addC >= 20 && !hasBadge(b, "master_add")) b.push("master_add");
    if (mulC >= 20 && !hasBadge(b, "master_mul")) b.push("master_mul");
    if (fracC >= 20 && !hasBadge(b, "master_frac")) b.push("master_frac");

    return nextStats;
  }

  function updateStatsOnAnswer({ qType, correct, starsEarned }) {
    setStats((prev) => {
      const next = structuredClone(prev);

      // totals
      next.totalAttempts += 1;
      if (correct) next.totalCorrect += 1;

      // by type
      if (!next.byType[qType]) next.byType[qType] = { attempts: 0, correct: 0, wrong: 0 };
      next.byType[qType].attempts += 1;

      if (correct) next.byType[qType].correct += 1;
      else next.byType[qType].wrong += 1;

      // streak
      if (correct) {
        next.streak += 1;
        next.bestStreak = Math.max(next.bestStreak, next.streak);
      } else {
        next.streak = 0;
      }

      // stars
      next.starsTotal += starsEarned;
      next.starsMax += 3;

      // badges
      next.badges = Array.isArray(next.badges) ? next.badges : [];
      return maybeUnlockBadges(next);
    });
  }

  function onCorrect() {
    playOk();
    setBurst(true);
    setTimeout(() => setBurst(false), 450);

    const gainedXp = 10;
    const starsEarned = calcStars({ correct: true, hintUsedLocal: hintUsed, revealedLocal: answerRevealed });

    setXp((x) => x + gainedXp);
    setCoins((c) => c + (question.reward ?? 5));

    // Bonus fun: streak => bonus XP
    const streakBonus = Math.min(10, stats.streak >= 2 ? 2 : 0) + (stats.streak >= 4 ? 2 : 0);

    if (streakBonus) setXp((x) => x + streakBonus);

    setMessage(`Bravo ! +${starsEarned}⭐ ${theme.sparkle}`);

    updateStatsOnAnswer({ qType: question.type, correct: true, starsEarned });

    setLevel((lvl) => {
      const next = xp + gainedXp >= lvl * 50 ? lvl + 1 : lvl;
      if (next !== lvl) setMessage(`Niveau supérieur ! 🚀`);
      return next;
    });

    setTimeout(() => newQuestion(), 700);
  }

  function onWrong() {
    playBad();
    setShake(true);
    setTimeout(() => setShake(false), 350);

    setMessage("Oups… 😅");
    setShowSteps(true);

    updateStatsOnAnswer({ qType: question.type, correct: false, starsEarned: 0 });

    setLives((l) => {
      const next = l - 1;
      if (next <= 0) {
        alert("Partie terminée ! On recommence au niveau 1.");
        resetGame();
        return 3;
      }
      return next;
    });

    setTimeout(() => newQuestion(), 1100);
  }

  function checkAnswer() {
    const correct = Number(input) === question.answer;
    if (correct) onCorrect();
    else onWrong();
  }

  function buyAvatar(avatar) {
    if (coins < avatar.price) return;
    if (ownedAvatars.includes(avatar.id)) return;
    setCoins((c) => c - avatar.price);
    setOwnedAvatars((prev) => [...prev, avatar.id]);
  }

  function claimDailyReward() {
    if (dailyRewardClaimed) return;
    setCoins((c) => c + 30);
    setDailyRewardClaimed(true);
    setMessage("Cadeau reçu : +30 pièces 🎁");
  }

  /* =======================
     Profiles actions
  ====================== */
  function addProfile() {
    const name = prompt("Nom du profil ?");
    if (!name) return;
    const id = uid();
    const p = { id, name, data: null };
    setProfiles((prev) => [...prev, p]);
    setActiveProfileId(id);
  }

  function renameProfile(id) {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    const name = prompt("Nouveau nom :", p.name);
    if (!name) return;
    setProfiles((prev) => prev.map((x) => (x.id === id ? { ...x, name } : x)));
  }

  function deleteProfile(id) {
    if (profiles.length <= 1) {
      alert("Il faut au moins 1 profil.");
      return;
    }
    // eslint-disable-next-line no-restricted-globals
    const ok = confirm("Supprimer ce profil ? (progression perdue)");
    if (!ok) return;
    const next = profiles.filter((p) => p.id !== id);
    setProfiles(next);
    if (activeProfileId === id) setActiveProfileId(next[0]?.id ?? null);
  }

  /* =======================
     UI styles
  ====================== */
  const styles = {
    page: {
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      background: theme.bg,
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    },
    card: {
      width: "100%",
      maxWidth: 520,
      margin: "0 auto",
      background: theme.card,
      borderRadius: 22,
      padding: 16,
      boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
      textAlign: "center",
      transform: shake ? "translateX(-6px)" : "translateX(0px)",
      transition: "transform 120ms ease",
      border: `1px solid rgba(0,0,0,0.08)`,
    },
    pillRow: { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" },
    pill: {
      padding: "8px 10px",
      borderRadius: 999,
      border: "1px solid rgba(0,0,0,0.12)",
      background: "white",
      fontWeight: 800,
      fontSize: 12,
    },
    topRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
      flexWrap: "wrap",
    },
    select: {
      padding: "8px 10px",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.15)",
      background: "white",
      fontWeight: 700,
      maxWidth: 220,
    },
    iconBtn: {
      padding: "8px 10px",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      background: "white",
      cursor: "pointer",
      fontWeight: 800,
    },
    installBtn: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 14,
      border: "1px solid rgba(0,0,0,0.12)",
      background: "white",
      cursor: "pointer",
      marginBottom: 10,
      fontWeight: 900,
    },
    mascot: {
      fontSize: 56,
      transform: burst ? "scale(1.08)" : "scale(1)",
      transition: "transform 140ms ease",
      filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.2))",
    },
    title: { margin: 0, fontSize: 26, letterSpacing: 0.2 },
    subtitle: { marginTop: 6, marginBottom: 12, opacity: 0.85 },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 8,
      fontSize: 13,
      marginBottom: 10,
      opacity: 0.95,
    },
    progressWrap: {
      height: 10,
      width: "100%",
      background: "rgba(0,0,0,0.10)",
      borderRadius: 999,
      overflow: "hidden",
      marginBottom: 10,
    },
    progressBar: { height: "100%", background: theme.accent },
    question: { fontSize: 20, fontWeight: 900, marginTop: 10, marginBottom: 10 },
    input: {
      width: "100%",
      padding: 12,
      borderRadius: 14,
      border: "1px solid rgba(0,0,0,0.18)",
      fontSize: 18,
      textAlign: "center",
      outline: "none",
    },
    primaryBtn: {
      width: "100%",
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      border: "none",
      background: theme.accent,
      color: "white",
      fontWeight: 900,
      cursor: "pointer",
      fontSize: 16,
    },
    secondaryBtn: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      background: "white",
      cursor: "pointer",
      fontWeight: 800,
    },
    row: { display: "flex", gap: 10, justifyContent: "center", marginTop: 12, flexWrap: "wrap" },
    steps: {
      marginTop: 10,
      background: "rgba(255,255,255,0.85)",
      padding: 12,
      borderRadius: 16,
      textAlign: "left",
      fontSize: 13,
      border: "1px solid rgba(0,0,0,0.08)",
    },
    shop: {
      marginTop: 12,
      textAlign: "left",
      background: "rgba(255,255,255,0.70)",
      padding: 12,
      borderRadius: 16,
      border: "1px solid rgba(0,0,0,0.08)",
    },
    shopRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0" },
    modal: {
      marginTop: 12,
      textAlign: "left",
      background: "rgba(255,255,255,0.70)",
      padding: 12,
      borderRadius: 16,
      border: "1px solid rgba(0,0,0,0.08)",
    },
    checkboxRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" },
    small: { fontSize: 12, opacity: 0.85 },
    badge: {
      padding: "8px 10px",
      borderRadius: 14,
      border: "1px solid rgba(0,0,0,0.10)",
      background: "white",
      marginBottom: 8,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13,
      overflow: "hidden",
      borderRadius: 12,
    },
    th: { textAlign: "left", padding: 8, borderBottom: "1px solid rgba(0,0,0,0.08)" },
    td: { padding: 8, borderBottom: "1px solid rgba(0,0,0,0.06)" },
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const starsPct = pct(stats.starsTotal, stats.starsMax);
  const totalRate = pct(stats.totalCorrect, stats.totalAttempts);

  function revealAnswer() {
    setAnswerRevealed(true);
    setShowSteps(true);
    setMessage(`Réponse : ${question.type === "fraction" ? "regarde l’explication" : question.answer} 👀`);
  }

  function toggleHint() {
    setHintUsed(true);
    setShowSteps(true);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {installable && (
          <button onClick={install} style={styles.installBtn}>
            📲 Installer l’application
          </button>
        )}

        {/* Top controls */}
        <div style={styles.topRow}>
          <select
            value={activeProfileId ?? ""}
            onChange={(e) => setActiveProfileId(e.target.value)}
            style={styles.select}
            title="Choisir un profil"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                👤 {p.name}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.iconBtn} onClick={addProfile} title="Ajouter profil">
              ➕ Profil
            </button>
            <button style={styles.iconBtn} onClick={() => activeProfile && renameProfile(activeProfile.id)} title="Renommer">
              ✏️
            </button>
            <button style={styles.iconBtn} onClick={() => activeProfile && deleteProfile(activeProfile.id)} title="Supprimer">
              🗑️
            </button>
          </div>
        </div>

        <div style={styles.pillRow}>
          <span style={styles.pill}>Thème : {theme.name}</span>
          <span style={styles.pill}>Combo : x{stats.streak} 🔥</span>
          <span style={styles.pill}>Étoiles : {starsPct}% ⭐</span>
          <span style={styles.pill}>Adaptatif : {adaptiveMode ? "ON" : "OFF"}</span>
        </div>

        <div style={styles.mascot}>{avatarEmoji}</div>
        <h1 style={styles.title}>Aventure Math</h1>
        <p style={styles.subtitle}>
          {activeProfile ? `Profil : ${activeProfile.name}` : "Choisis un profil"} • {theme.sparkle}
        </p>

        <div style={styles.statsGrid}>
          <div>Niv {level}</div>
          <div>XP {xp}</div>
          <div>💰 {coins}</div>
          <div>❤️ {lives}</div>
        </div>

        <div style={styles.progressWrap}>
          <div style={{ ...styles.progressBar, width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>

        <div style={styles.question}>{question.text}</div>

        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ta réponse"
          style={styles.input}
        />

        <button onClick={checkAnswer} style={styles.primaryBtn}>
          Valider
        </button>

        {/* HELPERS (fun + pedagogy) */}
        <div style={styles.row}>
          <button style={styles.secondaryBtn} onClick={toggleHint}>
            💡 Indice
          </button>
          <button style={styles.secondaryBtn} onClick={revealAnswer}>
            👀 Voir la réponse
          </button>
          <button style={styles.secondaryBtn} onClick={() => setShowSteps((s) => !s)}>
            📘 Explication
          </button>
        </div>

        {message && <div style={{ marginTop: 10, fontWeight: 900 }}>{message}</div>}

        {showSteps && (
          <div style={styles.steps}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>💡 Explication :</div>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {(question.steps ?? []).filter(Boolean).map((s, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {s}
                </li>
              ))}
            </ol>
            <div style={{ marginTop: 8, ...styles.small }}>
              ⭐ Étoiles : 3⭐ si tu réussis sans aide • 2⭐ avec indice • 1⭐ si tu vois la réponse
            </div>
          </div>
        )}

        {/* MAIN ACTIONS */}
        <div style={styles.row}>
          <button style={styles.secondaryBtn} onClick={() => setShowShop((s) => !s)}>
            🛒 Boutique
          </button>
          <button style={styles.secondaryBtn} onClick={claimDailyReward} disabled={dailyRewardClaimed}>
            🎁 Cadeau du jour
          </button>
          <button style={styles.secondaryBtn} onClick={() => setShowSettings((s) => !s)}>
            ⚙️ Réglages
          </button>
          <button style={styles.secondaryBtn} onClick={() => setShowParents((s) => !s)}>
            👨‍👩‍👧 Parents
          </button>
        </div>

        {/* SHOP */}
        {showShop && (
          <div style={styles.shop}>
            <h3 style={{ marginTop: 0 }}>Boutique d’avatars</h3>
            {AVATARS.map((a) => (
              <div key={a.id} style={styles.shopRow}>
                <div style={{ fontSize: 26 }}>
                  {a.emoji} <span style={{ fontSize: 14, opacity: 0.8 }}>{a.price} pièces</span>
                </div>
                {ownedAvatars.includes(a.id) ? (
                  <button onClick={() => setCurrentAvatar(a.id)} style={styles.secondaryBtn}>
                    Équiper
                  </button>
                ) : (
                  <button onClick={() => buyAvatar(a)} style={styles.secondaryBtn} disabled={coins < a.price}>
                    Acheter
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS */}
        {showSettings && (
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0 }}>Réglages</h3>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>🎨 Thème</div>
              <select value={themeId} onChange={(e) => setThemeId(e.target.value)} style={styles.select}>
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>🔊 Sons</div>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} />
                Activer les sons (bonne réponse / erreur)
              </label>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                Astuce : ajoute <code>/public/sfx-correct.mp3</code> et <code>/public/sfx-wrong.mp3</code>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>🧠 Mode adaptatif</div>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="checkbox" checked={adaptiveMode} onChange={(e) => setAdaptiveMode(e.target.checked)} />
                Proposer plus d’exercices là où l’enfant se trompe
              </label>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>🧠 Types d’exercices</div>
              {Object.keys(exerciseTypes).map((k) => (
                <div key={k} style={styles.checkboxRow}>
                  <span style={{ fontWeight: 800 }}>{TYPE_LABEL[k]}</span>
                  <input
                    type="checkbox"
                    checked={exerciseTypes[k]}
                    onChange={(e) => setExerciseTypes((p) => ({ ...p, [k]: e.target.checked }))}
                  />
                </div>
              ))}
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                Tu peux choisir ce que l’enfant pratique.
              </div>
            </div>

            <div style={styles.row}>
              <button style={styles.secondaryBtn} onClick={() => setShowSettings(false)}>
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* PARENTS DASHBOARD */}
        {showParents && (
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0 }}>Tableau Parents</h3>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={styles.pill}>Réussite : {totalRate}%</span>
              <span style={styles.pill}>Meilleur combo : x{stats.bestStreak}</span>
              <span style={styles.pill}>Étoiles : {starsPct}%</span>
              <span style={styles.pill}>Réussites : {stats.totalCorrect}</span>
            </div>

            <h4 style={{ marginBottom: 6 }}>Résultats par type</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Tentatives</th>
                  <th style={styles.th}>Réussites</th>
                  <th style={styles.th}>%</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(TYPE_LABEL).map((t) => {
                  const s = stats.byType[t] ?? { attempts: 0, correct: 0 };
                  return (
                    <tr key={t}>
                      <td style={styles.td}>{TYPE_LABEL[t]}</td>
                      <td style={styles.td}>{s.attempts}</td>
                      <td style={styles.td}>{s.correct}</td>
                      <td style={styles.td}>{pct(s.correct, s.attempts)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <h4 style={{ marginBottom: 6, marginTop: 12 }}>Badges débloqués</h4>
            {stats.badges.length === 0 && <div style={styles.small}>Aucun badge pour le moment.</div>}
            {stats.badges.length > 0 && (
              <div>
                {BADGES.filter((b) => stats.badges.includes(b.id)).map((b) => (
                  <div key={b.id} style={styles.badge}>
                    <div style={{ fontWeight: 900 }}>{b.name}</div>
                    <div style={styles.small}>{b.desc}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.row}>
              <button style={styles.secondaryBtn} onClick={() => setShowParents(false)}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
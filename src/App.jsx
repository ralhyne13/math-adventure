import React, { useEffect, useMemo, useRef, useState } from "react";

/* =======================
   Pro Icons (inline SVG)
   (no external libraries)
======================= */
function Icon({ children, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}
const Icons = {
  Game: (p) => (
    <Icon {...p}>
      <path d="M7 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6.2 6.8h11.6a2.6 2.6 0 0 1 2.55 2.1l.9 4.6A3 3 0 0 1 20.3 17H3.7a3 3 0 0 1-2.95-3.5l.9-4.6A2.6 2.6 0 0 1 4.2 6.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Icon>
  ),
  Shop: (p) => (
    <Icon {...p}>
      <path
        d="M6 8h12l-1 13H7L6 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 8a3 3 0 0 1 6 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M6 8 4.5 4.5h15L18 8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </Icon>
  ),
  Settings: (p) => (
    <Icon {...p}>
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19 12a7.4 7.4 0 0 0-.08-1l2.04-1.57-2-3.46-2.45.98a7.2 7.2 0 0 0-1.72-1l-.38-2.6H9.6l-.38 2.6a7.2 7.2 0 0 0-1.72 1L5.05 5.97l-2 3.46L5.09 11a7.4 7.4 0 0 0 0 2l-2.04 1.57 2 3.46 2.45-.98a7.2 7.2 0 0 0 1.72 1l.38 2.6h4.8l.38-2.6a7.2 7.2 0 0 0 1.72-1l2.45.98 2-3.46L18.92 13c.05-.33.08-.66.08-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Icon>
  ),
  Heart: (p) => (
    <Icon {...p}>
      <path
        d="M12 20s-7-4.6-9.1-8.6C1.2 8.2 3 5.5 6 5.2c1.7-.2 3.2.6 4 1.7.8-1.1 2.3-1.9 4-1.7 3 .3 4.8 3 3.1 6.2C19 15.4 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Icon>
  ),
  Coin: (p) => (
    <Icon {...p}>
      <ellipse cx="12" cy="12" rx="8" ry="8" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 10.5c.5-1 1.6-1.7 2.8-1.7 1.6 0 2.9 1.1 2.9 2.5 0 1.2-.9 2-2.1 2.3l-1.4.3c-1.1.2-1.8.8-1.8 1.7 0 1 1 1.9 2.4 1.9 1.1 0 2.1-.5 2.6-1.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Icon>
  ),
  Level: (p) => (
    <Icon {...p}>
      <path d="M4 18V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 15l3-4 3 2 4-6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </Icon>
  ),
  User: (p) => (
    <Icon {...p}>
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Icon>
  ),
  Plus: (p) => (
    <Icon {...p}>
      <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Icon>
  ),
  Edit: (p) => (
    <Icon {...p}>
      <path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8L17.3 5.5a2 2 0 0 0-2.8 0L4 16v4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Icon>
  ),
  Trash: (p) => (
    <Icon {...p}>
      <path d="M6 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 7l1 14h6l1-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </Icon>
  ),
};

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
   🔊 Simple sounds (optional)
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
   🧠 Questions (no timer)
======================= */
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function addition(level) {
  const max = level * 5 + 10;
  const a = rand(1, max);
  const b = rand(1, max);
  return { type: "addition", text: `${a} + ${b}`, answer: a + b, steps: [`${a} + ${b} = ${a + b}`], reward: 5 };
}
function subtraction(level) {
  const max = level * 5 + 10;
  const a = rand(5, max);
  const b = rand(1, a);
  return { type: "subtraction", text: `${a} - ${b}`, answer: a - b, steps: [`${a} - ${b} = ${a - b}`], reward: 6 };
}
function multiplication(level) {
  const max = Math.min(12, level + 5);
  const a = rand(2, max);
  const b = rand(2, max);
  return { type: "multiplication", text: `${a} × ${b}`, answer: a * b, steps: [`${a} × ${b} = ${a * b}`], reward: 8 };
}
function division(level) {
  const b = rand(2, Math.min(10, level + 3));
  const result = rand(2, 12);
  const a = b * result;
  return { type: "division", text: `${a} ÷ ${b}`, answer: result, steps: [`${a} ÷ ${b} = ${result}`], reward: 10 };
}
function fraction() {
  const d = rand(2, 10);
  const n1 = rand(1, d);
  const n2 = rand(1, d);
  const num = n1 + n2;
  return { type: "fraction", text: `${n1}/${d} + ${n2}/${d}`, answer: num / d, steps: [`${n1}+${n2} = ${num} → ${num}/${d}`], reward: 12 };
}
function wordProblem(level) {
  const apples = rand(3, 10 + level);
  const eaten = rand(1, apples - 1);
  return { type: "problem", text: `Tu as ${apples} pommes. Tu en manges ${eaten}. Combien reste-t-il ?`, answer: apples - eaten, steps: [`${apples} - ${eaten} = ${apples - eaten}`], reward: 15 };
}

const GEN_MAP = { addition, subtraction, multiplication, division, fraction, problem: wordProblem };

const TYPE_LABEL = {
  addition: "Addition",
  subtraction: "Soustraction",
  multiplication: "Multiplication",
  division: "Division",
  fraction: "Fractions",
  problem: "Problèmes",
};

const THEMES = [
  {
    id: "space",
    name: "Espace",
    accent: "#8b5cf6",
    accent2: "#22d3ee",
    bg: "radial-gradient(1200px 600px at 10% 10%, rgba(139,92,246,0.35), transparent 50%), radial-gradient(900px 500px at 90% 30%, rgba(34,211,238,0.22), transparent 55%), linear-gradient(135deg, #050816 0%, #0b1024 45%, #0b0f1a 100%)",
  },
  {
    id: "jungle",
    name: "Jungle",
    accent: "#10b981",
    accent2: "#a3e635",
    bg: "radial-gradient(1200px 700px at 10% 10%, rgba(16,185,129,0.30), transparent 55%), radial-gradient(900px 500px at 85% 20%, rgba(163,230,53,0.22), transparent 55%), linear-gradient(135deg, #051b12 0%, #06261a 45%, #04130e 100%)",
  },
  {
    id: "magic",
    name: "Magie",
    accent: "#ec4899",
    accent2: "#a78bfa",
    bg: "radial-gradient(1200px 700px at 10% 20%, rgba(236,72,153,0.26), transparent 55%), radial-gradient(900px 500px at 90% 25%, rgba(167,139,250,0.22), transparent 55%), linear-gradient(135deg, #120412 0%, #1a0930 50%, #0b0b1b 100%)",
  },
];

const AVATARS = [
  { id: "cat", emoji: "🐱", price: 0 },
  { id: "robot", emoji: "🤖", price: 40 },
  { id: "alien", emoji: "👽", price: 80 },
  { id: "wizard", emoji: "🧙", price: 120 },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function App() {
  const { installable, install } = usePWAInstall();

  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);

  const [themeId, setThemeId] = useState("space");
  const [soundOn, setSoundOn] = useState(true);

  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);

  const [ownedAvatars, setOwnedAvatars] = useState(["cat"]);
  const [currentAvatar, setCurrentAvatar] = useState("cat");
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  const [exerciseTypes, setExerciseTypes] = useState({
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
    fraction: true,
    problem: true,
  });

  const [screen, setScreen] = useState("game"); // game | shop | settings

  const [question, setQuestion] = useState(() => addition(1));
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [showSteps, setShowSteps] = useState(false);

  const [shake, setShake] = useState(false);
  const [pop, setPop] = useState(false);

  const theme = useMemo(() => THEMES.find((t) => t.id === themeId) ?? THEMES[0], [themeId]);
  const accent = theme.accent;
  const accent2 = theme.accent2;

  const avatarEmoji = useMemo(() => AVATARS.find((a) => a.id === currentAvatar)?.emoji ?? "🐱", [currentAvatar]);
  const progress = (xp % (level * 50)) / (level * 50) * 100;

  const { playOk, playBad } = useSfx(soundOn);

  // LOAD
  useEffect(() => {
    const savedG = localStorage.getItem("mathAdventureGlobal");
    if (savedG) {
      const d = JSON.parse(savedG);
      setThemeId(d.themeId ?? "space");
      setSoundOn(d.soundOn ?? true);
    }

    const savedP = localStorage.getItem("mathAdventureProfiles");
    if (savedP) {
      const d = JSON.parse(savedP);
      setProfiles(d.profiles ?? []);
      setActiveProfileId(d.activeProfileId ?? null);
    } else {
      const defaultId = uid();
      setProfiles([{ id: defaultId, name: "Joueur 1", data: null }]);
      setActiveProfileId(defaultId);
    }
  }, []);

  // SAVE
  useEffect(() => {
    localStorage.setItem("mathAdventureGlobal", JSON.stringify({ themeId, soundOn }));
  }, [themeId, soundOn]);

  useEffect(() => {
    localStorage.setItem("mathAdventureProfiles", JSON.stringify({ profiles, activeProfileId }));
  }, [profiles, activeProfileId]);

  // Apply active profile
  useEffect(() => {
    if (!activeProfileId) return;
    const p = profiles.find((x) => x.id === activeProfileId);
    if (!p) return;

    const data = p.data;
    if (!data) {
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
      setQuestion(addition(1));
      setInput("");
      setMessage("");
      setShowSteps(false);
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
    setQuestion(data.question ?? addition(data.level ?? 1));
    setInput("");
    setMessage("");
    setShowSteps(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId]);

  // Persist active profile
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
    question,
    activeProfileId,
  ]);

  function enabledTypes() {
    const e = Object.entries(exerciseTypes)
      .filter(([, v]) => v)
      .map(([k]) => k);
    return e.length ? e : ["addition"];
  }

  function newQuestion(nextLevel = level) {
    const e = enabledTypes();
    const pick = e[rand(0, e.length - 1)];
    const gen = GEN_MAP[pick] || addition;
    setQuestion(gen(nextLevel));
    setInput("");
    setShowSteps(false);
    setMessage("");
  }

  function resetGame() {
    setLevel(1);
    setXp(0);
    setCoins(0);
    setLives(3);
    setDailyRewardClaimed(false);
    newQuestion(1);
  }

  function onCorrect() {
    playOk();
    setPop(true);
    setTimeout(() => setPop(false), 200);

    const gainedXp = 10;
    setXp((x) => x + gainedXp);
    setCoins((c) => c + (question.reward ?? 5));
    setMessage("Réponse correcte.");

    setLevel((lvl) => (xp + gainedXp >= lvl * 50 ? lvl + 1 : lvl));
    setTimeout(() => newQuestion(), 650);
  }

  function onWrong() {
    playBad();
    setShake(true);
    setTimeout(() => setShake(false), 320);

    setMessage("Réponse incorrecte. Regarde l’explication.");
    setShowSteps(true);

    setLives((l) => {
      const next = l - 1;
      if (next <= 0) {
        alert("Partie terminée ! On recommence au niveau 1.");
        resetGame();
        return 3;
      }
      return next;
    });

    setTimeout(() => newQuestion(), 1050);
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
    setMessage("Cadeau reçu (+30).");
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  function addProfile() {
    const name = prompt("Nom du profil ?");
    if (!name) return;
    const id = uid();
    setProfiles((prev) => [...prev, { id, name, data: null }]);
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
    if (profiles.length <= 1) return alert("Il faut au moins 1 profil.");
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Supprimer ce profil ? (progression perdue)")) return;
    const next = profiles.filter((p) => p.id !== id);
    setProfiles(next);
    if (activeProfileId === id) setActiveProfileId(next[0]?.id ?? null);
  }

  const styles = {
    app: {
      minHeight: "100vh",
      width: "100%",
      background: theme.bg,
      color: "rgba(255,255,255,0.92)",
      position: "relative",
      overflow: "hidden",
      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    },
    container: { maxWidth: 1100, margin: "0 auto", padding: "18px 16px 90px" },
    topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 },
    brand: { display: "flex", alignItems: "center", gap: 10, fontWeight: 900, letterSpacing: 0.2 },
    brandTitle: { fontSize: 14, fontWeight: 900, lineHeight: 1 },
    brandSub: { fontSize: 12, opacity: 0.8, fontWeight: 700 },
    pill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.10)",
      border: "1px solid rgba(255,255,255,0.14)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      fontSize: 12,
      fontWeight: 800,
    },
    grid: { display: "grid", gridTemplateColumns: "1fr", gap: 14 },
    glass: {
      background: "rgba(255,255,255,0.10)",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 18,
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    },
    panel: { padding: 14 },
    h2: { margin: 0, fontSize: 12, opacity: 0.85, fontWeight: 900, letterSpacing: 0.3 },
    progressWrap: {
      height: 10,
      width: "100%",
      background: "rgba(255,255,255,0.12)",
      borderRadius: 999,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.10)",
      marginTop: 10,
    },
    progressBar: {
      height: "100%",
      width: `${clamp(progress, 0, 100)}%`,
      background: `linear-gradient(90deg, ${accent}, ${accent2})`,
      borderRadius: 999,
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(0,0,0,0.20)",
      color: "rgba(255,255,255,0.92)",
      outline: "none",
      fontWeight: 800,
    },
    row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
    iconBtn: {
      padding: "10px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(0,0,0,0.20)",
      color: "rgba(255,255,255,0.92)",
      cursor: "pointer",
      fontWeight: 900,
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
    },
    primaryBtn: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: 16,
      border: 0,
      cursor: "pointer",
      fontWeight: 900,
      color: "white",
      background: `linear-gradient(90deg, ${accent}, ${accent2})`,
      boxShadow: "0 14px 35px rgba(0,0,0,0.35)",
      transform: pop ? "scale(1.02)" : "scale(1)",
      transition: "transform 120ms ease",
    },
    secondaryBtn: {
      padding: "10px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(0,0,0,0.20)",
      color: "rgba(255,255,255,0.92)",
      cursor: "pointer",
      fontWeight: 900,
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(0,0,0,0.22)",
      color: "rgba(255,255,255,0.92)",
      outline: "none",
      fontSize: 18,
      fontWeight: 900,
      textAlign: "center",
    },
    card: {
      padding: 16,
      borderRadius: 18,
      background: "rgba(0,0,0,0.18)",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      transform: shake ? "translateX(-6px)" : "translateX(0)",
      transition: "transform 120ms ease",
    },
    qText: { fontSize: 24, fontWeight: 900, letterSpacing: 0.3, margin: 0 },
    steps: {
      marginTop: 10,
      padding: 12,
      borderRadius: 16,
      background: "rgba(255,255,255,0.10)",
      border: "1px solid rgba(255,255,255,0.14)",
      fontSize: 13,
      lineHeight: 1.4,
    },
    nav: {
      position: "fixed",
      left: 12,
      right: 12,
      bottom: 12,
      maxWidth: 720,
      margin: "0 auto",
      padding: 10,
      borderRadius: 18,
      background: "rgba(10,10,14,0.55)",
      border: "1px solid rgba(255,255,255,0.14)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 10,
    },
    navBtn: (active) => ({
      padding: "10px 10px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.14)",
      background: active ? `linear-gradient(90deg, ${accent}, ${accent2})` : "rgba(0,0,0,0.20)",
      color: "white",
      fontWeight: 900,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    }),
  };

  const Keyframes = () => (
    <style>{`
      @media (min-width: 980px){
        .gridDesktop { grid-template-columns: 380px 1fr !important; }
      }
      .hoverLift:hover { transform: translateY(-2px); background: rgba(0,0,0,0.26); }
      .tap:active { transform: scale(0.98); }
      button:disabled { opacity: 0.55; cursor: not-allowed; }
    `}</style>
  );

  return (
    <div style={styles.app}>
      <Keyframes />
      <div style={styles.container}>
        {/* TOP BAR */}
        <div style={styles.topbar}>
          <div style={styles.brand}>
            <div style={{ width: 34, height: 34, borderRadius: 12, background: `linear-gradient(135deg, ${accent}, ${accent2})`, display: "grid", placeItems: "center", boxShadow: "0 12px 28px rgba(0,0,0,0.35)" }}>
              <Icons.Game size={18} />
            </div>
            <div>
              <div style={styles.brandTitle}>Aventure Math</div>
              <div style={styles.brandSub}>Typo Inter • Icônes SVG</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={styles.pill}>
              <Icons.Level size={16} /> Niv {level}
            </span>
            <span style={styles.pill}>
              <Icons.Coin size={16} /> {coins}
            </span>
            <span style={styles.pill}>
              <Icons.Heart size={16} /> {lives}
            </span>
          </div>
        </div>

        {/* GRID */}
        <div className="gridDesktop" style={styles.grid}>
          {/* LEFT */}
          <div style={{ ...styles.glass, ...styles.panel }}>
            {installable && (
              <button className="tap hoverLift" onClick={install} style={{ ...styles.secondaryBtn, width: "100%", justifyContent: "center" }}>
                <Icons.Game size={18} /> Installer l’application
              </button>
            )}

            <div style={{ marginTop: 12 }}>
              <div style={styles.h2}>PROFIL</div>
              <div style={{ marginTop: 8 }}>
                <select value={activeProfileId ?? ""} onChange={(e) => setActiveProfileId(e.target.value)} style={styles.select}>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ ...styles.row, marginTop: 10 }}>
                <button className="tap hoverLift" style={styles.iconBtn} onClick={addProfile}>
                  <Icons.Plus size={18} /> Ajouter
                </button>
                <button className="tap hoverLift" style={styles.iconBtn} onClick={() => activeProfile && renameProfile(activeProfile.id)}>
                  <Icons.Edit size={18} /> Renommer
                </button>
                <button className="tap hoverLift" style={styles.iconBtn} onClick={() => activeProfile && deleteProfile(activeProfile.id)}>
                  <Icons.Trash size={18} /> Supprimer
                </button>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={styles.h2}>PROGRESSION</div>
                <div style={{ marginTop: 10, fontWeight: 900, opacity: 0.92 }}>
                  XP {xp} • Objectif niveau : {level * 50}
                </div>
                <div style={styles.progressWrap}>
                  <div style={styles.progressBar} />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8, fontWeight: 700 }}>
                  {Math.round(progress)}% vers le prochain niveau
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={styles.h2}>ACTIONS</div>
                <div style={{ ...styles.row, marginTop: 10 }}>
                  <button className="tap hoverLift" style={styles.secondaryBtn} onClick={claimDailyReward} disabled={dailyRewardClaimed}>
                    <Icons.Coin size={18} /> Cadeau
                  </button>
                  <button className="tap hoverLift" style={styles.secondaryBtn} onClick={() => setShowSteps((s) => !s)}>
                    <Icons.Settings size={18} /> Explication
                  </button>
                  <button className="tap hoverLift" style={styles.secondaryBtn} onClick={() => newQuestion()}>
                    <Icons.Game size={18} /> Nouvelle
                  </button>
                </div>

                {message && <div style={{ marginTop: 10, fontWeight: 900, opacity: 0.95 }}>{message}</div>}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ ...styles.glass, ...styles.panel }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 0.2 }}>
                  {screen === "game" ? "Exercice" : screen === "shop" ? "Boutique" : "Réglages"}
                </div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.82, fontWeight: 700 }}>
                  {screen === "game"
                    ? "Réponds calmement, sans limite de temps."
                    : screen === "shop"
                    ? "Achète des avatars avec tes pièces."
                    : "Personnalise le thème, les sons et les exercices."}
                </div>
              </div>
              <span style={styles.pill}>
                <Icons.User size={16} /> {TYPE_LABEL[question.type] ?? "Math"}
              </span>
            </div>

            {screen === "game" && (
              <>
                <div style={{ marginTop: 14, ...styles.card }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, opacity: 0.9 }}>Mascotte</div>
                    <div style={{ fontSize: 28 }}>{avatarEmoji}</div>
                  </div>

                  <p style={styles.qText}>{question.text}</p>

                  <div style={{ marginTop: 12 }}>
                    <input
                      type="number"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      style={styles.input}
                      placeholder="Ta réponse"
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button className="tap" onClick={checkAnswer} style={styles.primaryBtn}>
                      Valider
                    </button>
                  </div>

                  <div style={{ ...styles.row, marginTop: 12, justifyContent: "center" }}>
                    <button className="tap hoverLift" style={styles.secondaryBtn} onClick={() => newQuestion()}>
                      <Icons.Game size={18} /> Nouvelle question
                    </button>
                    <button className="tap hoverLift" style={styles.secondaryBtn} onClick={() => setInput("")}>
                      <Icons.Settings size={18} /> Effacer
                    </button>
                  </div>
                </div>

                {showSteps && (
                  <div style={styles.steps}>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Explication</div>
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                      {(question.steps ?? []).map((s, idx) => (
                        <li key={idx} style={{ marginBottom: 6 }}>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}

            {screen === "shop" && (
              <div style={{ marginTop: 14, ...styles.card }}>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Avatar actuel : <span style={{ fontSize: 26 }}>{avatarEmoji}</span></div>

                {AVATARS.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 26 }}>{a.emoji}</div>
                      <div>
                        <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>{a.id.toUpperCase()}</div>
                        <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 700 }}>Prix : {a.price} pièces</div>
                      </div>
                    </div>

                    {ownedAvatars.includes(a.id) ? (
                      <button className="tap hoverLift" style={styles.secondaryBtn} onClick={() => setCurrentAvatar(a.id)}>
                        {currentAvatar === a.id ? "Équipé" : "Équiper"}
                      </button>
                    ) : (
                      <button className="tap hoverLift" style={styles.secondaryBtn} onClick={() => buyAvatar(a)} disabled={coins < a.price}>
                        Acheter
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {screen === "settings" && (
              <div style={{ marginTop: 14, ...styles.card }}>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Thème</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      className="tap hoverLift"
                      onClick={() => setThemeId(t.id)}
                      style={{
                        ...styles.secondaryBtn,
                        justifyContent: "center",
                        background: themeId === t.id ? `linear-gradient(90deg, ${t.accent}, ${t.accent2})` : "rgba(0,0,0,0.20)",
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 14, fontWeight: 900 }}>Sons</div>
                <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, fontWeight: 800 }}>
                  <input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} />
                  Activer les sons
                </label>

                <div style={{ marginTop: 14, fontWeight: 900 }}>Types d’exercices</div>
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {Object.keys(exerciseTypes).map((k) => (
                    <label
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 14,
                        background: "rgba(0,0,0,0.20)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        fontWeight: 900,
                      }}
                    >
                      <span>{TYPE_LABEL[k]}</span>
                      <input
                        type="checkbox"
                        checked={exerciseTypes[k]}
                        onChange={(e) => setExerciseTypes((p) => ({ ...p, [k]: e.target.checked }))}
                      />
                    </label>
                  ))}
                </div>

                <div style={{ ...styles.row, marginTop: 14, justifyContent: "center" }}>
                  <button className="tap hoverLift" style={styles.secondaryBtn} onClick={resetGame}>
                    Réinitialiser
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom NAV */}
      <div style={styles.nav}>
        <button style={styles.navBtn(screen === "game")} onClick={() => setScreen("game")}>
          <Icons.Game size={18} /> Jeu
        </button>
        <button style={styles.navBtn(screen === "shop")} onClick={() => setScreen("shop")}>
          <Icons.Shop size={18} /> Boutique
        </button>
        <button style={styles.navBtn(screen === "settings")} onClick={() => setScreen("settings")}>
          <Icons.Settings size={18} /> Réglages
        </button>
      </div>
    </div>
  );
}
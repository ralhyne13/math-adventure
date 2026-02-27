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
   🔊 Simple sounds (optional)
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

const TYPE_LABEL = {
  addition: "Addition",
  subtraction: "Soustraction",
  multiplication: "Multiplication",
  division: "Division",
  fraction: "Fractions",
  problem: "Problèmes",
};

/* =======================
   🎨 Pro themes (pro UI)
======================= */
const THEMES = [
  {
    id: "space",
    name: "Espace",
    accent: "#8b5cf6",
    accent2: "#22d3ee",
    bg: "radial-gradient(1200px 600px at 10% 10%, rgba(139,92,246,0.35), transparent 50%), radial-gradient(900px 500px at 90% 30%, rgba(34,211,238,0.22), transparent 55%), radial-gradient(900px 600px at 40% 90%, rgba(59,130,246,0.18), transparent 55%), linear-gradient(135deg, #050816 0%, #0b1024 45%, #0b0f1a 100%)",
    sparkle: "✨",
  },
  {
    id: "jungle",
    name: "Jungle",
    accent: "#10b981",
    accent2: "#a3e635",
    bg: "radial-gradient(1200px 700px at 10% 10%, rgba(16,185,129,0.30), transparent 55%), radial-gradient(900px 500px at 85% 20%, rgba(163,230,53,0.22), transparent 55%), radial-gradient(900px 600px at 30% 95%, rgba(34,197,94,0.14), transparent 60%), linear-gradient(135deg, #051b12 0%, #06261a 45%, #04130e 100%)",
    sparkle: "🌿",
  },
  {
    id: "magic",
    name: "Magie",
    accent: "#ec4899",
    accent2: "#a78bfa",
    bg: "radial-gradient(1200px 700px at 10% 20%, rgba(236,72,153,0.26), transparent 55%), radial-gradient(900px 500px at 90% 25%, rgba(167,139,250,0.22), transparent 55%), radial-gradient(900px 600px at 35% 95%, rgba(59,130,246,0.14), transparent 60%), linear-gradient(135deg, #120412 0%, #1a0930 50%, #0b0b1b 100%)",
    sparkle: "🪄",
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

/* =======================
   Small UI helpers
======================= */
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function formatPct(n) {
  const x = Math.round(n);
  return `${clamp(x, 0, 100)}%`;
}

function countEnabled(obj) {
  return Object.values(obj).filter(Boolean).length;
}

/* =======================
   App
======================= */
export default function App() {
  const { installable, install } = usePWAInstall();

  /* Multi profiles */
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);

  /* Global settings */
  const [themeId, setThemeId] = useState("space");
  const [soundOn, setSoundOn] = useState(true);

  /* Game state */
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);

  const [ownedAvatars, setOwnedAvatars] = useState(["cat"]);
  const [currentAvatar, setCurrentAvatar] = useState("cat");
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  /* Pedagogy options */
  const [exerciseTypes, setExerciseTypes] = useState({
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
    fraction: true,
    problem: true,
  });

  /* UI */
  const [screen, setScreen] = useState("game"); // game | shop | settings
  const [question, setQuestion] = useState(() => addition(1));
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [showSteps, setShowSteps] = useState(false);

  const [shake, setShake] = useState(false);
  const [pop, setPop] = useState(false);

  const theme = useMemo(() => THEMES.find((t) => t.id === themeId) ?? THEMES[0], [themeId]);
  const avatarEmoji = useMemo(
    () => AVATARS.find((a) => a.id === currentAvatar)?.emoji ?? "🐱",
    [currentAvatar]
  );
  const progress = (xp % (level * 50)) / (level * 50) * 100;

  const { playOk, playBad } = useSfx(soundOn);

  /* LOAD */
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
      const defaultProfile = { id: defaultId, name: "Joueur 1", data: null };
      setProfiles([defaultProfile]);
      setActiveProfileId(defaultId);
    }
  }, []);

  /* SAVE */
  useEffect(() => {
    localStorage.setItem("mathAdventureGlobal", JSON.stringify({ themeId, soundOn }));
  }, [themeId, soundOn]);

  useEffect(() => {
    localStorage.setItem("mathAdventureProfiles", JSON.stringify({ profiles, activeProfileId }));
  }, [profiles, activeProfileId]);

  /* Apply active profile */
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

  /* Persist active profile state */
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
    const q = gen(nextLevel);
    setQuestion(q);
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
    setTimeout(() => setPop(false), 220);

    const gainedXp = 10;
    setXp((x) => x + gainedXp);
    setCoins((c) => c + (question.reward ?? 5));
    setMessage(`Bravo ${theme.sparkle}`);

    setLevel((lvl) => {
      const next = xp + gainedXp >= lvl * 50 ? lvl + 1 : lvl;
      return next;
    });

    setTimeout(() => newQuestion(), 650);
  }

  function onWrong() {
    playBad();
    setShake(true);
    setTimeout(() => setShake(false), 320);

    setMessage("Oups… essaie encore 🙂");
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
    setMessage("Cadeau reçu : +30 💰");
  }

  /* Profiles */
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

  /* =======================
     Pro UI components (inline)
======================= */
  const styles = useMemo(() => {
    const accent = theme.accent;
    const accent2 = theme.accent2;

    return {
      app: {
        minHeight: "100vh",
        width: "100%",
        background: theme.bg,
        color: "rgba(255,255,255,0.92)",
        position: "relative",
        overflow: "hidden",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
      },

      // subtle animated noise overlay
      noise: {
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        opacity: 0.08,
        backgroundImage:
          "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22><filter id=%22n%22 x=%220%22 y=%220%22 width=%22100%25%22 height=%22100%25%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22400%22 height=%22400%22 filter=%22url(%23n)%22 opacity=%220.35%22/></svg>')",
      },

      container: {
        maxWidth: 1100,
        margin: "0 auto",
        padding: "18px 16px 90px",
      },

      topbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
      },

      brand: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontWeight: 900,
        letterSpacing: 0.3,
      },

      badge: {
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

      grid: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 14,
      },

      // desktop two columns
      gridDesktop: {
        gridTemplateColumns: "380px 1fr",
        alignItems: "start",
      },

      glass: {
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 18,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      },

      panel: {
        padding: 14,
      },

      h2: {
        margin: 0,
        fontSize: 14,
        opacity: 0.9,
        fontWeight: 900,
        letterSpacing: 0.25,
      },

      big: {
        fontSize: 30,
        fontWeight: 950,
        margin: 0,
      },

      sub: {
        margin: "6px 0 0",
        opacity: 0.86,
        fontWeight: 650,
        fontSize: 13,
      },

      progressWrap: {
        height: 10,
        width: "100%",
        background: "rgba(255,255,255,0.12)",
        borderRadius: 999,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
        marginTop: 10,
      },

      progressBar: (pct) => ({
        height: "100%",
        width: `${clamp(pct, 0, 100)}%`,
        background: `linear-gradient(90deg, ${accent}, ${accent2})`,
        borderRadius: 999,
      }),

      statGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 10,
        marginTop: 12,
      },

      statCard: {
        padding: 12,
        borderRadius: 16,
        background: "rgba(0,0,0,0.16)",
        border: "1px solid rgba(255,255,255,0.10)",
      },

      statLabel: { fontSize: 12, opacity: 0.8, fontWeight: 800 },
      statValue: { fontSize: 18, fontWeight: 950, marginTop: 6 },

      row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },

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

      iconBtn: {
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(0,0,0,0.20)",
        color: "rgba(255,255,255,0.92)",
        cursor: "pointer",
        fontWeight: 900,
        transition: "transform 120ms ease, background 120ms ease",
      },

      primaryBtn: {
        width: "100%",
        padding: "12px 14px",
        borderRadius: 16,
        border: "0",
        cursor: "pointer",
        fontWeight: 950,
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

      questionCard: {
        padding: 16,
        borderRadius: 18,
        background: "rgba(0,0,0,0.18)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        transform: shake ? "translateX(-6px)" : "translateX(0)",
        transition: "transform 120ms ease",
      },

      questionText: {
        fontSize: 24,
        fontWeight: 980,
        letterSpacing: 0.3,
        margin: 0,
      },

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
        background: active
          ? `linear-gradient(90deg, ${accent}, ${accent2})`
          : "rgba(0,0,0,0.20)",
        color: "white",
        fontWeight: 950,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }),

      tiny: { fontSize: 12, opacity: 0.8, fontWeight: 800 },
    };
  }, [theme, progress, shake, pop]);

  /* inline keyframes once */
  const Keyframes = () => (
    <style>{`
      @media (min-width: 980px){
        .gridDesktop { grid-template-columns: 380px 1fr !important; }
      }
      .hoverLift:hover { transform: translateY(-2px); background: rgba(0,0,0,0.26); }
      .tap:active { transform: scale(0.98); }
    `}</style>
  );

  return (
    <div style={styles.app}>
      <Keyframes />
      <div style={styles.noise} />

      <div style={styles.container}>
        {/* TOP BAR */}
        <div style={styles.topbar}>
          <div style={styles.brand}>
            <div style={{ fontSize: 22 }}>{avatarEmoji}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 950, lineHeight: 1 }}>
                Aventure Math
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 800 }}>
                App éducative • design pro
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={styles.badge}>Niv {level}</span>
            <span style={styles.badge}>💰 {coins}</span>
            <span style={styles.badge}>❤️ {lives}</span>
          </div>
        </div>

        {/* GRID */}
        <div
          className="gridDesktop"
          style={{
            ...styles.grid,
            ...(window.innerWidth >= 980 ? styles.gridDesktop : {}),
          }}
        >
          {/* LEFT PANEL */}
          <div style={{ ...styles.glass, ...styles.panel }}>
            {installable && (
              <button
                className="tap hoverLift"
                onClick={install}
                style={{ ...styles.secondaryBtn, width: "100%" }}
              >
                📲 Installer l’application
              </button>
            )}

            <div style={{ marginTop: 12 }}>
              <div style={styles.h2}>Profil</div>
              <div style={{ marginTop: 8 }}>
                <select
                  value={activeProfileId ?? ""}
                  onChange={(e) => setActiveProfileId(e.target.value)}
                  style={styles.select}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      👤 {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ ...styles.row, marginTop: 10 }}>
                <button className="tap hoverLift" style={styles.iconBtn} onClick={addProfile}>
                  ➕ Profil
                </button>
                <button
                  className="tap hoverLift"
                  style={styles.iconBtn}
                  onClick={() => activeProfile && renameProfile(activeProfile.id)}
                >
                  ✏️
                </button>
                <button
                  className="tap hoverLift"
                  style={styles.iconBtn}
                  onClick={() => activeProfile && deleteProfile(activeProfile.id)}
                >
                  🗑️
                </button>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={styles.h2}>Progression</div>
                <div style={{ marginTop: 8, fontWeight: 950 }}>
                  XP {xp} • Objectif niv : {level * 50}
                </div>
                <div style={styles.progressWrap}>
                  <div style={styles.progressBar(progress)} />
                </div>
                <div style={styles.tiny}>{formatPct(progress)} vers le prochain niveau</div>

                <div style={styles.statGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Thème</div>
                    <div style={styles.statValue}>{theme.name}</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Exercices</div>
                    <div style={styles.statValue}>{countEnabled(exerciseTypes)}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={styles.h2}>Raccourcis</div>
                <div style={{ ...styles.row, marginTop: 10 }}>
                  <button
                    className="tap hoverLift"
                    style={styles.secondaryBtn}
                    onClick={claimDailyReward}
                    disabled={dailyRewardClaimed}
                    title="Cadeau du jour"
                  >
                    🎁 Cadeau
                  </button>
                  <button
                    className="tap hoverLift"
                    style={styles.secondaryBtn}
                    onClick={() => setShowSteps((s) => !s)}
                    title="Voir/cacher explication"
                  >
                    💡 Explication
                  </button>
                </div>
                {message && (
                  <div style={{ marginTop: 10, fontWeight: 950, opacity: 0.95 }}>
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ ...styles.glass, ...styles.panel }}>
            {/* Screen header */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div>
                <p style={styles.big}>Mode {screen === "game" ? "Jeu" : screen === "shop" ? "Boutique" : "Réglages"}</p>
                <p style={styles.sub}>
                  {screen === "game"
                    ? "Réponds, progresse, gagne des récompenses."
                    : screen === "shop"
                    ? "Débloque des avatars avec tes pièces."
                    : "Personnalise le thème, les exercices et les sons."}
                </p>
              </div>
              <div style={{ ...styles.badge, alignSelf: "start" }}>
                {TYPE_LABEL[question.type] ?? "Math"}
              </div>
            </div>

            {screen === "game" && (
              <>
                <div style={{ marginTop: 14, ...styles.questionCard }}>
                  <p style={styles.questionText}>{question.text}</p>

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
                      Valider ✅
                    </button>
                  </div>

                  <div style={{ ...styles.row, marginTop: 12, justifyContent: "center" }}>
                    <button className="tap hoverLift" style={styles.secondaryBtn} onClick={() => newQuestion()}>
                      🔄 Nouvelle question
                    </button>
                    <button className="tap hoverLift" style={styles.secondaryBtn} onClick={() => setInput("")}>
                      ⌫ Effacer
                    </button>
                  </div>
                </div>

                {showSteps && (
                  <div style={styles.steps}>
                    <div style={{ fontWeight: 950, marginBottom: 8 }}>💡 Explication</div>
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
              <div style={{ marginTop: 14 }}>
                <div style={{ ...styles.questionCard }}>
                  <div style={{ fontWeight: 950, marginBottom: 10 }}>
                    Ton avatar : <span style={{ fontSize: 22 }}>{avatarEmoji}</span>
                  </div>

                  {AVATARS.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "10px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 26 }}>{a.emoji}</div>
                        <div>
                          <div style={{ fontWeight: 950 }}>{a.id.toUpperCase()}</div>
                          <div style={styles.tiny}>
                            Prix : {a.price} pièces
                          </div>
                        </div>
                      </div>

                      {ownedAvatars.includes(a.id) ? (
                        <button
                          className="tap hoverLift"
                          style={styles.secondaryBtn}
                          onClick={() => setCurrentAvatar(a.id)}
                        >
                          {currentAvatar === a.id ? "✅ Équipé" : "Équiper"}
                        </button>
                      ) : (
                        <button
                          className="tap hoverLift"
                          style={styles.secondaryBtn}
                          onClick={() => buyAvatar(a)}
                          disabled={coins < a.price}
                          title={coins < a.price ? "Pas assez de pièces" : "Acheter"}
                        >
                          Acheter
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {screen === "settings" && (
              <div style={{ marginTop: 14 }}>
                <div style={{ ...styles.questionCard }}>
                  <div style={{ fontWeight: 980, marginBottom: 10 }}>🎨 Thème</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        className="tap hoverLift"
                        onClick={() => setThemeId(t.id)}
                        style={{
                          ...styles.secondaryBtn,
                          borderRadius: 16,
                          background:
                            themeId === t.id
                              ? `linear-gradient(90deg, ${t.accent}, ${t.accent2})`
                              : "rgba(0,0,0,0.20)",
                        }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: 14, fontWeight: 980 }}>🔊 Sons</div>
                  <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, fontWeight: 850 }}>
                    <input
                      type="checkbox"
                      checked={soundOn}
                      onChange={(e) => setSoundOn(e.target.checked)}
                    />
                    Activer les sons (bonne réponse / erreur)
                  </label>
                  <div style={{ ...styles.tiny, marginTop: 6 }}>
                    (Optionnel) Ajoute <code>/public/sfx-correct.mp3</code> et <code>/public/sfx-wrong.mp3</code>
                  </div>

                  <div style={{ marginTop: 14, fontWeight: 980 }}>🧠 Types d’exercices</div>
                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
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
                      ♻️ Réinitialiser la partie
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom NAV */}
      <div style={styles.nav}>
        <button style={styles.navBtn(screen === "game")} onClick={() => setScreen("game")}>
          🎮 <span>Jeu</span>
        </button>
        <button style={styles.navBtn(screen === "shop")} onClick={() => setScreen("shop")}>
          🛒 <span>Boutique</span>
        </button>
        <button style={styles.navBtn(screen === "settings")} onClick={() => setScreen("settings")}>
          ⚙️ <span>Réglages</span>
        </button>
      </div>
    </div>
  );
}
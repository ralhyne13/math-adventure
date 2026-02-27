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
    steps: [
      `On additionne les deux nombres.`,
      `${a} + ${b} = ${a + b}`,
    ],
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
    steps: [
      `On retire ${b} à ${a}.`,
      `${a} - ${b} = ${a - b}`,
    ],
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
   🎨 Themes (Design)
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

  /* =======================
     UI
  ====================== */
  const [question, setQuestion] = useState(() => addition(1));
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [showSteps, setShowSteps] = useState(false);

  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shake, setShake] = useState(false);
  const [burst, setBurst] = useState(false);

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
      // create default profile
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
      // default fresh state
      setLevel(1);
      setXp(0);
      setCoins(0);
      setLives(3);
      setTimer(20);
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
            timer,
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
    timer,
    ownedAvatars,
    currentAvatar,
    dailyRewardClaimed,
    exerciseTypes,
    question,
    activeProfileId,
  ]);

  /* =======================
     Timer
  ====================== */


  function getEnabledGenerators() {
    const enabled = Object.entries(exerciseTypes)
      .filter(([, v]) => v)
      .map(([k]) => k);

    // sécurité : si tout décoché → on remet addition
    if (enabled.length === 0) return ["addition"];
    return enabled;
  }

  function newQuestion(nextLevel = level) {
    const enabled = getEnabledGenerators();
    const pick = enabled[rand(0, enabled.length - 1)];
    const gen = GEN_MAP[pick] || addition;
    const q = gen(nextLevel);
    setQuestion(q);

    setInput("");
    setShowSteps(false);
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
    setBurst(true);
    setTimeout(() => setBurst(false), 450);

    const gainedXp = 10;
    setXp((x) => x + gainedXp);
    setCoins((c) => c + (question.reward ?? 5));
    setMessage(`Bravo ! ${theme.sparkle}`);

    // level up
    setLevel((lvl) => {
      const next = xp + gainedXp >= lvl * 50 ? lvl + 1 : lvl;
      if (next !== lvl) setMessage(`Niveau supérieur ! 🚀`);
      return next;
    });


  }

  function onWrong(fromTimeout = false) {
    playBad();
    setShake(true);
    setTimeout(() => setShake(false), 350);

    setMessage(fromTimeout ? "Temps écoulé ⏱️" : "Oups…");
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

    // on pose une nouvelle question après un court délai
    setTimeout(() => newQuestion(), 1200);
  }

  function checkAnswer() {
    const correct = Number(input) === question.answer;
    if (correct) onCorrect();
    else onWrong(false);
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
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
  },

  card: {
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    background: theme.card,
    borderRadius: 22,
    padding: 16,
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
    textAlign: "center",
    border: "1px solid rgba(0,0,0,0.08)",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },

  select: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "white",
    fontWeight: 700,
  },

  iconBtn: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    cursor: "pointer",
    fontWeight: 800,
  },

  mascot: {
    fontSize: 56,
    marginBottom: 10,
  },

  title: {
    margin: 0,
    fontSize: 26,
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 12,
    opacity: 0.85,
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    fontSize: 13,
    marginBottom: 10,
  },

  progressWrap: {
    height: 10,
    width: "100%",
    background: "rgba(0,0,0,0.10)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 10,
  },

  progressBar: {
    height: "100%",
    background: theme.accent,
  },

  question: {
    fontSize: 20,
    fontWeight: 900,
    marginTop: 10,
    marginBottom: 10,
  },

  input: {
    width: "100%",
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.18)",
    fontSize: 18,
    textAlign: "center",
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

  row: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    marginTop: 12,
    flexWrap: "wrap",
  
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
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

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
            <button
              style={styles.iconBtn}
              onClick={() => activeProfile && renameProfile(activeProfile.id)}
              title="Renommer"
            >
              ✏️
            </button>
            <button
              style={styles.iconBtn}
              onClick={() => activeProfile && deleteProfile(activeProfile.id)}
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </div>

        <div style={styles.pillRow}>
          <span style={styles.pill}>Thème : {theme.name}</span>
          <span style={styles.pill}>Exos : {Object.values(exerciseTypes).filter(Boolean).length}</span>
          <span style={styles.pill}>Sons : {soundOn ? "ON" : "OFF"}</span>
        </div>

        <div style={styles.mascot}>{avatarEmoji}</div>
        <h1 style={styles.title}>Aventure Math</h1>
        <p style={styles.subtitle}>
          {activeProfile ? `Profil : ${activeProfile.name}` : "Choisis un profil"} • {theme.sparkle}
        </p>

        <div style={styles.stats}>
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

        {message && <div style={{ marginTop: 10, fontWeight: 900 }}>{message}</div>}

        {showSteps && (
          <div style={styles.steps}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>💡 Explication :</div>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {(question.steps ?? [question.explanation ?? ""]).filter(Boolean).map((s, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}

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

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>🧠 Types d’exercices</div>
              {Object.keys(exerciseTypes).map((k) => (
                <div key={k} style={styles.checkboxRow}>
                  <span style={{ fontWeight: 800 }}>
                    {k === "addition" && "Addition"}
                    {k === "subtraction" && "Soustraction"}
                    {k === "multiplication" && "Multiplication"}
                    {k === "division" && "Division"}
                    {k === "fraction" && "Fractions"}
                    {k === "problem" && "Problèmes"}
                  </span>
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
      </div>
    </div>
  );
}
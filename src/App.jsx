import React, { useEffect, useMemo, useState } from "react";

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
   🧠 Questions
======================= */
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function addition(level) {
  const max = level * 5 + 10;
  const a = rand(1, max);
  const b = rand(1, max);
  return { text: `${a} + ${b}`, answer: a + b, explanation: `${a} + ${b} = ${a + b}`, reward: 5 };
}

function subtraction(level) {
  const max = level * 5 + 10;
  const a = rand(5, max);
  const b = rand(1, a);
  return { text: `${a} - ${b}`, answer: a - b, explanation: `${a} - ${b} = ${a - b}`, reward: 6 };
}

function multiplication(level) {
  const max = Math.min(12, level + 5);
  const a = rand(2, max);
  const b = rand(2, max);
  return { text: `${a} × ${b}`, answer: a * b, explanation: `${a} × ${b} = ${a * b}`, reward: 8 };
}

function division(level) {
  const b = rand(2, Math.min(10, level + 3));
  const result = rand(2, 12);
  const a = b * result;
  return { text: `${a} ÷ ${b}`, answer: result, explanation: `${a} ÷ ${b} = ${result}`, reward: 10 };
}

function fraction() {
  const d = rand(2, 10);
  const n1 = rand(1, d);
  const n2 = rand(1, d);
  return {
    text: `${n1}/${d} + ${n2}/${d}`,
    answer: (n1 + n2) / d,
    explanation: `Même dénominateur → ${n1}+${n2}=${n1 + n2} → ${(n1 + n2)}/${d}`,
    reward: 12,
  };
}

function wordProblem(level) {
  const apples = rand(3, 10 + level);
  const eaten = rand(1, apples - 1);
  return {
    text: `Tu as ${apples} pommes. Tu en manges ${eaten}. Combien reste-t-il ?`,
    answer: apples - eaten,
    explanation: `${apples} - ${eaten} = ${apples - eaten}`,
    reward: 15,
  };
}

const GENERATORS = [addition, subtraction, multiplication, division, fraction, wordProblem];
function generateQuestion(level) {
  const gen = GENERATORS[rand(0, GENERATORS.length - 1)];
  return gen(level);
}

/* =======================
   🧍 Avatars
======================= */
const AVATARS = [
  { id: "cat", emoji: "🐱", price: 0 },
  { id: "robot", emoji: "🤖", price: 40 },
  { id: "alien", emoji: "👽", price: 80 },
  { id: "wizard", emoji: "🧙", price: 120 },
];

export default function App() {
  const { installable, install } = usePWAInstall();

  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);

  const [timer, setTimer] = useState(20);
  const [question, setQuestion] = useState(() => generateQuestion(1));
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);

  const [ownedAvatars, setOwnedAvatars] = useState(["cat"]);
  const [currentAvatar, setCurrentAvatar] = useState("cat");
  const [showShop, setShowShop] = useState(false);

  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  // LOAD
  useEffect(() => {
    const saved = localStorage.getItem("mathAdventurePWA");
    if (!saved) return;
    const d = JSON.parse(saved);
    setLevel(d.level ?? 1);
    setXp(d.xp ?? 0);
    setCoins(d.coins ?? 0);
    setLives(d.lives ?? 3);
    setOwnedAvatars(d.ownedAvatars ?? ["cat"]);
    setCurrentAvatar(d.currentAvatar ?? "cat");
    setDailyRewardClaimed(d.dailyRewardClaimed ?? false);
    setQuestion(generateQuestion(d.level ?? 1));
  }, []);

  // SAVE
  useEffect(() => {
    localStorage.setItem(
      "mathAdventurePWA",
      JSON.stringify({ level, xp, coins, lives, ownedAvatars, currentAvatar, dailyRewardClaimed })
    );
  }, [level, xp, coins, lives, ownedAvatars, currentAvatar, dailyRewardClaimed]);

  // TIMER
  useEffect(() => {
    if (timer <= 0) {
      loseLife();
      return;
    }
    const i = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(i);
  }, [timer]);

  function newQuestion(nextLevel = level) {
    setQuestion(generateQuestion(nextLevel));
    setTimer(20);
    setInput("");
    setShowExplanation(false);
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

  function loseLife() {
    setLives((l) => {
      if (l - 1 <= 0) {
        alert("Partie terminée ! On recommence au niveau 1.");
        resetGame();
        return 3;
      }
      return l - 1;
    });
    newQuestion();
  }

  function checkAnswer() {
    const correct = Number(input) === question.answer;

    if (correct) {
      const gainedXp = 10;
      setXp((x) => x + gainedXp);
      setCoins((c) => c + (question.reward ?? 5));
      setMessage("Bonne réponse 🎉");

      // level up
      setLevel((lvl) => {
        const next = xp + gainedXp >= lvl * 50 ? lvl + 1 : lvl;
        if (next !== lvl) setMessage("Niveau supérieur ! 🚀");
        return next;
      });

      setTimeout(() => newQuestion(), 900);
    } else {
      setMessage("Incorrect 😢");
      setShowExplanation(true);
      loseLife();
    }
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

  const avatarEmoji = useMemo(() => AVATARS.find((a) => a.id === currentAvatar)?.emoji ?? "🐱", [currentAvatar]);
  const progress = (xp % (level * 50)) / (level * 50) * 100;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {installable && (
          <button onClick={install} style={styles.installBtn}>
            📲 Installer l’application
          </button>
        )}

        <div style={{ fontSize: 54 }}>{avatarEmoji}</div>
        <h1 style={{ margin: 0 }}>Aventure Math</h1>
        <p style={{ marginTop: 6, marginBottom: 12, opacity: 0.8 }}>Jeu de maths + progression + récompenses</p>

        <div style={styles.stats}>
          <div>Niv {level}</div>
          <div>XP {xp}</div>
          <div>💰 {coins}</div>
          <div>❤️ {lives}</div>
        </div>

        <div style={styles.progressWrap}>
          <div style={{ ...styles.progressBar, width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>

        <div style={{ fontWeight: 600 }}>⏱ {timer}s</div>

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

        {message && <div style={{ marginTop: 10, fontWeight: 600 }}>{message}</div>}

        {showExplanation && <div style={styles.explain}>💡 {question.explanation}</div>}

        <div style={styles.row}>
          <button onClick={() => setShowShop((s) => !s)} style={styles.secondaryBtn}>
            🛒 Boutique
          </button>
          <button onClick={claimDailyReward} style={styles.secondaryBtn} disabled={dailyRewardClaimed}>
            🎁 Cadeau du jour
          </button>
        </div>

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
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background: "linear-gradient(135deg, #dbeafe, #e9d5ff)",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "white",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
    textAlign: "center",
  },
  installBtn: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    cursor: "pointer",
    marginBottom: 10,
    fontWeight: 700,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    fontSize: 13,
    marginBottom: 10,
    opacity: 0.9,
  },
  progressWrap: {
    height: 10,
    width: "100%",
    background: "rgba(0,0,0,0.08)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBar: {
    height: "100%",
    background: "#6366f1",
  },
  question: {
    fontSize: 20,
    fontWeight: 800,
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
    outline: "none",
  },
  primaryBtn: {
    width: "100%",
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    border: "none",
    background: "#6366f1",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 16,
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  row: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    marginTop: 12,
    flexWrap: "wrap",
  },
  explain: {
    marginTop: 10,
    background: "rgba(99,102,241,0.08)",
    padding: 10,
    borderRadius: 14,
    textAlign: "left",
    fontSize: 13,
  },
  shop: {
    marginTop: 12,
    textAlign: "left",
    background: "rgba(0,0,0,0.04)",
    padding: 12,
    borderRadius: 16,
  },
  shopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "8px 0",
  },
};
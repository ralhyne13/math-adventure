// App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
import { clamp, randInt } from "./utils/math";
import { playBeep } from "./utils/audio";
import {
  safeLSGet,
  safeLSSet,
  parisDayKey,
  isYesterdayKey,
  parisWeekKey,
  normalizePseudo,
  userKey,
  getUsersIndex,
  setUsersIndex,
  safeName,
} from "./storage";
import {
  GRADES,
  DIFFS,
  MODES,
  DAILY_CHALLENGES,
  WEEKLY_CHALLENGES,
  modeName,
  createChallengeProgress,
  challengeById,
  challengeProgressValue,
  applyAnswerToChallengeStats,
  questionSignature,
  makeQuestion,
  stepDiff,
  buildHints,
  buildMethodSteps,
  weakestMode,
  modeHint,
  buildCoachSummary,
} from "./questions";
import { SKINS, AVATARS, ACHIEVEMENTS } from "./config/gameData";
import TopBar from "./components/TopBar";
import QuestionCard from "./components/QuestionCard";
import Shop from "./components/Shop";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import { sha256Hex } from "./hooks/useAuth";
import useAchievements from "./hooks/useAchievements";
import useGameLogic, { awardLevelCoins, dayKeyStamp, xpToNext } from "./hooks/useGameLogic";

/* ------------------------ Coach helpers ------------------------ */
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

function leagueTierFromPoints(points) {
  if (points >= 520) return { id: "master", label: "Maitre", icon: "👑" };
  if (points >= 390) return { id: "diamond", label: "Diamant", icon: "💎" };
  if (points >= 270) return { id: "gold", label: "Or", icon: "🥇" };
  if (points >= 160) return { id: "silver", label: "Argent", icon: "🥈" };
  return { id: "bronze", label: "Bronze", icon: "🥉" };
}

function freshSeasonState(now = Date.now()) {
  const tier = leagueTierFromPoints(0);
  return {
    seasonStartTs: now,
    points: 0,
    tierId: tier.id,
    games: 0,
    right: 0,
    scoreSum: 0,
    bestStreak: 0,
  };
}

function ensureSeasonState(saved, now = Date.now()) {
  const monthMs = 30 * 24 * 3600 * 1000;
  const base = { ...freshSeasonState(now), ...(saved ?? {}) };
  if (now - (base.seasonStartTs ?? now) >= monthMs) return freshSeasonState(now);
  return base;
}

function updateLeagueAfterAnswer(prevLeague, { isCorrect, scoreAdd, nextStreak }) {
  const base = ensureSeasonState(prevLeague);
  const games = (base.games ?? 0) + 1;
  const right = (base.right ?? 0) + (isCorrect ? 1 : 0);
  const scoreSum = (base.scoreSum ?? 0) + Math.max(0, scoreAdd);
  const bestStreak = Math.max(base.bestStreak ?? 0, nextStreak ?? 0);
  const acc = games ? (right / games) * 100 : 0;
  const avgScore = games ? scoreSum / games : 0;
  const points = Math.round(acc * 0.55 + avgScore * 1.35 + bestStreak * 2.4);
  const tier = leagueTierFromPoints(points);
  return { ...base, games, right, scoreSum, bestStreak, points, tierId: tier.id };
}

function buildRushLeaderboard(prev, entry) {
  const list = [...(prev ?? []), entry].sort((a, b) => b.score - a.score || String(b.date).localeCompare(String(a.date)));
  return list.slice(0, 10);
}

function rollChestReward({ ownedAvatars, ownedSkins }) {
  const r = Math.random();
  if (r < 0.12) {
    const rare = AVATARS.filter((a) => a.rarity === "Rare" || a.rarity === "Epique" || a.rarity === "Épique" || a.rarity === "Exclusif");
    const notOwned = rare.filter((a) => !ownedAvatars.includes(a.id));
    if (notOwned.length) {
      const pick = notOwned[randInt(0, notOwned.length - 1)];
      return { kind: "avatar", avatarId: pick.id, text: `Avatar ${pick.emoji} ${pick.name}` };
    }
  }
  if (r < 0.2) {
    const notOwnedSkins = SKINS.filter((s) => !ownedSkins.includes(s.id) && s.price > 0);
    if (notOwnedSkins.length) {
      const pick = notOwnedSkins[randInt(0, notOwnedSkins.length - 1)];
      return { kind: "skin", skinId: pick.id, text: `Skin ${pick.name}` };
    }
  }
  if (r < 0.42) return { kind: "xpBoost", minutes: 30, text: "XP x2 pendant 30 min" };
  const coins = randInt(45, 160);
  return { kind: "coins", coins, text: `+${coins} coins` };
}

/* ------------------------ App ------------------------ */
export default function App() {
  const qHistoryRef = useRef([]);
  const adaptiveRollRef = useRef([]);
  const autoTimerRef = useRef(null);
  const badgeTimerRef = useRef(null);
  const levelTimerRef = useRef(null);
  const coachTimerRef = useRef(null);
  const rushWasOnRef = useRef(false);

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
        adaptiveOn: true,
        noPenaltyOnWrong: false,
        reduceMotion: false,
        achievements: {},
        lastLoginDayKey: null,
        loginStreak: 0,
        activityMap: {},
        rushBestScore: 0,
        rushLeaderboard: [],
        chestProgress: 0,
        chestPending: 0,
        xpBoostUntilTs: 0,
        league: freshSeasonState(),
        challengeProgress: createChallengeProgress(null),
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
      adaptiveOn: saved?.adaptiveOn ?? true,
      noPenaltyOnWrong: saved?.noPenaltyOnWrong ?? false,
      reduceMotion: saved?.reduceMotion ?? false,
      achievements: saved?.achievements ?? {},
      lastLoginDayKey: saved?.lastLoginDayKey ?? null,
      loginStreak: saved?.loginStreak ?? 0,
      activityMap: saved?.activityMap ?? {},
      rushBestScore: saved?.rushBestScore ?? 0,
      rushLeaderboard: saved?.rushLeaderboard ?? [],
      chestProgress: saved?.chestProgress ?? 0,
      chestPending: saved?.chestPending ?? 0,
      xpBoostUntilTs: saved?.xpBoostUntilTs ?? 0,
      league: ensureSeasonState(saved?.league),
      challengeProgress: createChallengeProgress(saved?.challengeProgress),
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
  const [adaptiveOn, setAdaptiveOn] = useState(initial.adaptiveOn);
  const [noPenaltyOnWrong, setNoPenaltyOnWrong] = useState(initial.noPenaltyOnWrong);
  const [reduceMotion, setReduceMotion] = useState(initial.reduceMotion);

  const [achievements, setAchievements] = useState(initial.achievements);
  const [badgePop, setBadgePop] = useState(null);

  const [levelPop, setLevelPop] = useState(null);
  const [coachPop, setCoachPop] = useState(null);

  const [lastLoginDayKey, setLastLoginDayKey] = useState(initial.lastLoginDayKey);
  const [loginStreak, setLoginStreak] = useState(initial.loginStreak);
  const [activityMap, setActivityMap] = useState(initial.activityMap);
  const [rushBestScore, setRushBestScore] = useState(initial.rushBestScore);
  const [rushLeaderboard, setRushLeaderboard] = useState(initial.rushLeaderboard);
  const [chestProgress, setChestProgress] = useState(initial.chestProgress);
  const [chestPending, setChestPending] = useState(initial.chestPending);
  const [xpBoostUntilTs, setXpBoostUntilTs] = useState(initial.xpBoostUntilTs);
  const [league, setLeague] = useState(initial.league);
  const [challengeProgress, setChallengeProgress] = useState(initial.challengeProgress);
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
  const [showMethod, setShowMethod] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintMsg, setHintMsg] = useState("");
  const [adaptiveAction, setAdaptiveAction] = useState(null);
  const [rushOn, setRushOn] = useState(false);
  const [rushTimeLeft, setRushTimeLeft] = useState(60);
  const [rushScore, setRushScore] = useState(0);
  const [rushCombo, setRushCombo] = useState(0);
  const [bossActive, setBossActive] = useState(false);
  const [bossRemaining, setBossRemaining] = useState(0);
  const [bossTimeLeft, setBossTimeLeft] = useState(0);

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
  const { profileRank, xpNeed } = useGameLogic(level);
  const { isUnlocked, unlockAchievement } = useAchievements({
    achievements,
    setAchievements,
    awardCoins,
    showBadgePopup,
  });

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
      adaptiveOn,
      noPenaltyOnWrong,
      reduceMotion,
      achievements,
      lastLoginDayKey,
      loginStreak,
      activityMap,
      rushBestScore,
      rushLeaderboard,
      chestProgress,
      chestPending,
      xpBoostUntilTs,
      league,
      challengeProgress,
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
    adaptiveOn,
    noPenaltyOnWrong,
    reduceMotion,
    achievements,
    lastLoginDayKey,
    loginStreak,
    activityMap,
    rushBestScore,
    rushLeaderboard,
    chestProgress,
    chestPending,
    xpBoostUntilTs,
    league,
    challengeProgress,
  ]);

  useEffect(() => {
    newQuestion(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeId, gradeId, diffId]);

  useEffect(() => {
    setChallengeProgress((prev) => {
      const nowDay = parisDayKey();
      const nowWeek = parisWeekKey();
      if (prev?.dayKey === nowDay && prev?.weekKey === nowWeek) return prev;
      return createChallengeProgress(prev);
    });
  }, [questionIndex]);

  useEffect(() => {
    setLeague((prev) => ensureSeasonState(prev));
  }, [questionIndex]);

  useEffect(() => {
    if (!rushOn) return undefined;
    const id = setInterval(() => {
      setRushTimeLeft((t) => {
        if (t <= 1) {
          setRushOn(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [rushOn]);

  useEffect(() => {
    if (rushOn) {
      rushWasOnRef.current = true;
      return;
    }
    if (rushWasOnRef.current) {
      rushWasOnRef.current = false;
      if (rushScore > 0) endRush(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rushOn]);

  useEffect(() => {
    if (!bossActive || showExplain) return undefined;
    const id = setInterval(() => {
      setBossTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          submit("__TIME__");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bossActive, showExplain, q]);

  useEffect(() => {
    if (bossActive && bossRemaining <= 0) {
      setBossActive(false);
      setBossTimeLeft(0);
      showCoachPopup({
        title: "Boss termine",
        lines: ["Tu as termine le boss (3 questions).", "XP bonus x3 applique pendant le boss."],
        hint: "Le prochain boss arrive dans 10 questions.",
      });
    }
  }, [bossActive, bossRemaining]);

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
    const boosted = Date.now() < (xpBoostUntilTs ?? 0) ? 2 : 1;
    const add = Math.round(Math.max(0, amount) * boosted);
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
      playBeep("level", audioOn);
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

  function pushHistory(qNew, effectiveDiff = diffId) {
    const sig = questionSignature(qNew, modeId, gradeId, effectiveDiff);
    const arr = qHistoryRef.current ?? [];
    const next = [sig, ...arr];
    qHistoryRef.current = next.slice(0, 25);
  }

  function newQuestion(resetPick = false) {
    clearAutoTimer();
    const liveDiff = bossActive ? "difficile" : diffId;
    const qNew = makeQuestion(modeId, gradeId, liveDiff, qHistoryRef);
    pushHistory(qNew, liveDiff);

    setQ(qNew);
    setStatus("idle");
    setExplain("");
    setShowExplain(false);
    setShowMethod(false);
    setHintLevel(0);
    setHintMsg("");
    setFx("none");
    setSpark(false);
    setIsLocked(false);
    if (resetPick) setPicked(null);
  }

  function resetSession() {
    clearAutoTimer();
    setRushOn(false);
    setRushTimeLeft(60);
    setRushScore(0);
    setRushCombo(0);
    setBossActive(false);
    setBossRemaining(0);
    setBossTimeLeft(0);
    setScore(0);
    setStreak(0);
    setQuestionIndex(1);
    newQuestion(true);

    setLastAnswers([]);
    setSessionAnswered(0);
    adaptiveRollRef.current = [];
    setAdaptiveAction(null);
    setSessionPerf(() => {
      const o = {};
      for (const m of MODES) o[m.id] = { right: 0, total: 0 };
      return o;
    });
    setCoachPop(null);
  }

  function startRush() {
    setRushOn(true);
    setRushTimeLeft(60);
    setRushScore(0);
    setRushCombo(0);
    setScore(0);
    setStreak(0);
    setQuestionIndex(1);
    setBossActive(false);
    setBossRemaining(0);
    setBossTimeLeft(0);
    setShowExplain(false);
    setIsLocked(false);
    newQuestion(true);
  }

  function endRush(force = false) {
    if (!rushOn && !force) return;
    setRushOn(false);
    setRushTimeLeft((t) => (force ? t : Math.max(0, t)));
    setRushBestScore((prev) => Math.max(prev ?? 0, rushScore));
    const entry = {
      pseudo: authUser?.pseudoDisplay ?? "Joueur",
      score: rushScore,
      date: new Date().toISOString(),
    };
    setRushLeaderboard((prev) => buildRushLeaderboard(prev, entry));
    showCoachPopup({
      title: "Rush termine",
      lines: [`Score rush: ${rushScore}`, `Meilleur: ${Math.max(rushBestScore, rushScore)}`],
      hint: "Tu peux relancer un rush quand tu veux.",
    });
  }

  function openChest() {
    if (chestPending <= 0) return;
    const reward = rollChestReward({ ownedAvatars, ownedSkins });
    setChestPending((n) => Math.max(0, n - 1));

    if (reward.kind === "coins") awardCoins(reward.coins);
    if (reward.kind === "avatar") {
      setOwnedAvatars((prev) => (prev.includes(reward.avatarId) ? prev : [...prev, reward.avatarId]));
    }
    if (reward.kind === "skin") {
      setOwnedSkins((prev) => (prev.includes(reward.skinId) ? prev : [...prev, reward.skinId]));
    }
    if (reward.kind === "xpBoost") {
      setXpBoostUntilTs(Date.now() + reward.minutes * 60 * 1000);
    }

    showBadgePopup({
      icon: "🎁",
      title: "Coffre ouvert",
      desc: reward.text,
      reward: 0,
    });
  }


  function checkAchievements(snapshot) {
    for (const a of ACHIEVEMENTS) {
      if (isUnlocked(a.id)) continue;

      if (a.type === "streak" && snapshot.streak >= a.target) unlockAchievement(a);
      if (a.type === "right" && snapshot.totalRight >= a.target) unlockAchievement(a);
      if (a.type === "questions" && snapshot.totalQuestions >= a.target) unlockAchievement(a);
      if (a.type === "accuracy" && snapshot.totalAnswers >= 50 && snapshot.accuracy >= a.target) unlockAchievement(a);
      if (a.type === "rush" && (snapshot.rushBest ?? 0) >= a.target) unlockAchievement(a);
    }
  }

  function maybeCoach(afterCount, nextPerf) {
    if (afterCount > 0 && afterCount % 10 === 0) {
      const summary = buildCoachSummary(nextPerf);
      showCoachPopup(summary);
    }
  }

  function getHintCost(nextLevel) {
    if (diffId === "facile" && nextLevel === 1) return 0;
    return 1;
  }

  function useHint() {
    if (!canAskHint) return;
    const nextLevel = hintLevel + 1;
    const cost = getHintCost(nextLevel);
    if (cost > 0 && coins < cost) {
      setHintMsg("Pas assez de coins pour un indice.");
      return;
    }

    if (cost > 0) setCoins((c) => Math.max(0, c - cost));
    setHintLevel(nextLevel);
    setHintMsg(cost > 0 ? `Indice debloque (-${cost} coin).` : "Premier indice gratuit en facile.");
  }

  function computeAdaptiveAction(roll20, perfByMode) {
    if (!adaptiveOn || roll20.length < 20) return null;

    const right = roll20.reduce((sum, ok) => sum + (ok ? 1 : 0), 0);
    const acc20 = Math.round((right / roll20.length) * 100);

    if (acc20 > 85) {
      const nextDiff = stepDiff(diffId, +1);
      if (nextDiff !== diffId) {
        return {
          kind: "up",
          nextDiffId: nextDiff,
          lines: [`Precision sur 20 questions: ${acc20}%. On monte en difficulte (${nextDiff}).`],
          hint: "Tu progresses tres bien, on augmente le challenge.",
        };
      }
      return null;
    }

    if (acc20 < 55) {
      const nextDiff = stepDiff(diffId, -1);
      const weakMode = weakestMode(perfByMode);
      return {
        kind: "down",
        nextDiffId: nextDiff !== diffId ? nextDiff : null,
        suggestedModeId: weakMode && weakMode !== modeId ? weakMode : null,
        lines: [
          `Precision sur 20 questions: ${acc20}%.`,
          nextDiff !== diffId ? `On baisse la difficulte (${nextDiff}) pour consolider.` : "On garde la difficulte actuelle.",
          weakMode ? `Entrainement cible conseille: ${modeName(weakMode)}.` : "Continue sur ce mode pour consolider.",
        ],
        hint: weakMode ? modeHint(weakMode) : modeHint(modeId),
      };
    }

    return null;
  }

  function submit(choice) {
    if (isLocked || showExplain) return;
    setIsLocked(true);
    clearAutoTimer();

    setPicked(choice);
    const isCorrect = choice === q.correct;
    const isRushNow = rushOn && rushTimeLeft > 0;
    const isBossNow = bossActive;
    const fastMode = isRushNow || isBossNow;

    const nextTotalQuestions = totalQuestions + 1;
    const nextTotalRight = totalRight + (isCorrect ? 1 : 0);
    const nextTotalWrong = totalWrong + (isCorrect ? 0 : 1);
    const nextStreak = isCorrect ? streak + 1 : 0;
    const baseScoreAdd = isCorrect ? 10 + Math.min(18, streak * 2) : 0;
    const rushMult = isRushNow ? 1 + Math.floor((isCorrect ? rushCombo + 1 : 0) / 5) * 0.2 : 1;
    const nextScoreAdd = Math.round(baseScoreAdd * rushMult);

    const nextTotalAnswers = nextTotalRight + nextTotalWrong;
    const nextAccuracy = nextTotalAnswers ? Math.round((nextTotalRight / nextTotalAnswers) * 100) : 0;
    const nextSessionPerf = (() => {
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

    setTotalQuestions((x) => x + 1);

    if (!bossActive && nextTotalQuestions > 0 && nextTotalQuestions % 10 === 0) {
      setBossActive(true);
      setBossRemaining(3);
      setBossTimeLeft(10);
      playBeep("level", audioOn);
      vibrate(35);
      showCoachPopup({
        title: "Boss Fight",
        lines: ["3 questions difficiles", "Temps court", "XP x3"],
        hint: "Reste focus jusqu'au bout.",
      });
    }

    setLastAnswers((prev) => [{ ok: isCorrect }, ...(prev ?? [])].slice(0, 10));

    setSessionPerf(nextSessionPerf);

    setSessionAnswered((n) => {
      const nextCount = n + 1;
      maybeCoach(nextCount, nextSessionPerf);
      return nextCount;
    });

    const nextRoll = [...(adaptiveRollRef.current ?? []), isCorrect].slice(-20);
    adaptiveRollRef.current = nextRoll;
    setAdaptiveAction(computeAdaptiveAction(nextRoll, nextSessionPerf));

    setChallengeProgress((prev) => {
      const base = createChallengeProgress(prev);
      return {
        ...base,
        dailyStats: applyAnswerToChallengeStats(base.dailyStats, modeId, isCorrect),
        weeklyStats: applyAnswerToChallengeStats(base.weeklyStats, modeId, isCorrect),
      };
    });
    setActivityMap((prev) => {
      const today = parisDayKey();
      const next = {
        ...(prev ?? {}),
        [today]: (prev?.[today] ?? 0) + 1,
      };
      const keys = Object.keys(next);
      if (keys.length <= 120) return next;
      const oldest = keys.sort((a, b) => dayKeyStamp(a) - dayKeyStamp(b))[0];
      if (oldest) delete next[oldest];
      return next;
    });

    setLeague((prev) => updateLeagueAfterAnswer(prev, { isCorrect, scoreAdd: nextScoreAdd, nextStreak }));

    if (isCorrect) {
      setChestProgress((p) => {
        const next = (p ?? 0) + 1;
        if (next >= 15) {
          setChestPending((v) => v + 1);
          showBadgePopup({ icon: "🎁", title: "Coffre gagne", desc: "15 bonnes reponses atteintes. Ouvre ton coffre.", reward: 0 });
          return next - 15;
        }
        return next;
      });
    }

    if (isRushNow) {
      if (isCorrect) {
        setRushTimeLeft((t) => Math.min(120, t + 1));
        setRushCombo((c) => c + 1);
        setRushScore((s) => s + nextScoreAdd);
      } else {
        setRushTimeLeft((t) => Math.max(0, t - 2));
        setRushCombo(0);
      }
    }

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

      awardXp((10 + Math.min(8, streak)) * (isBossNow ? 3 : 1));

      if (!fastMode) {
        setExplain(q.explain(choice));
        setShowExplain(true);
        setShowMethod(false);
      } else {
        setShowExplain(false);
      }

      updateRecordIfNeeded(score + nextScoreAdd);
    } else {
      setStatus("bad");
      playBeep("bad", audioOn);
      vibrate(60);
      triggerFx("bad");

      if (!noPenaltyOnWrong) {
        setCoins((c) => Math.max(0, c - 1));
      }

      setTotalWrong((x) => x + 1);
      setStreak(0);

      awardXp(4 * (isBossNow ? 3 : 1));

      if (!fastMode) {
        setExplain(q.explain(choice));
        setShowExplain(true);
        setShowMethod(false);
      } else {
        setShowExplain(false);
      }
    }

    if (isBossNow) {
      setBossRemaining((n) => Math.max(0, n - 1));
      setBossTimeLeft(10);
    }

    checkAchievements({
      streak: nextStreak,
      totalRight: nextTotalRight,
      totalQuestions: nextTotalQuestions,
      totalAnswers: nextTotalAnswers,
      accuracy: nextAccuracy,
      rushBest: Math.max(rushBestScore, rushScore + (isCorrect ? nextScoreAdd : 0)),
    });

    if (fastMode) {
      setTimeout(() => {
        setQuestionIndex((i) => i + 1);
        newQuestion(true);
      }, 180);
      return;
    }

    if (autoNextOn) {
      autoTimerRef.current = setTimeout(() => {
        goNext();
      }, clamp(autoNextMs, 600, 6000));
    }
  }

  function goNext() {
    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);
    if (adaptiveAction) {
      let changed = false;
      if (adaptiveAction.nextDiffId && adaptiveAction.nextDiffId !== diffId) {
        setDiffId(adaptiveAction.nextDiffId);
        changed = true;
      }
      if (adaptiveAction.suggestedModeId && adaptiveAction.suggestedModeId !== modeId) {
        setModeId(adaptiveAction.suggestedModeId);
        changed = true;
      }
      showCoachPopup({ title: "Mode adaptatif", lines: adaptiveAction.lines, hint: adaptiveAction.hint });
      setAdaptiveAction(null);
      if (changed) return;
    }
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

  const dailyChallenge = useMemo(
    () => challengeById(DAILY_CHALLENGES, challengeProgress?.dailyId, challengeProgress?.dayKey ?? parisDayKey()),
    [challengeProgress?.dailyId, challengeProgress?.dayKey]
  );
  const weeklyChallenge = useMemo(
    () => challengeById(WEEKLY_CHALLENGES, challengeProgress?.weeklyId, challengeProgress?.weekKey ?? parisWeekKey()),
    [challengeProgress?.weeklyId, challengeProgress?.weekKey]
  );

  const dailyProgress = useMemo(
    () => challengeProgressValue(dailyChallenge, challengeProgress?.dailyStats),
    [dailyChallenge, challengeProgress?.dailyStats]
  );
  const weeklyProgress = useMemo(
    () => challengeProgressValue(weeklyChallenge, challengeProgress?.weeklyStats),
    [weeklyChallenge, challengeProgress?.weeklyStats]
  );

  const isDailyDone = !!dailyChallenge && dailyProgress >= dailyChallenge.target;
  const isWeeklyDone = !!weeklyChallenge && weeklyProgress >= weeklyChallenge.target;

  function claimChallenge(scope) {
    const isDaily = scope === "daily";
    const ch = isDaily ? dailyChallenge : weeklyChallenge;
    if (!ch) return;
    const already = isDaily ? challengeProgress?.claimedDaily : challengeProgress?.claimedWeekly;
    const isDone = isDaily ? isDailyDone : isWeeklyDone;
    if (already || !isDone) return;

    awardCoins(ch.rewardCoins);
    awardXp(ch.rewardXp);
    showBadgePopup({
      icon: ch.icon ?? "🎯",
      title: `Defi ${isDaily ? "journalier" : "hebdo"} complete`,
      desc: `${ch.title} • +${ch.rewardCoins} coins • +${ch.rewardXp} XP`,
      reward: ch.rewardCoins,
    });

    setChallengeProgress((prev) => {
      if (!prev) return prev;
      if (isDaily) return { ...prev, claimedDaily: true };
      return { ...prev, claimedWeekly: true };
    });
  }

  const accuracy = useMemo(() => {
    const total = totalRight + totalWrong;
    if (!total) return 0;
    return Math.round((totalRight / total) * 100);
  }, [totalRight, totalWrong]);
  const leagueTier = useMemo(() => leagueTierFromPoints(league?.points ?? 0), [league?.points]);
  const seasonDaysLeft = useMemo(() => {
    const now = Date.now();
    const start = league?.seasonStartTs ?? now;
    const left = Math.ceil((30 * 24 * 3600 * 1000 - (now - start)) / (24 * 3600 * 1000));
    return Math.max(0, left);
  }, [league?.seasonStartTs, questionIndex]);
  const xpBoostActive = Date.now() < (xpBoostUntilTs ?? 0);
  const xpBoostMinutesLeft = xpBoostActive ? Math.max(1, Math.ceil((xpBoostUntilTs - Date.now()) / 60000)) : 0;

  const activity7 = useMemo(() => {
    const base = new Date();
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const key = parisDayKey(d);
      const count = Number(activityMap?.[key] ?? 0);
      const day = d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2);
      arr.push({ key, count, day });
    }
    return arr;
  }, [activityMap]);
  const playedDays7 = useMemo(() => activity7.filter((d) => d.count > 0).length, [activity7]);
  const visualStreak7 = useMemo(() => {
    let st = 0;
    for (let i = activity7.length - 1; i >= 0; i--) {
      if (activity7[i].count > 0) st += 1;
      else break;
    }
    return st;
  }, [activity7]);

  const xpPct = Math.round((xp / xpNeed) * 100);

  const unlockedCount = useMemo(() => ACHIEVEMENTS.filter((a) => isUnlocked(a.id)).length, [achievements]);

  const disableChoices = isLocked || showExplain;
  const hintList = useMemo(() => buildHints(q, gradeId), [q, gradeId]);
  const methodSteps = useMemo(() => buildMethodSteps(q, gradeId), [q, gradeId]);
  const visibleHints = hintList.slice(0, hintLevel);
  const canAskHint = !disableChoices && hintLevel < hintList.length;

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
      adaptiveOn: true,
      noPenaltyOnWrong: false,
      reduceMotion: false,
      achievements: {},
      lastLoginDayKey: null,
      loginStreak: 0,
      activityMap: {},
      rushBestScore: 0,
      rushLeaderboard: [],
      chestProgress: 0,
      chestPending: 0,
      xpBoostUntilTs: 0,
      league: freshSeasonState(),
      challengeProgress: createChallengeProgress(null),
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

      <TopBar
        avatar={avatar}
        authUser={authUser}
        loginStreak={loginStreak}
        profileRank={profileRank}
        coins={coins}
        level={level}
        xp={`${xp}/${xpNeed}`}
        questionIndex={questionIndex}
        bestScore={bestScore}
        unlockedCount={unlockedCount}
        onOpenSettings={() => setShowSettings(true)}
        onOpenProfile={() => setShowProfile(true)}
        onOpenShop={() => setShowShop(true)}
        onLogout={doLogout}
      />

      <div className="grid">
        <QuestionCard
          status={status}
          fx={fx}
          spark={spark}
          modeId={modeId}
          setModeId={setModeId}
          gradeId={gradeId}
          setGradeId={setGradeId}
          diffId={diffId}
          setDiffId={setDiffId}
          GRADES={GRADES}
          DIFFS={DIFFS}
          MODES={MODES}
          resetSession={resetSession}
          adaptiveOn={adaptiveOn}
          xpPct={xpPct}
          sessionAnswered={sessionAnswered}
          lastAnswers={lastAnswers}
          q={q}
          streak={streak}
          accuracy={accuracy}
          hintLevel={hintLevel}
          hintList={hintList}
          canAskHint={canAskHint}
          getHintCost={getHintCost}
          useHint={useHint}
          hintMsg={hintMsg}
          visibleHints={visibleHints}
          picked={picked}
          showExplain={showExplain}
          submit={submit}
          disableChoices={disableChoices}
          goNext={goNext}
          explain={explain}
          methodSteps={methodSteps}
          showMethod={showMethod}
          setShowMethod={setShowMethod}
          rushOn={rushOn}
          rushTimeLeft={rushTimeLeft}
          bossActive={bossActive}
          bossTimeLeft={bossTimeLeft}
          bossRemaining={bossRemaining}
        />
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

          <div className="toast" style={{ marginTop: 12 }}>
            <div style={{ width: "100%" }}>
              <strong>Rush 60s</strong>
              <div className="small" style={{ marginTop: 6 }}>
                Temps: <b>{rushTimeLeft}s</b> • Score: <b>{rushScore}</b> • Combo: <b>{rushCombo}</b> • Record: <b>{rushBestScore}</b>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {!rushOn ? (
                  <button className="btn btnPrimary smooth hover-lift press" onClick={startRush}>
                    Lancer Rush
                  </button>
                ) : (
                  <button className="btn smooth hover-lift press" onClick={() => setRushOn(false)}>
                    Stop Rush
                  </button>
                )}
              </div>
              {!!rushLeaderboard?.length && (
                <div className="small" style={{ marginTop: 10 }}>
                  Local top:{" "}
                  {rushLeaderboard
                    .slice(0, 3)
                    .map((r, idx) => `${idx + 1}. ${r.pseudo} ${r.score}`)
                    .join(" • ")}
                </div>
              )}
            </div>
          </div>

          <div className="toast" style={{ marginTop: 12 }}>
            <div style={{ width: "100%" }}>
              <strong>Ligue saisonniere</strong>
              <div className="small" style={{ marginTop: 6 }}>
                {leagueTier.icon} <b>{leagueTier.label}</b> • Points: <b>{league?.points ?? 0}</b> • Fin de saison: <b>{seasonDaysLeft}j</b>
              </div>
              <div className="small" style={{ marginTop: 6 }}>
                Precision: <b>{league?.games ? Math.round((league.right / league.games) * 100) : 0}%</b> • Score moyen:{" "}
                <b>{league?.games ? Math.round(league.scoreSum / league.games) : 0}</b> • Best streak: <b>{league?.bestStreak ?? 0}</b>
              </div>
            </div>
          </div>

          <div className="toast" style={{ marginTop: 12 }}>
            <div style={{ width: "100%" }}>
              <strong>Coffres</strong>
              <div className="small" style={{ marginTop: 6 }}>
                Progression: <b>{chestProgress}/15</b> bonnes réponses • Coffres prêts: <b>{chestPending}</b>
              </div>
              <div className="small" style={{ marginTop: 6 }}>
                Bonus XP x2: <b>{xpBoostActive ? `actif (${xpBoostMinutesLeft} min)` : "inactif"}</b>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn btnPrimary smooth hover-lift press" onClick={openChest} disabled={chestPending <= 0}>
                  Ouvrir coffre
                </button>
              </div>
            </div>
          </div>

          <div className="toast" style={{ marginTop: 12 }}>
            <div style={{ width: "100%" }}>
              <strong>Boss Fight</strong>
              <div className="small" style={{ marginTop: 6 }}>
                Etat: <b>{bossActive ? "ACTIF" : "attente"}</b>
                {bossActive ? ` • Questions restantes: ${bossRemaining} • Temps: ${bossTimeLeft}s` : ` • Prochain boss toutes les 10 questions`}
              </div>
            </div>
            <span className="pill">XP x3</span>
          </div>

          <div className="toast" style={{ marginTop: 12 }}>
            <div style={{ width: "100%" }}>
              <strong>Activite 7 jours</strong>
              <div className="heatmapGrid" style={{ marginTop: 10 }}>
                {activity7.map((d) => {
                  const lv = d.count === 0 ? 0 : d.count < 3 ? 1 : d.count < 7 ? 2 : d.count < 12 ? 3 : 4;
                  return (
                    <div key={d.key} className="heatCol" title={`${d.key} : ${d.count} question(s)`}>
                      <span className={`heatCell lv${lv}`} />
                      <span className="heatLbl">{d.day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                Jours joues : <b>{playedDays7}/7</b> • Streak visuel : <b>{visualStreak7}</b>
              </div>
            </div>
          </div>

          <div className="toast" style={{ marginTop: 14 }}>
            <div style={{ width: "100%" }}>
              <strong>Defi journalier</strong>
              <div className="sub" style={{ marginTop: 6 }}>{dailyChallenge?.desc}</div>
              <div className="small" style={{ marginTop: 6 }}>
                Progression: <b>{Math.min(dailyProgress, dailyChallenge?.target ?? 0)}</b> / <b>{dailyChallenge?.target ?? 0}</b>
              </div>
              <div className="barWrap" style={{ marginTop: 8 }}>
                <div
                  className="bar"
                  style={{ width: `${Math.round(((dailyProgress || 0) / Math.max(1, dailyChallenge?.target ?? 1)) * 100)}%` }}
                />
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="pill">+{dailyChallenge?.rewardCoins ?? 0} coins</span>
                <span className="pill">+{dailyChallenge?.rewardXp ?? 0} XP</span>
                <button
                  className="btn btnPrimary smooth hover-lift press"
                  disabled={!isDailyDone || !!challengeProgress?.claimedDaily}
                  onClick={() => claimChallenge("daily")}
                >
                  {challengeProgress?.claimedDaily ? "Recompense recue" : "Recuperer"}
                </button>
              </div>
            </div>
          </div>

          <div className="toast" style={{ marginTop: 12 }}>
            <div style={{ width: "100%" }}>
              <strong>Defi hebdo</strong>
              <div className="sub" style={{ marginTop: 6 }}>{weeklyChallenge?.desc}</div>
              <div className="small" style={{ marginTop: 6 }}>
                Progression: <b>{Math.min(weeklyProgress, weeklyChallenge?.target ?? 0)}</b> / <b>{weeklyChallenge?.target ?? 0}</b>
              </div>
              <div className="barWrap" style={{ marginTop: 8 }}>
                <div
                  className="bar"
                  style={{ width: `${Math.round(((weeklyProgress || 0) / Math.max(1, weeklyChallenge?.target ?? 1)) * 100)}%` }}
                />
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="pill">+{weeklyChallenge?.rewardCoins ?? 0} coins</span>
                <span className="pill">+{weeklyChallenge?.rewardXp ?? 0} XP</span>
                <button
                  className="btn btnPrimary smooth hover-lift press"
                  disabled={!isWeeklyDone || !!challengeProgress?.claimedWeekly}
                  onClick={() => claimChallenge("weekly")}
                >
                  {challengeProgress?.claimedWeekly ? "Recompense recue" : "Recuperer"}
                </button>
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

      <Shop
        show={showShop}
        onClose={() => setShowShop(false)}
        shopTab={shopTab}
        setShopTab={setShopTab}
        coins={coins}
        SKINS={SKINS}
        AVATARS={AVATARS}
        ownedSkins={ownedSkins}
        skinId={skinId}
        canBuy={canBuy}
        buySkin={buySkin}
        equipSkin={equipSkin}
        ownedAvatars={ownedAvatars}
        avatarId={avatarId}
        buyAvatar={buyAvatar}
        equipAvatar={equipAvatar}
      />
      {/* Profil */}
      <Profile
        show={showProfile}
        onClose={() => setShowProfile(false)}
        profileTab={profileTab}
        setProfileTab={setProfileTab}
        coins={coins}
        authUser={authUser}
        level={level}
        loginStreak={loginStreak}
        totalRight={totalRight}
        totalWrong={totalWrong}
        accuracy={accuracy}
        totalQuestions={totalQuestions}
        bestStreak={bestStreak}
        GRADES={GRADES}
        DIFFS={DIFFS}
        MODES={MODES}
        records={records}
        unlockedCount={unlockedCount}
        ACHIEVEMENTS={ACHIEVEMENTS}
        isUnlocked={isUnlocked}
        achievements={achievements}
      />
      <Settings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        audioOn={audioOn}
        setAudioOn={setAudioOn}
        vibrateOn={vibrateOn}
        setVibrateOn={setVibrateOn}
        autoNextOn={autoNextOn}
        setAutoNextOn={setAutoNextOn}
        autoNextMs={autoNextMs}
        setAutoNextMs={setAutoNextMs}
        reduceMotion={reduceMotion}
        setReduceMotion={setReduceMotion}
        skinAnimated={skin.animated}
        adaptiveOn={adaptiveOn}
        setAdaptiveOn={setAdaptiveOn}
        noPenaltyOnWrong={noPenaltyOnWrong}
        setNoPenaltyOnWrong={setNoPenaltyOnWrong}
        pwCurrent={pwCurrent}
        setPwCurrent={setPwCurrent}
        pwChangeNew={pwChangeNew}
        setPwChangeNew={setPwChangeNew}
        pwChangeNew2={pwChangeNew2}
        setPwChangeNew2={setPwChangeNew2}
        pwChangeMsg={pwChangeMsg}
        changePasswordLoggedIn={changePasswordLoggedIn}
      />
    </div>
  );
}


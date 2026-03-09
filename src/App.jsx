// App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
import { clamp, randInt } from "./utils/math";
import { playBeep } from "./utils/audio";
import {
  safeLSGet,
  safeLSSet,
  isCloudEnabled,
  cloudPullUserSave,
  cloudPushUserSave,
  cloudPushLeaderboard,
  cloudLogEvent,
  cloudAuthSignUp,
  cloudAuthSignIn,
  cloudAuthSignOut,
  cloudAuthUpdatePassword,
  cloudAuthSendPasswordReset,
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
  WORLDS,
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
import RushScreen from "./components/RushScreen";
import ClassicPlayScreen from "./components/ClassicPlayScreen";
import ArenaScreen from "./components/ArenaScreen";
import MobileGameShell from "./components/MobileGameShell";
import MobileAppView from "./components/MobileAppView";
import AppOverlays from "./components/AppOverlays";
import { buildMobileViewProps } from "./components/buildMobileViewProps";
import Shop from "./components/Shop";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import { sha256Hex } from "./hooks/useAuth";
import useAchievements from "./hooks/useAchievements";
import useGameLogic, { awardLevelCoins, dayKeyStamp, xpToNext } from "./hooks/useGameLogic";
import useRewardedAds, { OPTIONAL_AD_LIMITS, emptyAdUsageByKind, normalizeAdUsageByKind } from "./hooks/useRewardedAds";

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
      return { kind: "avatar", avatarId: picked.id, label: `Avatar : ${picked.name}` };
    }
    return { kind: "coins", coins: coinReward + 40, label: `Pièces : +${coinReward + 40}` };
  }

  return { kind: "coins", coins: coinReward, label: `Pièces : +${coinReward}` };
}

const LEAGUES = [
  { id: "bronze", name: "Bronze", icon: "\uD83E\uDD49", min: 0 },
  { id: "silver", name: "Argent", icon: "\uD83E\uDD48", min: 1200 },
  { id: "gold", name: "Or", icon: "\uD83E\uDD47", min: 2600 },
  { id: "diamond", name: "Diamant", icon: "\uD83D\uDC8E", min: 4200 },
];

function leagueFromScore(score) {
  let cur = LEAGUES[0];
  for (const league of LEAGUES) {
    if (score >= league.min) cur = league;
  }
  return cur;
}

function leagueTierFromPoints(points) {
  const league = leagueFromScore(points);
  return { id: league.id, label: league.name, icon: league.icon };
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

const CHEST_TYPES = {
  common: { id: "common", label: "\uD83C\uDF81 Coffre commun", icon: "\uD83C\uDF81" },
  rare: { id: "rare", label: "\uD83C\uDF1F Coffre rare", icon: "\uD83C\uDF1F" },
  epic: { id: "epic", label: "\u2728 Coffre épique", icon: "\u2728" },
  legendary: { id: "legendary", label: "\uD83D\uDC51 Coffre légendaire", icon: "\uD83D\uDC51" },
};

function chestRevealVibration(chestType) {
  if (chestType === "legendary") return [24, 18, 36, 16, 48, 16, 62];
  if (chestType === "epic") return [20, 16, 30, 14, 38];
  if (chestType === "rare") return [16, 12, 22];
  return [14, 12, 18];
}

const ANSWER_EFFECTS = [
  { id: "default", label: "Classique", desc: "Effet de base.", dustCost: 0 },
  { id: "gold-burst", label: "Explosion dorée", desc: "Explosion dorée sur bonne réponse.", dustCost: 120 },
  { id: "electric-aura", label: "Aura électrique", desc: "Aura bleue électrique.", dustCost: 180 },
  { id: "prism-particles", label: "Particules spéciales", desc: "Particules multicolores.", dustCost: 260 },
];

function rollChestRarity(score) {
  const base = clamp((Number(score) || 0) / 5000, 0, 1);
  const r = Math.random();
  const epicChance = 0.06 + base * 0.06;
  const rareChance = 0.22 + base * 0.1;
  if (r < epicChance) return "epic";
  if (r < epicChance + rareChance) return "rare";
  return "common";
}

function chestTypeFromRoll(score = 0) {
  return rollChestRarity(score);
}

function rarityRank(raw) {
  const r = String(raw || "").toLowerCase();
  if (r.includes("légendaire") || r.includes("legendaire") || r.includes("exclusif")) return 5;
  if (r.includes("épique") || r.includes("epique")) return 4;
  if (r.includes("rare")) return 3;
  return 1;
}

function coinsForChest(rarity) {
  if (rarity === "epic") return randInt(140, 220);
  if (rarity === "rare") return randInt(70, 120);
  return randInt(25, 55);
}

function pickSkinReward(rarity, ownedSkins) {
  const pool =
    rarity === "epic"
      ? SKINS.filter((s) => s.price >= 180)
      : rarity === "rare"
        ? SKINS.filter((s) => s.price >= 120)
        : SKINS.filter((s) => s.price >= 0);

  const notOwned = pool.filter((s) => !ownedSkins.includes(s.id));
  if (!notOwned.length) return null;
  return notOwned[randInt(0, notOwned.length - 1)];
}

function pickAvatarReward(rarity, ownedAvatars) {
  const pool =
    rarity === "epic"
      ? AVATARS.filter((a) => a.rarity === "Épique" || a.rarity === "Exclusif")
      : rarity === "rare"
        ? AVATARS.filter((a) => a.rarity === "Rare" || a.rarity === "Épique")
        : AVATARS.filter((a) => a.rarity === "Commun" || a.rarity === "Rare");

  const notOwned = pool.filter((a) => !ownedAvatars.includes(a.id));
  if (!notOwned.length) return null;
  return notOwned[randInt(0, notOwned.length - 1)];
}

function rollChestReward({ score, ownedSkins, ownedAvatars }) {
  const rarity = rollChestRarity(score);
  const skinChance = rarity === "epic" ? 0.4 : rarity === "rare" ? 0.26 : 0.12;
  const avatarChance = rarity === "epic" ? 0.45 : rarity === "rare" ? 0.28 : 0.14;

  const r = Math.random();
  if (r < skinChance) {
    const skin = pickSkinReward(rarity, ownedSkins);
    if (skin) return { rarity, kind: "skin", skinId: skin.id, text: `Skin: ${skin.name}` };
  }
  if (r < skinChance + avatarChance) {
    const avatar = pickAvatarReward(rarity, ownedAvatars);
    if (avatar) return { rarity, kind: "avatar", avatarId: avatar.id, text: `Avatar: ${avatar.name}` };
  }

  const coins = coinsForChest(rarity);
  return { rarity, kind: "coins", coins, text: `+${coins} pièces` };
}

function rollChestRewardByType({ chestType, ownedAvatars, ownedSkins, ownedEffects, score = 0 }) {
  const type = CHEST_TYPES[chestType] ? chestType : "common";
  const effectsPool = ANSWER_EFFECTS.filter((e) => e.id !== "default" && !ownedEffects.includes(e.id));
  const commonSkins = SKINS.filter((s) => !ownedSkins.includes(s.id) && s.price > 0 && s.price <= 170);
  const premiumSkins = SKINS.filter((s) => !ownedSkins.includes(s.id) && s.price > 170);
  const commonAvatars = AVATARS.filter((a) => !ownedAvatars.includes(a.id) && rarityRank(a.rarity) <= 1);
  const rareAvatars = AVATARS.filter((a) => !ownedAvatars.includes(a.id) && rarityRank(a.rarity) >= 3);
  const epicAvatars = AVATARS.filter((a) => !ownedAvatars.includes(a.id) && rarityRank(a.rarity) >= 4);

  const pick = (arr) => arr[randInt(0, arr.length - 1)];
  const r = Math.random();

  if (type === "legendary") {
    if (effectsPool.length && r < 0.48) {
      const fx = pick(effectsPool);
      return { kind: "effect", effectId: fx.id, text: `Effet spécial: ${fx.label}` };
    }
    if (premiumSkins.length && r < 0.73) {
      const s = pick(premiumSkins);
      return { kind: "skin", skinId: s.id, text: `Skin: ${s.name}` };
    }
    if (epicAvatars.length && r < 0.9) {
      const a = pick(epicAvatars);
      return { kind: "avatar", avatarId: a.id, text: `Avatar: ${a.name}` };
    }
    if (r < 0.97) return { kind: "xpBoost", minutes: 45, text: "Boost XP x2 (45 min)" };
    const coins = randInt(260, 520);
    return { kind: "coins", coins, text: `+${coins} pièces` };
  }

  if (type === "epic" || type === "rare" || type === "common") {
    return rollChestReward({ score, ownedSkins, ownedAvatars });
  }

  if (commonAvatars.length && r < 0.18) {
    const a = pick(commonAvatars);
    return { kind: "avatar", avatarId: a.id, text: `Avatar: ${a.name}` };
  }
  if (r < 0.32) return { kind: "xpBoost", minutes: 15, text: "Boost XP x2 (15 min)" };
  const coins = randInt(40, 110);
  return { kind: "coins", coins, text: `+${coins} pièces` };
}

const WORLD_LEVEL_MAX = 30;
const WORLD_STEP_CORRECT = 3;
const STUDY5_DURATION = 5 * 60;

function defaultWorldProgress() {
  const out = {};
  for (const w of WORLDS) out[w.id] = { level: 1, progress: 0, bossDone: false, badgeWon: false };
  return out;
}

function normalizeWorldProgress(saved) {
  return { ...defaultWorldProgress(), ...(saved ?? {}) };
}

function worldIdFromGrade(gradeId) {
  return WORLDS.find((w) => w.gradeId === gradeId)?.id ?? "ce1";
}

function isCollegeGrade(gradeId) {
  return ["6e", "5e", "4e", "3e"].includes(gradeId);
}

function makeEmptyStudy5Summary() {
  return null;
}

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function arenaComboMultiplier(combo) {
  const c = Math.max(0, Number(combo) || 0);
  if (c >= 15) return 4;
  if (c >= 10) return 3;
  if (c >= 5) return 2;
  return 1;
}

function getRushMultiplier(combo) {
  const c = Math.max(0, Number(combo) || 0);
  if (c >= 15) return 5;
  if (c >= 10) return 4;
  if (c >= 6) return 3;
  if (c >= 3) return 2;
  return 1;
}

function basePoints(diffId) {
  if (diffId === "facile") return 10;
  if (diffId === "moyen") return 14;
  return 18;
}

function speedBonus(rtMs) {
  if (rtMs < 1200) return 6;
  if (rtMs < 2000) return 3;
  return 0;
}

function rewardVisualMeta(reward, chestType) {
  if (reward.kind === "dust") {
    return { icon: "\uD83D\uDC8E", label: `${reward.dust} diamants cosmétiques`, tone: "rare", rarity: "Conversion", preview: { type: "dust" } };
  }
  if (reward.kind === "coins") {
    return { icon: "\uD83E\uDE99", label: `${reward.coins} pièces`, tone: chestType, rarity: chestType, preview: { type: "coin" } };
  }
  if (reward.kind === "avatar") {
    const avatar = AVATARS.find((a) => a.id === reward.avatarId);
    return {
      icon: "\uD83D\uDE42",
      label: reward.text,
      tone: "rare",
      rarity: avatar?.rarity ?? "Rare",
      preview: { type: "emoji", value: avatar?.emoji ?? "\uD83D\uDE42" },
    };
  }
  if (reward.kind === "skin") {
    const skin = SKINS.find((s) => s.id === reward.skinId);
    return {
      icon: "\uD83C\uDFA8",
      label: reward.text,
      tone: "epic",
      rarity: skin?.price > 170 ? "Légendaire" : "Épique",
      preview: { type: "skin", accent: skin?.vars?.["--accent"], accent2: skin?.vars?.["--accent2"] },
    };
  }
  if (reward.kind === "xpBoost") {
    return { icon: "\u26A1", label: reward.text, tone: "rare", rarity: "Rare", preview: { type: "bolt" } };
  }
  if (reward.kind === "effect") {
    const fx = ANSWER_EFFECTS.find((e) => e.id === reward.effectId);
    return {
      icon: "\u2728",
      label: reward.text,
      tone: "legendary",
      rarity: "Légendaire",
      preview: { type: "effect", value: fx?.label ?? "Effet" },
    };
  }
  return { icon: "\uD83C\uDF81", label: reward.text, tone: chestType, rarity: chestType, preview: { type: "gift" } };
}

function dustForDuplicate(kind) {
  if (kind === "skin") return 140;
  if (kind === "effect") return 120;
  if (kind === "avatar") return 90;
  return 50;
}

const ARENA_BOSSES = [
  { id: "hydra", name: "Hydre des Tables", emoji: "\uD83D\uDC09" },
  { id: "golem", name: "Golem du Calcul", emoji: "\uD83E\uDEA8" },
  { id: "phantom", name: "Fantôme des Fractions", emoji: "\uD83D\uDC7B" },
  { id: "titan", name: "Titan Algebra", emoji: "\uD83D\uDDFF" },
];

const COMBO_FUN_MILESTONES = [
  { streak: 3, coins: 5, icon: "\uD83C\uDF89", title: "Mini combo" },
  { streak: 7, coins: 12, icon: "\uD83D\uDD25", title: "Super combo" },
  { streak: 12, coins: 20, icon: "\uD83C\uDF1F", title: "Mega combo" },
];

const SESSION_CHALLENGE_LIBRARY = [
  {
    id: "streak4",
    kind: "streak",
    icon: "\u26A1",
    title: "Combo magique",
    description: "Fais 4 bonnes réponses d'affilée.",
    target: 4,
    rewardCoins: 10,
    rewardXp: 15,
  },
  {
    id: "correct6",
    kind: "correct",
    icon: "\u2705",
    title: "Marathon",
    description: "Donne 6 bonnes réponses dans la session",
    target: 6,
    rewardCoins: 12,
    rewardXp: 18,
  },
  {
    id: "hard3",
    kind: "hard",
    icon: "\uD83E\uDDE0",
    title: "Mission difficile",
    description: "Réussis 3 bonnes réponses en difficile",
    target: 3,
    rewardCoins: 14,
    rewardXp: 22,
  },
];

function comboMilestoneFor(streakValue) {
  return COMBO_FUN_MILESTONES.find((item) => item.streak === streakValue) ?? null;
}

function buildSessionChallenge() {
  const i = randInt(0, SESSION_CHALLENGE_LIBRARY.length - 1);
  return { ...SESSION_CHALLENGE_LIBRARY[i] };
}

function sessionChallengeNextProgress({
  challenge,
  isCorrect,
  nextStreak,
  nextSessionCorrect = 0,
  isHardMode = false,
  currentProgress = 0,
}) {
  if (!challenge) return { progress: 0, done: false, nextHardCount: 0 };

  if (challenge.kind === "streak") {
    const progress = isCorrect ? Math.max(0, nextStreak) : 0;
    return { progress, done: progress >= challenge.target, nextHardCount: 0 };
  }

  if (challenge.kind === "correct") {
    const progress = isCorrect ? Math.min(challenge.target, nextSessionCorrect) : nextSessionCorrect;
    return { progress, done: progress >= challenge.target, nextHardCount: 0 };
  }

  if (challenge.kind === "hard") {
    const nextHardCount = currentProgress + (isCorrect && isHardMode ? 1 : 0);
    return {
      progress: Math.min(challenge.target, nextHardCount),
      done: nextHardCount >= challenge.target,
      nextHardCount,
    };
  }

  return { progress: 0, done: false, nextHardCount: 0 };
}

function evolvedOwlForLevel(level) {
  if (level >= 30) return { emoji: "\uD83D\uDC51", name: "Hibou légendaire" };
  if (level >= 20) return { emoji: "\uD83E\uDD47", name: "Hibou doré" };
  if (level >= 10) return { emoji: "\uD83D\uDEE1\uFE0F", name: "Hibou armure" };
  return { emoji: "\uD83E\uDD89", name: "Petit hibou" };
}

function displayAvatarByLevel(baseAvatar, avatarId, level) {
  if (!baseAvatar) return { id: "owl", name: "Petit hibou", emoji: "\uD83E\uDD89" };
  if (avatarId !== "owl") return baseAvatar;
  const evo = evolvedOwlForLevel(level);
  return { ...baseAvatar, ...evo };
}

/* ------------------------ App ------------------------ */
export default function App() {
  const qHistoryRef = useRef([]);
  const adaptiveRollRef = useRef([]);
  const autoTimerRef = useRef(null);
  const badgeTimerRef = useRef(null);
  const levelTimerRef = useRef(null);
  const coachTimerRef = useRef(null);
  const chestTimerRef = useRef(null);
  const chestRevealTimerRef = useRef(null);
  const rushWasOnRef = useRef(false);
  const rushQuestionStartTsRef = useRef(Date.now());
  const study5WasOnRef = useRef(false);
  const study5StartTsRef = useRef(0);
  const worldTransitionTimerRef = useRef(null);
  const worldTransitionLockRef = useRef(false);
  const cloudHydrateRef = useRef(false);
  const cloudSaveTimerRef = useRef(null);

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
        selectedWorldId: "ce1",
        worldProgress: defaultWorldProgress(),
        gradeId: "CE1",
        diffId: "moyen",
        modeId: "add",
        coins: 120,
        avatarId: "owl",
        ownedSkins: ["neon-night"],
        ownedAvatars: ["owl"],
        cosmeticDust: 0,
        level: 1,
        xp: 0,
        records: {},
        bestStreak: 0,
        totalRight: 0,
        totalWrong: 0,
        totalQuestions: 0,
        audioOn: true,
        fxVolume: 0.8,
        vibrateOn: true,
        autoNextOn: false,
        autoNextMs: 1800,
        arenaOn: true,
        adaptiveOn: true,
        noPenaltyOnWrong: false,
        reduceMotion: false,
        achievements: {},
        lastLoginDayKey: null,
        loginStreak: 0,
        activityMap: {},
        rushBest: 0,
        rushLeague: "bronze",
        rushBestScore: 0,
        rushLeaderboard: [],
        ownedEffects: ["default"],
        answerEffectId: "default",
        chestProgress: 0,
        chestPending: 0,
        chestQueue: [],
        xpBoostUntilTs: 0,
        premiumPlan: "free",
        premiumSinceTs: 0,
        adDayKey: parisDayKey(),
        adTodayCount: 0,
        adUsageByKind: emptyAdUsageByKind(),
        adCooldownUntilTs: 0,
        rushDayKey: parisDayKey(),
        rushTodayCount: 0,
        adSurvivalLives: 0,
        league: freshSeasonState(),
        challengeProgress: createChallengeProgress(null),
        collegeArena: { dayKey: parisDayKey(), hardRight: 0, claimed: false },
        study5LastSummary: makeEmptyStudy5Summary(),
      };
    }

    const saved = safeLSGet(userKey(authUser.pseudoKey), null);
    const selectedWorldId = saved?.selectedWorldId ?? worldIdFromGrade(saved?.gradeId ?? "CE1");
    return {
      skinId: saved?.skinId ?? "neon-night",
      selectedWorldId,
      worldProgress: normalizeWorldProgress(saved?.worldProgress),
      gradeId: saved?.gradeId ?? "CE1",
      diffId: saved?.diffId ?? "moyen",
      modeId: saved?.modeId ?? "add",
      coins: saved?.coins ?? 120,
      avatarId: saved?.avatarId ?? "owl",
      ownedSkins: saved?.ownedSkins ?? ["neon-night"],
      ownedAvatars: saved?.ownedAvatars ?? ["owl"],
      cosmeticDust: saved?.cosmeticDust ?? 0,
      level: saved?.level ?? 1,
      xp: saved?.xp ?? 0,
      records: saved?.records ?? {},
      bestStreak: saved?.bestStreak ?? 0,
      totalRight: saved?.totalRight ?? 0,
      totalWrong: saved?.totalWrong ?? 0,
      totalQuestions: saved?.totalQuestions ?? 0,
      audioOn: saved?.audioOn ?? true,
      fxVolume: saved?.fxVolume ?? 0.8,
      vibrateOn: saved?.vibrateOn ?? true,
      autoNextOn: saved?.autoNextOn ?? false,
      autoNextMs: saved?.autoNextMs ?? 1800,
      arenaOn: saved?.arenaOn ?? true,
      adaptiveOn: saved?.adaptiveOn ?? true,
      noPenaltyOnWrong: saved?.noPenaltyOnWrong ?? false,
      reduceMotion: saved?.reduceMotion ?? false,
      achievements: saved?.achievements ?? {},
      lastLoginDayKey: saved?.lastLoginDayKey ?? null,
      loginStreak: saved?.loginStreak ?? 0,
      activityMap: saved?.activityMap ?? {},
      rushBest: saved?.rushBest ?? 0,
      rushLeague: saved?.rushLeague ?? "bronze",
      rushBestScore: saved?.rushBestScore ?? 0,
      rushLeaderboard: saved?.rushLeaderboard ?? [],
      ownedEffects: saved?.ownedEffects ?? ["default"],
      answerEffectId: saved?.answerEffectId ?? "default",
      chestProgress: saved?.chestProgress ?? 0,
      chestPending: saved?.chestPending ?? 0,
      chestQueue: saved?.chestQueue ?? [],
      xpBoostUntilTs: saved?.xpBoostUntilTs ?? 0,
      premiumPlan: saved?.premiumPlan ?? "free",
      premiumSinceTs: saved?.premiumSinceTs ?? 0,
      adDayKey: saved?.adDayKey ?? parisDayKey(),
      adTodayCount: saved?.adTodayCount ?? 0,
      adUsageByKind: normalizeAdUsageByKind(saved?.adUsageByKind),
      adCooldownUntilTs: saved?.adCooldownUntilTs ?? 0,
      rushDayKey: saved?.rushDayKey ?? parisDayKey(),
      rushTodayCount: saved?.rushTodayCount ?? 0,
      adSurvivalLives: saved?.adSurvivalLives ?? 0,
      league: ensureSeasonState(saved?.league),
      challengeProgress: createChallengeProgress(saved?.challengeProgress),
      collegeArena: {
        dayKey: saved?.collegeArena?.dayKey ?? parisDayKey(),
        hardRight: saved?.collegeArena?.hardRight ?? 0,
        claimed: !!saved?.collegeArena?.claimed,
      },
      study5LastSummary: saved?.study5LastSummary ?? makeEmptyStudy5Summary(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, authUser?.pseudoKey]);

  const [skinId, setSkinId] = useState(initial.skinId);
  const [selectedWorldId, setSelectedWorldId] = useState(initial.selectedWorldId);
  const [worldProgress, setWorldProgress] = useState(initial.worldProgress);
  const [gradeId, setGradeId] = useState(initial.gradeId);
  const [diffId, setDiffId] = useState(initial.diffId);
  const [modeId, setModeId] = useState(initial.modeId);

  const [coins, setCoins] = useState(initial.coins);
  const [avatarId, setAvatarId] = useState(initial.avatarId);
  const [ownedSkins, setOwnedSkins] = useState(initial.ownedSkins);
  const [ownedAvatars, setOwnedAvatars] = useState(initial.ownedAvatars);
  const [cosmeticDust, setCosmeticDust] = useState(initial.cosmeticDust);

  const [level, setLevel] = useState(initial.level);
  const [xp, setXp] = useState(initial.xp);

  const [records, setRecords] = useState(initial.records);
  const [bestStreak, setBestStreak] = useState(initial.bestStreak);
  const [totalRight, setTotalRight] = useState(initial.totalRight);
  const [totalWrong, setTotalWrong] = useState(initial.totalWrong);
  const [totalQuestions, setTotalQuestions] = useState(initial.totalQuestions);

  const [audioOn, setAudioOn] = useState(initial.audioOn);
  const [fxVolume, setFxVolume] = useState(initial.fxVolume ?? 0.8);
  const [vibrateOn, setVibrateOn] = useState(initial.vibrateOn);
  const [autoNextOn, setAutoNextOn] = useState(initial.autoNextOn);
  const [autoNextMs, setAutoNextMs] = useState(initial.autoNextMs);
  const [arenaOn, setArenaOn] = useState(initial.arenaOn);
  const [adaptiveOn, setAdaptiveOn] = useState(initial.adaptiveOn);
  const [noPenaltyOnWrong, setNoPenaltyOnWrong] = useState(initial.noPenaltyOnWrong);
  const [reduceMotion, setReduceMotion] = useState(initial.reduceMotion);

  const [achievements, setAchievements] = useState(initial.achievements);
  const [badgePop, setBadgePop] = useState(null);

  const [levelPop, setLevelPop] = useState(null);
  const [coachPop, setCoachPop] = useState(null);
  const [chestPop, setChestPop] = useState(null);
  const [comboFunPop, setComboFunPop] = useState(null);
  const [sessionChallenge, setSessionChallenge] = useState(() => buildSessionChallenge());
  const [sessionChallengeProgress, setSessionChallengeProgress] = useState(0);
  const [sessionChallengeDone, setSessionChallengeDone] = useState(false);
  const [sessionChallengePop, setSessionChallengePop] = useState(null);

  const [lastLoginDayKey, setLastLoginDayKey] = useState(initial.lastLoginDayKey);
  const [loginStreak, setLoginStreak] = useState(initial.loginStreak);
  const [activityMap, setActivityMap] = useState(initial.activityMap);
  const [rushBest, setRushBest] = useState(initial.rushBest ?? 0);
  const [rushLeague, setRushLeague] = useState(initial.rushLeague ?? "bronze");
  const [rushBestScore, setRushBestScore] = useState(initial.rushBestScore);
  const [rushLeaderboard, setRushLeaderboard] = useState(initial.rushLeaderboard);
  const [ownedEffects, setOwnedEffects] = useState(initial.ownedEffects);
  const [answerEffectId, setAnswerEffectId] = useState(initial.answerEffectId);
  const [chestProgress, setChestProgress] = useState(initial.chestProgress);
  const [chestPending, setChestPending] = useState(initial.chestPending);
  const [chestQueue, setChestQueue] = useState(initial.chestQueue);
  const [xpBoostUntilTs, setXpBoostUntilTs] = useState(initial.xpBoostUntilTs);
  const [premiumPlan, setPremiumPlan] = useState(initial.premiumPlan);
  const [premiumSinceTs, setPremiumSinceTs] = useState(initial.premiumSinceTs);
  const [rushDayKey, setRushDayKey] = useState(initial.rushDayKey);
  const [rushTodayCount, setRushTodayCount] = useState(initial.rushTodayCount);
  const [league, setLeague] = useState(initial.league);
  const [challengeProgress, setChallengeProgress] = useState(initial.challengeProgress);
  const [collegeArena, setCollegeArena] = useState(initial.collegeArena);
  const [study5LastSummary, setStudy5LastSummary] = useState(initial.study5LastSummary);
  const [loginRewardPop, setLoginRewardPop] = useState(null);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isInstalledPwa, setIsInstalledPwa] = useState(
    () => window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator?.standalone === true
  );
  const [showMobileBootSplash, setShowMobileBootSplash] = useState(() => window.innerWidth <= 820);
  const [showMobileEntryMenu, setShowMobileEntryMenu] = useState(() => window.innerWidth <= 820);
  const [mobileEntryWorldId, setMobileEntryWorldId] = useState(initial.selectedWorldId);
  const [worldTransitionFx, setWorldTransitionFx] = useState(null);

  // Session
  const [screen, setScreen] = useState("classic"); // "classic" | "rush"
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
  const [rushTimeLeft, setRushTimeLeft] = useState(60000);
  const [rushScore, setRushScore] = useState(0);
  const [rushCombo, setRushCombo] = useState(0);
  const [rushBestCombo, setRushBestCombo] = useState(0);
  const [rushFeedback, setRushFeedback] = useState(null);
  const [study5On, setStudy5On] = useState(false);
  const [study5TimeLeft, setStudy5TimeLeft] = useState(STUDY5_DURATION);
  const [study5Answered, setStudy5Answered] = useState(0);
  const [study5Right, setStudy5Right] = useState(0);
  const [study5Wrong, setStudy5Wrong] = useState(0);
  const [study5BestStreak, setStudy5BestStreak] = useState(0);
  const [adBoostNext, setAdBoostNext] = useState(false);
  const [bossActive, setBossActive] = useState(false);
  const [bossRemaining, setBossRemaining] = useState(0);
  const [bossTimeLeft, setBossTimeLeft] = useState(0);
  const [bossProfile, setBossProfile] = useState(ARENA_BOSSES[0]);
  const [bossHitFx, setBossHitFx] = useState(false);
  const [bossAttackFx, setBossAttackFx] = useState(false);
  const [bossImpactRingFx, setBossImpactRingFx] = useState(false);
  const [bossAttackFlashFx, setBossAttackFlashFx] = useState(false);
  const [bossCalloutText, setBossCalloutText] = useState("");
  const [errorShakeFx, setErrorShakeFx] = useState(false);
  const [worldBossActive, setWorldBossActive] = useState(false);
  const [worldBossRemaining, setWorldBossRemaining] = useState(0);

  const [isLocked, setIsLocked] = useState(false);

  const [fx, setFx] = useState("none");
  const [spark, setSpark] = useState(false);

  // Modals
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shopTab, setShopTab] = useState("skins");
  const [profileTab, setProfileTab] = useState("stats");
  const [mobileRoute, setMobileRoute] = useState("home");
  const [isMobileViewport, setIsMobileViewport] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 820 : false));
  const [activitySpan, setActivitySpan] = useState(7);

  // historique réponses
  const [lastAnswers, setLastAnswers] = useState([]);
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionPerf, setSessionPerf] = useState(() => {
    const o = {};
    for (const m of MODES) o[m.id] = { right: 0, total: 0 };
    return o;
  });

  const avatarBase = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0];
  const avatar = useMemo(() => displayAvatarByLevel(avatarBase, avatarId, level), [avatarBase, avatarId, level]);
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];
  const currentWorld = WORLDS.find((w) => w.id === selectedWorldId) ?? WORLDS[1];
  const currentWorldState = worldProgress?.[currentWorld.id] ?? { level: 1, progress: 0, bossDone: false, badgeWon: false };
  const worldLevel = clamp(currentWorldState.level ?? 1, 1, WORLD_LEVEL_MAX);
  const worldProgressCurrent = clamp(currentWorldState.progress ?? 0, 0, WORLD_STEP_CORRECT);
  const worldBossDone = !!currentWorldState.bossDone;
  const worldBossReady = worldLevel >= WORLD_LEVEL_MAX && !worldBossDone && !worldBossActive;
  const cloudEnabled = isCloudEnabled();
  const isPremium = premiumPlan === "monthly" || premiumPlan === "lifetime";
  const { profileRank, xpNeed } = useGameLogic(level);
  const { isUnlocked, unlockAchievement } = useAchievements({
    achievements,
    setAchievements,
    awardCoins,
    showBadgePopup,
  });
  const {
    adSim,
    adDayKey,
    adTodayCount,
    adUsageByKind,
    adCooldownUntilTs,
    adSurvivalLives,
    setAdSurvivalLives,
    adTodayUsed,
    adUsageToday,
    adCooldownLeftSec,
    adLocked,
    startOptionalAd,
    skipOptionalAd,
    logAdEvent,
  } = useRewardedAds({
    initial: {
      adDayKey: initial.adDayKey,
      adTodayCount: initial.adTodayCount,
      adUsageByKind: initial.adUsageByKind,
      adCooldownUntilTs: initial.adCooldownUntilTs,
      adSurvivalLives: initial.adSurvivalLives,
    },
    isPremium,
    cloudEnabled,
    authUser,
    showCoachPopup,
    cloudLogEvent,
  });

  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    xpRef.current = xp;
  }, [xp]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__mathFxVolume = clamp(Number(fxVolume) || 0, 0, 1);
  }, [fxVolume]);

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

  useEffect(() => {
    if (ownedEffects.includes(answerEffectId)) return;
    setAnswerEffectId("default");
  }, [ownedEffects, answerEffectId]);

  useEffect(() => {
    const world = WORLDS.find((w) => w.id === selectedWorldId);
    if (!world) return;
    if (gradeId !== world.gradeId) setGradeId(world.gradeId);
    setWorldBossActive(false);
    setWorldBossRemaining(0);
  }, [selectedWorldId, gradeId]);

  /* ------------------------ Save per-user ------------------------ */
  useEffect(() => {
    if (!isLoggedIn) return;
    const nextSave = {
      skinId,
      selectedWorldId,
      worldProgress,
      gradeId,
      diffId,
      modeId,
      coins,
      avatarId,
      ownedSkins,
      ownedAvatars,
      cosmeticDust,
      level,
      xp,
      records,
      bestStreak,
      totalRight,
      totalWrong,
      totalQuestions,
      audioOn,
      fxVolume,
      vibrateOn,
      autoNextOn,
      autoNextMs,
      arenaOn,
      adaptiveOn,
      noPenaltyOnWrong,
      reduceMotion,
      achievements,
      lastLoginDayKey,
      loginStreak,
      activityMap,
      rushBest,
      rushLeague,
      rushBestScore,
      rushLeaderboard,
      ownedEffects,
      answerEffectId,
      chestProgress,
      chestPending,
      chestQueue,
      xpBoostUntilTs,
      premiumPlan,
      premiumSinceTs,
      adDayKey,
      adTodayCount,
      adUsageByKind,
      adCooldownUntilTs,
      rushDayKey,
      rushTodayCount,
      adSurvivalLives,
      league,
      challengeProgress,
      collegeArena,
      study5LastSummary,
      updatedAt: new Date().toISOString(),
    };
    safeLSSet(userKey(authUser.pseudoKey), nextSave);

    if (!cloudEnabled || !cloudHydrateRef.current) return;
    if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    cloudSaveTimerRef.current = setTimeout(() => {
      cloudPushUserSave(authUser.pseudoKey, authUser?.pseudoDisplay, nextSave, authUser?.accessToken);
    }, 800);
  }, [
    isLoggedIn,
    authUser?.pseudoKey,
    authUser?.pseudoDisplay,
    authUser?.accessToken,
    cloudEnabled,
    skinId,
    selectedWorldId,
    worldProgress,
    gradeId,
    diffId,
    modeId,
    coins,
    avatarId,
    ownedSkins,
    ownedAvatars,
    cosmeticDust,
    level,
    xp,
    records,
    bestStreak,
    totalRight,
    totalWrong,
    totalQuestions,
    audioOn,
    fxVolume,
    vibrateOn,
    autoNextOn,
    autoNextMs,
    arenaOn,
    adaptiveOn,
    noPenaltyOnWrong,
    reduceMotion,
    achievements,
    lastLoginDayKey,
    loginStreak,
    activityMap,
    rushBest,
    rushLeague,
    rushBestScore,
    rushLeaderboard,
    ownedEffects,
    answerEffectId,
    chestProgress,
    chestPending,
    chestQueue,
    xpBoostUntilTs,
    premiumPlan,
    premiumSinceTs,
    adDayKey,
    adTodayCount,
    adUsageByKind,
    adCooldownUntilTs,
    rushDayKey,
    rushTodayCount,
    adSurvivalLives,
    league,
    challengeProgress,
    collegeArena,
    study5LastSummary,
  ]);

  useEffect(() => {
    if (!isLoggedIn || !cloudEnabled || cloudHydrateRef.current) return;
    cloudHydrateRef.current = true;
    let cancelled = false;

    (async () => {
      const remote = await cloudPullUserSave(authUser.pseudoKey, authUser?.accessToken);
      if (cancelled || !remote?.save) return;

      const local = safeLSGet(userKey(authUser.pseudoKey), null);
      const remoteTs = Date.parse(remote.updated_at || remote.save?.updatedAt || "") || 0;
      const localTs = Date.parse(local?.updatedAt || "") || 0;
      const shouldUseRemote = !local || remoteTs > localTs;
      if (!shouldUseRemote) return;

      safeLSSet(userKey(authUser.pseudoKey), remote.save);
      window.location.reload();
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, cloudEnabled, authUser?.pseudoKey, authUser?.accessToken]);

  useEffect(() => {
    return () => {
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
      if (worldTransitionTimerRef.current) clearTimeout(worldTransitionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    const onInstalled = () => {
      setInstallPromptEvent(null);
      setIsInstalledPwa(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (worldTransitionLockRef.current) return;
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
    const today = parisDayKey();
    if (rushDayKey !== today) {
      setRushDayKey(today);
      setRushTodayCount(0);
    }
  }, [questionIndex, rushDayKey]);

  useEffect(() => {
    const today = parisDayKey();
    if ((collegeArena?.dayKey ?? today) !== today) {
      setCollegeArena({ dayKey: today, hardRight: 0, claimed: false });
    }
  }, [questionIndex, collegeArena?.dayKey]);

  useEffect(() => {
    if (!rushOn) return undefined;
    let lastTick = Date.now();
    const id = setInterval(() => {
      const nowTick = Date.now();
      const dtMs = Math.max(10, nowTick - lastTick);
      lastTick = nowTick;
      setRushTimeLeft((t) => {
        const next = Math.max(0, t - dtMs);
        if (next <= 0) {
          if (adSurvivalLives > 0) {
            setAdSurvivalLives((n) => Math.max(0, n - 1));
            showCoachPopup({
              title: "Vie de survie utilisée",
              lines: ["Rush relance avec +15 secondes."],
              hint: "La réserve de survie est consommée automatiquement.",
            });
            playBeep("ok", audioOn);
            rushQuestionStartTsRef.current = Date.now();
            return 15000;
          }
          setRushOn(false);
          return 0;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [rushOn, adSurvivalLives, audioOn]);

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
    if (!study5On) return undefined;
    const id = setInterval(() => {
      setStudy5TimeLeft((t) => {
        if (t <= 1) {
          if (adSurvivalLives > 0) {
            setAdSurvivalLives((n) => Math.max(0, n - 1));
            showCoachPopup({
              title: "Vie de survie utilisée",
              lines: ["Défi 5 minutes prolongé de 30 secondes."],
              hint: "La réserve de survie est consommée automatiquement.",
            });
            playBeep("ok", audioOn);
            return 30;
          }
          setStudy5On(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [study5On, adSurvivalLives, audioOn]);

  useEffect(() => {
    if (study5On) {
      study5WasOnRef.current = true;
      return;
    }
    if (study5WasOnRef.current) {
      study5WasOnRef.current = false;
      endStudy5(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [study5On]);

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
      playBeep("boss_win", audioOn);
      vibrate([24, 18, 34, 18, 52]);
      setBossActive(false);
      setBossTimeLeft(0);
      showCoachPopup({
        title: "Boss terminé",
        lines: ["Boss KO.", "Bonus XP x3 appliqué pendant le boss."],
        hint: "Le prochain boss arrive dans 10 questions.",
      });
    }
  }, [bossActive, bossRemaining, audioOn]);

  useEffect(() => {
    if (!bossAttackFx) return undefined;
    const t = setTimeout(() => setBossAttackFx(false), 420);
    return () => clearTimeout(t);
  }, [bossAttackFx]);

  useEffect(() => {
    if (!bossAttackFlashFx) return undefined;
    const t = setTimeout(() => setBossAttackFlashFx(false), 260);
    return () => clearTimeout(t);
  }, [bossAttackFlashFx]);

  useEffect(() => {
    if (!bossHitFx) return undefined;
    const t = setTimeout(() => setBossHitFx(false), 280);
    return () => clearTimeout(t);
  }, [bossHitFx]);

  useEffect(() => {
    if (!bossImpactRingFx) return undefined;
    const t = setTimeout(() => setBossImpactRingFx(false), 360);
    return () => clearTimeout(t);
  }, [bossImpactRingFx]);

  useEffect(() => {
    if (!bossCalloutText) return undefined;
    const t = setTimeout(() => setBossCalloutText(""), 520);
    return () => clearTimeout(t);
  }, [bossCalloutText]);

  useEffect(() => {
    if (!errorShakeFx) return undefined;
    const t = setTimeout(() => setErrorShakeFx(false), 360);
    return () => clearTimeout(t);
  }, [errorShakeFx]);

  useEffect(() => {
    if (!rushFeedback) return undefined;
    const t = setTimeout(() => setRushFeedback(null), 650);
    return () => clearTimeout(t);
  }, [rushFeedback]);

  function vibrate(ms) {
    if (!vibrateOn) return;
    try {
      const pattern = Array.isArray(ms) ? ms : [ms];
      navigator.vibrate?.(pattern);
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
  function showChestPopup(payload) {
    setChestPop(payload);
    if (chestTimerRef.current) clearTimeout(chestTimerRef.current);
    if (payload?.phase === "rolling" || payload?.phase === "impact") return;
    chestTimerRef.current = setTimeout(() => setChestPop(null), 5200);
  }

  function equipChestReward(item) {
    const reward = item?.reward;
    if (!reward) return;
    if (reward.kind === "skin" && ownedSkins.includes(reward.skinId)) {
      setSkinId(reward.skinId);
      setChestPop(null);
    }
    if (reward.kind === "effect" && ownedEffects.includes(reward.effectId)) {
      setAnswerEffectId(reward.effectId);
      setChestPop(null);
    }
  }

  function unlockEffectWithDust(effectId) {
    const fx = ANSWER_EFFECTS.find((e) => e.id === effectId);
    if (!fx || fx.id === "default") return;
    if (ownedEffects.includes(effectId)) {
      setAnswerEffectId(effectId);
      return;
    }
    const cost = fx.dustCost ?? 0;
    if (cosmeticDust < cost) return;
    setCosmeticDust((v) => Math.max(0, v - cost));
    setOwnedEffects((prev) => (prev.includes(effectId) ? prev : [...prev, effectId]));
    setAnswerEffectId(effectId);
    showBadgePopup({
      icon: "\u2728",
      title: "Effet débloqué",
      desc: `${fx.label} | -${cost} diamants`,
      reward: 0,
    });
  }

  function awardCoins(amount) {
    setCoins((c) => c + Math.max(0, amount));
  }

  function awardDust(amount) {
    setCosmeticDust((v) => v + Math.max(0, amount));
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
      vibrate([28, 18, 46]);
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

  function pushHistory(qNew, effectiveDiff = diffId, forcedGradeId = null) {
    const gradeForHistory = forcedGradeId ?? gradeId;
    const sig = questionSignature(qNew, modeId, gradeForHistory, effectiveDiff);
    const arr = qHistoryRef.current ?? [];
    const next = [sig, ...arr];
    qHistoryRef.current = next.slice(0, 25);
  }

  function newQuestion(resetPick = false, forcedGradeId = null) {
    clearAutoTimer();
    const liveDiff = bossActive || worldBossActive ? "difficile" : diffId;
    const nextGradeId = forcedGradeId ?? gradeId;
    const qNew = makeQuestion(modeId, nextGradeId, liveDiff, qHistoryRef);
    pushHistory(qNew, liveDiff, nextGradeId);
    if (rushOn) rushQuestionStartTsRef.current = Date.now();

    setQ(qNew);
    setStatus("idle");
    setExplain("");
    setShowExplain(false);
    setShowMethod(false);
    setHintLevel(0);
    setHintMsg("");
    setFx("none");
    setSpark(false);
    setBossHitFx(false);
    setBossAttackFx(false);
    setIsLocked(false);
    if (resetPick) setPicked(null);
  }

  function seedSessionChallenge() {
    setSessionChallenge(buildSessionChallenge());
    setSessionChallengeProgress(0);
    setSessionChallengeDone(false);
    setSessionCorrect(0);
  }

  function resetSession() {
    clearAutoTimer();
    setScreen("classic");
    setStudy5On(false);
    setStudy5TimeLeft(STUDY5_DURATION);
    setStudy5Answered(0);
    setStudy5Right(0);
    setStudy5Wrong(0);
    setStudy5BestStreak(0);
    setRushOn(false);
    setRushTimeLeft(60000);
    setRushScore(0);
    setRushCombo(0);
    setRushBestCombo(0);
    setRushFeedback(null);
    setAdBoostNext(false);
    setSessionChallengePop(null);
    setBossActive(false);
    setBossRemaining(0);
    setBossTimeLeft(0);
    setBossHitFx(false);
    setBossAttackFx(false);
    setWorldBossActive(false);
    setWorldBossRemaining(0);
    setScore(0);
    setStreak(0);
    setSessionAnswered(0);
    setLastAnswers([]);
    adaptiveRollRef.current = [];
    setAdaptiveAction(null);
    seedSessionChallenge();
    setSessionPerf(() => {
      const o = {};
      for (const m of MODES) o[m.id] = { right: 0, total: 0 };
      return o;
    });
    setCoachPop(null);
    setQuestionIndex(1);
    newQuestion(true);
  }

  function startWorldBoss() {
    if (!worldBossReady) return;
    setWorldBossActive(true);
    setWorldBossRemaining(3);
    playBeep("level", audioOn);
    vibrate([24, 20, 34]);
    showCoachPopup({
      title: "Boss final",
      lines: [`${currentWorld.name}`, "3 questions difficiles pour valider le monde."],
      hint: "Réussis les 3 pour débloquer le badge spécial.",
    });
    newQuestion(true);
  }

  function startStudy5() {
    if (rushOn) {
      showCoachPopup({
        title: "Défi 5 minutes",
        lines: ["Arrête le mode Rush avant de lancer le défi 5 minutes."],
        hint: "Un seul mode minuteur a la fois.",
      });
      return;
    }
    study5StartTsRef.current = Date.now();
    setStudy5On(true);
    setStudy5TimeLeft(STUDY5_DURATION);
    setStudy5Answered(0);
    setStudy5Right(0);
    setStudy5Wrong(0);
    setStudy5BestStreak(0);
    setSessionAnswered(0);
    setLastAnswers([]);
    setSessionChallengePop(null);
    seedSessionChallenge();
    setScore(0);
    setStreak(0);
    setQuestionIndex(1);
    setBossActive(false);
    setBossRemaining(0);
    setBossTimeLeft(0);
    setBossHitFx(false);
    setBossAttackFx(false);
    setWorldBossActive(false);
    setWorldBossRemaining(0);
    newQuestion(true);
    showCoachPopup({
      title: "Défi 5 minutes lancé",
      lines: ["Objectif : faire 5 minutes de maths.", "Réponds au plus de questions possible."],
      hint: "Un résumé parent sera généré en fin de session.",
    });
  }

  function endStudy5(force = false) {
    if (!study5On && !force) return;
    setStudy5On(false);
    const startedAt = study5StartTsRef.current || Date.now();
    const endedAt = Date.now();
    const durationSec = Math.max(1, Math.round((endedAt - startedAt) / 1000));
    const accuracy5 = study5Answered ? Math.round((study5Right / study5Answered) * 100) : 0;
    const summary = {
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      durationSec,
      answered: study5Answered,
      right: study5Right,
      wrong: study5Wrong,
      accuracy: accuracy5,
      bestStreak: study5BestStreak,
      score,
    };
    setStudy5LastSummary(summary);
    showCoachPopup({
      title: "Défi 5 minutes terminé",
      lines: [`Questions: ${summary.answered}`, `Réussite: ${summary.accuracy}%`, `Meilleur combo: ${summary.bestStreak}`],
      hint: "Tu peux partager ce résumé au parent.",
    });
    if (cloudEnabled) {
      cloudLogEvent({
        pseudoKey: authUser?.pseudoKey,
        event: "study5_end",
        payload: summary,
        accessToken: authUser?.accessToken,
      });
    }
  }

  function copyStudy5Summary() {
    if (!study5LastSummary) return;
    const t = study5LastSummary;
    const text = [
      "Résumé parent - Défi 5 minutes",
      `Date: ${new Date(t.endedAt).toLocaleString("fr-FR")}`,
      `Durée: ${t.durationSec}s`,
      `Questions: ${t.answered}`,
      `Bonnes réponses: ${t.right}`,
      `Erreurs: ${t.wrong}`,
      `Précision: ${t.accuracy}%`,
      `Meilleur combo: ${t.bestStreak}`,
      `Score: ${t.score}`,
    ].join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function startRush() {
    if (study5On) {
      showCoachPopup({
        title: "Rush indisponible",
        lines: ["Termine le défi 5 minutes avant de lancer Rush."],
        hint: "Un seul mode minuteur a la fois.",
      });
      return;
    }
    const today = parisDayKey();
    const used = rushDayKey === today ? rushTodayCount : 0;
    if (!isPremium && used >= 3) {
      showCoachPopup({
        title: "Rush limite atteint",
        lines: ["Version gratuite: 3 rush par jour."],
        hint: "Passe Premium pour Rush illimité.",
      });
      return;
    }
    if (rushDayKey !== today) {
      setRushDayKey(today);
      setRushTodayCount(0);
    }
    if (!isPremium) setRushTodayCount((n) => n + 1);
    setScreen("rush");
    setSessionAnswered(0);
    setLastAnswers([]);
    setSessionChallengePop(null);
    seedSessionChallenge();
    setRushOn(true);
    setRushTimeLeft(60000);
    setRushScore(0);
    setRushCombo(0);
    setRushBestCombo(0);
    setRushFeedback(null);
    rushQuestionStartTsRef.current = Date.now();
    setScore(0);
    setStreak(0);
    setQuestionIndex(1);
    setBossActive(false);
    setBossRemaining(0);
    setBossTimeLeft(0);
    setWorldBossActive(false);
    setWorldBossRemaining(0);
    setShowExplain(false);
    setIsLocked(false);
    newQuestion(true);
  }

  function endRush(force = false) {
    if (!rushOn && !force) return;
    setScreen("classic");
    setRushOn(false);
    setRushTimeLeft((t) => (force ? t : Math.max(0, t)));
    setRushBestScore((prev) => Math.max(prev ?? 0, rushScore));
    const entry = {
      pseudo: authUser?.pseudoDisplay ?? "Joueur",
      score: rushScore,
      date: new Date().toISOString(),
    };
    setRushLeaderboard((prev) => buildRushLeaderboard(prev, entry));
    if (cloudEnabled) {
      cloudPushLeaderboard({
        pseudoKey: authUser?.pseudoKey,
        pseudoDisplay: authUser?.pseudoDisplay,
        mode: "rush",
        score: rushScore,
        accessToken: authUser?.accessToken,
      });
      cloudLogEvent({
        pseudoKey: authUser?.pseudoKey,
        event: "rush_end",
        payload: { score: rushScore, best: Math.max(rushBestScore, rushScore) },
        accessToken: authUser?.accessToken,
      });
    }
    showCoachPopup({
      title: "Rush terminé",
      lines: [`Score rush: ${rushScore}`, `Meilleur: ${Math.max(rushBestScore, rushScore)}`],
      hint: "Tu peux relancer un rush quand tu veux.",
    });
  }

  function openChestBatch(count = 1) {
    const openCount = clamp(Number(count) || 1, 1, Math.max(1, chestPending));
    if (chestPending <= 0) return;
    const chestScoreSeed = Math.max(score ?? 0, rushScore ?? 0);

    const availableTypes = Array.isArray(chestQueue) ? [...chestQueue] : [];
    const opened = [];
    const tempOwnedAvatars = new Set(ownedAvatars);
    const tempOwnedSkins = new Set(ownedSkins);
    const tempOwnedEffects = new Set(ownedEffects);

    for (let i = 0; i < openCount; i++) {
      const chestType = availableTypes.shift() ?? chestTypeFromRoll(chestScoreSeed);
      const reward = rollChestRewardByType({
        chestType,
        ownedAvatars: [...tempOwnedAvatars],
        ownedSkins: [...tempOwnedSkins],
        ownedEffects: [...tempOwnedEffects],
        score: chestScoreSeed,
      });
      let finalReward = reward;

      if (reward.kind === "avatar") {
        if (tempOwnedAvatars.has(reward.avatarId)) {
          const dust = dustForDuplicate("avatar");
          finalReward = { kind: "dust", dust, text: `Doublon avatar converti en ${dust} diamant` };
        } else {
          tempOwnedAvatars.add(reward.avatarId);
        }
      }
      if (reward.kind === "skin") {
        if (tempOwnedSkins.has(reward.skinId)) {
          const dust = dustForDuplicate("skin");
          finalReward = { kind: "dust", dust, text: `Doublon skin converti en ${dust} diamant` };
        } else {
          tempOwnedSkins.add(reward.skinId);
        }
      }
      if (reward.kind === "effect") {
        if (tempOwnedEffects.has(reward.effectId)) {
          const dust = dustForDuplicate("effect");
          finalReward = { kind: "dust", dust, text: `Doublon effet converti en ${dust} diamant` };
        } else {
          tempOwnedEffects.add(reward.effectId);
        }
      }

      opened.push({
        chestType,
        reward: finalReward,
        visual: rewardVisualMeta(finalReward, chestType),
      });
    }

    setChestPending((n) => Math.max(0, n - openCount));
    setChestQueue(availableTypes);

    for (const item of opened) {
      const reward = item.reward;
      if (reward.kind === "dust") awardDust(reward.dust);
      if (reward.kind === "coins") awardCoins(reward.coins);
      if (reward.kind === "avatar") {
        setOwnedAvatars((prev) => (prev.includes(reward.avatarId) ? prev : [...prev, reward.avatarId]));
      }
      if (reward.kind === "skin") {
        setOwnedSkins((prev) => (prev.includes(reward.skinId) ? prev : [...prev, reward.skinId]));
      }
      if (reward.kind === "xpBoost") {
        setXpBoostUntilTs((prev) => Math.max(prev, Date.now()) + reward.minutes * 60 * 1000);
      }
      if (reward.kind === "effect") {
        setOwnedEffects((prev) => (prev.includes(reward.effectId) ? prev : [...prev, reward.effectId]));
        setAnswerEffectId(reward.effectId);
      }
    }

    const headline = openCount === 1 ? `${CHEST_TYPES[opened[0]?.chestType]?.label ?? "Coffre"} ouvert` : `${openCount} coffres ouverts`;
    showBadgePopup({
      icon: CHEST_TYPES[opened[0]?.chestType]?.icon ?? "\uD83C\uDF81",
      title: headline,
      desc: openCount === 1 ? opened[0]?.reward?.text : `${openCount} récompenses révélées`,
      reward: 0,
    });

    playBeep("chest", audioOn);
    vibrate([18, 16, 26]);

    if (chestRevealTimerRef.current) clearTimeout(chestRevealTimerRef.current);
    showChestPopup({
      phase: "rolling",
      openCount,
      chestType: opened[0]?.chestType ?? "common",
      reel: ["\uD83C\uDF81", "\uD83C\uDF1F", "\u2728", "\uD83D\uDC51", "\uD83C\uDF1F", "\u2728"],
    });
    chestRevealTimerRef.current = setTimeout(() => {
      const revealChestType = opened[0]?.chestType ?? "common";
      showChestPopup({
        phase: "impact",
        openCount,
        chestType: revealChestType,
        chestLabel: CHEST_TYPES[revealChestType]?.label ?? "Coffre",
        chestIcon: CHEST_TYPES[revealChestType]?.icon ?? "\uD83C\uDF81",
      });
      playBeep("level", audioOn, fxVolume);
      vibrate(chestRevealVibration(revealChestType));
      chestRevealTimerRef.current = setTimeout(() => {
      showChestPopup({
        phase: "reveal",
        openCount,
        chestType: revealChestType,
        chestLabel: openCount === 1 ? CHEST_TYPES[revealChestType]?.label ?? "Coffre" : `${openCount} coffres`,
        chestIcon: CHEST_TYPES[revealChestType]?.icon ?? "\uD83C\uDF81",
        leadRewardKind: opened[0]?.reward?.kind ?? "coins",
        rewards: opened,
      });
      }, reduceMotion ? 0 : 340);
    }, reduceMotion ? 0 : 880);

    if (cloudEnabled) {
      cloudLogEvent({
        pseudoKey: authUser?.pseudoKey,
        event: "chest_opened",
        payload: {
          count: openCount,
          chests: opened.map((item) => ({
            chestType: item.chestType,
            rewardKind: item.reward.kind,
            rewardText: item.reward.text,
          })),
        },
        accessToken: authUser?.accessToken,
      });
    }
  }

  function openChest() {
    openChestBatch(1);
  }

  function watchAdDoubleReward() {
    startOptionalAd(
      "double_reward",
      () => {
        setAdBoostNext(true);
        showCoachPopup({
          title: "Pub optionnelle",
          lines: ["Prochaine bonne réponse : pièces + XP x2 activés."],
          hint: "Aucune pub forcée.",
        });
        logAdEvent("double_reward");
      },
      {
        title: "Publicité en cours",
        lines: ["Déblocage du bonus x2.", "Fin de la simulation dans 3 secondes."],
      }
    );
  }

  function watchAdInstantChest() {
    startOptionalAd(
      "instant_chest",
      () => {
        const t = chestTypeFromRoll(Math.max(score ?? 0, rushScore ?? 0));
        setChestPending((v) => v + 1);
        setChestQueue((prev) => [...(prev ?? []), t]);
        showCoachPopup({
          title: "Pub optionnelle",
          lines: [`${CHEST_TYPES[t]?.label ?? "Coffre"} ajouté instantanément.`],
          hint: "Aucune pub forcée.",
        });
        logAdEvent("instant_chest", { chestType: t });
      },
      {
        title: "Publicité en cours",
        lines: ["Déblocage d'un coffre immédiat.", "Fin de la simulation dans 3 secondes."],
      }
    );
  }

  function watchAdSurvivalLife() {
    if (adSurvivalLives >= 3) return;
    startOptionalAd(
      "survival_life",
      () => {
        setAdSurvivalLives((n) => Math.min(3, n + 1));
        showCoachPopup({
          title: "Pub optionnelle",
          lines: ["1 vie de survie stockée."],
          hint: "Elle sera consommée si un chrono Rush ou Défi 5 minutes tombe à 0.",
        });
        logAdEvent("survival_life");
      },
      {
        title: "Publicité en cours",
        lines: ["Préparation d'une vie de survie.", "Fin de la simulation dans 3 secondes."],
      }
    );
  }

  function activatePremium(plan) {
    if (plan !== "monthly" && plan !== "lifetime") return;
    setPremiumPlan(plan);
    if (!premiumSinceTs) setPremiumSinceTs(Date.now());
    showCoachPopup({
      title: "Premium activé",
      lines: [plan === "lifetime" ? "Plan à vie activé" : "Plan mensuel activé"],
      hint: "Skins/avatars premium + Rush illimité + stats avancées.",
    });
    if (cloudEnabled) {
      cloudLogEvent({
        pseudoKey: authUser?.pseudoKey,
        event: "premium_change",
        payload: { plan },
        accessToken: authUser?.accessToken,
      });
    }
  }

  function disablePremium() {
    setPremiumPlan("free");
    showCoachPopup({
      title: "Retour gratuit",
      lines: ["Mode gratuit actif."],
      hint: "Tu gardes les objets déjà achetés.",
    });
    if (cloudEnabled) {
      cloudLogEvent({
        pseudoKey: authUser?.pseudoKey,
        event: "premium_change",
        payload: { plan: "free" },
        accessToken: authUser?.accessToken,
      });
    }
  }

  async function installPwaApp() {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    try {
      await installPromptEvent.userChoice;
    } catch {}
    setInstallPromptEvent(null);
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
      setHintMsg("Pas assez de pièces pour un indice.");
      return;
    }

    if (cost > 0) setCoins((c) => Math.max(0, c - cost));
    setHintLevel(nextLevel);
    setHintMsg(cost > 0 ? `Indice débloqué (-${cost} pièce${cost > 1 ? "s" : ""}).` : "Premier indice gratuit en facile.");
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
          lines: [`Précision sur 20 questions: ${acc20}%. On monte en difficulté (${nextDiff}).`],
          hint: "Tu progresses très bien, on augmente le challenge.",
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
          `Précision sur 20 questions: ${acc20}%.`,
          nextDiff !== diffId ? `On baisse la difficulté (${nextDiff}) pour consolider.` : "On garde la difficulté actuelle.",
          weakMode ? `Entraînement ciblé conseillé : ${modeName(weakMode)}.` : "Continue sur ce mode pour consolider.",
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
    const isArenaNow = arenaOn && !isRushNow && !study5On;
    const isBossNow = bossActive;
    const isWorldBossNow = worldBossActive;
    const fastMode = isRushNow || isBossNow || isWorldBossNow;

    const nextTotalQuestions = totalQuestions + 1;
    const nextTotalRight = totalRight + (isCorrect ? 1 : 0);
    const nextTotalWrong = totalWrong + (isCorrect ? 0 : 1);
    const nextStreak = isCorrect ? streak + 1 : 0;
    const baseScoreAdd = isCorrect ? 10 + Math.min(18, streak * 2) : 0;
    const rushMult = isRushNow ? getRushMultiplier(isCorrect ? rushCombo + 1 : 0) : 1;
    const arenaMult = isArenaNow ? arenaComboMultiplier(isCorrect ? streak + 1 : streak) : 1;
    const nextScoreAdd = Math.round(baseScoreAdd * (isRushNow ? rushMult : arenaMult));
    let rushScoreAdd = 0;

    const nextTotalAnswers = nextTotalRight + nextTotalWrong;
    const nextAccuracy = nextTotalAnswers ? Math.round((nextTotalRight / nextTotalAnswers) * 100) : 0;
    const nextSessionCorrect = sessionCorrect + (isCorrect ? 1 : 0);
    const isHardMode = diffId === "difficile";
    const challengeProgressData = sessionChallenge
      ? sessionChallengeNextProgress({
          challenge: sessionChallenge,
          isCorrect,
          nextStreak,
          nextSessionCorrect,
          isHardMode,
          currentProgress: sessionChallengeProgress,
        })
      : null;

    if (study5On) {
      setStudy5Answered((n) => n + 1);
      if (isCorrect) {
        setStudy5Right((n) => n + 1);
        setStudy5BestStreak((n) => Math.max(n, nextStreak));
      } else {
        setStudy5Wrong((n) => n + 1);
      }
    }
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

    if (isArenaNow && !bossActive && !worldBossActive && nextTotalQuestions > 0 && nextTotalQuestions % 10 === 0) {
      const bossPick = ARENA_BOSSES[randInt(0, ARENA_BOSSES.length - 1)];
      setBossProfile(bossPick);
      setBossHitFx(false);
      setBossAttackFx(false);
      setBossActive(true);
      setBossRemaining(100);
      setBossTimeLeft(12);
      playBeep("level", audioOn);
      vibrate([22, 16, 30]);
      showCoachPopup({
        title: "Combat de boss",
        lines: [`${bossPick.name}`, "Boss enragé : 100 PV", "Chaque bonne réponse : -20 % PV"],
        hint: "Reste focus jusqu'au bout.",
      });
    }

    setLastAnswers((prev) => [{ ok: isCorrect }, ...(prev ?? [])].slice(0, 10));

    setSessionPerf(nextSessionPerf);
    if (challengeProgressData && !sessionChallengeDone) {
      setSessionChallengeProgress(
        sessionChallenge.kind === "hard" ? challengeProgressData.nextHardCount : challengeProgressData.progress
      );

      if (challengeProgressData.done) {
        setSessionChallengeDone(true);
        awardCoins(sessionChallenge.rewardCoins);
        awardXp(sessionChallenge.rewardXp);
        setSessionChallengePop({
          icon: sessionChallenge.icon,
          title: "Défi session validé",
          sub: sessionChallenge.title,
          reward: sessionChallenge.rewardCoins,
          xpReward: sessionChallenge.rewardXp,
        });
        playBeep("chest_open", audioOn, fxVolume);
        vibrate([14, 12, 18, 16]);
      }
    }
    setSessionCorrect((n) => (isCorrect ? n + 1 : n));

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
    if (isCorrect && diffId === "difficile" && isCollegeGrade(gradeId)) {
      setCollegeArena((prev) => {
        const today = parisDayKey();
        const base = prev?.dayKey === today ? prev : { dayKey: today, hardRight: 0, claimed: false };
        return { ...base, hardRight: (base.hardRight ?? 0) + 1 };
      });
    }
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

    const effectiveScoreAdd = isRushNow ? rushScoreAdd : nextScoreAdd;
    setLeague((prev) => updateLeagueAfterAnswer(prev, { isCorrect, scoreAdd: effectiveScoreAdd, nextStreak }));

    if (isWorldBossNow) {
      if (isCorrect) {
        setWorldBossRemaining((n) => {
          const next = Math.max(0, n - 1);
          if (next === 0) {
            setWorldBossActive(false);
            setWorldProgress((prev) => {
              const base = normalizeWorldProgress(prev);
              base[currentWorld.id] = { ...base[currentWorld.id], bossDone: true, badgeWon: true };
              return base;
            });
            awardCoins(180);
            awardXp(220);
            showBadgePopup({
              icon: "\uD83C\uDFC6",
              title: `Monde complété : ${currentWorld.name}`,
              desc: `${currentWorld.badge} débloqué | +180 pièces | +220 XP`,
              reward: 180,
            });
          }
          return next;
        });
      } else {
        setWorldBossActive(false);
        setWorldBossRemaining(0);
        showCoachPopup({
          title: "Boss final raté",
          lines: [`${currentWorld.name}: essaie encore.`],
          hint: "Reviens plus fort, le badge est proche.",
        });
      }
    } else if (isCorrect && !worldBossDone) {
      setWorldProgress((prev) => {
        const base = normalizeWorldProgress(prev);
        const cur = base[currentWorld.id] ?? { level: 1, progress: 0, bossDone: false, badgeWon: false };
        if (cur.level >= WORLD_LEVEL_MAX) return base;
        let nextLevel = cur.level;
        let nextProgress = (cur.progress ?? 0) + 1;
        if (nextProgress >= WORLD_STEP_CORRECT) {
          nextLevel = Math.min(WORLD_LEVEL_MAX, nextLevel + 1);
          nextProgress = 0;
          showCoachPopup({
            title: currentWorld.name,
            lines: [`Niveau ${nextLevel}/${WORLD_LEVEL_MAX}`],
            hint: nextLevel >= WORLD_LEVEL_MAX ? "Boss final prêt à lancer." : "Continue l'aventure.",
          });
        }
        base[currentWorld.id] = { ...cur, level: nextLevel, progress: nextProgress };
        return base;
      });
    }

    if (isCorrect) {
      setChestProgress((p) => {
        const next = (p ?? 0) + 1;
        if (next >= 15) {
          const t = chestTypeFromRoll(Math.max(score ?? 0, rushScore ?? 0));
          setChestPending((v) => v + 1);
          setChestQueue((prev) => [...(prev ?? []), t]);
          showBadgePopup({
            icon: CHEST_TYPES[t]?.icon ?? "",
            title: `${CHEST_TYPES[t]?.label ?? "Coffre"} gagné`,
            desc: "15 bonnes réponses atteintes. Ouvre ton coffre.",
            reward: 0,
          });
          return next - 15;
        }
        return next;
      });
    }

    if (isRushNow) {
      const nowMs = Date.now();
      const rt = Math.max(0, nowMs - rushQuestionStartTsRef.current);
      if (isCorrect) {
        const nextRushCombo = rushCombo + 1;
        const nextRushMult = getRushMultiplier(nextRushCombo);
        const base = basePoints(diffId);
        const speedPts = speedBonus(rt);
        rushScoreAdd = (base + speedPts) * nextRushMult;
        setRushFeedback(
          speedPts >= 6
            ? { tone: "fast", label: "RAPIDE", bonus: speedPts, rtMs: rt }
            : speedPts >= 3
              ? { tone: "good", label: "BON", bonus: speedPts, rtMs: rt }
              : { tone: "base", label: "OK", bonus: 0, rtMs: rt }
        );

        setRushCombo(nextRushCombo);
        setRushBestCombo((best) => Math.max(best, nextRushCombo));
        setRushScore((s) => s + rushScoreAdd);
        setRushTimeLeft((t) => Math.min(75000, t + 900));
      } else {
        setRushCombo(0);
        setRushTimeLeft((t) => Math.max(0, t - 1400));
        setRushFeedback({ tone: "miss", label: "-1.4s", bonus: 0, rtMs: rt });
      }
      rushQuestionStartTsRef.current = nowMs;
    }

    if (isCorrect) {
      setStatus("ok");
      playBeep("ok", audioOn);
      vibrate([14, 18]);
      triggerFx("ok");

      const rewardBoost = adBoostNext ? 2 : 1;
      const coinReward = 3 * rewardBoost;
      awardCoins(coinReward);
      if (adBoostNext) setAdBoostNext(false);
      setTotalRight((x) => x + 1);

      setScore((s) => s + effectiveScoreAdd);

      setStreak((st) => {
        const ns = st + 1;
        setBestStreak((bs) => Math.max(bs, ns));
        const milestone = comboMilestoneFor(ns);
        if (milestone) {
          awardCoins(milestone.coins);
          setComboFunPop({
            icon: milestone.icon,
            title: milestone.title,
            streak: ns,
            coins: milestone.coins,
          });
          playBeep("combo_up", audioOn, fxVolume);
          vibrate([12, 10, 14]);
        }
        return ns;
      });

      awardXp((10 + Math.min(8, streak)) * (isBossNow || isWorldBossNow ? 3 : 1) * rewardBoost);

      if (!fastMode) {
        setExplain(q.explain(choice));
        setShowExplain(true);
        setShowMethod(false);
      } else {
        setShowExplain(false);
      }

      updateRecordIfNeeded(score + effectiveScoreAdd);
    } else {
      setStatus("bad");
      playBeep("bad", audioOn);
      vibrate([70, 36, 90]);
      triggerFx("bad");
      setErrorShakeFx(true);

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
      if (isCorrect) {
        const nextBossRemaining = Math.max(0, bossRemaining - 20);
        playBeep("boss_hit", audioOn);
        setBossHitFx(true);
        setBossImpactRingFx(true);
        setBossCalloutText(nextBossRemaining <= 30 ? "CRITIQUE" : "BOSS HIT");
        setBossRemaining((n) => Math.max(0, n - 20));
      } else {
        playBeep("boss_attack", audioOn);
        setBossAttackFx(true);
        setBossAttackFlashFx(true);
        setBossCalloutText("BOSS ATTAQUE");
      }
      setBossTimeLeft(10);
    }

    checkAchievements({
      streak: nextStreak,
      totalRight: nextTotalRight,
      totalQuestions: nextTotalQuestions,
      totalAnswers: nextTotalAnswers,
      accuracy: nextAccuracy,
      rushBest: Math.max(rushBestScore, rushScore + (isCorrect ? rushScoreAdd : 0)),
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
    if (s?.premiumOnly && !isPremium) return;
    if (!canBuy(s.price)) return;
    setCoins((c) => c - s.price);
    setOwnedSkins((list) => [...list, s.id]);
    setSkinId(s.id);
  }
  function buyAvatar(a) {
    if (ownedAvatars.includes(a.id)) return;
    if (a?.premiumOnly && !isPremium) return;
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

  function switchWorld(worldId, opts = null) {
    const nextWorld = WORLDS.find((w) => w.id === worldId);
    if (!nextWorld || nextWorld.id === selectedWorldId) return;
    const intense = !!opts?.intense;
    const afterRoute = opts?.afterRoute || null;

    const nextGradeId = nextWorld.gradeId;
    const fromWorld = WORLDS.find((w) => w.id === selectedWorldId) ?? currentWorld;

    if (worldTransitionTimerRef.current) clearTimeout(worldTransitionTimerRef.current);
    worldTransitionLockRef.current = true;
    setWorldTransitionFx({
      from: fromWorld,
      to: nextWorld,
      gradeId: nextGradeId,
      intense,
    });

    setSelectedWorldId(nextWorld.id);
    setGradeId(nextGradeId);

    setHintLevel(0);
    setHintMsg("");
    setShowExplain(false);
    setExplain("");
    setShowMethod(false);
    setPicked(null);
    setStatus("idle");
    setRushOn(false);
    setStudy5On(false);
    setBossActive(false);
    setBossRemaining(0);
    setBossTimeLeft(0);
    setWorldBossActive(false);
    setWorldBossRemaining(0);
    setAdaptiveAction(null);
    setSessionChallengePop(null);
    setBossHitFx(false);
    setBossAttackFx(false);

    playBeep(intense ? "portal" : "world", audioOn, fxVolume);
    vibrate(intense ? [16, 30, 40, 24, 56] : [10, 16, 24]);

    const fxMs = reduceMotion ? 240 : intense ? 980 : 680;
    worldTransitionTimerRef.current = setTimeout(() => {
      setWorldTransitionFx(null);
      worldTransitionLockRef.current = false;
      newQuestion(true, nextGradeId);
      if (afterRoute) navigateMobile(afterRoute);
    }, fxMs);
  }

  function startMobileWorldAdventure() {
    const target = WORLDS.find((w) => w.id === mobileEntryWorldId)?.id ?? selectedWorldId;
    if (!target) return;
    if (target === selectedWorldId) {
      navigateMobile("classic-play");
      return;
    }
    switchWorld(target, { intense: true, afterRoute: "classic-play" });
  }

  function navigateMobile(route) {
    setShowMobileEntryMenu(false);
    setMobileRoute(route);
    if (isMobileViewport) {
      return;
    }
    if (route === "classic-play" || route === "arena" || route === "rush") {
      setScreen(route);
      return;
    }
    setScreen("classic");
  }

  function openMobileEntryMenu() {
    if (!isMobileViewport) return;
    setShowMobileEntryMenu(true);
  }

  function openShopPanel() {
    if (isMobileViewport) {
      navigateMobile("shop");
      return;
    }
    setShowShop(true);
  }

  function closeShopPanel() {
    if (isMobileViewport) {
      if (mobileRoute === "shop") navigateMobile("classic-play");
      return;
    }
    setShowShop(false);
  }

  function openProfilePanel() {
    if (isMobileViewport) {
      navigateMobile("profile");
      return;
    }
    setShowProfile(true);
  }

  function closeProfilePanel() {
    if (isMobileViewport) {
      if (mobileRoute === "profile") navigateMobile("classic-play");
      return;
    }
    setShowProfile(false);
  }

  function openSettingsPanel() {
    if (isMobileViewport) {
      navigateMobile("settings");
      return;
    }
    setShowSettings(true);
  }

  function closeSettingsPanel() {
    if (isMobileViewport) {
      if (mobileRoute === "settings") navigateMobile("classic-play");
      return;
    }
    setShowSettings(false);
  }

  const bestScore = getBestScoreFor(modeId, gradeId, diffId);
  const study5Accuracy = study5Answered ? Math.round((study5Right / study5Answered) * 100) : 0;

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
      icon: ch.icon ?? "",
      title: `Défi ${isDaily ? "journalier" : "hebdo"} complété`,
      desc: `${ch.title} | +${ch.rewardCoins} pièces | +${ch.rewardXp} XP`,
      reward: ch.rewardCoins,
    });

    setChallengeProgress((prev) => {
      if (!prev) return prev;
      if (isDaily) return { ...prev, claimedDaily: true };
      return { ...prev, claimedWeekly: true };
    });
  }

  function claimCollegeArenaReward() {
    const today = parisDayKey();
    const arena = collegeArena?.dayKey === today ? collegeArena : { dayKey: today, hardRight: 0, claimed: false };
    if (arena.claimed || arena.hardRight < 12 || !isCollegeGrade(gradeId)) return;
    awardCoins(90);
    awardXp(120);
    setCollegeArena({ ...arena, claimed: true });
    showBadgePopup({
      icon: "\uD83C\uDFC6",
      title: "Défi collège complété",
      desc: "12 bonnes réponses en difficile | +90 pièces | +120 XP",
      reward: 90,
    });
  }

  const accuracy = useMemo(() => {
    const total = totalRight + totalWrong;
    if (!total) return 0;
    return Math.round((totalRight / total) * 100);
  }, [totalRight, totalWrong]);
  const premiumLabel = premiumPlan === "lifetime" ? "À vie" : premiumPlan === "monthly" ? "Mensuel" : "Gratuit";
  const isCollegeNow = isCollegeGrade(gradeId);
  const collegeArenaToday = useMemo(() => {
    const today = parisDayKey();
    if (collegeArena?.dayKey === today) return collegeArena;
    return { dayKey: today, hardRight: 0, claimed: false };
  }, [collegeArena]);
  const collegeArenaTarget = 12;
  const collegeArenaDone = collegeArenaToday.hardRight >= collegeArenaTarget;
  const collegeArenaPct = Math.round((Math.min(collegeArenaToday.hardRight, collegeArenaTarget) / collegeArenaTarget) * 100);
  const leagueTier = useMemo(() => leagueTierFromPoints(league?.points ?? 0), [league?.points]);
  const seasonDaysLeft = useMemo(() => {
    const now = Date.now();
    const start = league?.seasonStartTs ?? now;
    const left = Math.ceil((30 * 24 * 3600 * 1000 - (now - start)) / (24 * 3600 * 1000));
    return Math.max(0, left);
  }, [league?.seasonStartTs, questionIndex]);
  const xpBoostActive = Date.now() < (xpBoostUntilTs ?? 0);
  const xpBoostMinutesLeft = xpBoostActive ? Math.max(1, Math.ceil((xpBoostUntilTs - Date.now()) / 60000)) : 0;
  const localCompetition = useMemo(() => {
    const idx = getUsersIndex();
    const keys = Object.keys(idx?.users ?? {});
    const rows = keys
      .map((pseudoKey) => {
        const save = safeLSGet(userKey(pseudoKey), null);
        if (!save) return null;
        const right = save?.totalRight ?? 0;
        const wrong = save?.totalWrong ?? 0;
        const total = right + wrong;
        const accuracyRow = total ? Math.round((right / total) * 100) : 0;
        return {
          pseudoKey,
          pseudoDisplay: idx?.users?.[pseudoKey]?.pseudoDisplay ?? pseudoKey,
          points: save?.league?.points ?? 0,
          accuracy: accuracyRow,
          bestStreak: save?.bestStreak ?? 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.points - a.points || b.accuracy - a.accuracy || b.bestStreak - a.bestStreak)
      .slice(0, 20);
    const myRank = rows.findIndex((r) => r.pseudoKey === authUser?.pseudoKey) + 1;
    return { rows, myRank };
  }, [authUser?.pseudoKey, questionIndex, totalRight, totalWrong, bestStreak, league?.points]);

  const activityDays = useMemo(() => {
    const base = new Date();
    const arr = [];
    const span = activitySpan === 30 ? 30 : 7;
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const key = parisDayKey(d);
      const count = Number(activityMap?.[key] ?? 0);
      const day = d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2);
      const dayNum = d.toLocaleDateString("fr-FR", { day: "2-digit" });
      arr.push({ key, count, day, dayNum });
    }
    return arr;
  }, [activityMap, activitySpan]);
  const playedDays = useMemo(() => activityDays.filter((d) => d.count > 0).length, [activityDays]);
  const visualStreak = useMemo(() => {
    let st = 0;
    for (let i = activityDays.length - 1; i >= 0; i--) {
      if (activityDays[i].count > 0) st += 1;
      else break;
    }
    return st;
  }, [activityDays]);

  const rushDanger = rushOn && rushTimeLeft <= 10000;
  const rushMultNow = rushOn ? getRushMultiplier(rushCombo) : 1;
  const arenaMultNow = arenaOn && !rushOn ? arenaComboMultiplier(streak + 1) : 1;
  const bossHpPct = clamp(bossRemaining, 0, 100);
  const chestTypeCounts = useMemo(() => {
    const base = { common: 0, rare: 0, epic: 0, legendary: 0 };
    for (const t of chestQueue ?? []) {
      if (base[t] !== undefined) base[t] += 1;
    }
    return base;
  }, [chestQueue]);

  const xpPct = Math.round((xp / xpNeed) * 100);

  const unlockedCount = useMemo(() => ACHIEVEMENTS.filter((a) => isUnlocked(a.id)).length, [achievements]);

  const disableChoices = isLocked || showExplain;
  const hintList = useMemo(() => buildHints(q, gradeId), [q, gradeId]);
  const methodSteps = useMemo(() => buildMethodSteps(q, gradeId), [q, gradeId]);
  const visibleHints = hintList.slice(0, hintLevel);
  const canAskHint = !disableChoices && hintLevel < hintList.length;

  const FLOATERS = useMemo(
    () => ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "+", "-", "x", "/", "=", "<", ">", "S", "pi", "%", "AB", "*"],
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
      rewardText = `+${reward.coins} pièces`;
    } else {
      if (!nextOwnedAv.includes(reward.avatarId)) nextOwnedAv.push(reward.avatarId);
      rewardText = `NOUVEL AVATAR : ${
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
    vibrate([14, 16, 20]);
  }

  /* ------------------------ Auth actions ------------------------ */
  async function doRegister() {
    setAuthMsg("");
    const pseudoDisplay = safeName(authPseudo);
    const pseudoKey = normalizePseudo(authPseudo);
    const pass = String(authPass || "");

    if (pseudoKey.length < 3) return setAuthMsg("Pseudo trop court (min 3).");
    if (pass.length < 4) return setAuthMsg("Mot de passe trop court (min 4).");
    const starterSave = {
      skinId: "neon-night",
      selectedWorldId: "ce1",
      worldProgress: defaultWorldProgress(),
      gradeId: "CE1",
      diffId: "moyen",
      modeId: "add",
      coins: 120,
      avatarId: "owl",
      ownedSkins: ["neon-night"],
      ownedAvatars: ["owl"],
      cosmeticDust: 0,
      level: 1,
      xp: 0,
      records: {},
      bestStreak: 0,
      totalRight: 0,
      totalWrong: 0,
      totalQuestions: 0,
      audioOn: true,
      fxVolume: 0.8,
      vibrateOn: true,
      autoNextOn: false,
      autoNextMs: 1800,
      arenaOn: true,
      adaptiveOn: true,
      noPenaltyOnWrong: false,
      reduceMotion: false,
      achievements: {},
      lastLoginDayKey: null,
      loginStreak: 0,
      activityMap: {},
      rushBest: 0,
      rushLeague: "bronze",
      rushBestScore: 0,
      rushLeaderboard: [],
      ownedEffects: ["default"],
      answerEffectId: "default",
      chestProgress: 0,
      chestPending: 0,
      chestQueue: [],
      xpBoostUntilTs: 0,
      premiumPlan: "free",
      premiumSinceTs: 0,
      adDayKey: parisDayKey(),
      adTodayCount: 0,
      adUsageByKind: emptyAdUsageByKind(),
      adCooldownUntilTs: 0,
      rushDayKey: parisDayKey(),
      rushTodayCount: 0,
      adSurvivalLives: 0,
      league: freshSeasonState(),
      challengeProgress: createChallengeProgress(null),
      collegeArena: { dayKey: parisDayKey(), hardRight: 0, claimed: false },
      study5LastSummary: makeEmptyStudy5Summary(),
      updatedAt: new Date().toISOString(),
    };

    if (cloudEnabled) {
      const signUp = await cloudAuthSignUp(pseudoKey, pass, pseudoDisplay);
      if (!signUp?.ok) return setAuthMsg(`Inscription cloud impossible: ${signUp?.error ?? "erreur"}`);
      let accessToken = signUp?.data?.access_token ?? null;
      let refreshToken = signUp?.data?.refresh_token ?? null;
      if (!accessToken) {
        const signIn = await cloudAuthSignIn(pseudoKey, pass);
        if (!signIn?.ok) return setAuthMsg("Compte créé, mais connexion cloud impossible.");
        accessToken = signIn?.data?.access_token ?? null;
        refreshToken = signIn?.data?.refresh_token ?? null;
      }
      safeLSSet(userKey(pseudoKey), starterSave);
      await cloudPushUserSave(pseudoKey, pseudoDisplay, starterSave, accessToken);
      await cloudLogEvent({ pseudoKey, event: "register", payload: {}, accessToken });
      const au = { pseudoDisplay, pseudoKey, accessToken, refreshToken, authProvider: "supabase" };
      safeLSSet("math-adventure-auth", au);
      setAuthUser(au);
      window.location.reload();
      return;
    }

    if (!crypto?.subtle) return setAuthMsg("Ton navigateur ne supporte pas crypto.subtle.");
    const idx = getUsersIndex();
    if (idx.users?.[pseudoKey]) return setAuthMsg("Pseudo déjà pris.");
    const hash = await sha256Hex(pass);
    const recoveryCode = `${randInt(100000, 999999)}-${randInt(100000, 999999)}`;
    const nextIdx = {
      ...idx,
      users: {
        ...(idx.users ?? {}),
        [pseudoKey]: { pseudoDisplay, passHash: hash, recoveryCode, createdAt: new Date().toISOString() },
      },
    };
    setUsersIndex(nextIdx);
    safeLSSet(userKey(pseudoKey), starterSave);
    alert(`IMPORTANT : garde ce code de récupération (si tu oublies ton mot de passe) :\n\n${recoveryCode}\n\nNote-le quelque part ?`);
    const au = { pseudoDisplay, pseudoKey, authProvider: "local" };
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
    if (cloudEnabled) {
      const signIn = await cloudAuthSignIn(pseudoKey, pass);
      if (!signIn?.ok) return setAuthMsg("Identifiants cloud invalides.");
      const accessToken = signIn?.data?.access_token ?? null;
      const refreshToken = signIn?.data?.refresh_token ?? null;
      const cloudName = signIn?.data?.user?.user_metadata?.pseudo_display || pseudoDisplay || pseudoKey;
      const au = { pseudoDisplay: cloudName, pseudoKey, accessToken, refreshToken, authProvider: "supabase" };
      await cloudLogEvent({ pseudoKey, event: "login_success", payload: {}, accessToken });
      safeLSSet("math-adventure-auth", au);
      setAuthUser(au);
      window.location.reload();
      return;
    }

    if (!crypto?.subtle) return setAuthMsg("Ton navigateur ne supporte pas crypto.subtle.");
    const idx = getUsersIndex();
    const user = idx.users?.[pseudoKey];
    if (!user) return setAuthMsg("Utilisateur introuvable.");
    const hash = await sha256Hex(pass);
    if (hash !== user.passHash) return setAuthMsg("Mot de passe incorrect.");
    const au = { pseudoDisplay: user.pseudoDisplay || pseudoDisplay, pseudoKey, authProvider: "local" };
    safeLSSet("math-adventure-auth", au);
    setAuthUser(au);
    window.location.reload();
  }

  async function doLogout() {
    if (cloudEnabled && authUser?.accessToken) {
      await cloudAuthSignOut(authUser.accessToken);
    }
    safeLSSet("math-adventure-auth", null);
    setAuthUser(null);
    window.location.reload();
  }

  // Reset password via recovery code (login screen)
  async function resetPasswordWithRecovery() {
    setPwMsg("");
    if (cloudEnabled) {
      const loginOrEmail = String(pwTargetPseudo || "").trim();
      if (!loginOrEmail) return setPwMsg("Pseudo ou email manquant.");
      const redirectTo = `${window.location.origin}/`;
      const sent = await cloudAuthSendPasswordReset(loginOrEmail, redirectTo);
      if (!sent?.ok) return setPwMsg("Impossible d'envoyer l'email de réinitialisation.");
      setPwTargetPseudo("");
      setPwMsg("Email de réinitialisation envoyé. Vérifie ta boîte mail.");
      return;
    }
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
    setPwMsg("Mot de passe réinitialisé. Tu peux te connecter.");
    setAuthMode("login");
    setPwMode("none");
  }

  // Change password (logged in)
  async function changePasswordLoggedIn() {
    setPwChangeMsg("");
    if (!authUser?.pseudoKey) return;
    if (cloudEnabled && authUser?.accessToken) {
      const next = String(pwChangeNew || "");
      const next2 = String(pwChangeNew2 || "");
      if (next.length < 4) return setPwChangeMsg("Nouveau mot de passe trop court (min 4).");
      if (next !== next2) return setPwChangeMsg("Confirmation différente.");
      const upd = await cloudAuthUpdatePassword(authUser.accessToken, next);
      if (!upd?.ok) return setPwChangeMsg("Impossible de changer le mot de passe cloud.");
      setPwCurrent("");
      setPwChangeNew("");
      setPwChangeNew2("");
      setPwChangeMsg("Mot de passe cloud mis a jour.");
      return;
    }
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
    setPwChangeMsg("Mot de passe mis a jour.");
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

  useEffect(() => {
    if (!comboFunPop) return;
    const t = setTimeout(() => setComboFunPop(null), 2400);
    return () => clearTimeout(t);
  }, [comboFunPop]);

  useEffect(() => {
    if (!sessionChallengePop) return;
    const t = setTimeout(() => setSessionChallengePop(null), 3800);
    return () => clearTimeout(t);
  }, [sessionChallengePop]);

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= 820);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !isMobileViewport) {
      setShowMobileBootSplash(false);
      setShowMobileEntryMenu(false);
      return undefined;
    }
    setShowMobileBootSplash(true);
    setShowMobileEntryMenu(false);
    const t = setTimeout(() => {
      setShowMobileBootSplash(false);
      setShowMobileEntryMenu(true);
    }, reduceMotion ? 250 : 1100);
    return () => clearTimeout(t);
  }, [isLoggedIn, isMobileViewport, reduceMotion]);

  useEffect(() => {
    if (!showMobileEntryMenu) return;
    setMobileEntryWorldId(selectedWorldId);
  }, [showMobileEntryMenu, selectedWorldId]);

  /* ------------------------ Not logged in screen ------------------------ */
  if (!isLoggedIn) {
    return (
      <div className="shell authShell">
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

        <section className="card smooth authHero">
          <div className="authHeroCopy">
            <span className="landingBadge">Math Royale</span>
            <div className="h1 authHeroTitle">Reconnecte-toi et reprends ton aventure.</div>
            <div className="sub authHeroLead">Un acces simple a ton profil, tes mondes et tes progres.</div>
          </div>
          <div className="authHeroStats">
            <span className="pill">Connexion rapide</span>
            <span className="pill">Progression sauvegardee</span>
            <span className="pill">Retour immediat au jeu</span>
          </div>
        </section>

        <div className="grid authGrid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="card smooth authPanel">
            <div className="cardTitle">
              <span>{authMode === "login" ? "Connexion" : "Inscription"}</span>
              <span className="pill">{authMode === "login" ? "retour au profil" : "creation rapide"}</span>
            </div>

            <div className="authForm">
              <div className="toast authIntro" style={{ marginTop: 0 }}>
                <div>
                  <strong>{authMode === "login" ? "Entre dans ton espace" : "Cree ton profil joueur"}</strong>
                  <div className="sub" style={{ marginTop: 6 }}>
                    {authMode === "login"
                      ? "Saisis ton pseudo et ton mot de passe pour reprendre exactement la ou tu t'es arrete."
                      : "Choisis un pseudo simple et un mot de passe facile a retenir."}
                  </div>
                </div>
                <span className="pill">{authMode === "login" ? "profil" : "nouveau joueur"}</span>
              </div>

              <input className="input smooth" placeholder="Ton pseudo (ex: Emma)" value={authPseudo} onChange={(e) => setAuthPseudo(e.target.value)} />
              <input
                className="input smooth"
                placeholder={authMode === "login" ? "Ton mot de passe" : "Choisis un mot de passe (4 caracteres min.)"}
                type="password"
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
              />

              {authMsg && <div className="authMsg">{authMsg}</div>}

              <div className="authActions">
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
                  {authMode === "login" ? "Je crée mon compte" : "J'ai déjà un compte"}
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
                  {cloudEnabled ? (
                    <>
                      <div className="toast" style={{ marginTop: 0 }}>
                        <div>
                          <strong>Réinitialiser via email</strong>
                          <div className="sub" style={{ marginTop: 6 }}>
                            Entre ton pseudo ou ton email. On t'envoie un lien de réinitialisation.
                          </div>
                        </div>
                        <span className="pill">cloud</span>
                      </div>

                      <input
                        className="input smooth"
                        placeholder="Pseudo ou email"
                        value={pwTargetPseudo}
                        onChange={(e) => setPwTargetPseudo(e.target.value)}
                      />

                      {pwMsg && <div className={/envoye|reinitialis/i.test(pwMsg) ? "authMsg authMsgOk" : "authMsg"}>{pwMsg}</div>}

                      <button className="btn btnPrimary smooth hover-lift press" onClick={resetPasswordWithRecovery}>
                        Envoyer l'email de réinitialisation
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="toast" style={{ marginTop: 0 }}>
                        <div>
                          <strong>Réinitialiser (local uniquement)</strong>
                          <div className="sub" style={{ marginTop: 6 }}>
                            Utilise ton <b>code de récupération</b> (donné à l'inscription).
                          </div>
                        </div>
                        <span className="pill">recovery</span>
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

                      {pwMsg && <div className={/envoye|reinitialis/i.test(pwMsg) ? "authMsg authMsgOk" : "authMsg"}>{pwMsg}</div>}

                      <button className="btn btnPrimary smooth hover-lift press" onClick={resetPasswordWithRecovery}>
                        Réinitialiser
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="small">En mode local, tes donnees restent sur cet appareil.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isMobileViewport && showMobileBootSplash) {
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
        <div className="mobileBootSplash" role="status" aria-live="polite">
          <div className="mobileBootSplashCard smooth">
            <div className="logo smooth" />
            <div className="mobileBootSplashTitle">Math Royale</div>
            <div className="small">Chargement du hub mobile...</div>
            <div className="mobileBootSplashBar">
              <div className="mobileBootSplashFill" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isMobileViewport && showMobileEntryMenu) {
    return (
      <div className="shell mobileArcadeEntry">
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
        <div className="mobileEntryFx" aria-hidden="true">
          {["+", "-", "x", "/", "=", "\u03A3", "\u221A", "\u03C0", "%", "1", "2", "3"].map((symbol, idx) => (
            <span key={`${symbol}-${idx}`} style={{ "--i": idx }}>
              {symbol}
            </span>
          ))}
        </div>
        <section className="mobileEntryCard smooth">
          <div className="mobileEntryTitle">Math Royale</div>
          <div className="mobileEntryLead">Choisis ton accès rapide, puis ton monde pour démarrer.</div>
          <div className="mobileEntryActions">
            <button className="btn btnPrimary smooth hover-lift press mobileEntryBtn" onClick={startMobileWorldAdventure}>
              Jouer maintenant
            </button>
            <button className="btn smooth hover-lift press mobileEntryBtn" onClick={() => navigateMobile("settings")}>
              Réglages
            </button>
            <button className="btn smooth hover-lift press mobileEntryBtn" onClick={() => navigateMobile("profile")}>
              Stats
            </button>
          </div>
          <div className="mobileEntryWorldPicker">
            <div className="mobileEntryWorldTitle">Choix du monde</div>
            <div className="mobileEntryWorldGrid">
              {WORLDS.map((w) => {
                const active = mobileEntryWorldId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    className={`mobileEntryWorldChip smooth press ${active ? "isActive" : ""}`}
                    onClick={() => setMobileEntryWorldId(w.id)}
                  >
                    <span className="mobileEntryWorldChipIcon">{w.icon}</span>
                    <span className="mobileEntryWorldChipLabel">{w.gradeId}</span>
                  </button>
                );
              })}
            </div>
            <button className="btn btnPrimary smooth hover-lift press mobileEntryStartBtn" onClick={startMobileWorldAdventure}>
              Démarrer l'aventure
            </button>
          </div>
        </section>
      </div>
    );
  }

  const questionCardProps = {
    status,
    fx,
    spark,
    compact: isMobileViewport,
    modeId,
    setModeId,
    selectedWorldId,
    onSelectWorld: switchWorld,
    worlds: WORLDS,
    worldLevel,
    worldBossReady,
    worldBossDone,
    diffId,
    setDiffId,
    DIFFS,
    MODES,
    resetSession,
    adaptiveOn,
    xpPct,
    worldProgressCurrent,
    worldStepTarget: WORLD_STEP_CORRECT,
    sessionAnswered,
    sessionChallenge,
    sessionChallengeProgress,
    sessionChallengeDone,
    lastAnswers,
    q,
    streak,
    accuracy,
    hintLevel,
    hintList,
    canAskHint,
    getHintCost,
    useHint,
    hintMsg,
    visibleHints,
    picked,
    showExplain,
    submit,
    disableChoices,
    goNext,
    explain,
    methodSteps,
    showMethod,
    setShowMethod,
    rushOn,
    rushTimeLeft,
    rushDanger,
    rushMultNow,
    rushFeedback,
    arenaOn,
    arenaMultNow,
    bossActive,
    bossTimeLeft,
    bossRemaining,
    bossHpPct,
    bossProfile,
    bossHitFx,
    bossAttackFx,
    bossImpactRingFx,
    bossAttackFlashFx,
    bossCalloutText,
    errorShakeFx,
    answerEffectId,
    chestProgress,
  };

  const mobileGameTopBarProps = {
    authUser,
    avatar,
    coins,
    level,
    xp,
    xpNeed,
    questionIndex,
    bestScore,
    unlockedCount,
    achievementsCount: ACHIEVEMENTS.length,
    loginStreak,
    profileRank,
    onOpenSettings: openSettingsPanel,
    onOpenProfile: openProfilePanel,
    onOpenShop: openShopPanel,
    canInstallApp: !isInstalledPwa && !!installPromptEvent,
    onInstallApp: installPwaApp,
    onLogout: doLogout,
  };

  function openArenaScreen() {
    setArenaOn(true);
    if (isMobileViewport) {
      navigateMobile("arena");
      return;
    }
    setScreen("arena");
  }

  if (isMobileViewport && mobileRoute === "rush") {
    return (
      <MobileGameShell
        floaters={FLOATERS}
        topBarProps={mobileGameTopBarProps}
        activeRoute={mobileRoute}
        onGoHome={openMobileEntryMenu}
        onGoPlay={() => navigateMobile("classic-play")}
        onGoRush={() => navigateMobile("rush")}
        onGoArena={openArenaScreen}
        onOpenShop={openShopPanel}
        onOpenProfile={openProfilePanel}
      >
        <RushScreen
          onExit={() => {
            openMobileEntryMenu();
          }}
          gradeId={gradeId}
          diffId={diffId}
          modeId={modeId}
          setModeId={setModeId}
          setGradeId={setGradeId}
          setDiffId={setDiffId}
          audioOn={audioOn}
          fxVolume={fxVolume}
          vibrateOn={vibrateOn}
          reduceMotion={reduceMotion}
          setCoins={setCoins}
          setOwnedSkins={setOwnedSkins}
          setOwnedAvatars={setOwnedAvatars}
          ownedSkins={ownedSkins}
          ownedAvatars={ownedAvatars}
          makeQuestionFn={(m, g, d, h) => makeQuestion(m, g, d, h)}
          embedded
        />
      </MobileGameShell>
    );
  }

  if (screen === "rush") {
    return (
      <RushScreen
        onExit={() => setScreen("classic")}
        gradeId={gradeId}
        diffId={diffId}
        modeId={modeId}
        setModeId={setModeId}
        setGradeId={setGradeId}
        setDiffId={setDiffId}
        audioOn={audioOn}
        fxVolume={fxVolume}
        vibrateOn={vibrateOn}
        reduceMotion={reduceMotion}
        setCoins={setCoins}
        setOwnedSkins={setOwnedSkins}
        setOwnedAvatars={setOwnedAvatars}
        ownedSkins={ownedSkins}
        ownedAvatars={ownedAvatars}
        makeQuestionFn={(m, g, d, h) => makeQuestion(m, g, d, h)}
      />
    );
  }

  if (isMobileViewport && mobileRoute === "classic-play") {
    return (
      <MobileGameShell
        floaters={FLOATERS}
        topBarProps={mobileGameTopBarProps}
        activeRoute={mobileRoute}
        onGoHome={openMobileEntryMenu}
        onGoPlay={() => navigateMobile("classic-play")}
        onGoRush={() => navigateMobile("rush")}
        onGoArena={openArenaScreen}
        onOpenShop={openShopPanel}
        onOpenProfile={openProfilePanel}
      >
        <ClassicPlayScreen
          onBack={() => {
            openMobileEntryMenu();
          }}
          onOpenArena={openArenaScreen}
          onOpenRush={() => navigateMobile("rush")}
          questionCardProps={questionCardProps}
        />
      </MobileGameShell>
    );
  }

  if (isMobileViewport && mobileRoute === "arena") {
    return (
      <MobileGameShell
        floaters={FLOATERS}
        topBarProps={mobileGameTopBarProps}
        activeRoute={mobileRoute}
        onGoHome={openMobileEntryMenu}
        onGoPlay={() => navigateMobile("classic-play")}
        onGoRush={() => navigateMobile("rush")}
        onGoArena={openArenaScreen}
        onOpenShop={openShopPanel}
        onOpenProfile={openProfilePanel}
      >
        <ArenaScreen
          onBack={() => {
            openMobileEntryMenu();
          }}
          onOpenRush={() => navigateMobile("rush")}
          questionCardProps={questionCardProps}
        />
      </MobileGameShell>
    );
  }

  const useMobilePages = isMobileViewport;
  const activeMobilePage = useMobilePages ? mobileRoute : "home";
  const { mobileHomeProps, mobileShopProps, mobileProfileProps, mobileSettingsProps } = buildMobileViewProps({
    activeMobilePage,
    navigateMobile,
    openArenaScreen,
    openShopPanel,
    openProfilePanel,
    openSettingsPanel,
    closeShopPanel,
    closeProfilePanel,
    closeSettingsPanel,
    installPromptEvent,
    isInstalledPwa,
    installPwaApp,
    startStudy5,
    openChest,
    worlds: WORLDS,
    selectedWorldId,
    onSelectWorld: switchWorld,
    shopTab,
    setShopTab,
    profileTab,
    setProfileTab,
    coins,
    SKINS,
    AVATARS,
    ownedSkins,
    skinId,
    canBuy,
    buySkin,
    equipSkin,
    ownedAvatars,
    avatarId,
    buyAvatar,
    equipAvatar,
    isPremium,
    cosmeticDust,
    authUser,
    level,
    loginStreak,
    totalRight,
    totalWrong,
    accuracy,
    totalQuestions,
    bestStreak,
    GRADES,
    DIFFS,
    MODES,
    records,
    unlockedCount,
    ACHIEVEMENTS,
    isUnlocked,
    achievements,
    answerEffects: ANSWER_EFFECTS,
    ownedEffects,
    answerEffectId,
    unlockEffectWithDust,
    audioOn,
    setAudioOn,
    fxVolume,
    setFxVolume,
    vibrateOn,
    setVibrateOn,
    autoNextOn,
    setAutoNextOn,
    autoNextMs,
    setAutoNextMs,
    reduceMotion,
    setReduceMotion,
    skinAnimated: skin.animated,
    adaptiveOn,
    setAdaptiveOn,
    noPenaltyOnWrong,
    setNoPenaltyOnWrong,
    pwCurrent,
    setPwCurrent,
    pwChangeNew,
    setPwChangeNew,
    pwChangeNew2,
    setPwChangeNew2,
    pwChangeMsg,
    changePasswordLoggedIn,
    avatar,
    profileRank,
    xpLabel: `${xp}/${xpNeed}`,
    streak,
    currentWorld,
    worldLevel,
    worldBossReady,
    worldBossDone,
    chestPending,
    chestProgress,
    dailyChallenge,
    dailyProgress,
  });

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

      <AppOverlays
        loginRewardPop={loginRewardPop}
        onCloseLoginReward={() => setLoginRewardPop(null)}
        levelPop={levelPop}
        onCloseLevelPop={() => setLevelPop(null)}
        coachPop={coachPop}
        onCloseCoachPop={() => setCoachPop(null)}
        adSim={adSim}
        isPremium={isPremium}
        onSkipOptionalAd={skipOptionalAd}
        badgePop={badgePop}
        onCloseBadgePop={() => setBadgePop(null)}
        chestPop={chestPop}
        onCloseChestPop={() => setChestPop(null)}
        onEquipChestReward={equipChestReward}
        comboFunPop={comboFunPop}
        onCloseComboFunPop={() => setComboFunPop(null)}
        sessionChallengePop={sessionChallengePop}
        onCloseSessionChallengePop={() => setSessionChallengePop(null)}
        worldTransitionFx={worldTransitionFx}
        onCloseWorldTransition={() => setWorldTransitionFx(null)}
      />

      {useMobilePages ? (
        <MobileAppView
          topBarProps={mobileGameTopBarProps}
          mobileRoute={mobileRoute}
          onNavigateHome={openMobileEntryMenu}
          onNavigatePlay={() => navigateMobile("classic-play")}
          onNavigateRush={() => navigateMobile("rush")}
          onOpenArena={openArenaScreen}
          onOpenShop={openShopPanel}
          onOpenProfile={openProfilePanel}
          onOpenSettings={openSettingsPanel}
          homeProps={mobileHomeProps}
          shopProps={mobileShopProps}
          profileProps={mobileProfileProps}
          settingsProps={mobileSettingsProps}
        />
      ) : (
        <>
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
            onOpenSettings={openSettingsPanel}
            onOpenProfile={openProfilePanel}
            onOpenShop={openShopPanel}
            canInstallApp={!isInstalledPwa && !!installPromptEvent}
            onInstallApp={installPwaApp}
            onLogout={doLogout}
          />

          {activeMobilePage === "home" && (
            <>
              <div className="mobileHeroStrip">
                <button className="btn btnPrimary smooth hover-lift press" onClick={() => setScreen("rush")}>
                  Rush 60s
                </button>
                <button className="btn smooth hover-lift press" onClick={openShopPanel}>
                  Boutique
                </button>
                <button className="btn smooth hover-lift press" onClick={openProfilePanel}>
                  Profil
                </button>
              </div>

              <div className="grid appFrame">
                <QuestionCard {...questionCardProps} />
                <div className="card smooth desktopSidePanel">
                  <div className="cardTitle">
                    <span>{currentWorld.name}</span>
                    <span className="pill">{worldBossDone ? "Badge acquis" : "Aventure"}</span>
                  </div>

                  <div className="toast worldStatusCard" style={{ marginTop: 12 }}>
                    <div style={{ width: "100%" }}>
                      <strong>Progression du monde</strong>
                      <div className="small" style={{ marginTop: 6 }}>
                        Niveau actuel: <b>{worldLevel}/30</b>
                        {!worldBossDone && worldLevel < 30 ? ` | ${currentWorldState.progress}/${WORLD_STEP_CORRECT} vers le prochain niveau` : ""}
                      </div>
                      <div className="small" style={{ marginTop: 6 }}>
                        Boss final: <b>{worldBossDone ? "Vaincu" : worldBossActive ? `En cours (${worldBossRemaining}/3)` : worldBossReady ? "Pret" : "Verrouille"}</b>
                      </div>
                      <div className="small" style={{ marginTop: 6 }}>
                        Badge special: <b>{currentWorldState.badgeWon ? currentWorld.badge : "Non debloque"}</b>
                      </div>
                      <div className="worldStatusActions" style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button className="btn btnPrimary smooth hover-lift press" onClick={startWorldBoss} disabled={!worldBossReady}>
                          Lancer boss final
                        </button>
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
                        localStorage.removeItem(userKey(authUser.pseudoKey));
                        window.location.reload();
                      }}
                    >
                      Réinitialiser le profil
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <Shop
            show={showShop}
            onClose={closeShopPanel}
            presentation="modal"
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
            isPremium={isPremium}
          />
          <Profile
            show={showProfile}
            onClose={closeProfilePanel}
            presentation="modal"
            profileTab={profileTab}
            setProfileTab={setProfileTab}
            coins={coins}
            cosmeticDust={cosmeticDust}
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
            SKINS={SKINS}
            AVATARS={AVATARS}
            answerEffects={ANSWER_EFFECTS}
            ownedSkins={ownedSkins}
            ownedAvatars={ownedAvatars}
            ownedEffects={ownedEffects}
            skinId={skinId}
            avatarId={avatarId}
            answerEffectId={answerEffectId}
            unlockEffectWithDust={unlockEffectWithDust}
          />
          <Settings
            show={showSettings}
            onClose={closeSettingsPanel}
            presentation="modal"
            audioOn={audioOn}
            setAudioOn={setAudioOn}
            fxVolume={fxVolume}
            setFxVolume={setFxVolume}
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
        </>
      )}
    </div>
  );
}























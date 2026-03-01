import { useMemo } from "react";

export function xpToNext(level) {
  return 120 + level * 35;
}

export function awardLevelCoins(levelGained) {
  return 25 + levelGained * 5;
}

export function dayKeyStamp(dayKey) {
  const [dd, mm, yyyy] = String(dayKey).split("/").map((x) => parseInt(x, 10));
  if (!dd || !mm || !yyyy) return 0;
  return new Date(yyyy, mm - 1, dd, 12, 0, 0).getTime();
}

export function rankForProfile(level) {
  if (level >= 18) return { icon: "👑", label: "Roi des Maths" };
  if (level >= 12) return { icon: "🧠", label: "Génie des fractions" };
  if (level >= 6) return { icon: "📐", label: "Stratège" };
  return { icon: "🧮", label: "Apprenti" };
}

export default function useGameLogic(level) {
  const profileRank = useMemo(() => rankForProfile(level), [level]);
  const xpNeed = useMemo(() => xpToNext(level), [level]);
  return { profileRank, xpNeed };
}

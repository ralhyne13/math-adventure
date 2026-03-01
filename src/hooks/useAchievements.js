import { useCallback } from "react";

export function formatDateFR(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR");
  } catch {
    return "";
  }
}

export default function useAchievements({ achievements, setAchievements, awardCoins, showBadgePopup }) {
  const isUnlocked = useCallback((achId) => !!achievements?.[achId]?.unlocked, [achievements]);

  const unlockAchievement = useCallback(
    (a) => {
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
    },
    [awardCoins, isUnlocked, setAchievements, showBadgePopup]
  );

  return { isUnlocked, unlockAchievement };
}

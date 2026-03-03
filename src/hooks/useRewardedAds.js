import { useEffect, useRef, useState } from "react";
import { parisDayKey } from "../storage";

export const OPTIONAL_AD_LIMITS = {
  total: 6,
  cooldownSec: 15,
  byKind: {
    instant_chest: 2,
    double_reward: 3,
    survival_life: 2,
  },
};

export function emptyAdUsageByKind() {
  return {
    instant_chest: 0,
    double_reward: 0,
    survival_life: 0,
  };
}

export function normalizeAdUsageByKind(raw) {
  return { ...emptyAdUsageByKind(), ...(raw ?? {}) };
}

export default function useRewardedAds({
  initial,
  isPremium,
  cloudEnabled,
  authUser,
  showCoachPopup,
  cloudLogEvent,
}) {
  const adRewardRef = useRef(null);

  const [adSim, setAdSim] = useState(null);
  const [adDayKey, setAdDayKey] = useState(initial?.adDayKey ?? parisDayKey());
  const [adTodayCount, setAdTodayCount] = useState(initial?.adTodayCount ?? 0);
  const [adUsageByKind, setAdUsageByKind] = useState(normalizeAdUsageByKind(initial?.adUsageByKind));
  const [adCooldownUntilTs, setAdCooldownUntilTs] = useState(initial?.adCooldownUntilTs ?? 0);
  const [adNowTs, setAdNowTs] = useState(Date.now());
  const [adSurvivalLives, setAdSurvivalLives] = useState(initial?.adSurvivalLives ?? 0);

  useEffect(() => {
    if (!adSim) return undefined;
    if ((adSim.secondsLeft ?? 0) <= 0) {
      const rewardFn = adRewardRef.current;
      adRewardRef.current = null;
      setAdSim(null);
      rewardFn?.();
      return undefined;
    }
    const id = setTimeout(() => {
      setAdSim((prev) => (prev ? { ...prev, secondsLeft: Math.max(0, (prev.secondsLeft ?? 0) - 1) } : null));
    }, 1000);
    return () => clearTimeout(id);
  }, [adSim]);

  useEffect(() => {
    if (adCooldownUntilTs <= Date.now()) return undefined;
    const id = setInterval(() => {
      setAdNowTs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [adCooldownUntilTs]);

  function logAdEvent(kind, payload = {}) {
    if (!cloudEnabled) return;
    cloudLogEvent({
      pseudoKey: authUser?.pseudoKey,
      event: "optional_ad_reward",
      payload: { kind, ...payload },
      accessToken: authUser?.accessToken,
    });
  }

  function consumeOptionalAdSlot() {
    const today = parisDayKey();
    const nextCount = adDayKey === today ? adTodayCount + 1 : 1;
    setAdDayKey(today);
    setAdTodayCount(nextCount);
    return nextCount;
  }

  function consumeOptionalAdKind(kind) {
    const today = parisDayKey();
    const base = adDayKey === today ? normalizeAdUsageByKind(adUsageByKind) : emptyAdUsageByKind();
    const next = { ...base, [kind]: (base[kind] ?? 0) + 1 };
    setAdUsageByKind(next);
    return next[kind];
  }

  function canStartOptionalAd(kind) {
    if (adCooldownUntilTs > Date.now()) {
      const left = Math.max(1, Math.ceil((adCooldownUntilTs - Date.now()) / 1000));
      showCoachPopup({
        title: "Cooldown pub",
        lines: [`Attends encore ${left}s avant une autre pub optionnelle.`],
        hint: "Le délai évite le spam de récompenses.",
      });
      return false;
    }
    const today = parisDayKey();
    const used = adDayKey === today ? adTodayCount : 0;
    if (!isPremium && used >= OPTIONAL_AD_LIMITS.total) {
      showCoachPopup({
        title: "Quota pub atteint",
        lines: [`Version gratuite : ${OPTIONAL_AD_LIMITS.total} pubs optionnelles par jour.`],
        hint: "Reviens demain ou passe Premium.",
      });
      return false;
    }
    const usedByKind = adDayKey === today ? normalizeAdUsageByKind(adUsageByKind)[kind] ?? 0 : 0;
    const kindLimit = OPTIONAL_AD_LIMITS.byKind[kind] ?? OPTIONAL_AD_LIMITS.total;
    if (!isPremium && usedByKind >= kindLimit) {
      showCoachPopup({
        title: "Quota type atteint",
        lines: [`Cette récompense est limitée à ${kindLimit} pubs par jour.`],
        hint: "Choisis un autre bonus ou reviens demain.",
      });
      return false;
    }
    return true;
  }

  function startSimulatedRewardedAd(kind, rewardFn, summary, meta = {}) {
    const usedAfterStart = meta.usedAfterStart ?? consumeOptionalAdSlot();
    const usedKindAfterStart = meta.usedKindAfterStart ?? consumeOptionalAdKind(kind);
    if (!meta.keepExistingRewardRef) adRewardRef.current = rewardFn;
    if (!meta.keepExistingCooldown) setAdCooldownUntilTs(Date.now() + OPTIONAL_AD_LIMITS.cooldownSec * 1000);
    setAdSim({
      kind,
      provider: "simulation_locale",
      title: summary?.title ?? "Publicité optionnelle",
      lines: summary?.lines ?? ["Lecture en cours..."],
      secondsLeft: 3,
      usedAfterStart,
      usedKindAfterStart,
      ...meta,
    });
  }

  function launchRewardedAd(kind, rewardFn, summary) {
    const externalShow = window?.MathRoyaleAds?.showRewarded;
    if (typeof externalShow === "function") {
      let usedAfterStart = null;
      let usedKindAfterStart = null;
      try {
        usedAfterStart = consumeOptionalAdSlot();
        usedKindAfterStart = consumeOptionalAdKind(kind);
        setAdCooldownUntilTs(Date.now() + OPTIONAL_AD_LIMITS.cooldownSec * 1000);
        adRewardRef.current = rewardFn;
        setAdSim({
          kind,
          provider: "regie_externe",
          title: "Connexion régie publicitaire",
          lines: ["Demande envoyée à la régie configurée.", "Bascule automatique si indisponible."],
          secondsLeft: 1,
          usedAfterStart,
          usedKindAfterStart,
        });
        Promise.resolve(externalShow({ placement: kind, app: "math-royale" }))
          .then((granted) => {
            const fn = adRewardRef.current;
            adRewardRef.current = null;
            setAdSim(null);
            if (granted === false) {
              showCoachPopup({
                title: "Pub ignorée",
                lines: ["Aucune récompense accordée."],
                hint: "Tu peux réessayer plus tard.",
              });
              return;
            }
            fn?.();
          })
          .catch(() => {
            startSimulatedRewardedAd(kind, rewardFn, summary, {
              provider: "simulation_locale",
              usedAfterStart,
              usedKindAfterStart,
              keepExistingRewardRef: true,
              keepExistingCooldown: true,
            });
          });
        return;
      } catch {
        startSimulatedRewardedAd(kind, rewardFn, summary, {
          provider: "simulation_locale",
          usedAfterStart: usedAfterStart ?? undefined,
          usedKindAfterStart: usedKindAfterStart ?? undefined,
          keepExistingRewardRef: usedAfterStart !== null,
          keepExistingCooldown: usedAfterStart !== null,
        });
        return;
      }
    }
    startSimulatedRewardedAd(kind, rewardFn, summary, { provider: "simulation_locale" });
  }

  function startOptionalAd(kind, rewardFn, summary) {
    if (adSim || !canStartOptionalAd(kind)) return;
    launchRewardedAd(kind, rewardFn, summary);
  }

  function skipOptionalAd() {
    if (!isPremium || !adSim) return;
    const rewardFn = adRewardRef.current;
    adRewardRef.current = null;
    setAdSim(null);
    rewardFn?.();
  }

  const adTodayUsed = adDayKey === parisDayKey() ? adTodayCount : 0;
  const adUsageToday = adDayKey === parisDayKey() ? normalizeAdUsageByKind(adUsageByKind) : emptyAdUsageByKind();
  const adCooldownLeftSec = Math.max(0, Math.ceil(((adCooldownUntilTs ?? 0) - adNowTs) / 1000));
  const adLocked = !!adSim || adCooldownLeftSec > 0;

  return {
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
  };
}

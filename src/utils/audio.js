function resolveVolume(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
}

export function playBeep(kind = "ok", enabled = true, volume = null) {
  if (!enabled) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const globalVolume =
      volume == null && typeof window !== "undefined" ? window.__mathFxVolume : volume;
    const volumeMul = resolveVolume(globalVolume ?? 1);

    const pulse = (type, startFreq, midFreq, endFreq, startAt, attack, release, gainPeak) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = type;
      o.frequency.setValueAtTime(startFreq, startAt);
      if (midFreq) o.frequency.exponentialRampToValueAtTime(midFreq, startAt + attack);
      o.frequency.exponentialRampToValueAtTime(endFreq, startAt + release);
      g.gain.setValueAtTime(0.001, startAt);
      g.gain.exponentialRampToValueAtTime(Math.max(0.001, gainPeak * volumeMul), startAt + attack);
      g.gain.exponentialRampToValueAtTime(0.001, startAt + release);
      o.start(startAt);
      o.stop(startAt + release + 0.02);
    };

    if (kind === "ok") {
      pulse("triangle", 620, 930, 1320, now, 0.03, 0.16, 0.24);
      pulse("sine", 780, 1180, 1560, now + 0.045, 0.02, 0.15, 0.16);
      pulse("sine", 460, 620, 760, now + 0.02, 0.03, 0.14, 0.08);
    } else if (kind === "boss_hit") {
      pulse("triangle", 240, 420, 620, now, 0.02, 0.13, 0.24);
      pulse("square", 360, 640, 880, now + 0.03, 0.02, 0.14, 0.16);
      pulse("sine", 560, 860, 1040, now + 0.065, 0.02, 0.16, 0.1);
    } else if (kind === "boss_attack") {
      pulse("square", 150, 112, 82, now, 0.02, 0.21, 0.26);
      pulse("sawtooth", 120, 95, 70, now + 0.035, 0.02, 0.2, 0.14);
      pulse("triangle", 210, 160, 120, now + 0.06, 0.02, 0.18, 0.12);
    } else if (kind === "boss_win") {
      pulse("triangle", 360, 560, 820, now, 0.03, 0.16, 0.2);
      pulse("triangle", 560, 860, 1180, now + 0.08, 0.03, 0.18, 0.2);
      pulse("triangle", 840, 1220, 1660, now + 0.16, 0.03, 0.22, 0.18);
      pulse("sine", 1040, 1520, 1960, now + 0.22, 0.03, 0.24, 0.12);
    } else if (kind === "chest") {
      pulse("triangle", 380, 620, 980, now, 0.04, 0.22, 0.24);
      pulse("sine", 520, 860, 1240, now + 0.08, 0.03, 0.2, 0.14);
      pulse("triangle", 720, 1040, 1420, now + 0.16, 0.03, 0.24, 0.14);
    } else if (kind === "level") {
      pulse("triangle", 420, 760, 1120, now, 0.04, 0.22, 0.24);
      pulse("triangle", 620, 1040, 1460, now + 0.1, 0.04, 0.24, 0.2);
      pulse("sine", 840, 1280, 1720, now + 0.19, 0.03, 0.24, 0.14);
    } else if (kind === "combo_up") {
      pulse("triangle", 700, 1020, 1480, now, 0.03, 0.14, 0.22);
      pulse("sine", 920, 1320, 1760, now + 0.045, 0.02, 0.13, 0.16);
      pulse("square", 520, 700, 920, now + 0.075, 0.015, 0.12, 0.07);
    } else {
      pulse("square", 180, 136, 104, now, 0.03, 0.22, 0.24);
      pulse("sawtooth", 132, 108, 86, now + 0.045, 0.02, 0.19, 0.1);
    }

    setTimeout(() => ctx.close().catch(() => {}), 560);
  } catch {}
}

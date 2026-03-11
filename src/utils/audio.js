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
    } else if (kind === "world") {
      pulse("sine", 280, 640, 1120, now, 0.025, 0.15, 0.22);
      pulse("triangle", 340, 760, 980, now + 0.04, 0.02, 0.13, 0.18);
      pulse("triangle", 640, 980, 1240, now + 0.09, 0.02, 0.16, 0.16);
      pulse("sine", 420, 860, 1400, now + 0.14, 0.02, 0.2, 0.1);
    } else if (kind === "portal") {
      pulse("sine", 170, 320, 640, now, 0.03, 0.26, 0.22);
      pulse("triangle", 210, 460, 880, now + 0.05, 0.03, 0.26, 0.2);
      pulse("triangle", 360, 720, 1380, now + 0.14, 0.03, 0.28, 0.18);
      pulse("sine", 680, 1200, 1780, now + 0.24, 0.02, 0.22, 0.14);
      pulse("sine", 980, 1540, 2120, now + 0.32, 0.02, 0.2, 0.1);
    } else if (kind === "combo_up") {
      pulse("triangle", 700, 1020, 1480, now, 0.03, 0.14, 0.22);
      pulse("sine", 920, 1320, 1760, now + 0.045, 0.02, 0.13, 0.16);
      pulse("square", 520, 700, 920, now + 0.075, 0.015, 0.12, 0.07);
    } else if (kind === "owl_happy_mini") {
      pulse("triangle", 620, 980, 1460, now, 0.018, 0.12, 0.18);
      pulse("sine", 820, 1260, 1680, now + 0.04, 0.016, 0.1, 0.12);
      pulse("triangle", 520, 760, 980, now + 0.075, 0.014, 0.09, 0.07);
    } else if (kind === "owl_happy_mid") {
      pulse("triangle", 560, 900, 1340, now, 0.02, 0.125, 0.2);
      pulse("sine", 780, 1180, 1540, now + 0.043, 0.017, 0.11, 0.13);
      pulse("triangle", 480, 700, 920, now + 0.078, 0.014, 0.095, 0.075);
    } else if (kind === "owl_happy_teen" || kind === "owl_happy") {
      pulse("triangle", 540, 880, 1320, now, 0.02, 0.13, 0.2);
      pulse("sine", 760, 1160, 1520, now + 0.045, 0.018, 0.12, 0.14);
      pulse("triangle", 460, 620, 860, now + 0.08, 0.015, 0.1, 0.08);
    } else if (kind === "owl_coach_mini") {
      pulse("sine", 460, 390, 330, now, 0.02, 0.15, 0.14);
      pulse("triangle", 360, 320, 280, now + 0.038, 0.02, 0.15, 0.1);
      pulse("sine", 560, 650, 740, now + 0.12, 0.02, 0.12, 0.07);
    } else if (kind === "owl_coach_mid") {
      pulse("sine", 440, 370, 310, now, 0.02, 0.155, 0.15);
      pulse("triangle", 350, 310, 270, now + 0.04, 0.02, 0.155, 0.11);
      pulse("sine", 540, 630, 720, now + 0.125, 0.02, 0.125, 0.075);
    } else if (kind === "owl_coach_teen" || kind === "owl_coach") {
      pulse("sine", 420, 360, 300, now, 0.02, 0.16, 0.16);
      pulse("triangle", 340, 300, 260, now + 0.04, 0.02, 0.16, 0.12);
      pulse("sine", 520, 620, 700, now + 0.13, 0.02, 0.13, 0.08);
    } else if (kind === "victory_mini") {
      pulse("triangle", 500, 860, 1240, now, 0.03, 0.16, 0.2);
      pulse("triangle", 680, 1080, 1500, now + 0.08, 0.03, 0.16, 0.18);
      pulse("sine", 920, 1460, 1880, now + 0.18, 0.03, 0.18, 0.12);
    } else if (kind === "victory_mid") {
      pulse("triangle", 460, 780, 1140, now, 0.03, 0.165, 0.22);
      pulse("triangle", 620, 1000, 1440, now + 0.085, 0.03, 0.165, 0.2);
      pulse("sine", 860, 1380, 1840, now + 0.19, 0.03, 0.19, 0.13);
    } else if (kind === "victory_teen" || kind === "victory") {
      pulse("triangle", 420, 720, 1080, now, 0.03, 0.17, 0.24);
      pulse("triangle", 560, 960, 1380, now + 0.09, 0.03, 0.17, 0.22);
      pulse("triangle", 740, 1220, 1700, now + 0.18, 0.03, 0.19, 0.2);
      pulse("sine", 980, 1560, 2100, now + 0.27, 0.03, 0.2, 0.14);
    } else {
      pulse("square", 180, 136, 104, now, 0.03, 0.22, 0.24);
      pulse("sawtooth", 132, 108, 86, now + 0.045, 0.02, 0.19, 0.1);
    }

    setTimeout(() => ctx.close().catch(() => {}), 560);
  } catch {}
}

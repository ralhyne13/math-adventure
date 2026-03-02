export function playBeep(kind = "ok", enabled = true) {
  if (!enabled) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

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
      g.gain.exponentialRampToValueAtTime(gainPeak, startAt + attack);
      g.gain.exponentialRampToValueAtTime(0.001, startAt + release);
      o.start(startAt);
      o.stop(startAt + release + 0.02);
    };

    if (kind === "ok") {
      pulse("triangle", 720, 980, 1240, now, 0.04, 0.18, 0.22);
      pulse("sine", 540, 720, 860, now + 0.03, 0.03, 0.16, 0.08);
    } else if (kind === "boss_hit") {
      pulse("triangle", 300, 520, 760, now, 0.03, 0.14, 0.2);
      pulse("sine", 480, 760, 980, now + 0.04, 0.03, 0.18, 0.1);
    } else if (kind === "boss_attack") {
      pulse("square", 160, 120, 90, now, 0.03, 0.2, 0.24);
      pulse("sawtooth", 110, 95, 72, now + 0.05, 0.02, 0.18, 0.12);
    } else if (kind === "boss_win") {
      pulse("triangle", 420, 680, 940, now, 0.04, 0.18, 0.2);
      pulse("triangle", 720, 1040, 1380, now + 0.1, 0.04, 0.22, 0.18);
      pulse("sine", 980, 1320, 1680, now + 0.2, 0.04, 0.26, 0.12);
    } else if (kind === "chest") {
      pulse("triangle", 420, 660, 920, now, 0.05, 0.24, 0.24);
      pulse("sine", 520, 880, 1180, now + 0.11, 0.04, 0.22, 0.1);
    } else if (kind === "level") {
      pulse("triangle", 480, 820, 1160, now, 0.05, 0.2, 0.22);
      pulse("triangle", 760, 1180, 1560, now + 0.1, 0.05, 0.28, 0.18);
      pulse("sine", 620, 930, 1240, now + 0.18, 0.04, 0.24, 0.1);
    } else {
      pulse("square", 180, 140, 110, now, 0.03, 0.22, 0.22);
      pulse("sawtooth", 140, 120, 96, now + 0.04, 0.02, 0.18, 0.08);
    }

    setTimeout(() => ctx.close().catch(() => {}), 420);
  } catch {}
}

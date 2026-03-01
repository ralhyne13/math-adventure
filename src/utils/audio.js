export function playBeep(kind = "ok", enabled = true) {
  if (!enabled) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;

    if (kind === "ok") {
      o.type = "sine";
      o.frequency.setValueAtTime(740, now);
      o.frequency.exponentialRampToValueAtTime(980, now + 0.08);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      o.start(now);
      o.stop(now + 0.18);
    } else if (kind === "level") {
      o.type = "triangle";
      o.frequency.setValueAtTime(520, now);
      o.frequency.exponentialRampToValueAtTime(880, now + 0.11);
      o.frequency.exponentialRampToValueAtTime(1320, now + 0.24);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      o.start(now);
      o.stop(now + 0.32);
    } else {
      o.type = "square";
      o.frequency.setValueAtTime(180, now);
      o.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.start(now);
      o.stop(now + 0.22);
    }

    setTimeout(() => ctx.close().catch(() => {}), 420);
  } catch {}
}

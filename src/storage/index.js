const USERS_KEY = "math-adventure-users-v1";

export function safeLSGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function safeLSSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function parisDayKey(date = new Date()) {
  return date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}

function dayKeyToDate(dayKey) {
  const parts = String(dayKey).split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map((x) => parseInt(x, 10));
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd, 12, 0, 0);
}

export function isYesterdayKey(prevKey, todayKey) {
  const prev = dayKeyToDate(prevKey);
  const today = dayKeyToDate(todayKey);
  if (!prev || !today) return false;
  const diff = Math.round((today.getTime() - prev.getTime()) / (24 * 3600 * 1000));
  return diff === 1;
}

function parisIsoDate(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

export function parisWeekKey(date = new Date()) {
  const iso = parisIsoDate(date);
  const base = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(base.getTime())) return `week-${iso}`;
  const day = base.getDay();
  const mondayShift = (day + 6) % 7;
  base.setDate(base.getDate() - mondayShift);
  const mondayIso = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
  return `week-${mondayIso}`;
}

export function hashString(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0;
  return h;
}

export function normalizePseudo(p) {
  return String(p || "").trim().toLowerCase();
}

export function userKey(pseudo) {
  return `math-adventure-user:${normalizePseudo(pseudo)}`;
}

export function getUsersIndex() {
  return safeLSGet(USERS_KEY, { users: {} });
}

export function setUsersIndex(next) {
  safeLSSet(USERS_KEY, next);
}

export function safeName(pseudo) {
  return String(pseudo || "").trim();
}

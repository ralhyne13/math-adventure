const USERS_KEY = "math-adventure-users-v1";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

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

export function isCloudEnabled() {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

async function supabaseRequest(path, { method = "GET", body, query } = {}) {
  if (!isCloudEnabled()) return null;
  const q = query ? `?${query}` : "";
  const url = `${SUPABASE_URL}/rest/v1/${path}${q}`;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data;
  } catch {
    return null;
  }
}

export async function cloudPullUserSave(pseudoKey) {
  if (!pseudoKey || !isCloudEnabled()) return null;
  const rows = await supabaseRequest("profiles", {
    query: `pseudo_key=eq.${encodeURIComponent(pseudoKey)}&select=pseudo_key,save,updated_at&limit=1`,
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

export async function cloudPushUserSave(pseudoKey, pseudoDisplay, save) {
  if (!pseudoKey || !isCloudEnabled()) return null;
  const payload = {
    pseudo_key: pseudoKey,
    pseudo_display: pseudoDisplay ?? pseudoKey,
    save,
    updated_at: new Date().toISOString(),
  };
  return supabaseRequest("profiles", {
    method: "POST",
    query: "on_conflict=pseudo_key",
    body: payload,
  });
}

export async function cloudPushLeaderboard({ pseudoKey, pseudoDisplay, mode, score }) {
  if (!pseudoKey || !isCloudEnabled()) return null;
  return supabaseRequest("leaderboard", {
    method: "POST",
    body: {
      pseudo_key: pseudoKey,
      pseudo_display: pseudoDisplay ?? pseudoKey,
      mode,
      score,
      created_at: new Date().toISOString(),
    },
  });
}

export async function cloudLogEvent({ pseudoKey, event, payload }) {
  if (!pseudoKey || !event || !isCloudEnabled()) return null;
  return supabaseRequest("analytics_events", {
    method: "POST",
    body: {
      pseudo_key: pseudoKey,
      event,
      payload: payload ?? {},
      created_at: new Date().toISOString(),
    },
  });
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

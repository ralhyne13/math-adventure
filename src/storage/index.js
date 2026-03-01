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

async function supabaseRequest(path, { method = "GET", body, query, accessToken } = {}) {
  if (!isCloudEnabled()) return null;
  const q = query ? `?${query}` : "";
  const url = `${SUPABASE_URL}/rest/v1/${path}${q}`;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
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

async function supabaseAuthRequest(path, { method = "POST", body, accessToken } = {}) {
  if (!isCloudEnabled()) return null;
  const url = `${SUPABASE_URL}/auth/v1/${path}`;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.msg || data?.error_description || data?.error || "auth_error" };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

function pseudoToCloudEmail(pseudoKey) {
  return `${normalizePseudo(pseudoKey)}@mathroyale.local`;
}

export function cloudAuthLoginToEmail(loginOrEmail) {
  const raw = String(loginOrEmail || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("@")) return raw;
  return pseudoToCloudEmail(raw);
}

export async function cloudAuthSignUp(pseudoKey, password, pseudoDisplay) {
  if (!pseudoKey || !password || !isCloudEnabled()) return { ok: false, error: "invalid_input" };
  return supabaseAuthRequest("signup", {
    method: "POST",
    body: {
      email: pseudoToCloudEmail(pseudoKey),
      password,
      data: { pseudo_key: normalizePseudo(pseudoKey), pseudo_display: pseudoDisplay ?? pseudoKey },
    },
  });
}

export async function cloudAuthSignIn(pseudoKey, password) {
  if (!pseudoKey || !password || !isCloudEnabled()) return { ok: false, error: "invalid_input" };
  return supabaseAuthRequest("token?grant_type=password", {
    method: "POST",
    body: {
      email: cloudAuthLoginToEmail(pseudoKey),
      password,
    },
  });
}

export async function cloudAuthSendPasswordReset(loginOrEmail, redirectTo) {
  const email = cloudAuthLoginToEmail(loginOrEmail);
  if (!email || !isCloudEnabled()) return { ok: false, error: "invalid_input" };
  return supabaseAuthRequest("recover", {
    method: "POST",
    body: {
      email,
      ...(redirectTo ? { redirect_to: redirectTo } : {}),
    },
  });
}

export async function cloudAuthSignOut(accessToken) {
  if (!accessToken || !isCloudEnabled()) return { ok: false, error: "invalid_input" };
  return supabaseAuthRequest("logout", {
    method: "POST",
    accessToken,
  });
}

export async function cloudAuthUpdatePassword(accessToken, nextPassword) {
  if (!accessToken || !nextPassword || !isCloudEnabled()) return { ok: false, error: "invalid_input" };
  return supabaseAuthRequest("user", {
    method: "PUT",
    accessToken,
    body: { password: nextPassword },
  });
}

export async function cloudPullUserSave(pseudoKey, accessToken) {
  if (!pseudoKey || !isCloudEnabled()) return null;
  const rows = await supabaseRequest("profiles", {
    method: "GET",
    accessToken,
    query: `pseudo_key=eq.${encodeURIComponent(pseudoKey)}&select=pseudo_key,save,updated_at&limit=1`,
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

export async function cloudPushUserSave(pseudoKey, pseudoDisplay, save, accessToken) {
  if (!pseudoKey || !isCloudEnabled()) return null;
  const payload = {
    pseudo_key: pseudoKey,
    pseudo_display: pseudoDisplay ?? pseudoKey,
    save,
    updated_at: new Date().toISOString(),
  };
  return supabaseRequest("profiles", {
    method: "POST",
    accessToken,
    query: "on_conflict=pseudo_key",
    body: payload,
  });
}

export async function cloudPushLeaderboard({ pseudoKey, pseudoDisplay, mode, score, accessToken }) {
  if (!pseudoKey || !isCloudEnabled()) return null;
  return supabaseRequest("leaderboard", {
    method: "POST",
    accessToken,
    body: {
      pseudo_key: pseudoKey,
      pseudo_display: pseudoDisplay ?? pseudoKey,
      mode,
      score,
      created_at: new Date().toISOString(),
    },
  });
}

export async function cloudLogEvent({ pseudoKey, event, payload, accessToken }) {
  if (!pseudoKey || !event || !isCloudEnabled()) return null;
  return supabaseRequest("analytics_events", {
    method: "POST",
    accessToken,
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

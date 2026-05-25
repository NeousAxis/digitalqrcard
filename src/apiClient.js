// API client for the Digital QR Cards backend (Cloudflare Worker + Better Auth + D1).
// Replaces the previous Appwrite client. Auth uses BEARER TOKENS (no cookies) so it
// works inside the iOS WKWebView under capacitor://localhost without the cross-origin
// cookie problems that plagued Appwrite.

const API_URL = (
  import.meta.env.VITE_API_URL || "https://digitalqrcard-api.neousaxis.workers.dev"
).replace(/\/$/, "");

const TOKEN_KEY = "bauth_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}
function setToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
  } catch {
    /* ignore */
  }
}
function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

// Low-level fetch helper. Attaches the bearer token, parses JSON, throws on error.
async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Better Auth returns a fresh session token in this header on sign-in/up.
  const newToken = res.headers.get("set-auth-token");
  if (newToken) setToken(newToken);

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---- Auth ---------------------------------------------------------------

export async function signUp({ email, password, name }) {
  const data = await request("/api/auth/sign-up/email", {
    method: "POST",
    auth: false,
    body: { email, password, name: name || email.split("@")[0] },
  });
  if (data?.token) setToken(data.token);
  return data?.user || null;
}

export async function signIn({ email, password }) {
  const data = await request("/api/auth/sign-in/email", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  if (data?.token) setToken(data.token);
  return data?.user || null;
}

// Returns the current user object, or null if not authenticated.
export async function getCurrentUser() {
  if (!getToken()) return null;
  try {
    const data = await request("/api/auth/get-session", { method: "GET" });
    return data?.user || null;
  } catch (e) {
    if (e.status === 401) {
      clearToken();
      return null;
    }
    throw e;
  }
}

export async function signOut() {
  try {
    await request("/api/auth/sign-out", { method: "POST", body: {} });
  } catch {
    /* ignore network/expired errors on logout */
  }
  clearToken();
}

// Permanently delete the account + all its data (Apple Guideline 5.1.1(v)).
export async function deleteAccount() {
  await request("/api/account", { method: "DELETE" });
  clearToken();
}

// ---- Cards --------------------------------------------------------------

export async function listCards() {
  const data = await request("/api/cards", { method: "GET" });
  return data?.cards || [];
}

export async function createCard(card) {
  return request("/api/cards", { method: "POST", body: card });
}

export async function updateCard(id, card) {
  return request(`/api/cards/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: card,
  });
}

export async function deleteCard(id) {
  return request(`/api/cards/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---- Profile (subscription, etc.) --------------------------------------

export async function getProfile() {
  const data = await request("/api/profile", { method: "GET" });
  return data?.profile || {};
}

export async function updateProfile(profile) {
  const data = await request("/api/profile", { method: "PUT", body: profile });
  return data?.profile || {};
}

export { API_URL };

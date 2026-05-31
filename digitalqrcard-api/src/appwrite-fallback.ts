// Transparent Appwrite -> Cloudflare account migration (server-side, no app update, no reset).
//
// CONTEXT: v1.2 (live) switched the backend to Cloudflare (Better Auth + D1), but existing
// users' accounts + cards live ONLY in Appwrite and were never migrated -> login fails and there
// is no in-app password reset. FIX: when a user signs in and no Cloudflare account exists yet,
// verify the credentials against Appwrite; if valid, create the Cloudflare account (same email+
// password) and copy the user's cards. Future logins hit D1 natively. Zero new secrets required:
// card reads use the user's OWN Appwrite session (an optional APPWRITE_API_KEY is used if present).
//
// Wire-up (index.ts, BEFORE the `app.all("/api/auth/*")` catch-all):
//   app.post("/api/auth/sign-in/email", c => signInWithAppwriteFallback(c));

const AW_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const AW_PROJECT = "69c62a550031e83fd11e";
const AW_DB = "digitalqrcard";

// Verify email+password against Appwrite. Returns the Appwrite userId + session secret if valid.
async function appwriteVerify(
  email: string,
  password: string
): Promise<{ userId: string; session: string } | null> {
  try {
    const res = await fetch(`${AW_ENDPOINT}/account/sessions/email`, {
      method: "POST",
      headers: { "X-Appwrite-Project": AW_PROJECT, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null; // 401 = wrong creds OR user not in Appwrite either
    const data: any = await res.json();
    // Session secret: server responses include `secret`; client responses put it in Set-Cookie.
    let session: string = data.secret || "";
    if (!session) {
      const sc = res.headers.get("set-cookie") || "";
      const m = sc.match(/a_session_[^=]+=([^;]+)/);
      if (m) session = decodeURIComponent(m[1]);
    }
    return { userId: data.userId, session };
  } catch {
    return null;
  }
}

// Read the user's cards from Appwrite. Uses the user's session secret (no admin key needed); if a
// server APPWRITE_API_KEY is configured it is used instead. Best-effort: [] on any failure.
async function fetchAppwriteCards(
  appwriteUserId: string,
  opts: { apiKey?: string; session?: string }
): Promise<any[]> {
  try {
    const headers: Record<string, string> = { "X-Appwrite-Project": AW_PROJECT };
    if (opts.apiKey) headers["X-Appwrite-Key"] = opts.apiKey;
    else if (opts.session) headers["X-Appwrite-Session"] = opts.session;
    else return [];
    const q = JSON.stringify({ method: "equal", attribute: "user_id", values: [appwriteUserId] });
    const lim = JSON.stringify({ method: "limit", values: [100] });
    const url =
      `${AW_ENDPOINT}/databases/${AW_DB}/collections/cards/documents` +
      `?queries[]=${encodeURIComponent(q)}&queries[]=${encodeURIComponent(lim)}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data: any = await res.json();
    return data.documents || [];
  } catch {
    return [];
  }
}

// Map an Appwrite card document to the D1 `data` JSON blob shape /api/cards returns.
// Handles photo stored either in the `photo` attribute or as a {type:'__photo'} entry in `fields`.
function mapAppwriteCard(doc: any): { cardOrder: number; data: Record<string, any> } {
  let fields: any[] = [];
  try {
    fields = doc.fields ? JSON.parse(doc.fields) : [];
  } catch {
    fields = [];
  }
  let socials: any = {};
  try {
    socials = doc.socials ? JSON.parse(doc.socials) : {};
  } catch {
    socials = {};
  }
  let image = doc.photo || "";
  if (!image && Array.isArray(fields)) {
    const p = fields.find((f) => f && f.type === "__photo");
    if (p) image = p.value || "";
  }
  const editableFields = Array.isArray(fields)
    ? fields.filter((f) => f && f.type !== "__photo")
    : [];
  return {
    cardOrder: typeof doc.card_order === "number" ? doc.card_order : 0,
    data: {
      title: doc.title || "",
      name: doc.name || "",
      company: doc.company || "",
      phone: doc.phone || "",
      email: doc.email || "",
      website: doc.website || "",
      location: doc.location || doc.address || "",
      theme: doc.theme || "",
      fields: editableFields,
      socials,
      image,
    },
  };
}

// Main entry: native Better Auth sign-in first; on failure, fall back to Appwrite migration.
export async function signInWithAppwriteFallback(c: any): Promise<Response> {
  const auth = c.get("auth");
  const url: string = c.req.url;
  const origin = new URL(url).origin;
  const bodyText = await c.req.raw.text();

  // 1) Native sign-in (already-migrated / Cloudflare-native users, incl. the demo account).
  const nativeRes = await auth.handler(
    new Request(url, { method: "POST", headers: c.req.raw.headers, body: bodyText })
  );
  if (nativeRes.status === 200) return nativeRes;

  // 2) Native failed -> parse creds, try Appwrite.
  let creds: any = {};
  try {
    creds = JSON.parse(bodyText);
  } catch {
    return nativeRes;
  }
  if (!creds.email || !creds.password) return nativeRes;

  const aw = await appwriteVerify(creds.email, creds.password);
  if (!aw) return nativeRes; // not a valid Appwrite user either -> return the real failure

  // 3) Valid Appwrite user -> create the Cloudflare account with the SAME password (autoSignIn
  //    returns a session token + set-auth-token header, exactly what the app expects).
  const signupRes = await auth.handler(
    new Request(new URL("/api/auth/sign-up/email", url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", origin },
      body: JSON.stringify({
        email: creds.email,
        password: creds.password,
        name: creds.email.split("@")[0],
      }),
    })
  );
  if (signupRes.status !== 200) return signupRes; // surface signup error (e.g. password policy)

  // 4) Best-effort card migration into D1 for the new Cloudflare user id.
  try {
    const sd: any = await signupRes.clone().json();
    const newUserId = sd?.user?.id;
    if (newUserId) {
      const docs = await fetchAppwriteCards(aw.userId, {
        apiKey: c.env.APPWRITE_API_KEY,
        session: aw.session,
      });
      let order = 0;
      for (const doc of docs) {
        const { cardOrder, data } = mapAppwriteCard(doc);
        await c.env.DATABASE.prepare(
          "INSERT INTO cards (id, user_id, card_order, data) VALUES (?, ?, ?, ?)"
        )
          .bind(crypto.randomUUID(), newUserId, cardOrder || order, JSON.stringify(data))
          .run();
        order++;
      }
    }
  } catch {
    // Never fail login because card copy hiccuped — account is created; cards can be re-synced.
  }

  return signupRes;
}

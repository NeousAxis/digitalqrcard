import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth, TRUSTED_ORIGINS } from "./auth";
import type { CloudflareBindings } from "./env";
import { signInWithAppwriteFallback } from "./appwrite-fallback";

type Variables = {
    auth: ReturnType<typeof createAuth>;
};

const app = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>();

// CORS for the whole API (auth + cards). Allows the iOS app (capacitor://localhost,
// https://localhost) and the web origins, and EXPOSES `set-auth-token` so the client
// can read the bearer token returned on sign-in/up.
app.use(
    "/api/*",
    cors({
        origin: (requestOrigin: string, c) => {
            const self = new URL(c.req.url).origin;
            if (requestOrigin === self) return requestOrigin;
            return TRUSTED_ORIGINS.includes(requestOrigin) ? requestOrigin : "";
        },
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
        exposeHeaders: ["Content-Length", "set-auth-token"],
        maxAge: 600,
        credentials: true,
    })
);

// Middleware to initialize auth instance for each request
app.use("*", async (c, next) => {
    const auth = createAuth(c.env, (c.req.raw as any).cf || {}, new URL(c.req.url).origin);
    c.set("auth", auth);
    await next();
});

// Transparent migration: intercept email sign-in so existing Appwrite users (whose accounts
// were never migrated to Cloudflare) are migrated on first login — no app update, no reset.
// MUST be registered BEFORE the /api/auth/* catch-all below. See appwrite-fallback.ts.
app.post("/api/auth/sign-in/email", c => signInWithAppwriteFallback(c));

// Handle all auth routes
app.all("/api/auth/*", async c => {
    const auth = c.get("auth");
    return auth.handler(c.req.raw);
});

// Home page with anonymous login
app.get("/", async c => {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard - Better Auth Cloudflare (Hono)</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0; }
        .header { text-align: center; margin-bottom: 24px; }
        .title { font-size: 2rem; font-weight: bold; margin: 0; }
        .subtitle { color: #6b7280; font-size: 0.875rem; margin: 8px 0 0 0; }
        .content { space-y: 16px; }
        .info-row { margin: 12px 0; }
        .info-row strong { display: inline-block; width: 120px; }
        button { padding: 8px 16px; margin: 8px 4px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; }
        .primary-btn { background: #3b82f6; color: white; border-color: #3b82f6; }
        .danger-btn { background: #ef4444; color: white; border-color: #ef4444; }
        footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 16px; font-size: 0.875rem; color: #6b7280; background: white; border-top: 1px solid #e5e7eb; }
        footer a { color: #3b82f6; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1 class="title">Dashboard - Hono</h1>
            <p class="subtitle">Powered by better-auth-cloudflare</p>
        </div>
        
        <div id="status">Loading...</div>
        
        <div id="not-logged-in" style="display:none;">
            <button onclick="loginAnonymously()" class="primary-btn">Login Anonymously</button>
        </div>
        
        <div id="logged-in" style="display:none;">
            <div class="content">
                <p>Welcome, <span id="user-name" style="font-weight: 600;"></span>!</p>
                <div id="user-info"></div>
                <div id="geolocation-info"></div>
                <div style="margin-top: 24px;">
                    <button onclick="tryProtectedRoute()" class="primary-btn">Try Protected Route</button>
                    <button onclick="logout()">Logout</button>
                </div>
            </div>
        </div>
        
        <div id="protected-result"></div>
    </div>
    
    <footer>
        Powered by 
        <a href="https://github.com/zpg6/better-auth-cloudflare" target="_blank" rel="noopener noreferrer">better-auth-cloudflare</a>
        | 
        <a href="https://www.npmjs.com/package/better-auth-cloudflare" target="_blank" rel="noopener noreferrer">npm package</a>
    </footer>

    <script>
        let currentUser = null;

        async function checkStatus() {
            try {
                const response = await fetch('/api/auth/get-session', {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    showNotLoggedIn();
                    return;
                }
                
                const text = await response.text();
                
                if (!text || text.trim() === '') {
                    showNotLoggedIn();
                    return;
                }
                
                const result = JSON.parse(text);
                
                if (result?.session) {
                    currentUser = result.user;
                    await showLoggedIn();
                } else {
                    showNotLoggedIn();
                }
            } catch (error) {
                console.error('Error checking status:', error);
                showNotLoggedIn();
            }
        }

        async function loginAnonymously() {
            try {
                // First check if already logged in
                await checkStatus();
                if (currentUser) {
                    return;
                }
                
                const response = await fetch('/api/auth/sign-in/anonymous', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({})
                });
                
                const text = await response.text();
                
                if (!response.ok) {
                    // Handle specific error for already anonymous
                    if (text.includes('ANONYMOUS_USERS_CANNOT_SIGN_IN_AGAIN_ANONYMOUSLY')) {
                        alert('You are already logged in anonymously!');
                        await checkStatus(); // Refresh status
                        return;
                    }
                    alert('Anonymous login failed: HTTP ' + response.status + ' - ' + text);
                    return;
                }
                
                const result = JSON.parse(text);
                
                if (result.user) {
                    currentUser = result.user;
                    await showLoggedIn();
                } else {
                    alert('Anonymous login failed: ' + (result.error?.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Anonymous login error:', error);
                alert('Anonymous login failed: ' + error.message);
            }
        }

        async function logout() {
            try {
                await fetch('/api/auth/sign-out', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({})
                });
                currentUser = null;
                showNotLoggedIn();
                document.getElementById('protected-result').innerHTML = '';
            } catch (error) {
                alert('Logout failed: ' + error.message);
            }
        }

        async function clearSession() {
            try {
                // Clear cookies by setting them to expire
                document.cookie.split(";").forEach(function(c) { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });
                
                // Force logout
                await logout();
                
                // Refresh page to clear any cached state
                window.location.reload();
            } catch (error) {
                console.error('Error clearing session:', error);
                window.location.reload();
            }
        }

        async function tryProtectedRoute() {
            try {
                const response = await fetch('/protected', {
                    credentials: 'include'
                });
                const text = await response.text();
                
                document.getElementById('protected-result').innerHTML = 
                    '<h3>Protected Route Result:</h3><div style="border:1px solid #ccc; padding:10px; margin:10px 0;">' + text + '</div>';
            } catch (error) {
                document.getElementById('protected-result').innerHTML = 
                    '<h3>Protected Route Error:</h3><div style="border:1px solid red; padding:10px; margin:10px 0;">' + error.message + '</div>';
            }
        }

        async function showLoggedIn() {
            document.getElementById('status').innerHTML = 'Status: Logged In';
            document.getElementById('not-logged-in').style.display = 'none';
            document.getElementById('logged-in').style.display = 'block';
            
            if (currentUser) {
                document.getElementById('user-name').textContent = currentUser.name || currentUser.email || 'User';
                
                document.getElementById('user-info').innerHTML = 
                    '<div class="info-row"><strong>Email:</strong> ' + (currentUser.email || 'Anonymous') + '</div>' +
                    '<div class="info-row"><strong>User ID:</strong> ' + currentUser.id + '</div>';
                
                // Fetch geolocation data
                try {
                    const geoResponse = await fetch('/api/auth/cloudflare/geolocation', {
                        credentials: 'include'
                    });
                    
                    if (geoResponse.ok) {
                        const geoData = await geoResponse.json();
                        document.getElementById('geolocation-info').innerHTML = 
                            '<div class="info-row"><strong>Timezone:</strong> ' + (geoData.timezone || 'Unknown') + '</div>' +
                            '<div class="info-row"><strong>City:</strong> ' + (geoData.city || 'Unknown') + '</div>' +
                            '<div class="info-row"><strong>Country:</strong> ' + (geoData.country || 'Unknown') + '</div>' +
                            '<div class="info-row"><strong>Region:</strong> ' + (geoData.region || 'Unknown') + '</div>' +
                            '<div class="info-row"><strong>Region Code:</strong> ' + (geoData.regionCode || 'Unknown') + '</div>' +
                            '<div class="info-row"><strong>Data Center:</strong> ' + (geoData.colo || 'Unknown') + '</div>' +
                            (geoData.latitude ? '<div class="info-row"><strong>Latitude:</strong> ' + geoData.latitude + '</div>' : '') +
                            (geoData.longitude ? '<div class="info-row"><strong>Longitude:</strong> ' + geoData.longitude + '</div>' : '');
                    } else {
                        document.getElementById('geolocation-info').innerHTML = '<div class="info-row"><strong>Geolocation:</strong> Unable to fetch</div>';
                    }
                } catch (error) {
                    document.getElementById('geolocation-info').innerHTML = '<div class="info-row"><strong>Geolocation:</strong> Error fetching data</div>';
                }
            }
        }

        function showNotLoggedIn() {
            document.getElementById('status').innerHTML = 'Status: Not Logged In';
            document.getElementById('not-logged-in').style.display = 'block';
            document.getElementById('logged-in').style.display = 'none';
        }

        // Check status on page load
        checkStatus();
    </script>
</body>
</html>
  `;
    return c.html(html);
});

// Protected route that shows different content based on auth status
app.get("/protected", async c => {
    const auth = c.get("auth");

    try {
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        if (session) {
            return c.html(`
                <h2>🔒 Protected Content - You're In!</h2>
                <p>Welcome to the protected area!</p>
                <p><strong>User ID:</strong> ${session.user.id}</p>
                <p><strong>Session ID:</strong> ${session.session.id}</p>
                <p><strong>Created At:</strong> ${new Date(session.user.createdAt).toLocaleString()}</p>
                <p>This content is only visible to authenticated users (including anonymous ones)!</p>
            `);
        } else {
            return c.html(
                `
                <h2>❌ Access Denied</h2>
                <p>You need to be logged in to see this content.</p>
                <p>Go back and login anonymously first!</p>
            `,
                401
            );
        }
    } catch (error) {
        return c.html(
            `
            <h2>❌ Error</h2>
            <p>Error checking authentication: ${(error as Error).message}</p>
        `,
            500
        );
    }
});

// Simple health check
app.get("/health", c => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// App data API (bearer-authenticated): business cards + user profile.
// Replaces the Appwrite `cards` and `users` collections.
// ---------------------------------------------------------------------------

// Resolve the authenticated user id from the bearer token (no cookies).
async function requireUserId(c: any): Promise<string | null> {
    const auth = c.get("auth");
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    return session?.user?.id ?? null;
}

const NOW_SQL = "(cast(unixepoch('subsecond') * 1000 as integer))";

// List the current user's cards (ordered).
app.get("/api/cards", async c => {
    const uid = await requireUserId(c);
    if (!uid) return c.json({ error: "unauthorized" }, 401);
    const { results } = await c.env.DATABASE.prepare(
        "SELECT id, card_order, data FROM cards WHERE user_id = ? ORDER BY card_order ASC"
    )
        .bind(uid)
        .all();
    const cards = (results || []).map((r: any) => ({
        id: r.id,
        cardOrder: r.card_order,
        ...JSON.parse(r.data || "{}"),
    }));
    return c.json({ cards });
});

// Create a card. Body: { cardOrder?, ...anyCardData }
app.post("/api/cards", async c => {
    const uid = await requireUserId(c);
    if (!uid) return c.json({ error: "unauthorized" }, 401);
    const body = await c.req.json().catch(() => ({}));
    const { cardOrder = 0, id: _ignore, ...data } = body;
    const id = crypto.randomUUID();
    await c.env.DATABASE.prepare(
        "INSERT INTO cards (id, user_id, card_order, data) VALUES (?, ?, ?, ?)"
    )
        .bind(id, uid, cardOrder, JSON.stringify(data))
        .run();
    return c.json({ id, cardOrder, ...data });
});

// Update a card (ownership enforced).
app.put("/api/cards/:id", async c => {
    const uid = await requireUserId(c);
    if (!uid) return c.json({ error: "unauthorized" }, 401);
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const { cardOrder = 0, id: _ignore, ...data } = body;
    const owned = await c.env.DATABASE.prepare(
        "SELECT id FROM cards WHERE id = ? AND user_id = ?"
    )
        .bind(id, uid)
        .first();
    if (!owned) return c.json({ error: "not_found" }, 404);
    await c.env.DATABASE.prepare(
        `UPDATE cards SET card_order = ?, data = ?, updated_at = ${NOW_SQL} WHERE id = ? AND user_id = ?`
    )
        .bind(cardOrder, JSON.stringify(data), id, uid)
        .run();
    return c.json({ id, cardOrder, ...data });
});

// Delete a card (ownership enforced).
app.delete("/api/cards/:id", async c => {
    const uid = await requireUserId(c);
    if (!uid) return c.json({ error: "unauthorized" }, 401);
    const id = c.req.param("id");
    await c.env.DATABASE.prepare("DELETE FROM cards WHERE id = ? AND user_id = ?")
        .bind(id, uid)
        .run();
    return c.json({ ok: true });
});

// Read the user profile blob (subscription, etc.).
app.get("/api/profile", async c => {
    const uid = await requireUserId(c);
    if (!uid) return c.json({ error: "unauthorized" }, 401);
    const row: any = await c.env.DATABASE.prepare(
        "SELECT data FROM profiles WHERE user_id = ?"
    )
        .bind(uid)
        .first();
    return c.json({ profile: row ? JSON.parse(row.data || "{}") : {} });
});

// Permanently delete the account and all its data (Apple Guideline 5.1.1(v)).
app.delete("/api/account", async c => {
    const uid = await requireUserId(c);
    if (!uid) return c.json({ error: "unauthorized" }, 401);
    const db = c.env.DATABASE;
    await db.batch([
        db.prepare("DELETE FROM cards WHERE user_id = ?").bind(uid),
        db.prepare("DELETE FROM profiles WHERE user_id = ?").bind(uid),
        db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(uid),
        db.prepare("DELETE FROM accounts WHERE user_id = ?").bind(uid),
        db.prepare("DELETE FROM users WHERE id = ?").bind(uid),
    ]);
    return c.json({ ok: true });
});

// Upsert the user profile blob.
app.put("/api/profile", async c => {
    const uid = await requireUserId(c);
    if (!uid) return c.json({ error: "unauthorized" }, 401);
    const data = await c.req.json().catch(() => ({}));
    await c.env.DATABASE.prepare(
        `INSERT INTO profiles (user_id, data) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = ${NOW_SQL}`
    )
        .bind(uid, JSON.stringify(data))
        .run();
    return c.json({ profile: data });
});

export default app;

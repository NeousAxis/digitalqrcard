import type { D1Database, IncomingRequestCfProperties } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { anonymous, bearer } from "better-auth/plugins";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "../db";
import type { CloudflareBindings } from "../env";
import { sendResetEmail } from "../email.js";

// Origins allowed to call this API. The iOS app (Capacitor/WKWebView) runs under
// `capacitor://localhost` (and `https://localhost`); the web build runs on the
// digitalqrcard.xyz domains. Bearer tokens are used (no cookies) to avoid the
// WKWebView cross-origin cookie blocking that broke Appwrite on iOS.
export const TRUSTED_ORIGINS = [
    "capacitor://localhost",
    "https://localhost",
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:4173",
    "https://digitalqrcard.xyz",
    "https://www.digitalqrcard.xyz",
];

// --- Password hashing (WebCrypto PBKDF2) ---------------------------------
// Better Auth's default scrypt is pure-JS and blows the Cloudflare FREE-plan CPU
// budget (10ms), causing "Worker exceeded CPU time limit". WebCrypto PBKDF2 runs
// natively and is cheap enough to fit. Format: pbkdf2$<iter>$<saltB64>$<hashB64>.
const PBKDF2_ITER = 100000;
const td = new TextEncoder();
function toB64(bytes: Uint8Array): string {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s);
}
function fromB64(str: string): Uint8Array {
    const bin = atob(str);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}
async function derive(password: string, salt: Uint8Array, iter: number): Promise<string> {
    const key = await crypto.subtle.importKey("raw", td.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
        key,
        256
    );
    return toB64(new Uint8Array(bits));
}
async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const h = await derive(password, salt, PBKDF2_ITER);
    return `pbkdf2$${PBKDF2_ITER}$${toB64(salt)}$${h}`;
}
async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
    const parts = hash.split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
    const iter = parseInt(parts[1], 10);
    const salt = fromB64(parts[2]);
    const h = await derive(password, salt, iter);
    // constant-time-ish compare
    if (h.length !== parts[3].length) return false;
    let diff = 0;
    for (let i = 0; i < h.length; i++) diff |= h.charCodeAt(i) ^ parts[3].charCodeAt(i);
    return diff === 0;
}

// Single auth configuration that handles both CLI and runtime scenarios
function createAuth(env?: CloudflareBindings, cf?: IncomingRequestCfProperties, baseURL?: string) {
    // Use actual DB for runtime, empty object for CLI
    const db = env ? drizzle(env.DATABASE, { schema }) : ({} as any);

    return betterAuth({
        baseURL,
        // On Cloudflare Workers, secrets live on the `env` binding, not process.env,
        // so Better Auth's default lookup fails. Pass it explicitly.
        secret: env?.BETTER_AUTH_SECRET,
        ...withCloudflare(
            {
                autoDetectIpAddress: true,
                geolocationTracking: true,
                cf: cf || {},
                d1: env
                    ? {
                          db,
                          options: {
                              usePlural: true,
                              debugLogs: false,
                          },
                      }
                    : undefined,
            },
            {
                trustedOrigins: TRUSTED_ORIGINS,
                emailAndPassword: {
                    enabled: true,
                    minPasswordLength: 6,
                    // Native PBKDF2 (see above) — fits the free-plan CPU budget.
                    password: { hash: hashPassword, verify: verifyPassword },
                    // Password reset: Better Auth calls this on POST /api/auth/forget-password.
                    // We email a link to the reset page hosted on this Worker.
                    sendResetPassword: async ({ user, token }: { user: { email: string }; token: string }) => {
                        const base = baseURL || env?.BETTER_AUTH_URL || "https://www.digitalqrcard.xyz";
                        const resetUrl = `${base}/reset-password?token=${token}`;
                        await sendResetEmail(env, user.email, resetUrl);
                    },
                },
                // bearer(): returns the session token in the `set-auth-token`
                // response header on sign-in/up; the app sends it back as
                // `Authorization: Bearer <token>`. No cookies => iOS-safe.
                plugins: [anonymous(), bearer()],
                rateLimit: {
                    enabled: true,
                    window: 60,
                    max: 100,
                },
            }
        ),
        // Only add database adapter for CLI schema generation
        ...(env
            ? {}
            : {
                  database: drizzleAdapter({} as D1Database, {
                      provider: "sqlite",
                      usePlural: true,
                      debugLogs: false
                  }),
              }),
    });
}

// Export for CLI schema generation
export const auth = createAuth();

// Export for runtime usage
export { createAuth };

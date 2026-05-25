import type { D1Database } from "@cloudflare/workers-types";

export interface CloudflareBindings {
    DATABASE: D1Database;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
}

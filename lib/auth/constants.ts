// Shared with proxy.ts, which must stay free of heavy server-only imports
// (db, next/headers) since it runs on every matched request.
export const SESSION_COOKIE = "mastered_session";

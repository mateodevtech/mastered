import "server-only";
import webpush from "web-push";

// Configured lazily: setVapidDetails throws immediately if the keys are
// missing, which would otherwise crash Next.js's build-time route
// analysis in environments with no secrets configured (e.g. CI running
// only lint/typecheck/test, no real .env).
let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    "mailto:support@mastered.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export { webpush, ensureConfigured };

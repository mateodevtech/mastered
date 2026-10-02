import "server-only";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:support@mastered.app",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export { webpush };

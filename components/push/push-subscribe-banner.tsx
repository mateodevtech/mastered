"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useClientValue } from "@/lib/hooks/use-client-value";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function isSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export function PushSubscribeBanner() {
  const supported = useClientValue(isSupported, false);
  const initialPermission = useClientValue(
    () => (typeof Notification !== "undefined" ? Notification.permission : "default"),
    "default" as NotificationPermission,
  );
  const [permissionOverride, setPermissionOverride] =
    useState<NotificationPermission | null>(null);
  const permission = permissionOverride ?? initialPermission;
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;

    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setSubscribed(!!existing);
    });
  }, [supported]);

  async function enableNotifications() {
    setError(null);
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setError("Configuration push manquante.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const permissionResult = await Notification.requestPermission();
      setPermissionOverride(permissionResult);
      if (permissionResult !== "granted") return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) throw new Error("subscribe failed");
      setSubscribed(true);
    } catch {
      setError("Impossible d'activer les notifications. Réessaie.");
    }
  }

  if (!supported || subscribed || permission === "denied") return null;

  return (
    <div className="flex items-center justify-between gap-4 border-b bg-muted/50 px-6 py-2 text-sm">
      <span>Active les notifications pour ne rater aucune échéance.</span>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-destructive">{error}</span>}
        <Button size="sm" onClick={enableNotifications}>
          Activer
        </Button>
      </div>
    </div>
  );
}

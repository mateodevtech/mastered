"use client";

import { InfoIcon } from "lucide-react";
import { useClientValue } from "@/lib/hooks/use-client-value";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

// iOS Safari only supports Web Push for PWAs added to the home screen
// (iOS 16.4+), and background delivery there is still less reliable than
// Android/desktop. This is a known platform limit, not something this
// app can fix — surfaced here rather than silently under-delivering.
export function IosLimitationNotice() {
  const show = useClientValue(isIos, false);

  if (!show) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
      <InfoIcon className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">Notifications limitées sur iOS</p>
        <p className="text-muted-foreground">
          {isStandalone()
            ? "Même installée, iOS limite la fiabilité des notifications en arrière-plan par rapport à Android ou desktop."
            : "Ajoute Mastered à ton écran d'accueil (Partager → Sur l'écran d'accueil) pour activer les notifications — Safari ne les permet pas dans un onglet classique."}
        </p>
      </div>
    </div>
  );
}

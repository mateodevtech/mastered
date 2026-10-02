"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPromptBanner() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredEvent || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-b bg-muted/50 px-6 py-2 text-sm">
      <span>Installe Mastered sur ton appareil pour y accéder en un geste.</span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDismissed(true)}
        >
          Plus tard
        </Button>
        <Button
          size="sm"
          onClick={async () => {
            await deferredEvent.prompt();
            setDeferredEvent(null);
          }}
        >
          Installer
        </Button>
      </div>
    </div>
  );
}

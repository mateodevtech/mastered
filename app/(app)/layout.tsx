import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { TimezoneSync } from "@/components/theme/timezone-sync";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PushSubscribeBanner } from "@/components/push/push-subscribe-banner";
import { InstallPromptBanner } from "@/components/pwa/install-prompt-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: proxy.ts already redirects unauthenticated requests
  // away from these routes, but Server Functions must not rely on that
  // alone (see Next.js Proxy docs — matcher drift can silently skip it).
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TimezoneSync />
      <header className="flex items-center justify-between border-b px-6 py-4">
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Mastered
          </Link>
          <Link href="/goals" className="text-sm text-muted-foreground hover:text-foreground">
            Objectifs
          </Link>
          <Link href="/calendar" className="text-sm text-muted-foreground hover:text-foreground">
            Calendrier
          </Link>
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Réglages
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action="/api/auth/logout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              Se déconnecter
            </Button>
          </form>
        </div>
      </header>
      <PushSubscribeBanner />
      <InstallPromptBanner />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

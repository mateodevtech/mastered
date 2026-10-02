import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IosLimitationNotice } from "@/components/pwa/ios-limitation-notice";
import { PushSubscribeBanner } from "@/components/push/push-subscribe-banner";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <main className="flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>

      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Fuseau horaire détecté : {user.timezone}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Nécessaires pour les rappels et les alarmes bloquantes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <IosLimitationNotice />
          <PushSubscribeBanner />
        </CardContent>
      </Card>
    </main>
  );
}

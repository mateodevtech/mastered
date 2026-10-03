import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IosLimitationNotice } from "@/components/pwa/ios-limitation-notice";
import { PushSubscribeBanner } from "@/components/push/push-subscribe-banner";
import { ApiKeysManager } from "@/components/settings/api-keys-manager";
import { WebhooksManager } from "@/components/settings/webhooks-manager";

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

      <Card>
        <CardHeader>
          <CardTitle>Export de données</CardTitle>
          <CardDescription>
            Télécharge l&apos;historique de tes objectifs et tâches.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" nativeButton={false} render={<a href="/api/export/csv" />}>
            Export CSV
          </Button>
          <Button variant="outline" nativeButton={false} render={<a href="/api/export/pdf" />}>
            Rapport PDF
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clés API</CardTitle>
          <CardDescription>
            Pour accéder à tes données depuis un script ou une automatisation
            personnelle. Voir la{" "}
            <Link href="/docs" className="underline">
              documentation
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeysManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            Reçois une notification signée quand un événement se produit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebhooksManager />
        </CardContent>
      </Card>
    </main>
  );
}

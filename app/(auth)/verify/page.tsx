import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Vérifie ta boîte mail</CardTitle>
          <CardDescription>
            {email ? (
              <>
                On a envoyé un lien de connexion à <strong>{email}</strong>.
              </>
            ) : (
              "On t'a envoyé un lien de connexion."
            )}{" "}
            Il expire dans 15 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pas reçu l&apos;email ? Vérifie tes spams, ou retourne à la page de
            connexion pour en redemander un.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

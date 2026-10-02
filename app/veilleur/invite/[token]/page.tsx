import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals, users } from "@/lib/db/schema";
import { peekMagicLinkToken } from "@/lib/auth/magic-link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function VeilleurInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await peekMagicLinkToken(token);

  if (!record || record.purpose !== "veilleur_invite" || !record.relatedGoalId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Lien invalide</CardTitle>
            <CardDescription>
              Ce lien d&apos;invitation a expiré ou a déjà été utilisé.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const goal = await db.query.goals.findFirst({ where: eq(goals.id, record.relatedGoalId) });
  if (!goal) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Objectif introuvable</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const owner = await db.query.users.findFirst({ where: eq(users.id, goal.ownerId) });
  const ownerName = owner?.displayName ?? owner?.email ?? "Quelqu'un";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Invitation à devenir Veilleur</CardTitle>
          <CardDescription>
            {ownerName} t&apos;invite à soutenir l&apos;objectif « {goal.title} ». Tu pourras
            voir sa progression, l&apos;encourager, et valider ses preuves d&apos;avancement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/veilleur/accept" method="post">
            <input type="hidden" name="token" value={token} />
            <Button type="submit" className="w-full">
              Accepter l&apos;invitation
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

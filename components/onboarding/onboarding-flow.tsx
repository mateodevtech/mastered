"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlameIcon, ShieldIcon, SparklesIcon, TargetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Step = {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  icon: React.ReactNode;
};

const STEPS: Step[] = [
  {
    eyebrow: "Pourquoi Mastered",
    title: "Du point où tu es au point où tu devrais être",
    icon: <SparklesIcon className="size-6" />,
    body: (
      <>
        <p className="italic text-muted-foreground">
          « Vous, qui depuis longtemps devriez être des maîtres, vous avez encore
          besoin qu&apos;on vous enseigne les premiers rudiments… » — Hébreux 5:12
        </p>
        <p>
          Ce verset est le point de départ de Mastered : la maîtrise ne tombe pas
          d&apos;un coup, elle se construit un jour tenu après l&apos;autre. Mastered
          existe pour t&apos;aider à tenir, précisément les jours où ce serait plus
          simple de ne pas le faire.
        </p>
      </>
    ),
  },
  {
    eyebrow: "Comment ça marche",
    title: "Des objectifs, des tâches, une échéance qui compte",
    icon: <TargetIcon className="size-6" />,
    body: (
      <>
        <p>
          Un <strong>objectif</strong> peut être ponctuel (une échéance fixe) ou
          récurrent (une habitude à répéter chaque semaine).
        </p>
        <p>
          Chaque objectif se décompose en <strong>tâches</strong> avec une
          échéance. Les engagements les plus importants peuvent déclencher une{" "}
          <strong>alarme bloquante</strong> : à l&apos;heure dite, l&apos;app ne te
          laisse pas l&apos;ignorer silencieusement.
        </p>
      </>
    ),
  },
  {
    eyebrow: "La série",
    title: "La régularité, visible et protégée",
    icon: <FlameIcon className="size-6" />,
    body: (
      <>
        <p>
          Pour les objectifs récurrents, Mastered compte ta série de semaines
          réussies. Elle grandit avec ta régularité, et on te donne quelques
          <strong> freezes</strong> par mois pour absorber un vrai imprévu sans tout
          perdre.
        </p>
      </>
    ),
  },
  {
    eyebrow: "Le Veilleur",
    title: "Choisis quelqu'un pour te challenger",
    icon: <ShieldIcon className="size-6" />,
    body: (
      <>
        <p>
          Un <strong>Veilleur</strong> est une personne que tu invites sur un
          objectif : elle voit ta progression, t&apos;encourage, et peut être
          notifiée si une échéance est manquée. Ce n&apos;est pas obligatoire, mais
          c&apos;est souvent ce qui fait la différence entre « je devrais » et « je
          l&apos;ai fait ».
        </p>
        <p className="text-sm text-muted-foreground">
          Tu pourras en inviter un (ou plusieurs) directement depuis la page de
          ton premier objectif.
        </p>
      </>
    ),
  },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  async function finish() {
    setSubmitting(true);
    await fetch("/api/users/onboard", { method: "POST" });
    router.push("/goals/new");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-8">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col gap-5 pt-2">
          <div className="flex items-center gap-2 text-primary">
            {step.icon}
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {step.eyebrow}
            </span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-balance">{step.title}</h1>
          <div className="flex flex-col gap-3 text-sm leading-relaxed">{step.body}</div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-6 rounded-full ${i === stepIndex ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <Button variant="ghost" onClick={() => setStepIndex((i) => i - 1)}>
                  Retour
                </Button>
              )}
              {isLast ? (
                <Button onClick={finish} disabled={submitting}>
                  {submitting ? "..." : "Créer mon premier objectif"}
                </Button>
              ) : (
                <Button onClick={() => setStepIndex((i) => i + 1)}>Suivant</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

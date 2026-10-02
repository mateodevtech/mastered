"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Action = "validate" | "nudge" | "encourage" | "extend";

export function ProofReviewCard({
  proofId,
  taskTitle,
  proofType,
  textContent,
  photoUrl,
}: {
  proofId: string;
  taskTitle: string;
  proofType: string;
  textContent: string | null;
  photoUrl: string | null;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: Action) {
    if (action === "extend" && pendingAction !== "extend") {
      setPendingAction("extend");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/veilleur/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        proofId,
        note: note || undefined,
        ...(action === "extend"
          ? { newDeadline: new Date(newDeadline).toISOString() }
          : {}),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Une erreur est survenue.");
      setSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 border-b py-4 last:border-b-0">
      <div className="flex flex-col gap-1">
        <span className="font-medium">{taskTitle}</span>
        {proofType === "text" && textContent && (
          <p className="text-sm text-muted-foreground">« {textContent} »</p>
        )}
        {proofType === "photo" && photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Preuve soumise" className="max-h-48 rounded-lg object-cover" />
        )}
        {proofType === "checkbox" && (
          <p className="text-sm text-muted-foreground">Marqué comme fait.</p>
        )}
      </div>

      <Textarea
        placeholder="Un mot pour accompagner ta réponse (optionnel)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="text-sm"
      />

      {pendingAction === "extend" && (
        <Input
          type="datetime-local"
          value={newDeadline}
          onChange={(e) => setNewDeadline(e.target.value)}
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={submitting} onClick={() => respond("validate")}>
          Valider
        </Button>
        <Button size="sm" variant="outline" disabled={submitting} onClick={() => respond("encourage")}>
          Encourager
        </Button>
        <Button size="sm" variant="outline" disabled={submitting} onClick={() => respond("nudge")}>
          Relancer
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={submitting || (pendingAction === "extend" && !newDeadline)}
          onClick={() => respond("extend")}
        >
          {pendingAction === "extend" ? "Confirmer la prolongation" : "Prolonger"}
        </Button>
      </div>
    </div>
  );
}

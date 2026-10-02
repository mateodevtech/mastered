"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProofType = "text" | "photo" | "checkbox";

export function NewTaskDialog({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isCriticalCommitment, setIsCriticalCommitment] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [requiresProof, setRequiresProof] = useState(false);
  const [proofType, setProofType] = useState<ProofType>("checkbox");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetAndClose() {
    setOpen(false);
    setTitle("");
    setDeadline("");
    setIsCriticalCommitment(false);
    setBlocking(false);
    setRequiresProof(false);
    setProofType("checkbox");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalId,
        title,
        deadline: new Date(deadline).toISOString(),
        isCriticalCommitment,
        notificationMode: blocking ? "blocking" : "normal",
        requiresProof,
        proofType: requiresProof ? proofType : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Une erreur est survenue.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    resetAndClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Nouvelle tâche</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
          <DialogDescription>
            Une alarme bloquante n&apos;est possible que pour un engagement critique.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-title">Titre</Label>
            <Input
              id="task-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Envoyer le premier brouillon"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-deadline">Échéance</Label>
            <Input
              id="task-deadline"
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="critical" className="flex flex-col items-start gap-1">
              <span>Engagement critique</span>
              <span className="text-xs font-normal text-muted-foreground">
                Nécessaire pour activer l&apos;alarme bloquante
              </span>
            </Label>
            <Switch
              id="critical"
              checked={isCriticalCommitment}
              onCheckedChange={(checked) => {
                setIsCriticalCommitment(checked);
                if (!checked) setBlocking(false);
              }}
            />
          </div>

          {isCriticalCommitment && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="blocking" className="flex flex-col items-start gap-1">
                <span>Alarme bloquante</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Sonne à l&apos;échéance jusqu&apos;à soumission d&apos;une preuve
                </span>
              </Label>
              <Switch id="blocking" checked={blocking} onCheckedChange={setBlocking} />
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="requires-proof" className="flex flex-col items-start gap-1">
              <span>Demander une preuve</span>
            </Label>
            <Switch
              id="requires-proof"
              checked={requiresProof}
              onCheckedChange={setRequiresProof}
            />
          </div>

          {requiresProof && (
            <div className="flex flex-col gap-2">
              <Label>Type de preuve</Label>
              <Select value={proofType} onValueChange={(v) => setProofType(v as ProofType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkbox">Case à cocher</SelectItem>
                  <SelectItem value="text">Réponse texte</SelectItem>
                  <SelectItem value="photo">Photo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Création..." : "Créer la tâche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

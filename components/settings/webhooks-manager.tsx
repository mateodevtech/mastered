"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Webhook = {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
};

const EVENT_OPTIONS: { value: string; label: string }[] = [
  { value: "task.completed", label: "Tâche complétée" },
  { value: "goal.completed", label: "Objectif terminé" },
  { value: "streak.broken", label: "Série cassée" },
  { value: "streak.milestone", label: "Jalon de série atteint" },
];

export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  function refresh() {
    fetch("/api/webhooks")
      .then((res) => res.json())
      .then(setWebhooks)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  function toggleEvent(value: string) {
    setEvents((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value],
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, events }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Une erreur est survenue.");
      setSubmitting(false);
      return;
    }

    const created = await res.json();
    setSubmitting(false);
    setUrl("");
    setEvents([]);
    setRevealedSecret(created.secret);
    refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    refresh();
  }

  function closeDialog() {
    setOpen(false);
    setRevealedSecret(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {!loading && webhooks.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun webhook pour le moment.</p>
      )}

      {webhooks.length > 0 && (
        <ul className="flex flex-col gap-2">
          {webhooks.map((hook) => (
            <li
              key={hook.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-xs">{hook.url}</p>
                <p className="text-xs text-muted-foreground">{hook.events.join(", ")}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(hook.id)}>
                Supprimer
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) closeDialog();
        }}
      >
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          Ajouter un webhook
        </DialogTrigger>
        <DialogContent>
          {revealedSecret ? (
            <>
              <DialogHeader>
                <DialogTitle>Webhook créé</DialogTitle>
                <DialogDescription>
                  Copie ce secret maintenant — il sert à vérifier la signature des
                  requêtes reçues et ne sera plus jamais affiché.
                </DialogDescription>
              </DialogHeader>
              <p className="rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm break-all">
                {revealedSecret}
              </p>
              <DialogFooter>
                <Button onClick={closeDialog}>Fermer</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Ajouter un webhook</DialogTitle>
                <DialogDescription>
                  Reçois une requête signée à chaque événement choisi.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="webhook-url">URL</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://exemple.com/webhooks/mastered"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Événements</Label>
                  <div className="flex flex-col gap-2">
                    {EVENT_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={events.includes(opt.value)}
                          onChange={() => toggleEvent(opt.value)}
                          className="size-4 rounded border-input"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <DialogFooter>
                  <Button type="submit" disabled={submitting || events.length === 0}>
                    {submitting ? "Création..." : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

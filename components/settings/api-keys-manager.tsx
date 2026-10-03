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

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  function refresh() {
    fetch("/api/keys")
      .then((res) => res.json())
      .then(setKeys)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Une erreur est survenue.");
      setSubmitting(false);
      return;
    }

    const created = await res.json();
    setSubmitting(false);
    setName("");
    setRevealedKey(created.key);
    refresh();
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    refresh();
  }

  function closeDialog() {
    setOpen(false);
    setRevealedKey(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {!loading && keys.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune clé API pour le moment.</p>
      )}

      {keys.length > 0 && (
        <ul className="flex flex-col gap-2">
          {keys.map((key) => (
            <li
              key={key.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{key.keyPrefix}…</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleRevoke(key.id)}>
                Révoquer
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
          Créer une clé API
        </DialogTrigger>
        <DialogContent>
          {revealedKey ? (
            <>
              <DialogHeader>
                <DialogTitle>Clé créée</DialogTitle>
                <DialogDescription>
                  Copie-la maintenant — elle ne sera plus jamais affichée.
                </DialogDescription>
              </DialogHeader>
              <p className="rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm break-all">
                {revealedKey}
              </p>
              <DialogFooter>
                <Button onClick={closeDialog}>Fermer</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Créer une clé API</DialogTitle>
                <DialogDescription>
                  Utilise-la pour accéder à l&apos;API Mastered (voir la documentation).
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="api-key-name">Nom</Label>
                  <Input
                    id="api-key-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Script perso, raccourci iOS…"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
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

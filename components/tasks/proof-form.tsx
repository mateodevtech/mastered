"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type ProofType = "text" | "photo" | "checkbox";

export function ProofForm({
  taskId,
  proofType,
  onSubmitted,
}: {
  taskId: string;
  proofType: ProofType;
  onSubmitted: () => void;
}) {
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let body: Record<string, unknown>;

      if (proofType === "text") {
        if (!textContent.trim()) throw new Error("Écris une réponse.");
        body = { type: "text", textContent };
      } else if (proofType === "checkbox") {
        body = { type: "checkbox", checked: true };
      } else {
        if (!file) throw new Error("Choisis une photo.");
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/uploads/photo", { method: "POST", body: formData });
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => null);
          throw new Error(data?.error ?? "Échec de l'envoi de la photo.");
        }
        const { url } = await uploadRes.json();
        body = { type: "photo", photoUrl: url };
      }

      const res = await fetch(`/api/tasks/${taskId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Une erreur est survenue.");
      }

      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {proofType === "text" && (
        <Textarea
          autoFocus
          placeholder="Décris ce que tu as fait..."
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
        />
      )}
      {proofType === "photo" && (
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      )}
      {proofType === "checkbox" && (
        <p className="text-sm text-muted-foreground">Confirme que c&apos;est fait.</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Envoi..." : "Soumettre la preuve"}
      </Button>
    </form>
  );
}

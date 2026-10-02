"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GoalType = "one_off" | "recurring";

export default function NewGoalPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GoalType>("one_off");
  const [deadline, setDeadline] = useState("");
  const [timesPerWeek, setTimesPerWeek] = useState("3");
  const [customRewardText, setCustomRewardText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      title,
      description: description || undefined,
      type,
      deadline: type === "one_off" && deadline ? new Date(deadline).toISOString() : undefined,
      recurrenceTimesPerWeek: type === "recurring" ? Number(timesPerWeek) : undefined,
      customRewardText: customRewardText || undefined,
    };

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Une erreur est survenue.");
      setSubmitting(false);
      return;
    }

    const goal = await res.json();
    router.push(`/goals/${goal.id}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Nouvel objectif</CardTitle>
          <CardDescription>
            Un objectif ponctuel a une échéance fixe ; un objectif récurrent est une
            habitude à répéter chaque semaine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Courir un semi-marathon"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Type d&apos;objectif</Label>
              <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_off">Ponctuel (avec échéance)</SelectItem>
                  <SelectItem value="recurring">Récurrent (habitude)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "one_off" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="deadline">Échéance</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Label htmlFor="timesPerWeek">Fois par semaine</Label>
                <Input
                  id="timesPerWeek"
                  type="number"
                  min={1}
                  max={14}
                  required
                  value={timesPerWeek}
                  onChange={(e) => setTimesPerWeek(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="reward">Récompense personnelle (optionnel)</Label>
              <Input
                id="reward"
                value={customRewardText}
                onChange={(e) => setCustomRewardText(e.target.value)}
                placeholder="Ex : Je m'offre un resto"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? "Création..." : "Créer l'objectif"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProofDialog } from "@/components/tasks/proof-dialog";

type Task = {
  id: string;
  title: string;
  deadline: string | Date;
  status: string;
  notificationMode: string;
  isCriticalCommitment: boolean;
  requiresProof: boolean;
  proofType?: "text" | "photo" | "checkbox" | null;
};

export function TaskRow({ task }: { task: Task }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isDone = task.status === "done";

  function markDone() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Une erreur est survenue.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={isDone ? "line-through text-muted-foreground" : ""}>
            {task.title}
          </span>
          {task.notificationMode === "blocking" && (
            <Badge variant="destructive">Alarme bloquante</Badge>
          )}
          {task.requiresProof && <Badge variant="outline">Preuve requise</Badge>}
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(task.deadline).toLocaleString("fr-FR")}
        </span>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>

      {!isDone && !task.requiresProof && (
        <Button size="sm" variant="outline" disabled={isPending} onClick={markDone}>
          {isPending ? "..." : "Marquer fait"}
        </Button>
      )}
      {!isDone && task.requiresProof && task.proofType && (
        <ProofDialog taskId={task.id} proofType={task.proofType} />
      )}
    </div>
  );
}

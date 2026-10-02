"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProofForm } from "@/components/tasks/proof-form";

type ProofType = "text" | "photo" | "checkbox";
type AlarmState = "ringing" | "muted" | "submitting_proof" | "rescheduling" | "resolved";

type Task = {
  id: string;
  title: string;
  deadline: string | Date;
  proofType: ProofType | null;
};

export function AlarmScreen({ task, goalTitle }: { task: Task; goalTitle: string }) {
  const router = useRouter();
  const [state, setState] = useState<AlarmState>("ringing");
  const [newDeadline, setNewDeadline] = useState("");
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopAlarmSound() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }

  // Synthesized tone (no audio asset to source/license): a short sine
  // chirp repeated on an interval, steady rather than jarring per the
  // design brief — urgent, not alarming.
  function playBeep() {
    try {
      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 660;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext may be blocked without a prior user gesture — the
      // visual state still communicates urgency without sound.
    }
  }

  useEffect(() => {
    if (state !== "ringing") return;
    playBeep();
    intervalRef.current = setInterval(playBeep, 1500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  useEffect(() => {
    if (state !== "resolved") return;
    stopAlarmSound();
    const timer = setTimeout(() => router.push("/dashboard"), 2000);
    return () => clearTimeout(timer);
  }, [state, router]);

  function mute() {
    stopAlarmSound();
    setState("muted");
  }

  async function markDoneDirectly() {
    setConfirming(true);
    setConfirmError(null);
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    if (res.ok) {
      setState("resolved");
    } else {
      const data = await res.json().catch(() => null);
      setConfirmError(data?.error ?? "Une erreur est survenue.");
    }
    setConfirming(false);
  }

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    setRescheduling(true);
    setRescheduleError(null);

    const res = await fetch(`/api/tasks/${task.id}/snooze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newDeadline: new Date(newDeadline).toISOString() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setRescheduleError(data?.error ?? "Une erreur est survenue.");
      setRescheduling(false);
      return;
    }

    setState("resolved");
  }

  const isRingingOrMuted = state === "ringing" || state === "muted";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      {isRingingOrMuted && (
        <>
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {goalTitle}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">{task.title}</h1>
          <p className="text-muted-foreground">
            Échéance atteinte le {new Date(task.deadline).toLocaleString("fr-FR")}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => setState("submitting_proof")}>
              {task.proofType ? "Soumettre une preuve" : "C'est fait"}
            </Button>
            <Button size="lg" variant="outline" onClick={() => setState("rescheduling")}>
              Reporter l&apos;échéance
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={mute}>
            {state === "muted" ? "Son coupé" : "Couper le son"}
          </Button>
        </>
      )}

      {state === "submitting_proof" && (
        <div className="w-full max-w-sm text-left">
          <h2 className="mb-4 text-center text-lg font-medium">{task.title}</h2>
          {task.proofType ? (
            <ProofForm
              taskId={task.id}
              proofType={task.proofType}
              onSubmitted={() => setState("resolved")}
            />
          ) : (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-muted-foreground">Confirme que c&apos;est fait.</p>
              {confirmError && <p className="text-sm text-destructive">{confirmError}</p>}
              <Button onClick={markDoneDirectly} disabled={confirming}>
                {confirming ? "..." : "C'est fait"}
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setState("ringing")}
          >
            Retour
          </Button>
        </div>
      )}

      {state === "rescheduling" && (
        <form onSubmit={handleReschedule} className="flex w-full max-w-sm flex-col gap-4 text-left">
          <h2 className="text-center text-lg font-medium">Nouvelle échéance</h2>
          <Input
            type="datetime-local"
            required
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
          />
          {rescheduleError && <p className="text-sm text-destructive">{rescheduleError}</p>}
          <Button type="submit" disabled={rescheduling}>
            {rescheduling ? "..." : "Reporter"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setState("ringing")}>
            Retour
          </Button>
        </form>
      )}

      {state === "resolved" && (
        <p className="text-lg font-medium">C&apos;est noté. Retour au tableau de bord...</p>
      )}
    </div>
  );
}

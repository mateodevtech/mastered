import type { ExportTaskRow } from "@/lib/db/queries/export";

const CSV_HEADER = ["Objectif", "Type", "Tâche", "Statut", "Échéance", "Preuve requise"];

const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  done: "Terminée",
  missed: "Manquée",
  snoozed: "Reportée",
};

const GOAL_TYPE_LABELS: Record<string, string> = {
  one_off: "Ponctuel",
  recurring: "Récurrent",
  long_term: "Long terme",
};

// Escapes a field per RFC 4180: wrap in quotes and double any embedded quote
// whenever the value contains a comma, quote, or newline.
function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildTasksCsv(rows: ExportTaskRow[]): string {
  const lines = [CSV_HEADER.join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.goalTitle,
        GOAL_TYPE_LABELS[row.goalType] ?? row.goalType,
        row.taskTitle,
        TASK_STATUS_LABELS[row.taskStatus] ?? row.taskStatus,
        row.deadline.toISOString(),
        row.requiresProof ? "Oui" : "Non",
      ]
        .map((field) => escapeCsvField(String(field)))
        .join(","),
    );
  }

  // Leading BOM so Excel detects UTF-8 and renders accented characters correctly.
  return "﻿" + lines.join("\n") + "\n";
}

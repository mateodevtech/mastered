import { describe, expect, it } from "vitest";
import type { ExportTaskRow } from "@/lib/db/queries/export";
import { buildTasksCsv } from "./csv";

function row(overrides: Partial<ExportTaskRow> = {}): ExportTaskRow {
  return {
    goalTitle: "Courir un marathon",
    goalType: "recurring",
    taskTitle: "Sortie de 10km",
    taskStatus: "done",
    deadline: new Date("2026-03-17T10:00:00Z"),
    requiresProof: true,
    ...overrides,
  };
}

describe("buildTasksCsv", () => {
  it("includes a UTF-8 BOM and a header row", () => {
    const csv = buildTasksCsv([]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("Objectif,Type,Tâche,Statut,Échéance,Preuve requise");
  });

  it("translates enum values to French labels", () => {
    const csv = buildTasksCsv([row()]);
    expect(csv).toContain("Récurrent");
    expect(csv).toContain("Terminée");
    expect(csv).toContain("Oui");
  });

  it("escapes fields containing commas or quotes", () => {
    const csv = buildTasksCsv([row({ taskTitle: 'Dire "bonjour", puis partir' })]);
    expect(csv).toContain('"Dire ""bonjour"", puis partir"');
  });

  it("serializes the deadline as ISO-8601", () => {
    const csv = buildTasksCsv([row()]);
    expect(csv).toContain("2026-03-17T10:00:00.000Z");
  });
});

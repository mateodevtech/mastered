import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getExportTasksForUser } from "@/lib/db/queries/export";
import { buildTasksCsv } from "@/lib/export/csv";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const rows = await getExportTasksForUser(user.id);
  const csv = buildTasksCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mastered-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

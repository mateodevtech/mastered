import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getExportGoalSummariesForUser } from "@/lib/db/queries/export";
import { buildProgressReportPdf } from "@/lib/export/pdf";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const goals = await getExportGoalSummariesForUser(user.id);
  const pdf = await buildProgressReportPdf(user.email, goals);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mastered-rapport-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}

import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ExportGoalSummary } from "@/lib/db/queries/export";

const GOAL_TYPE_LABELS: Record<string, string> = {
  one_off: "Ponctuel",
  recurring: "Récurrent",
  long_term: "Long terme",
};

const GOAL_STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  completed: "Terminé",
  abandoned: "Abandonné",
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 20, marginBottom: 4 },
  subtitle: { fontSize: 11, marginBottom: 20, color: "#555555" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#111111",
    paddingBottom: 6,
    marginBottom: 2,
  },
  headerCell: { fontSize: 10, fontWeight: 700, color: "#111111" },
  cellGoal: { flex: 3 },
  cellSmall: { flex: 1.3, textAlign: "center" },
});

function completionRate(summary: ExportGoalSummary): string {
  if (summary.totalTasks === 0) return "—";
  return `${Math.round((summary.doneTasks / summary.totalTasks) * 100)}%`;
}

function ReportDocument({
  userEmail,
  goals,
  generatedAt,
}: {
  userEmail: string;
  goals: ExportGoalSummary[];
  generatedAt: Date;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Rapport de progression Mastered</Text>
        <Text style={styles.subtitle}>
          {userEmail} · généré le{" "}
          {generatedAt.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
        </Text>

        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.cellGoal]}>Objectif</Text>
          <Text style={[styles.headerCell, styles.cellSmall]}>Type</Text>
          <Text style={[styles.headerCell, styles.cellSmall]}>Statut</Text>
          <Text style={[styles.headerCell, styles.cellSmall]}>Complétion</Text>
          <Text style={[styles.headerCell, styles.cellSmall]}>Série</Text>
          <Text style={[styles.headerCell, styles.cellSmall]}>Record</Text>
        </View>

        {goals.map((goal) => (
          <View style={styles.row} key={goal.goalId}>
            <Text style={styles.cellGoal}>{goal.title}</Text>
            <Text style={styles.cellSmall}>{GOAL_TYPE_LABELS[goal.type] ?? goal.type}</Text>
            <Text style={styles.cellSmall}>{GOAL_STATUS_LABELS[goal.status] ?? goal.status}</Text>
            <Text style={styles.cellSmall}>{completionRate(goal)}</Text>
            <Text style={styles.cellSmall}>{goal.currentStreak}</Text>
            <Text style={styles.cellSmall}>{goal.longestStreak}</Text>
          </View>
        ))}

        {goals.length === 0 && <Text>Aucun objectif pour le moment.</Text>}
      </Page>
    </Document>
  );
}

export async function buildProgressReportPdf(
  userEmail: string,
  goals: ExportGoalSummary[],
): Promise<Buffer> {
  return renderToBuffer(<ReportDocument userEmail={userEmail} goals={goals} generatedAt={new Date()} />);
}

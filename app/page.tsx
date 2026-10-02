import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Mastered</h1>
      <p className="max-w-md text-balance text-muted-foreground">
        Atteins tes objectifs. Un Veilleur à tes côtés pour t&apos;aider à
        tenir tes engagements.
      </p>
      <Button size="lg" nativeButton={false} render={<Link href="/login" />}>
        Commencer
      </Button>
    </main>
  );
}

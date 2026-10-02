"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProofForm } from "@/components/tasks/proof-form";

export function ProofDialog({
  taskId,
  proofType,
}: {
  taskId: string;
  proofType: "text" | "photo" | "checkbox";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Soumettre une preuve
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preuve requise</DialogTitle>
        </DialogHeader>
        <ProofForm
          taskId={taskId}
          proofType={proofType}
          onSubmitted={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

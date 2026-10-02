import { z } from "zod";

export const proofTypeSchema = z.enum(["text", "photo", "checkbox"]);

export const createTaskSchema = z
  .object({
    goalId: z.string().uuid(),
    title: z.string().trim().min(1, "Titre requis").max(200),
    deadline: z.string().datetime(),
    isCriticalCommitment: z.boolean().default(false),
    notificationMode: z.enum(["normal", "blocking"]).default("normal"),
    requiresProof: z.boolean().default(false),
    proofType: proofTypeSchema.optional(),
  })
  .refine((data) => data.notificationMode !== "blocking" || data.isCriticalCommitment, {
    message: "L'alarme bloquante nécessite de marquer la tâche comme engagement critique",
    path: ["notificationMode"],
  })
  .refine((data) => !data.requiresProof || !!data.proofType, {
    message: "Choisis un type de preuve",
    path: ["proofType"],
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(["pending", "done", "missed", "snoozed"]).optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

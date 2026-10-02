import { z } from "zod";

// "long_term" is reserved in the DB enum for V2 (phased goals + milestone
// reviews) but intentionally not offered here — MVP only creates these two.
export const goalTypeSchema = z.enum(["one_off", "recurring"]);

export const createGoalSchema = z
  .object({
    title: z.string().trim().min(1, "Titre requis").max(200),
    description: z.string().trim().max(2000).optional(),
    type: goalTypeSchema,
    deadline: z.string().datetime().optional(),
    recurrenceTimesPerWeek: z.number().int().min(1).max(14).optional(),
    customRewardText: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.type !== "one_off" || !!data.deadline, {
    message: "Une échéance est requise pour un objectif ponctuel",
    path: ["deadline"],
  })
  .refine((data) => data.type !== "recurring" || !!data.recurrenceTimesPerWeek, {
    message: "Indique combien de fois par semaine",
    path: ["recurrenceTimesPerWeek"],
  });

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["active", "completed", "abandoned"]).optional(),
  customRewardText: z.string().trim().max(500).optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

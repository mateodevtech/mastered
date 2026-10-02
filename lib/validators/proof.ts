import { z } from "zod";

export const submitProofSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("checkbox"), checked: z.literal(true) }),
  z.object({ type: z.literal("text"), textContent: z.string().trim().min(1).max(5000) }),
  z.object({ type: z.literal("photo"), photoUrl: z.string().url() }),
]);

export type SubmitProofInput = z.infer<typeof submitProofSchema>;

export const snoozeSchema = z.object({
  newDeadline: z.string().datetime(),
});

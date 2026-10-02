import { z } from "zod";

export const inviteVeilleurSchema = z.object({
  goalId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
});

export type InviteVeilleurInput = z.infer<typeof inviteVeilleurSchema>;

const baseRespond = { proofId: z.string().uuid(), note: z.string().trim().max(1000).optional() };

export const veilleurRespondSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("validate"), ...baseRespond }),
  z.object({ action: z.literal("nudge"), ...baseRespond }),
  z.object({ action: z.literal("encourage"), ...baseRespond }),
  z.object({ action: z.literal("extend"), ...baseRespond, newDeadline: z.string().datetime() }),
]);

export type VeilleurRespondInput = z.infer<typeof veilleurRespondSchema>;

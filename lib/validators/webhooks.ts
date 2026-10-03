import { z } from "zod";

export const webhookEventSchema = z.enum([
  "task.completed",
  "goal.completed",
  "streak.broken",
  "streak.milestone",
]);

export const createWebhookSchema = z.object({
  url: z.string().trim().url("URL invalide").max(2000),
  events: z.array(webhookEventSchema).min(1, "Choisis au moins un événement"),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

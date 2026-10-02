import { z } from "zod";

export const requestLinkSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
});

export type RequestLinkInput = z.infer<typeof requestLinkSchema>;

import z from "zod";

export const settingsSchema = z.object({
  apiKey: z.string().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .or(z.literal(""))
    .optional(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

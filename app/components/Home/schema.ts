import { SignalType } from "@/generated/prisma/browser";
import z from "zod";

export const stationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3).max(100),
  signalType: z.enum(SignalType),
  streamUrl: z.url(),
  lowestFrequency: z.coerce.number(),
  highestFrequency: z.coerce.number(),
});
export type StationInput = z.infer<typeof stationSchema>;

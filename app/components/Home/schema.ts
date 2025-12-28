import { BandType } from "@/generated/prisma/browser";
import z from "zod";

export const BandTypeFilter = {
  ALL: "ALL",
  ...BandType,
} as const;
export type BandTypeFilter =
  (typeof BandTypeFilter)[keyof typeof BandTypeFilter];

export const stationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3).max(100),
  bandType: z.enum(BandType),
  streamUrl: z.url(),
  lowestFrequency: z.coerce.number(),
  highestFrequency: z.coerce.number(),
});
export type StationInput = z.infer<typeof stationSchema>;

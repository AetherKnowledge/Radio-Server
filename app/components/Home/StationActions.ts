"use server";

import { SignalType, Station } from "@/generated/prisma/browser";
import { isAuthenticated } from "@/lib/auth-utils.server";
import { prisma } from "@/lib/prisma";
import { v4 as uuid } from "uuid";
import { prettifyError } from "zod/v4/core";
import ActionResult from "../ActionResult";
import { StationInput, stationSchema } from "./schema";

export async function getStations(): Promise<ActionResult<Station[]>> {
  try {
    if (!isAuthenticated()) {
      return { success: false, message: "Unauthorized" };
    }

    const stations = await prisma.station.findMany();
    return { success: true, data: stations };
  } catch (err) {
    console.error("Error fetching stations:", err);
    return { success: false, message: (err as Error).message };
  }
}

export async function upsertStation(
  data: StationInput | FormData
): Promise<ActionResult<Station>> {
  try {
    if (!isAuthenticated()) {
      return { success: false, message: "Unauthorized" };
    }

    const validation = stationSchema.safeParse(
      data instanceof FormData ? Object.fromEntries(data) : data
    );
    if (!validation.success) {
      return {
        success: false,
        message: "Invalid station data: " + prettifyError(validation.error),
      };
    }

    const validatedData = validation.data;

    const stationExisting = await prisma.station.findUnique({
      where: { id: validatedData.id || "" },
    });

    if (stationExisting) {
      const station = await prisma.station.update({
        where: { id: validatedData.id },
        data: {
          name: validatedData.name,
          streamUrl: validatedData.streamUrl,
          signalType: validatedData.signalType,
          lowestFrequency: validatedData.lowestFrequency,
          highestFrequency: validatedData.highestFrequency,
        },
      });

      return { success: true, data: station };
    } else {
      const station = await prisma.station.create({
        data: {
          id: uuid(),
          name: validatedData.name,
          streamUrl: validatedData.streamUrl,
          signalType: validatedData.signalType,
          lowestFrequency: validatedData.lowestFrequency,
          highestFrequency: validatedData.highestFrequency,
        },
      });

      return { success: true, data: station };
    }
  } catch (err) {
    console.error("Error creating station:", err);
    return { success: false, message: (err as Error).message };
  }
}

export async function deleteStation(id: string): Promise<ActionResult<void>> {
  try {
    if (!isAuthenticated()) {
      return { success: false, message: "Unauthorized" };
    }

    await prisma.station.delete({
      where: { id },
    });
    return { success: true, data: undefined };
  } catch (err) {
    console.error("Error deleting station:", err);
    return { success: false, message: (err as Error).message };
  }
}

export async function getStation(
  signalType: SignalType,
  frequency: number
): Promise<ActionResult<Station>> {
  try {
    const station = await prisma.station.findFirst({
      where: {
        signalType,
        lowestFrequency: { lte: frequency },
        highestFrequency: { gte: frequency },
      },
    });
    if (!station) {
      return { success: false, message: "No station found for this frequency" };
    }
    return { success: true, data: station };
  } catch (err) {
    console.error("Error fetching station by frequency:", err);
    return { success: false, message: (err as Error).message };
  }
}

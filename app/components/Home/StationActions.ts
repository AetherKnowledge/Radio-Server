"use server";

import { BandType, Station } from "@/generated/prisma/browser";
import { isAuthenticated } from "@/lib/auth-utils.server";
import { prisma } from "@/lib/prisma";
import { v4 as generateUUID } from "uuid";
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

export async function getStationById(
  id: string
): Promise<ActionResult<Station>> {
  try {
    if (!isAuthenticated()) {
      return { success: false, message: "Unauthorized" };
    }
    const station = await prisma.station.findUnique({
      where: { id },
    });
    if (!station) {
      return { success: false, message: "Station not found" };
    }
    return { success: true, data: station };
  } catch (err) {
    console.error("Error fetching station by ID:", err);
    return { success: false, message: (err as Error).message };
  }
}

export async function createStation(): Promise<ActionResult<Station>> {
  try {
    if (!isAuthenticated()) {
      return { success: false, message: "Unauthorized" };
    }

    const highestFrequencyStation = await prisma.station.findFirst({
      orderBy: { highestFrequency: "desc" },
    });
    const newLowestFrequency = highestFrequencyStation
      ? highestFrequencyStation.highestFrequency + 1
      : 5;

    const station = await prisma.station.create({
      data: {
        id: generateUUID(),
        name: "New Station",
        streamUrl: "https://test.com",
        bandType: BandType.FM,
        lowestFrequency: newLowestFrequency,
        highestFrequency: newLowestFrequency + 5,
      },
    });

    return { success: true, data: station };
  } catch (err) {
    console.error("Error creating station:", err);
    return { success: false, message: (err as Error).message };
  }
}

export async function updateStation(
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

    if (!stationExisting) {
      return { success: false, message: "Station not found" };
    }

    if (validatedData.highestFrequency < validatedData.lowestFrequency) {
      return {
        success: false,
        message: "Highest frequency must be greater than lowest frequency",
      };
    }

    const hasOverlap = await prisma.station.findFirst({
      where: {
        id: { not: validatedData.id || undefined },
        bandType: validatedData.bandType,
        OR: [
          {
            AND: [
              { lowestFrequency: { lte: validatedData.lowestFrequency } },
              { highestFrequency: { gte: validatedData.lowestFrequency } },
            ],
          },
          {
            AND: [
              { lowestFrequency: { lte: validatedData.highestFrequency } },
              { highestFrequency: { gte: validatedData.highestFrequency } },
            ],
          },
        ],
      },
    });

    if (hasOverlap) {
      return {
        success: false,
        message: "Frequency range overlaps with an existing station",
      };
    }

    const station = await prisma.station.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        streamUrl: validatedData.streamUrl,
        bandType: validatedData.bandType,
        lowestFrequency: validatedData.lowestFrequency,
        highestFrequency: validatedData.highestFrequency,
      },
    });

    return { success: true, data: station };
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
  bandType: BandType,
  frequency: number
): Promise<ActionResult<Station>> {
  try {
    const station = await prisma.station.findFirst({
      where: {
        bandType,
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

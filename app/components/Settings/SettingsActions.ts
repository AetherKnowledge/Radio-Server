"use server";

import { Settings } from "@/generated/prisma/browser";
import { auth } from "@/lib/auth";
import { isAuthenticated } from "@/lib/auth-utils.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { prettifyError } from "zod/v4/core";
import ActionResult from "../ActionResult";
import { settingsSchema } from "./schema";

export async function getSettings(): Promise<ActionResult<Settings | null>> {
  try {
    const header = await headers();

    if (!isAuthenticated()) {
      return { success: false, message: "Unauthorized" };
    }

    const settings = await prisma.settings.findFirst();
    return { success: true, data: settings };
  } catch (error) {
    console.error("Error fetching settings:", error);
    return { success: false, message: (error as Error).message };
  }
}

export async function saveSettings(
  formData: FormData
): Promise<ActionResult<Settings>> {
  try {
    if (!isAuthenticated()) {
      return { success: false, message: "Unauthorized" };
    }

    const validation = settingsSchema.safeParse(Object.fromEntries(formData));
    if (!validation.success) {
      return {
        success: false,
        message: "Invalid settings data: " + prettifyError(validation.error),
      };
    }

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      create: { apiKey: validation.data.apiKey, id: 1 },
      update: { apiKey: validation.data.apiKey },
    });

    const header = await headers();
    const user = (await auth.api.getSession({ headers: header }))?.user;

    if (validation.data.password && user) {
      const data = await auth.api.setUserPassword({
        body: {
          newPassword: validation.data.password,
          userId: user.id,
        },
        headers: header,
      });

      if (!data.status) {
        return { success: false, message: "Failed to update password" };
      }
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error("Error saving settings:", error);
    return { success: false, message: (error as Error).message };
  }
}

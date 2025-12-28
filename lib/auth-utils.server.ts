import { env } from "next-runtime-env/build/script/env";
import { auth } from "./auth";
import { headers } from "next/headers";

export async function isAuthenticated(): Promise<boolean> {
  if (env("REQUIRE_AUTHENTICATION") !== "true") {
    return true;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    return false;
  }

  return true;
}

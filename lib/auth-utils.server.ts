import { env } from "next-runtime-env/build/script/env";

export async function isAuthenticated(): Promise<boolean> {
  if (env("REQUIRE_AUTHENTICATION") !== "true") {
    return true;
  }

  return true;
}

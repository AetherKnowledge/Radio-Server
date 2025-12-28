import { auth } from "@/lib/auth";
import { env } from "next-runtime-env";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import HomePage from "./components/Home";
import Navbar from "./components/Home/Navbar";

export default async function Home() {
  if (env("REQUIRE_AUTHENTICATION") === "true") {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      redirect("/login");
    }
  }

  return (
    <>
      <Navbar />
      <HomePage />
    </>
  );
}

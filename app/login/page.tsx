import { auth } from "@/lib/auth";
import { env } from "next-runtime-env";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Login from "../components/Login";

const page = async () => {
  if (env("REQUIRE_AUTHENTICATION") !== "true") {
    redirect("/");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/");
  }

  return <Login />;
};

export default page;

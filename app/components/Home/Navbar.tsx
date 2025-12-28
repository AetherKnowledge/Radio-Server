import ThemeController from "@/app/ThemeController";
import { Radio } from "lucide-react";
import { env } from "next-runtime-env";
import SignOutButton from "../Login/SignOutButton";
import SettingsButton from "../Settings/SettingsButton";

const Navbar = () => {
  const requireAuth = env("REQUIRE_AUTHENTICATION") === "true";

  return (
    <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl gap-2">
          <Radio className="w-6 h-6" />
          Radio Server
        </a>
      </div>
      <div className="flex-none gap-2">
        <ThemeController />
        {requireAuth && (
          <>
            <SettingsButton />
            <SignOutButton />
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;

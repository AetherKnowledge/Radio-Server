import ThemeController from "@/app/ThemeController";
import { Radio } from "lucide-react";

const Navbar = () => {
  return (
    <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl gap-2">
          <Radio className="w-6 h-6" />
          Radio Server
        </a>
      </div>
      <div className="flex-none">
        <ThemeController />
      </div>
    </div>
  );
};

export default Navbar;

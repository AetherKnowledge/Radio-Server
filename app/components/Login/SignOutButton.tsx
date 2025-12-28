"use client";

import { signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePopup } from "../Popup/PopupProvider";

const SignOutButton = () => {
  const router = useRouter();
  const statusPopup = usePopup();

  const handleLogout = async () => {
    const result = await signOut();
    if (result.error) {
      statusPopup.showError(result.error.message || "Failed to sign out");
      return;
    }

    if (result.data.success) {
      router.push("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="btn btn-ghost btn-circle hover:bg-error hover:text-error-content transition-colors"
      aria-label="Logout"
    >
      <LogOut className="w-6 h-6 text-base-content hover:text-error-content" />
    </button>
  );
};

export default SignOutButton;

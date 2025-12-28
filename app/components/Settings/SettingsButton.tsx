"use client";

import { Settings } from "lucide-react";
import { useState } from "react";
import SettingsPopup from "./SettingsPopup";

const SettingsButton = () => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <button
        className="btn btn-ghost btn-circle hover:bg-base-300 transition-colors"
        aria-label="Settings"
        onClick={() => setShowPopup(!showPopup)}
      >
        <Settings className="w-6 h-6 text-base-content" />
      </button>
      {showPopup && <SettingsPopup onClose={() => setShowPopup(false)} />}
    </>
  );
};

export default SettingsButton;

"use client";
import { Station } from "@/generated/prisma/browser";
import { Plus } from "lucide-react";
import { useState } from "react";
import { usePopup } from "../../Popup/PopupProvider";
import { createStation } from "../StationActions";

const AddButton = ({ onAdd }: { onAdd?: (station: Station) => void }) => {
  const statusPopup = usePopup();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    const result = await createStation();
    setIsLoading(false);

    if (!result.success) {
      statusPopup.showError(
        result.message || "Failed to save station: " + result.message
      );
      return;
    }

    onAdd?.(result.data);
  };

  return (
    <button
      className="btn btn-primary gap-2 hover:gap-3 transition-all"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          <span>Adding...</span>
        </>
      ) : (
        <>
          <Plus className="w-5 h-5" />
          <span>Add Station</span>
        </>
      )}
    </button>
  );
};

export default AddButton;

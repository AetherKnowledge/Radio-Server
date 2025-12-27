"use client";
import { Station } from "@/generated/prisma/browser";
import { Plus } from "lucide-react";
import { useState } from "react";
import { v4 as uuid } from "uuid";
import { usePopup } from "../../Popup/PopupProvider";
import { upsertStation } from "../StationActions";

const AddButton = ({ onAdd }: { onAdd?: (station: Station) => void }) => {
  const statusPopup = usePopup();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    const newStation: Station = {
      id: uuid(),
      name: "New Station",
      streamUrl: "https://test.com",
      signalType: "FM",
      lowestFrequency: 5,
      highestFrequency: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await upsertStation(newStation);
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

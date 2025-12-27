"use client";

import { Station } from "@/generated/prisma/browser";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePopup } from "../../Popup/PopupProvider";
import { deleteStation } from "../StationActions";

const DeleteButton = ({
  station,
  onDelete,
}: {
  station: Station;
  onDelete?: () => void;
}) => {
  const router = useRouter();
  const statusPopup = usePopup();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const result = await deleteStation(station.id);
    setIsLoading(false);

    if (!result.success) {
      statusPopup.showError(
        result.message || "Failed to delete station: " + result.message
      );
      return;
    }

    onDelete?.();
  };

  return (
    <button
      className="btn btn-error gap-2 hover:gap-3 transition-all"
      type="button"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          <span>Deleting...</span>
        </>
      ) : (
        <>
          <Trash2 className="w-5 h-5" />
          <span>Delete</span>
        </>
      )}
    </button>
  );
};

export default DeleteButton;

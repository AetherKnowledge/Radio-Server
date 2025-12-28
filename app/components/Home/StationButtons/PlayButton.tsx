"use client";

import { Play } from "lucide-react";

interface PlayButtonProps {
  onClick: () => void;
  loading?: boolean;
}

const PlayButton = ({ onClick, loading = false }: PlayButtonProps) => {
  return (
    <button
      className="btn btn-accent gap-2 hover:gap-3 transition-all"
      type="button"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          <span>Loading...</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          <span>Play</span>
        </>
      )}
    </button>
  );
};

export default PlayButton;

"use client";

import { Save } from "lucide-react";

const SaveButton = ({ loading }: { loading: boolean }) => {
  return (
    <button
      className="btn btn-primary gap-2 hover:gap-3 transition-all"
      type="submit"
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          <span>Save</span>
        </>
      )}
    </button>
  );
};

export default SaveButton;

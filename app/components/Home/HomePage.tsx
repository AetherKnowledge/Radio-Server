"use client";
import { Station } from "@/generated/prisma/client";
import { Loader2, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { usePopup } from "../Popup/PopupProvider";
import { getStations } from "./StationActions";
import AddButton from "./StationButtons/AddButton";
import StationCollapse from "./StationsCollapse";

const HomePage = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const statusPopup = usePopup();

  useEffect(() => {
    async function fetchStations() {
      const result = await getStations();
      setIsLoading(false);
      if (!result.success) {
        statusPopup.showError(result.message || "Error loading stations");
        return;
      }

      setStations(result.data || []);
    }
    fetchStations();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading stations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Radio className="w-10 h-10 text-primary" />
            Station Management
          </h1>
          <p className="text-base-content/60 mt-2">
            Manage your radio stations and stream URLs
          </p>
        </div>
        <AddButton
          onAdd={(newStation) => setStations((prev) => [...prev, newStation])}
        />
      </div>

      {/* Stations List */}
      {stations.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center py-16">
            <Radio className="w-20 h-20 text-base-content/20 mb-4" />
            <h2 className="card-title text-2xl">No Stations Yet</h2>
            <p className="text-base-content/60">
              Get started by adding your first radio station
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {stations.map((station) => (
            <StationCollapse
              key={station.id}
              station={station}
              onDelete={() =>
                setStations((prev) => prev.filter((s) => s.id !== station.id))
              }
              onSave={(updatedStation) =>
                setStations((prev) =>
                  prev.map((s) =>
                    s.id === updatedStation.id ? updatedStation : s
                  )
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;

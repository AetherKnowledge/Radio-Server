"use client";
import { Station } from "@/generated/prisma/client";
import { Filter, Loader2, Radio, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePopup } from "../Popup/PopupProvider";
import AudioPlayer from "./AudioPlayer";
import { BandTypeFilter } from "./schema";
import { getStations } from "./StationActions";
import AddButton from "./StationButtons/AddButton";
import FilterButton from "./StationButtons/FilterButton";
import StationCollapse from "./StationsCollapse";

const HomePage = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [playingStation, setPlayingStation] = useState<Station | null>(null);
  const statusPopup = usePopup();

  // Filter states
  const [signalTypeFilter, setSignalTypeFilter] =
    useState<BandTypeFilter>("ALL");
  const [minFrequency, setMinFrequency] = useState<string>("");
  const [maxFrequency, setMaxFrequency] = useState<string>("");

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

  // Filter stations based on selected filters
  const filteredStations = stations.filter((station) => {
    // Filter by band type
    if (signalTypeFilter !== "ALL" && station.bandType !== signalTypeFilter) {
      return false;
    }

    // Filter by minimum frequency
    if (minFrequency && station.highestFrequency < parseFloat(minFrequency)) {
      return false;
    }

    // Filter by maximum frequency
    if (maxFrequency && station.lowestFrequency > parseFloat(maxFrequency)) {
      return false;
    }

    return true;
  });

  const hasActiveFilters =
    signalTypeFilter !== "ALL" || minFrequency !== "" || maxFrequency !== "";

  const clearFilters = () => {
    setSignalTypeFilter("ALL");
    setMinFrequency("");
    setMaxFrequency("");
  };

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
    <>
      <div className="max-w-5xl mx-auto container px-4 py-8 overflow-y-auto min-h-0">
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

        {/* Filters Section */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn btn-ghost btn-xs gap-1 ml-auto"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Signal Type Filter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Signal Type</span>
                </label>
                <div className="flex flex-row gap-2 w-full md:w-35">
                  {Object.values(BandTypeFilter).map((type) => (
                    <FilterButton
                      key={type}
                      bandTypeFilter={type}
                      onClick={setSignalTypeFilter}
                      isActive={signalTypeFilter === type}
                    />
                  ))}
                </div>
              </div>

              {/* Minimum Frequency Filter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Min Frequency (MHz)
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="e.g., 88.0"
                  className="input input-bordered w-full"
                  value={minFrequency}
                  onChange={(e) => setMinFrequency(e.target.value)}
                  min={0}
                />
              </div>

              {/* Maximum Frequency Filter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Max Frequency (MHz)
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="e.g., 108.0"
                  className="input input-bordered w-full"
                  value={maxFrequency}
                  onChange={(e) => setMaxFrequency(e.target.value)}
                  min={0}
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-base-content/60 mt-4">
              Showing {filteredStations.length} of {stations.length} station
              {stations.length !== 1 ? "s" : ""}
            </div>
          </div>
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
        ) : filteredStations.length === 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-16">
              <Filter className="w-20 h-20 text-base-content/20 mb-4" />
              <h2 className="card-title text-2xl">
                No Stations Match Your Filters
              </h2>
              <p className="text-base-content/60">
                Try adjusting your filter criteria
              </p>
              <button
                onClick={clearFilters}
                className="btn btn-primary mt-4 gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStations.map((station) => (
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
                onPlay={(station) => setPlayingStation(station)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Audio Player */}
      {playingStation && (
        <AudioPlayer
          station={playingStation}
          onClose={() => setPlayingStation(null)}
        />
      )}
    </>
  );
};

export default HomePage;

"use client";

import { Station } from "@/generated/prisma/browser";
import { ChevronDown, Radio, Waves } from "lucide-react";
import { useState } from "react";
import ComboBox from "../Input/ComboBox";
import TextBox from "../Input/TextBox";
import { usePopup } from "../Popup/PopupProvider";
import { updateStation } from "./StationActions";
import DeleteButton from "./StationButtons/DeleteButton";
import PlayButton from "./StationButtons/PlayButton";
import SaveButton from "./StationButtons/SaveButton";

const StationCollapse = ({
  station,
  onSave,
  onDelete,
  onPlay,
}: {
  station: Station;
  onSave?: (station: Station) => void;
  onDelete?: () => void;
  onPlay?: (station: Station) => void;
}) => {
  const inputId = station.id + "-collapse";
  const statusPopup = usePopup();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const formData = new FormData(event.currentTarget);
    const result = await updateStation(formData);
    setSaving(false);

    if (!result.success) {
      statusPopup.showError(result.message || "Failed to save station");
    } else if (result.data) {
      onSave?.(result.data);
    }
  }

  return (
    <div className="collapse rounded-xl shadow-lg bg-base-100 border border-base-300 hover:shadow-xl">
      {/* hide the checkbox visually but keep it accessible; use it as the peer */}
      <input id={inputId} type="checkbox" className="peer sr-only" />
      {/* clicking the title toggles the checkbox so peer-checked styles apply */}
      <label
        htmlFor={inputId}
        className="collapse-title font-semibold flex items-center justify-between pr-4 cursor-pointer select-none peer-checked:[&_svg]:rotate-180"
      >
        <div className="flex flex-row gap-3 items-center">
          <div className="badge badge-primary badge-lg gap-2">
            {station.bandType === "FM" ? (
              <Waves className="w-4 h-4" />
            ) : (
              <Radio className="w-4 h-4" />
            )}
            {station.bandType}
          </div>
          <span className="text-lg">{station.name}</span>
          <span className="text-sm font-normal text-base-content/60">
            {station.lowestFrequency}-{station.highestFrequency} MHz
          </span>
        </div>
        <ChevronDown className="w-6 h-6 transition-transform duration-300 ease-in-out" />
      </label>
      <form onSubmit={handleSubmit} className="collapse-content p-6 py-0">
        <div className="flex flex-col gap-4">
          <input
            type="hidden"
            name="id"
            value={station.id}
            className="sr-only"
          />

          {/* Station Name */}
          <div className="form-control w-full">
            <TextBox
              name="name"
              legend="Station Name"
              defaultValue={station.name}
              className="w-full"
              required
            />
          </div>

          {/* Frequency and Signal Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <TextBox
                name="lowestFrequency"
                legend="Lowest Frequency (MHz)"
                defaultValue={station.lowestFrequency.toString()}
                className="w-full"
                type="number"
                required
              />
            </div>
            <div className="form-control">
              <TextBox
                name="highestFrequency"
                legend="Highest Frequency (MHz)"
                defaultValue={station.highestFrequency.toString()}
                className="w-full"
                type="number"
                required
              />
            </div>
            <div className="form-control">
              <ComboBox
                name="bandType"
                legend="Band Type"
                placeholder="Select Type"
                options={[
                  { label: "AM", value: "AM" },
                  { label: "FM", value: "FM" },
                ]}
                defaultValue={station.bandType}
                className="w-full"
                required
              />
            </div>
          </div>

          {/* Stream URL */}
          <div className="form-control w-full">
            <TextBox
              name="streamUrl"
              legend="Stream URL"
              defaultValue={station.streamUrl}
              className="w-full"
              type="url"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-3 justify-end items-center mt-4 pt-4 border-t border-base-300 pb-6">
            <PlayButton onClick={() => onPlay?.(station)} />
            <SaveButton loading={saving} />
            <DeleteButton station={station} onDelete={onDelete} />
          </div>
        </div>
      </form>
    </div>
  );
};

export default StationCollapse;

"use client";

import { Settings as SettingsData } from "@/generated/prisma/browser";
import { Settings, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SaveButton from "../Home/StationButtons/SaveButton";
import TextBox from "../Input/TextBox";
import ModalBase from "../Popup/ModalBase";
import { usePopup } from "../Popup/PopupProvider";
import { getSettings, saveSettings } from "./SettingsActions";

const SettingsPopup = ({ onClose }: { onClose: () => void }) => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const statusPopup = usePopup();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const formData = new FormData(event.currentTarget);

    const result = await saveSettings(formData);
    setSaving(false);

    if (!result.success) {
      statusPopup.showError(result.message || "Failed to save settings");
      return;
    }

    setSettings(result.data);

    statusPopup.showSuccess("Settings saved successfully");
    router.refresh();
  };

  useEffect(() => {
    async function fetchSettings() {
      const result = await getSettings();
      if (!result.success) {
        statusPopup.showError(result.message || "Error loading settings");
        return;
      }
      setSettings(result.data);
    }
    fetchSettings();
  }, []);

  return (
    <ModalBase onClose={onClose}>
      <div className="flex flex-col gap-6 bg-base-100 p-6 rounded-lg max-w-96 w-screen">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-base-300 pb-4">
          <Settings className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Settings</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Password Field */}
          <div className="form-control w-full">
            <TextBox
              name="password"
              legend="Password"
              type="password"
              placeholder="Enter new password"
              className="w-full"
              size="input-md"
            />
          </div>

          {/* API Key Field */}
          <div className="form-control w-full">
            <TextBox
              name="apiKey"
              legend="API Key"
              type="text"
              placeholder="Enter new API key"
              className="w-full"
              size="input-md"
              defaultValue={settings?.apiKey || ""}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-3 mt-4 pt-4 border-t border-base-300">
            <SaveButton loading={saving} />

            <button
              type="button"
              onClick={onClose}
              className="btn btn-error gap-2 hover:gap-3 transition-all"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </form>
      </div>
    </ModalBase>
  );
};

export default SettingsPopup;

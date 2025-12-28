"use client";

import { Station } from "@/generated/prisma/browser";
import { getCookie, setCookie } from "cookies-next";
import { Pause, Play, Radio, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  station: Station;
  onClose: () => void;
}

const AudioPlayer = ({ station, onClose }: AudioPlayerProps) => {
  const volumeCookie = getCookie("volume") as string | undefined;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(
    volumeCookie && !isNaN(parseInt(volumeCookie)) ? parseInt(volumeCookie) : 70
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set initial volume
    audio.volume = volume / 100;

    const handleCanPlay = () => {
      setIsLoading(false);
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        setIsPlaying(false);
      });
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    // Start loading
    audio.load();

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audio.pause();
    };
  }, [station]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);

    setCookie("volume", newVolume.toString(), { path: "/" });

    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const streamUrl = `/api/stations?bandType=${station.bandType}&channel=${
    (station.lowestFrequency + station.highestFrequency) / 2
  }`;

  return (
    <div className="sticky bottom-0 left-0 right-0 z-50 bg-base-200 shadow-2xl border-t border-base-300">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Station Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center">
                <Radio className="w-6 h-6" />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">{station.name}</h3>
              <p className="text-sm text-base-content/60">
                {station.bandType} •{" "}
                {(station.lowestFrequency + station.highestFrequency) / 2} MHz
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className="btn btn-circle btn-primary btn-lg"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-md"></span>
              ) : isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 w-32">
              <button
                onClick={toggleMute}
                className="btn btn-ghost btn-sm btn-circle"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="range range-primary range-xs"
              />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={streamUrl} preload="auto" />
    </div>
  );
};

export default AudioPlayer;

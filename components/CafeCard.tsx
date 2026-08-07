"use client";

import {
  Coffee,
  PersonStanding,
  PlugZap,
  Star,
  Volume2,
  VolumeX,
  Wallet,
  Wifi,
} from "lucide-react";
import { Cafe } from "@/types/cafe";
import FeatureChip, { type FeatureTone } from "./FeatureChip";

interface CafeCardProps {
  cafe: Cafe;
  selected: boolean;
  onClick: () => void;
}

export default function CafeCard({
  cafe,
  selected,
  onClick,
}: CafeCardProps) {
  const wifiTone: FeatureTone = cafe.wifi === "Okay WiFi" ? "neutral" : "good";
  const noiseTone: FeatureTone =
    cafe.noise === "Quiet"
      ? "good"
      : cafe.noise === "Moderate"
        ? "neutral"
        : "poor";
  const socketsTone: FeatureTone =
    cafe.sockets === "Plenty"
      ? "good"
      : cafe.sockets === "Some"
        ? "neutral"
        : "warning";

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 transition-all duration-300 ${
        selected
          ? "ring-2 ring-blue-500 shadow-xl"
          : "hover:-translate-y-1 hover:shadow-xl"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Coffee aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
          </div>

          <h2 className="text-lg font-bold text-[#111827]">{cafe.name}</h2>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
          <Star
            aria-hidden="true"
            className="h-3.5 w-3.5 fill-amber-400 text-amber-500"
            strokeWidth={2}
          />
          {cafe.rating}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-sm font-medium text-[#4B5563]">
          <Wallet aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
          {cafe.price}
        </span>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-sm font-medium text-[#4B5563]">
          <PersonStanding aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
          {cafe.walkTime} min
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FeatureChip icon={Wifi} label={cafe.wifi} tone={wifiTone} />
        <FeatureChip
          icon={cafe.noise === "Quiet" ? VolumeX : Volume2}
          label={cafe.noise}
          tone={noiseTone}
        />
        <FeatureChip
          icon={PlugZap}
          label={`${cafe.sockets} sockets`}
          tone={socketsTone}
        />
      </div>
    </div>
  );
}

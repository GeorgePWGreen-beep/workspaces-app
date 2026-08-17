"use client";

import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Bookmark,
  Coffee,
  MessageSquareText,
  Navigation,
  PersonStanding,
  PlugZap,
  Star,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  Wifi,
} from "lucide-react";
import { Cafe } from "@/types/cafe";
import CafeHeroImage from "./CafeHeroImage";
import FeatureChip, { type FeatureTone } from "./FeatureChip";
import StudyScore from "./StudyScore";

interface CafeDetailsProps {
  cafe: Cafe;
}

interface InfoChipProps {
  icon: LucideIcon;
  label: string;
}

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
}

function InfoChip({ icon: Icon, label }: InfoChipProps) {
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-[#4B5563]">
      <Icon aria-hidden="true" className="h-4 w-4 text-slate-600" strokeWidth={2} />
      {label}
    </span>
  );
}

function ActionButton({ icon: Icon, label }: ActionButtonProps) {
  return (
    <button
      type="button"
      className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-[#374151] shadow-sm transition-[transform,background-color,border-color,box-shadow] duration-150 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:scale-[0.98] active:bg-slate-100 active:shadow-none motion-reduce:transform-none"
    >
      <Icon aria-hidden="true" className="h-5 w-5 text-slate-700" strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}

export default function CafeDetails({ cafe }: CafeDetailsProps) {
  const features: {
    id: string;
    icon: LucideIcon;
    label: string;
    tone: FeatureTone;
  }[] = [
    {
      id: "wifi",
      icon: Wifi,
      label: cafe.wifi,
      tone: cafe.wifi === "Okay WiFi" ? "neutral" : "good",
    },
    {
      id: "sockets",
      icon: PlugZap,
      label: `${cafe.sockets} sockets`,
      tone:
        cafe.sockets === "Plenty"
          ? "good"
          : cafe.sockets === "Some"
            ? "neutral"
            : "warning",
    },
    {
      id: "noise",
      icon: cafe.noise === "Quiet" ? VolumeX : Volume2,
      label: cafe.noise,
      tone:
        cafe.noise === "Quiet"
          ? "good"
          : cafe.noise === "Moderate"
            ? "neutral"
            : "poor",
    },
    {
      id: "busyness",
      icon: Users,
      label: cafe.busyness,
      tone:
        cafe.busyness === "Quiet"
          ? "good"
          : cafe.busyness === "Moderate"
            ? "neutral"
            : "warning",
    },
    {
      id: "coffee",
      icon: Coffee,
      label: `${cafe.coffee} coffee`,
      tone:
        cafe.coffee === "Excellent"
          ? "good"
          : cafe.coffee === "Good"
            ? "neutral"
            : "warning",
    },
    {
      id: "seating",
      icon: Armchair,
      label: `${cafe.seating} seating`,
      tone:
        cafe.seating === "Comfortable"
          ? "good"
          : cafe.seating === "Average"
            ? "neutral"
            : "warning",
    },
  ];

  return (
    <div className="overflow-hidden rounded-t-[32px] bg-white">
      <CafeHeroImage src={cafe.image} cafeName={cafe.name} />

      <div className="p-6 pb-8">
        <div className="flex items-start justify-between gap-5 pr-2">
          <h2 className="min-w-0 flex-1 text-[28px] font-bold leading-tight tracking-[-0.03em] text-[#111827]">
            {cafe.name}
          </h2>

          <div className="mt-1 shrink-0">
            <StudyScore score={cafe.studyScore} size={114} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#4B5563]">
          <Star
            aria-hidden="true"
            className="h-4 w-4 fill-amber-400 text-amber-500"
            strokeWidth={2}
          />
          <span>{cafe.rating}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <InfoChip icon={Wallet} label={cafe.price} />
          <InfoChip icon={PersonStanding} label={`${cafe.walkTime} min walk`} />
        </div>

        <div className="my-7 border-t border-[#E5E7EB]" />

        <section>
          <h3 className="text-base font-semibold text-[#111827]">About</h3>
          <p className="mt-2 text-[15px] leading-7 text-[#4B5563]">
            {cafe.description}
          </p>
        </section>

        <div className="my-7 border-t border-[#E5E7EB]" />

        <section>
          <h3 className="text-base font-semibold text-[#111827]">
            Study Features
          </h3>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {features.map((feature) => (
              <FeatureChip key={feature.id} {...feature} />
            ))}
          </div>
        </section>

        <div className="my-7 border-t border-[#E5E7EB]" />

        <div className="grid grid-cols-3 gap-3">
          <ActionButton icon={Navigation} label="Directions" />
          <ActionButton icon={Bookmark} label="Save" />
          <ActionButton icon={MessageSquareText} label="Review" />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronRight,
  Coffee,
  PlugZap,
  Star,
  Volume2,
  VolumeX,
  Wallet,
  Wifi,
} from "lucide-react";
import { useStudyPreferences } from "./StudyPreferencesProvider";
import MatchBadge from "./MatchBadge";
import { Cafe } from "@/types/cafe";
import { CAFE_IMAGE_PLACEHOLDER } from "@/utils/cafeImages";
import { getStudyScoreColor } from "@/utils/studyScore";
import FeatureChip, { type FeatureTone } from "./FeatureChip";
import WalkTime from "./WalkTime";
import { useCafeTime } from "./CafeTimeProvider";
import { getOpeningStatus } from "@/utils/openingHours";
import { CITY_CONFIG } from "@/lib/cities";

interface CafeCardProps {
  cafe: Cafe;
  selected: boolean;
  onClick: () => void;
  variant?: "sidebar" | "sheet";
}

interface CafeCardImageProps {
  src: string;
  cafeName: string;
}

function CafeCardImage({ src, cafeName }: CafeCardImageProps) {
  const [imageSource, setImageSource] = useState<string | null>(
    src || CAFE_IMAGE_PLACEHOLDER,
  );

  return (
    <div className="relative h-full w-[100px] shrink-0 overflow-hidden rounded-[18px] bg-[color:var(--hs-canvas)] max-[374px]:w-[90px]">
      {imageSource && (
        <Image
          fill
          src={imageSource}
          alt={`Interior of ${cafeName}`}
          sizes="(max-width: 374px) 90px, 100px"
          className="object-cover"
          onError={() =>
            setImageSource((currentSource) =>
              currentSource === CAFE_IMAGE_PLACEHOLDER
                ? null
                : CAFE_IMAGE_PLACEHOLDER,
            )
          }
        />
      )}
    </div>
  );
}

function getFeatureTones(cafe: Cafe) {
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

  return { wifiTone, noiseTone, socketsTone };
}

export default function CafeCard({
  cafe,
  selected,
  onClick,
  variant = "sidebar",
}: CafeCardProps) {
  const { matches } = useStudyPreferences();
  const hasMatch = matches.has(cafe);
  const { wifiTone, noiseTone, socketsTone } = getFeatureTones(cafe);
  const now = useCafeTime();
  const openingStatus = cafe.weeklyOpeningHours && now
    ? getOpeningStatus(cafe.weeklyOpeningHours, now, CITY_CONFIG[cafe.city].timeZone) : null;
  const closedLabel = openingStatus && !openingStatus.isOpen ? openingStatus.label : null;

  if (variant === "sidebar") {
    return (
      <div
        onClick={onClick}
        className={`group cursor-pointer rounded-3xl border border-[color:var(--hs-border)] bg-white p-5 transition-all duration-300 ${
          selected
            ? "ring-2 ring-[color:var(--hs-sage)] shadow-xl"
            : "hover:-translate-y-1 hover:shadow-xl"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <Coffee aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            </div>

            <h2 className="text-lg font-bold text-[color:var(--hs-ink)]">
              {cafe.name}
            </h2>
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

        <p className="mt-3 text-sm font-semibold">Study Score {cafe.studyScore}</p>
        <MatchBadge cafe={cafe} />
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[color:var(--hs-canvas)] px-3 text-sm font-medium text-[color:var(--hs-muted)]">
            <Wallet aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
            {cafe.price}
          </span>
          <WalkTime coords={cafe.coords} />
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
        {closedLabel && <p className="mt-3 text-xs leading-5 text-[color:var(--hs-text-secondary)]">{closedLabel}</p>}
      </div>
    );
  }

  const scoreColor = getStudyScoreColor(cafe.studyScore);

  return (
    <div
      role="button"
      tabIndex={0}
      data-sheet-interactive=""
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={`hs-cafe-list-card flex ${hasMatch ? closedLabel ? "min-h-[180px]" : "min-h-[160px]" : closedLabel ? "h-[156px]" : "h-[136px]"} cursor-pointer items-stretch gap-1 rounded-[22px] p-2 text-left transition-[transform,box-shadow,ring] duration-150 active:scale-[0.99] motion-reduce:transform-none ${
        selected ? "ring-2 ring-[color:var(--hs-green)]" : ""
      }`}
    >
      <CafeCardImage src={cafe.image} cafeName={cafe.name} />

      <div className="min-w-0 flex-1 py-1">
        <h2 className="max-h-[42px] overflow-hidden text-[19px] font-bold leading-[1.1] tracking-[-0.02em] text-[color:var(--hs-text)] max-[374px]:text-[18px]">
          {cafe.name}
        </h2>

        <MatchBadge cafe={cafe} />
        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[14px] font-medium text-[color:var(--hs-text-secondary)] max-[374px]:gap-x-1 max-[374px]:text-[13px]">
          <Star aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.9} />
          <span>{cafe.rating}</span>
          <span aria-hidden="true" className="h-3 border-l border-[color:var(--hs-border)]" />
          <span>{cafe.price}</span>
          <WalkTime coords={cafe.coords} compact />
        </div>

        <div className="mt-2 flex gap-1 overflow-hidden">
          <span className="hs-cafe-feature-pill inline-flex h-7 items-center rounded-full px-2 text-[12px] font-medium text-[color:var(--hs-text-secondary)]">
            <span className="whitespace-nowrap">{cafe.wifi}</span>
          </span>
          <span className="hs-cafe-feature-pill inline-flex h-7 items-center rounded-full px-2 text-[12px] font-medium text-[color:var(--hs-text-secondary)] max-[374px]:hidden">
            <span className="whitespace-nowrap">{cafe.noise}</span>
          </span>
        </div>
        {closedLabel && <p className="mt-1.5 truncate text-[11px] leading-4 text-[color:var(--hs-text-secondary)]" title={closedLabel}>{closedLabel}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-px">
        <div
          className="grid h-14 w-14 place-items-center rounded-[14px] border-2 bg-[#FCFCFA] text-[29px] font-bold leading-none tracking-[-0.045em] text-[#171A18] shadow-[0_2px_6px_rgba(20,25,21,0.06)] max-[374px]:h-[52px] max-[374px]:w-[52px] max-[374px]:rounded-[13px] max-[374px]:text-[27px]"
          style={{ borderColor: scoreColor.stroke }}
        >
          <span className="sr-only">Study Score </span>
          <span aria-hidden="true">{cafe.studyScore}</span>
        </div>
        <ChevronRight
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-[color:var(--hs-text-secondary)]"
          strokeWidth={1.9}
        />
      </div>
    </div>
  );
}

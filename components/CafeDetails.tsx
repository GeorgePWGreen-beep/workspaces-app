"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Navigation,
  Armchair,
  PlugZap,
  Share2,
  Star,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  Wifi,
} from "lucide-react";
import MatchBadge from "./MatchBadge";
import { Cafe } from "@/types/cafe";
import CafeHeroImage from "./CafeHeroImage";
import FeatureChip, { type FeatureTone } from "./FeatureChip";
import StudyScore from "./StudyScore";
import OpeningHours from "./OpeningHours";
import WalkTime from "./WalkTime";
import { CITY_CONFIG } from "@/lib/cities";
import { formatVerifiedDate } from "@/utils/openingHours";

interface CafeDetailsProps {
  cafe: Cafe;
}

interface StudyFeatureCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  tone: FeatureTone;
}

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  variant?: "primary" | "secondary";
}

const FEATURE_CARD_TONES: Record<FeatureTone, string> = {
  good: "bg-[color:var(--hs-green-soft)] text-[color:var(--hs-green-deep)]",
  neutral: "bg-[#F0F2EF] text-[#626A64]",
  warning: "bg-amber-50 text-amber-700",
  poor: "bg-red-50 text-red-700",
};

function StudyFeatureCard({
  icon: Icon,
  title,
  value,
  tone,
}: StudyFeatureCardProps) {
  return (
    <div className="rounded-2xl border border-[color:var(--hs-border)] bg-[#FCFCFA] p-3.5 shadow-[0_4px_16px_rgba(20,25,21,0.035)]">
      <div
        className={`grid h-9 w-9 place-items-center rounded-full ${FEATURE_CARD_TONES[tone]}`}
      >
        <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </div>
      <p className="mt-3 text-[13px] font-medium text-[color:var(--hs-text-secondary)]">
        {title}
      </p>
      <p className="mt-0.5 text-[15px] font-semibold leading-tight text-[color:var(--hs-text)]">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  variant = "secondary",
}: ActionButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-[transform,background-color,border-color,box-shadow] duration-150 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-sage)] focus-visible:ring-offset-2 ${
        isPrimary
          ? "border-[color:var(--hs-sage-dark)] bg-[color:var(--hs-sage-dark)] text-white shadow-[0_3px_12px_rgba(20,25,21,0.08)]"
          : "border-[color:var(--hs-border)] bg-[#FCFCFA] text-[color:var(--hs-text)] shadow-[0_3px_12px_rgba(20,25,21,0.04)] hover:border-[color:var(--hs-sage)] hover:bg-[color:var(--hs-sage-soft)]"
      }`}
    >
      <Icon
        aria-hidden="true"
        className="h-5 w-5"
        strokeWidth={2}
      />
      <span>{label}</span>
    </button>
  );
}

export default function CafeDetails({ cafe }: CafeDetailsProps) {
  const verifiedDate = formatVerifiedDate(cafe.lastVerifiedAt, CITY_CONFIG[cafe.city].timeZone);
  const features: {
    id: string;
    icon: LucideIcon;
    title: string;
    value: string;
    chipLabel: string;
    tone: FeatureTone;
  }[] = [
    {
      id: "wifi",
      icon: Wifi,
      title: "Wi-Fi",
      value: cafe.wifi,
      chipLabel: cafe.wifi,
      tone: cafe.wifi === "Okay WiFi" ? "neutral" : "good",
    },
    {
      id: "noise",
      icon: cafe.noise === "Quiet" ? VolumeX : Volume2,
      title: "Noise",
      value: cafe.noise,
      chipLabel: `${cafe.noise} noise`,
      tone:
        cafe.noise === "Quiet"
          ? "good"
          : cafe.noise === "Moderate"
            ? "neutral"
            : "poor",
    },
    {
      id: "sockets",
      icon: PlugZap,
      title: "Sockets",
      value: cafe.sockets,
      chipLabel: `${cafe.sockets} sockets`,
      tone:
        cafe.sockets === "Plenty"
          ? "good"
          : cafe.sockets === "Some"
            ? "neutral"
            : "warning",
    },
    {
      id: "busyness",
      icon: Users,
      title: "Business",
      value: cafe.busyness,
      chipLabel: `${cafe.busyness} business`,
      tone:
        cafe.busyness === "Quiet"
          ? "good"
          : cafe.busyness === "Moderate"
            ? "neutral"
            : "warning",
    },
  ];

  return (
    <div
      className="overflow-hidden rounded-t-[32px] bg-[color:var(--hs-bg)] text-[color:var(--hs-text)]"
    >
      <CafeHeroImage src={cafe.image} cafeName={cafe.name} />

      <div className="px-5 pb-8 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 text-[28px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[color:var(--hs-text)] max-[374px]:text-[26px]">
            {cafe.name}
          </h2>

          <div className="-mt-1 shrink-0">
            <StudyScore score={cafe.studyScore} size={96} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px] font-medium text-[color:var(--hs-text-secondary)]">
          <Star
            aria-hidden="true"
            className="h-4 w-4 fill-amber-400 text-amber-500"
            strokeWidth={1.9}
          />
          <span className="font-semibold">{cafe.rating}</span>
          <span aria-hidden="true" className="h-4 border-l border-[color:var(--hs-border)]" />
          <Wallet aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
          <span>{cafe.price}</span>
          <WalkTime coords={cafe.coords} />
        </div>

        <MatchBadge cafe={cafe} details />

        <OpeningHours cafe={cafe} />

        <div className="mt-4 flex flex-wrap gap-2">
          {features.map((feature) => (
            <FeatureChip
              key={feature.id}
              icon={feature.icon}
              label={feature.chipLabel}
              tone={feature.tone}
            />
          ))}
        </div>

        {cafe.seatCount !== null && <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[color:var(--hs-text-secondary)]">
          <Armchair aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
          Approx. {cafe.seatCount} seats
        </p>}

        <div className="my-6 border-t border-[color:var(--hs-border)]" />

        <section>
          <h3 className="text-[17px] font-bold text-[color:var(--hs-text)]">About</h3>
          <p className="mt-2 text-[15px] leading-[1.6] text-[color:var(--hs-text-secondary)]">
            {cafe.description}
          </p>
        </section>

        <div className="my-6 border-t border-[color:var(--hs-border)]" />

        <section>
          <h3 className="text-[17px] font-bold text-[color:var(--hs-text)]">
            Study Features
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <StudyFeatureCard key={feature.id} {...feature} />
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[color:var(--hs-text-secondary)]">
            {cafe.coffee} coffee <span aria-hidden="true">·</span> {cafe.seating} seating
          </p>
        </section>

        <div className="my-6 border-t border-[color:var(--hs-border)]" />

        <div className="grid grid-cols-3 gap-2.5">
          <ActionButton icon={Bookmark} label="Save" />
          <ActionButton icon={Share2} label="Share" />
          <ActionButton icon={Navigation} label="Directions" variant="primary" />
        </div>
        {verifiedDate && <p className="mt-5 text-center text-[12px] leading-5 text-[color:var(--hs-text-tertiary)]">Last verified <time dateTime={cafe.lastVerifiedAt!}>{verifiedDate}</time></p>}
      </div>
    </div>
  );
}

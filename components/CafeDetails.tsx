"use client";

import { useRef } from "react";

import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  PlugZap,
  Star,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  Wifi,
  X,
} from "lucide-react";
import CafeActions from "./CafeActions";
import MatchBadge from "./MatchBadge";
import { Cafe } from "@/types/cafe";
import CafeHeroImage from "./CafeHeroImage";
import FeatureChip, { type FeatureTone } from "./FeatureChip";
import StudyScore from "./StudyScore";
import OpeningHours from "./OpeningHours";
import WalkTime from "./WalkTime";
import { CITY_CONFIG } from "@/lib/cities";
import { formatVerifiedDate } from "@/utils/openingHours";
import { useFeatureIntroduction } from "./FeatureIntroductions";

interface CafeDetailsProps {
  cafe: Cafe;
  onSignIn: () => void;
}

interface StudyFeatureCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  tone: FeatureTone;
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

export default function CafeDetails({ cafe, onSignIn }: CafeDetailsProps) {
  const { ref: introductionRef, visible: scoreVisible, pending: scorePending, dismiss: dismissScore } = useFeatureIntroduction("studyScore");
  const scoreAnchor = useRef<HTMLDivElement>(null);
  const dismissScoreIntroduction = () => { dismissScore(); scoreAnchor.current?.focus({ preventScroll: true }); };
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
      <div className="relative">
        <CafeHeroImage src={cafe.image} cafeName={cafe.name} />
        <div ref={scoreAnchor} tabIndex={-1} aria-label={`Study Score ${cafe.studyScore} out of 100`} data-score-introduction-highlight={scoreVisible || undefined} className={`absolute bottom-0 right-5 z-10 w-[112px] translate-y-[65%] rounded-full outline-none min-[390px]:w-[120px] ${scoreVisible ? "ring-4 ring-[color:var(--hs-green-soft)]" : ""}`}>
          <StudyScore score={cafe.studyScore} />
        </div>
      </div>

      <div className="px-5 pb-8 pt-2.5">
        <div className="min-w-0 pr-[124px] min-[390px]:pr-[132px]">
          <h2 className="break-words text-[28px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[color:var(--hs-text)] max-[374px]:text-[26px]">
            {cafe.name}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px] font-medium text-[color:var(--hs-text-secondary)]">
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
        </div>

        {(scorePending || scoreVisible) && <div ref={introductionRef} role="region" aria-label="About Study Score" className="hs-introduction mt-6 rounded-2xl border border-[color:var(--hs-border)] bg-[color:var(--hs-green-soft)] p-3.5"
          onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); dismissScoreIntroduction(); } }}>
          <div className="flex items-start justify-between gap-2">
            <div><h3 className="text-sm font-semibold text-[color:var(--hs-green-deep)]">Study Score, explained</h3>
              <p className="mt-1 text-[13px] leading-5 text-[color:var(--hs-text-secondary)]">A score out of 100 for Wi-Fi, seating, sockets and more. The same study-friendly rating for everyone.</p></div>
            <button type="button" aria-label="Dismiss Study Score introduction" onClick={dismissScoreIntroduction} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-black/5 focus-visible:outline-2"><X aria-hidden="true" className="h-4 w-4" /></button>
          </div>
        </div>}

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

        <MatchBadge cafe={cafe} details />

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

        <CafeActions key={cafe.id ?? cafe.name} cafe={cafe} onSignIn={onSignIn} />
        {verifiedDate && <p className="mt-5 text-center text-[12px] leading-5 text-[color:var(--hs-text-tertiary)]">Last verified <time dateTime={cafe.lastVerifiedAt!}>{verifiedDate}</time></p>}
      </div>
    </div>
  );
}

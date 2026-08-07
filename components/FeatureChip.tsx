import type { LucideIcon } from "lucide-react";

export type FeatureTone = "good" | "neutral" | "warning" | "poor";

interface FeatureChipProps {
  icon: LucideIcon;
  label: string;
  tone: FeatureTone;
}

const TONE_STYLES: Record<FeatureTone, string> = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  poor: "border-red-200 bg-red-50 text-red-800",
};

export default function FeatureChip({
  icon: Icon,
  label,
  tone,
}: FeatureChipProps) {
  return (
    <span
      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium ${TONE_STYLES[tone]}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}

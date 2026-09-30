import { normalizeStudyScore } from "@/utils/studyScore";

interface StudyScoreProps {
  score: number;
  size?: number;
}

const RADIUS = 53;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Preserve the existing green ring accent, independently of the score's band.
const RING_GREEN = "#65A30D";

function getStudyScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Great";
  if (score >= 60) return "Good";
  return "Fair";
}

export default function StudyScore({ score, size = 120 }: StudyScoreProps) {
  const value = normalizeStudyScore(score);
  const label = getStudyScoreLabel(value);

  return (
    <div
      role="img"
      aria-label={`Study Score ${value} out of 100 — ${label}`}
      className="relative grid aspect-square max-w-full shrink-0 place-items-center"
      style={{ width: Math.max(112, size) }}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 120 120"
      >
        <circle cx="60" cy="60" r={RADIUS} fill="#FCFCFA" stroke="#E5E8E3" strokeWidth="3" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke={RING_GREEN}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)}
          // A round cap at zero would otherwise suggest nonzero progress.
          visibility={value === 0 ? "hidden" : undefined}
        />
      </svg>

      <div aria-hidden="true" className="relative flex flex-col items-center text-center">
        <span className="text-[38px] font-extrabold leading-none tracking-[-0.055em] text-[#171A18] tabular-nums">
          {value}
        </span>
        <span className="mt-1 text-[11px] font-medium leading-3 text-[color:var(--hs-text-secondary)]">
          Study Score
        </span>
        <span className="mt-1 text-[11px] font-semibold leading-[14px] text-[#3F6212]">
          {label}
        </span>
      </div>
    </div>
  );
}

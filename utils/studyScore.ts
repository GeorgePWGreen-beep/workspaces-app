export interface StudyScoreColor {
  stroke: string;
  shadow: string;
  text: string;
}

interface StudyScoreBand extends StudyScoreColor {
  minimum: number;
}

const STUDY_SCORE_BANDS: readonly StudyScoreBand[] = [
  {
    minimum: 95,
    stroke: "#0F766E",
    shadow: "rgba(15, 118, 110, 0.16)",
    text: "#115E59",
  },
  {
    minimum: 90,
    stroke: "#16A34A",
    shadow: "rgba(22, 163, 74, 0.16)",
    text: "#166534",
  },
  {
    minimum: 80,
    stroke: "#65A30D",
    shadow: "rgba(101, 163, 13, 0.16)",
    text: "#3F6212",
  },
  {
    minimum: 70,
    stroke: "#CA8A04",
    shadow: "rgba(202, 138, 4, 0.16)",
    text: "#854D0E",
  },
  {
    minimum: 60,
    stroke: "#D97706",
    shadow: "rgba(217, 119, 6, 0.16)",
    text: "#92400E",
  },
  {
    minimum: 40,
    stroke: "#EA580C",
    shadow: "rgba(234, 88, 12, 0.16)",
    text: "#9A3412",
  },
  {
    minimum: 0,
    stroke: "#DC2626",
    shadow: "rgba(220, 38, 38, 0.16)",
    text: "#991B1B",
  },
];

export function normalizeStudyScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getStudyScoreColor(score: number): StudyScoreColor {
  const value = normalizeStudyScore(score);

  return STUDY_SCORE_BANDS.find((band) => value >= band.minimum)!;
}

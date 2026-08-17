"use client";

import {
  motion,
  useAnimate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useState } from "react";
import { getStudyScoreColor, normalizeStudyScore } from "@/utils/studyScore";

interface StudyScoreProps {
  score: number;
  size?: number;
}

const VIEWBOX_SIZE = 120;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS = 50;
const GUIDE_STROKE_WIDTH = 3.5;
const PROGRESS_STROKE_WIDTH = 8.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const START_DELAY_MS = 50;
const DRAW_DURATION_SECONDS = 0.8;
const PULSE_DURATION_SECONDS = 0.17;

export default function StudyScore({ score, size = 128 }: StudyScoreProps) {
  const value = normalizeStudyScore(score);
  const diameter = Math.max(72, size);
  const progress = value / 100;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const color = getStudyScoreColor(value);
  const shouldReduceMotion = useReducedMotion();
  const [scope, animate] = useAnimate();
  const progressOffset = useMotionValue(CIRCUMFERENCE);
  const scoreValue = useMotionValue(0);
  const [displayedScore, setDisplayedScore] = useState(0);

  useMotionValueEvent(scoreValue, "change", (latest) => {
    setDisplayedScore(Math.round(latest));
  });

  useEffect(() => {
    progressOffset.stop();
    scoreValue.stop();

    if (shouldReduceMotion) {
      progressOffset.set(dashOffset);
      scoreValue.set(value);
      return;
    }

    progressOffset.set(CIRCUMFERENCE);
    scoreValue.set(0);

    let isCancelled = false;
    let pulseControls: { stop: () => void } | undefined;
    const startTimer = window.setTimeout(async () => {
      const ringControls = animate(progressOffset, dashOffset, {
        duration: DRAW_DURATION_SECONDS,
        ease: "easeOut",
      });
      const numberControls = animate(scoreValue, value, {
        duration: DRAW_DURATION_SECONDS,
        ease: "easeOut",
      });

      await Promise.all([ringControls, numberControls]);

      if (isCancelled || !scope.current) return;

      pulseControls = animate(
        scope.current,
        { scale: [1, 1.03, 1] },
        {
          duration: PULSE_DURATION_SECONDS,
          ease: "easeOut",
          times: [0, 0.5, 1],
        },
      );
    }, START_DELAY_MS);

    return () => {
      isCancelled = true;
      window.clearTimeout(startTimer);
      progressOffset.stop();
      scoreValue.stop();
      pulseControls?.stop();
    };
  }, [animate, dashOffset, progressOffset, scope, scoreValue, shouldReduceMotion, value]);

  return (
    <motion.div
      ref={scope}
      role="img"
      aria-label={`Study Score ${value}`}
      className="relative grid shrink-0 place-items-center"
      style={{ height: diameter, width: diameter }}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 -rotate-90"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="#EFEAE2"
          strokeWidth={GUIDE_STROKE_WIDTH}
        />

        <g style={{ filter: `drop-shadow(0 1px 1px ${color.shadow})` }}>
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={color.stroke}
            strokeWidth={PROGRESS_STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            style={{ strokeDashoffset: progressOffset }}
          />
        </g>
      </svg>

      <div className="relative flex flex-col items-center pt-[5px] text-center">
        <span
          className="font-bold leading-none tracking-[-0.06em] tabular-nums"
          style={{ color: color.text, fontSize: Math.round(diameter * 0.32) }}
        >
          {displayedScore}
        </span>
        <span
          className="mt-1 font-medium leading-none text-[#817B73]"
          style={{ fontSize: Math.max(11, Math.round(diameter * 0.1)) }}
        >
          Study Score
        </span>
      </div>
    </motion.div>
  );
}

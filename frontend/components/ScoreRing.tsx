"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const RADIUS = 36;
const STROKE_WIDTH = 7;
const VIEW = 100;
const CIRC = 2 * Math.PI * RADIUS;

interface ScoreRingProps {
  score: number;
  size?: number;
}

export default function ScoreRing({ score, size = 80 }: ScoreRingProps) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = CIRC * (1 - clamped / 100);
  const strokeColor = clamped >= 80 ? "#27AE60" : "#2D9CDB";

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Track */}
      <circle
        cx={VIEW / 2}
        cy={VIEW / 2}
        r={RADIUS}
        fill="none"
        stroke="#1E2D45"
        strokeWidth={STROKE_WIDTH}
      />
      {/* Progress arc */}
      <motion.circle
        cx={VIEW / 2}
        cy={VIEW / 2}
        r={RADIUS}
        fill="none"
        stroke={strokeColor}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        initial={{ strokeDashoffset: CIRC }}
        animate={{ strokeDashoffset: inView ? dashOffset : CIRC }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        transform={`rotate(-90 ${VIEW / 2} ${VIEW / 2})`}
      />
      {/* Score label */}
      <text
        x={VIEW / 2}
        y={VIEW / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
          fontSize: "20px",
          fontWeight: 700,
          fill: "#F0F4FF",
        }}
      >
        {clamped}
      </text>
    </svg>
  );
}

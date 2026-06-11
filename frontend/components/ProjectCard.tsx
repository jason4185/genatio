"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GitFork, Clock } from "lucide-react";
import FundingProgress from "./FundingProgress";

interface ProjectCardProps {
  title: string;
  score: number;
  repo: string;
  description: string;
  raised: number;
  goal: number;
  currency: string;
  endsAt: Date;
}

function useCountdown(endsAt: Date) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, endsAt.getTime() - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return timeLeft;
}

export default function ProjectCard({
  title,
  score,
  repo,
  description,
  raised,
  goal,
  currency,
  endsAt,
}: ProjectCardProps) {
  const { d, h, m, s } = useCountdown(endsAt);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        backgroundColor: "#0D1117",
        border: `1px solid ${hovered ? "rgba(232,255,71,0.25)" : "#1A1D2E"}`,
        borderRadius: "12px",
        padding: "1.375rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease",
        boxShadow: hovered
          ? "0 0 0 1px rgba(232,255,71,0.12), 0 8px 32px rgba(0,0,0,0.4)"
          : "0 2px 16px rgba(0,0,0,0.3)",
        cursor: "default",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <h3
          style={{
            fontFamily: "'Clash Display', var(--font-inter), system-ui, sans-serif",
            fontSize: "1.0625rem",
            fontWeight: 600,
            color: "#F8F9FA",
            lineHeight: 1.3,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#E8FF47",
            backgroundColor: "rgba(232,255,71,0.08)",
            border: "1px solid rgba(232,255,71,0.2)",
            borderRadius: "100px",
            padding: "0.2rem 0.625rem",
            whiteSpace: "nowrap",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {score} · ACTIVE
        </span>
      </div>

      {/* Repo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          color: "#8B949E",
        }}
      >
        <GitFork size={13} />
        <span
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.75rem",
            color: "#8B949E",
            letterSpacing: "0.01em",
          }}
        >
          {repo}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: "0.875rem",
          color: "#8B949E",
          lineHeight: 1.6,
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description}
      </p>

      {/* Progress bar */}
      <FundingProgress raised={raised} goal={goal} />

      {/* Amount row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.8125rem",
            color: "#F8F9FA",
            fontWeight: 600,
          }}
        >
          {raised.toLocaleString()} {currency} raised
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.75rem",
            color: "#8B949E",
          }}
        >
          {goal.toLocaleString()} {currency} goal
        </span>
      </div>

      {/* Countdown */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          color: "#8B949E",
        }}
      >
        <Clock size={13} />
        <span
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.75rem",
            color: "#8B949E",
          }}
        >
          Ends in {d}d {h}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s
        </span>
      </div>

      {/* CTA button */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{
          width: "100%",
          padding: "0.625rem 1rem",
          backgroundColor: "transparent",
          border: "1px solid #E8FF47",
          borderRadius: "6px",
          color: "#E8FF47",
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: "0.875rem",
          fontWeight: 500,
          cursor: "pointer",
          transition: "background 0.2s ease, color 0.2s ease",
          letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#E8FF47";
          e.currentTarget.style.color = "#080B14";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#E8FF47";
        }}
      >
        Fund Project →
      </motion.button>
    </motion.div>
  );
}

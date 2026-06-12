"use client";

import { GitFork, Clock } from "lucide-react";
import ScoreRing from "./ScoreRing";
import FundingProgress from "./FundingProgress";

interface ProjectCardProps {
  name: string;
  repo: string;
  description: string;
  score: number;
  status: "ACTIVE" | "REJECTED" | "PENDING";
  raised: number;
  goal: number;
  daysLeft: number;
}

export default function ProjectCard({
  name,
  repo,
  description,
  score,
  status,
  raised,
  goal,
  daysLeft,
}: ProjectCardProps) {
  const statusColor =
    status === "ACTIVE" ? "#27AE60" : status === "REJECTED" ? "#EB5757" : "#8899AA";

  const formatAmount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(12,18,32,0.7)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid #1E2D45",
        borderRadius: "12px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 0 36px rgba(45,156,219,0.15)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Top row: name + ring */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.375rem",
            }}
          >
            <GitFork size={14} color="#4A5568" />
            <span
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#4A5568",
                letterSpacing: "0.02em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {repo}
            </span>
          </div>
          <h3
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#F0F4FF",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {name}
          </h3>
        </div>

        {/* Ring + badge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
          <ScoreRing score={score} size={72} />
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.625rem",
              fontWeight: 700,
              color: statusColor,
              letterSpacing: "0.08em",
              border: `1px solid ${statusColor}33`,
              borderRadius: "100px",
              padding: "0.125rem 0.5rem",
            }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.875rem",
          color: "#8899AA",
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

      {/* Funding */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <FundingProgress raised={raised} goal={goal} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.8125rem",
              color: "#F0F4FF",
              fontWeight: 600,
            }}
          >
            {formatAmount(raised)} GLY{" "}
            <span style={{ color: "#4A5568", fontWeight: 400 }}>
              / {formatAmount(goal)} GLY
            </span>
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.75rem",
              color: "#8899AA",
            }}
          >
            <Clock size={11} color="#4A5568" />
            {daysLeft}d left
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        style={{
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "#2D9CDB",
          backgroundColor: "transparent",
          border: "1px solid #2D9CDB",
          borderRadius: "8px",
          padding: "0.625rem 1rem",
          cursor: "pointer",
          transition: "background-color 0.18s ease, color 0.18s ease",
          width: "100%",
          letterSpacing: "-0.01em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#2D9CDB";
          e.currentTarget.style.color = "#F0F4FF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#2D9CDB";
        }}
      >
        Fund Project →
      </button>
    </div>
  );
}

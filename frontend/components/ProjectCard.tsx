"use client";

import { useRouter } from "next/navigation";
import { GitFork, Clock } from "lucide-react";
import ScoreRing from "./ScoreRing";
import FundingProgress from "./FundingProgress";

interface ProjectCardProps {
  projectId: string;
  name: string;
  repo: string;
  description: string;
  score: number;
  status: "ACTIVE" | "active" | "REJECTED" | "rejected" | "PENDING" | "pending" | "DISPUTED" | "disputed" | "ENDED" | "ended" | string;
  raised: number;
  goal: number;
  daysLeft: number;
}

export default function ProjectCard({
  projectId,
  name,
  repo,
  description,
  score,
  status,
  raised,
  goal,
  daysLeft,
}: ProjectCardProps) {
  const router = useRouter();
  const upper = status.toUpperCase();
  const statusColor =
    upper === "ACTIVE" ? "var(--color-success)" : upper === "REJECTED" ? "var(--color-danger)" : "var(--color-text-secondary)";
  const statusBorderColor =
    upper === "ACTIVE" ? "var(--color-success)" :
    upper === "REJECTED" ? "var(--color-danger)" :
    upper === "DISPUTED" ? "var(--color-warning)" :
    "var(--color-border-subtle)";

  const formatAmount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div
      onClick={() => router.push(`/project/${projectId}`)}
      style={{
        backgroundColor: "rgba(var(--color-surface-rgb), 0.7)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "12px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 0 36px color-mix(in srgb, var(--color-accent-blue) 15%, transparent)";
        el.style.borderColor = "color-mix(in srgb, var(--color-accent-blue) 35%, transparent)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
        el.style.borderColor = "var(--color-border-subtle)";
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
            <GitFork size={14} color="var(--color-text-muted)" />
            <span
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
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
              color: "var(--color-text-primary)",
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
              border: `1px solid ${statusBorderColor}`,
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
          color: "var(--color-text-secondary)",
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
              color: "var(--color-text-primary)",
              fontWeight: 600,
            }}
          >
            {formatAmount(raised)} GEN{" "}
            <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
              / {formatAmount(goal)} GEN
            </span>
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.75rem",
              color: "var(--color-text-secondary)",
            }}
          >
            <Clock size={11} color="var(--color-text-muted)" />
            {daysLeft}d left
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/project/${projectId}`);
        }}
        style={{
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--color-accent-blue)",
          backgroundColor: "transparent",
          border: "1px solid var(--color-accent-blue)",
          borderRadius: "8px",
          padding: "0.625rem 1rem",
          cursor: "pointer",
          transition: "background-color 0.18s ease, color 0.18s ease",
          width: "100%",
          letterSpacing: "-0.01em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-accent-blue)";
          e.currentTarget.style.color = "var(--color-text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--color-accent-blue)";
        }}
      >
        Fund Project →
      </button>
    </div>
  );
}

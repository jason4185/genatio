"use client";

import { useRouter } from "next/navigation";
import { Clock3, Coins, ExternalLink, GitFork, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import ScoreRing from "./ScoreRing";
import { useCountdown } from "@/hooks/useCountdown";

interface ProjectCardProps {
  projectId: string;
  name: string;
  repo: string;
  description: string;
  score: number;
  status: "ACTIVE" | "active" | "REJECTED" | "rejected" | "PENDING" | "pending" | "DISPUTED" | "disputed" | "ENDED" | "ended" | string;
  githubUrl?: string;
  liveUrl?: string;
  raisedGen?: number;
  goalGen?: number;
  donorCount?: number;
  createdAt?: string | number;
  durationDays?: string | number;
}

function formatGen(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function ProjectCard({
  projectId,
  name,
  repo,
  description,
  score,
  status,
  githubUrl,
  liveUrl,
  raisedGen = 0,
  goalGen = 0,
  donorCount = 0,
  createdAt,
  durationDays,
}: ProjectCardProps) {
  const router = useRouter();
  const countdown = useCountdown(createdAt, durationDays);
  const upper = status.toUpperCase();
  const statusColor =
    upper === "ACTIVE" ? "var(--color-success)" : upper === "REJECTED" ? "var(--color-danger)" : "var(--color-text-secondary)";
  const statusBorderColor =
    upper === "ACTIVE" ? "var(--color-success)" :
    upper === "REJECTED" ? "var(--color-danger)" :
    upper === "DISPUTED" ? "var(--color-warning)" :
    "var(--color-border-subtle)";
  const progress = goalGen > 0 ? Math.min(100, (raisedGen / goalGen) * 100) : 0;

  return (
    <div
      onClick={() => router.push(`/project/${projectId}`)}
      style={{
        backgroundColor: "rgba(var(--color-surface-rgb), 0.94)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--color-border-strong)",
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
        el.style.boxShadow = "0 14px 30px color-mix(in srgb, var(--color-primary) 16%, transparent)";
        el.style.borderColor = "color-mix(in srgb, var(--color-primary) 30%, var(--color-border-subtle))";
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
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
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
            <ShieldCheck size={12} />
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
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          flex: 1,
        }}
      >
        {description}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.75rem", color: "var(--color-text-primary)", fontWeight: 700 }}>
            <Coins size={13} color="var(--color-accent-cyan)" />
            <span style={{ color: "var(--color-accent-cyan)" }}>{formatGen(raisedGen)}</span> / {formatGen(goalGen)} GEN
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            <Users size={13} />
            {donorCount} donor{donorCount === 1 ? "" : "s"}
          </span>
        </div>
        <div style={{ width: "100%", height: "8px", borderRadius: "999px", backgroundColor: "var(--color-elevated)", overflow: "hidden" }}>
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "var(--color-primary)",
              borderRadius: "999px",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            <Coins size={13} />
            Funding progress
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            <Clock3 size={13} />
            {countdown.label}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.75rem",
              color: "var(--color-accent-blue)",
              textDecoration: "none",
            }}
          >
            <GitFork size={12} />
            GitHub
          </a>
        )}
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.75rem",
              color: "var(--color-accent-blue)",
              textDecoration: "none",
            }}
          >
            <ExternalLink size={12} />
            Live URL
          </a>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.625rem" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/project/${projectId}`);
          }}
          style={{
            flex: 1,
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--color-accent-blue)",
            backgroundColor: "transparent",
            border: "1px solid color-mix(in srgb, var(--color-accent-blue) 30%, transparent)",
            borderRadius: "8px",
            padding: "0.625rem 1rem",
            cursor: "pointer",
            transition: "background-color 0.18s ease",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--color-accent-blue) 8%, transparent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          View Project
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/project/${projectId}`);
          }}
          style={{
            flex: 1,
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--color-primary-foreground)",
            backgroundColor: "var(--color-primary)",
            border: "1px solid var(--color-primary)",
            borderRadius: "8px",
            padding: "0.625rem 1rem",
            cursor: "pointer",
            transition: "background-color 0.18s ease, color 0.18s ease",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-primary-dark)";
            e.currentTarget.style.color = "var(--color-primary-foreground)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-primary)";
            e.currentTarget.style.color = "var(--color-primary-foreground)";
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", justifyContent: "center" }}>
            <HeartHandshake size={14} />
            Fund Project
          </span>
        </button>
      </div>
    </div>
  );
}

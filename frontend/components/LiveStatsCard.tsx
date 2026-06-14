"use client";

import { useEffect, useRef, useState } from "react";

const STAT_META = [
  { key: "totalProjects" as const, label: "Projects Verified", duration: 1500, suffix: "" },
  { key: "totalDonors" as const, label: "Total Donors", duration: 2000, suffix: "" },
  { key: "totalRaised" as const, label: "Total Raised", duration: 2500, suffix: " GEN" },
];

function formatNum(n: number, suffix: string): string {
  if (suffix === " GEN") return n.toLocaleString("en-US", { maximumFractionDigits: 0 }) + suffix;
  return n.toLocaleString("en-US") + suffix;
}

function StatRow({
  base,
  label,
  duration,
  suffix,
  isLast,
}: {
  base: number;
  label: string;
  duration: number;
  suffix: string;
  isLast: boolean;
}) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplayed(Math.round(easeOut(t) * base));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [base, duration]);

  return (
    <div
      style={{
        padding: "1.75rem 2rem",
        borderBottom: isLast ? "none" : "1px solid var(--color-border-subtle)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
          fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          margin: "0 0 0.25rem",
          letterSpacing: "-0.03em",
          fontVariantNumeric: "tabular-nums",
        } as React.CSSProperties}
      >
        {formatNum(displayed, suffix)}
      </p>
      <p
        style={{
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.875rem",
          color: "var(--color-text-secondary)",
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}

function SkeletonRow({ isLast }: { isLast: boolean }) {
  return (
    <div
      style={{
        padding: "1.75rem 2rem",
        borderBottom: isLast ? "none" : "1px solid var(--color-border-subtle)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          height: "1.75rem",
          width: "60%",
          borderRadius: "6px",
          backgroundColor: "var(--color-elevated)",
          animation: "skeleton-shimmer 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          height: "0.875rem",
          width: "80%",
          borderRadius: "4px",
          backgroundColor: "var(--color-elevated)",
          animation: "skeleton-shimmer 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export function LiveStatsCard({
  totalProjects,
  totalDonors,
  totalRaised,
  loading,
}: {
  totalProjects: number;
  totalDonors: number;
  totalRaised: number;
  loading: boolean;
}) {
  const values = [totalProjects, totalDonors, Math.round(totalRaised)];

  return (
    <>
      <style>{`
        @keyframes card-glow {
          0%, 100% {
            box-shadow: none;
            border-color: var(--color-border-subtle);
          }
          50% {
            box-shadow: 0 0 28px 4px color-mix(in srgb, var(--color-accent-blue) 13%, transparent);
            border-color: color-mix(in srgb, var(--color-accent-blue) 38%, transparent);
          }
        }
        @keyframes skeleton-shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          backgroundColor: "rgba(var(--color-surface-rgb), 0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "16px",
          overflow: "hidden",
          animation: "card-glow 5s ease-in-out infinite",
        }}
      >
        {/* LIVE header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 2rem",
            borderBottom: "1px solid var(--color-border-subtle)",
            backgroundColor: "color-mix(in srgb, var(--color-success) 4%, transparent)",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "var(--color-success)",
              display: "block",
              flexShrink: 0,
              animation: "pulse-live 1.4s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "var(--color-success)",
              letterSpacing: "0.12em",
            }}
          >
            LIVE
          </span>
        </div>

        {loading
          ? STAT_META.map((m, i) => (
              <SkeletonRow key={m.key} isLast={i === STAT_META.length - 1} />
            ))
          : STAT_META.map((m, i) => (
              <StatRow
                key={`${m.key}-${values[i]}`}
                base={values[i]}
                label={m.label}
                duration={m.duration}
                suffix={m.suffix}
                isLast={i === STAT_META.length - 1}
              />
            ))}
      </div>
    </>
  );
}

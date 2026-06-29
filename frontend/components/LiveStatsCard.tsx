"use client";

import { useEffect, useRef, useState } from "react";
import { Coins, ShieldCheck, Users } from "lucide-react";

function StatRow({
  base,
  label,
  duration,
  isLast,
  format,
  Icon,
}: {
  base: number;
  label: string;
  duration: number;
  isLast: boolean;
  format?: (value: number) => string;
  Icon: React.ElementType;
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
        padding: "1rem",
        borderBottom: isLast ? "none" : "1px solid var(--color-border-subtle)",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "0.875rem",
        justifyContent: "flex-start",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          backgroundColor: "var(--color-accent-blue-soft)",
          border: "1px solid color-mix(in srgb, var(--color-accent-blue) 18%, var(--color-border-subtle))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-accent-blue)",
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: "0 0 0.125rem",
            letterSpacing: "0",
            fontVariantNumeric: "tabular-nums",
          } as React.CSSProperties}
        >
          {format ? format(displayed) : displayed.toLocaleString("en-US")}
        </p>
        <p
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            margin: 0,
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function SkeletonRow({ isLast }: { isLast: boolean }) {
  return (
    <div
      style={{
        padding: "1rem",
        borderBottom: isLast ? "none" : "1px solid var(--color-border-subtle)",
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          backgroundColor: "var(--color-elevated)",
          animation: "skeleton-shimmer 1.5s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: "1.25rem",
            width: "44%",
            borderRadius: "6px",
            backgroundColor: "var(--color-elevated)",
            animation: "skeleton-shimmer 1.5s ease-in-out infinite",
            marginBottom: "0.5rem",
          }}
        />
        <div
          style={{
            height: "0.8125rem",
            width: "70%",
            borderRadius: "4px",
            backgroundColor: "var(--color-elevated)",
            animation: "skeleton-shimmer 1.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

export function LiveStatsCard({
  totalProjects,
  totalDonors,
  totalRaisedGen,
  loading,
}: {
  totalProjects: number;
  totalDonors: number;
  totalRaisedGen: number;
  loading: boolean;
}) {
  return (
    <>
      <style>{`
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
          backgroundColor: "rgba(var(--color-surface-rgb), 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            padding: "1rem 1rem 0.875rem",
            borderBottom: "1px solid var(--color-border-subtle)",
            backgroundColor: "rgba(var(--color-surface-rgb), 0.72)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              letterSpacing: "0",
            }}
          >
            Live platform stats
          </span>
          <ShieldCheck size={17} color="var(--color-accent-blue)" />
        </div>

        {loading ? (
          <>
            <SkeletonRow isLast={false} />
            <SkeletonRow isLast={false} />
            <SkeletonRow isLast={true} />
          </>
        ) : (
          <>
            <StatRow
              key={`projects-${totalProjects}`}
              base={totalProjects}
              label="Projects Verified"
              duration={1200}
              isLast={false}
              Icon={ShieldCheck}
            />
            <StatRow
              key={`donors-${totalDonors}`}
              base={totalDonors}
              label="Total Donors"
              duration={1200}
              isLast={false}
              Icon={Users}
            />
            <StatRow
              key={`raised-${totalRaisedGen}`}
              base={totalRaisedGen}
              label="Total GEN Raised"
              duration={1200}
              isLast={true}
              format={(value) => `${value.toLocaleString("en-US")} GEN`}
              Icon={Coins}
            />
          </>
        )}
      </div>
    </>
  );
}

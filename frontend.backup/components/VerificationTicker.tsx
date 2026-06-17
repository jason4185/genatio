"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useProjects } from "@/hooks/useProjects";

interface TickerItem {
  name: string;
  score: number;
  status: "ACTIVE" | "REJECTED";
}


function TickerRow({ items }: { items: TickerItem[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0 2rem",
            borderRight: "1px solid var(--color-border-subtle)",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.8125rem",
              color: "var(--color-text-secondary)",
              letterSpacing: "0.02em",
            }}
          >
            {item.name}
          </span>
          <span style={{ color: "var(--color-border-subtle)" }}>·</span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.8125rem",
              color: "var(--color-text-secondary)",
            }}
          >
            Score {item.score}
          </span>
          <span style={{ color: "var(--color-border-subtle)" }}>·</span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: item.status === "ACTIVE" ? "var(--color-success)" : "var(--color-danger)",
              letterSpacing: "0.06em",
            }}
          >
            {item.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function padToMinLength(items: TickerItem[], min = 8): TickerItem[] {
  if (items.length === 0) return items;
  const result: TickerItem[] = [];
  while (result.length < min) result.push(...items);
  return result;
}

export default function VerificationTicker() {
  const [paused, setPaused] = useState(false);
  const { projects, loading } = useProjects("active");

  if (loading || projects.length === 0) return null;

  const rawItems: TickerItem[] = projects.map((p) => ({
    name: p.title,
    score: Math.round(Number(p.score)),
    status: p.status?.toUpperCase() === "REJECTED" ? "REJECTED" : "ACTIVE",
  }));

  const tickerItems = padToMinLength(rawItems, 8);
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          backgroundColor: "rgba(var(--color-surface-rgb), 0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "100px",
          padding: "0.625rem 0",
          overflow: "hidden",
          position: "relative",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* LIVE badge */}
        <div
          style={{
            position: "absolute",
            left: "1rem",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            backgroundColor: "var(--color-background)",
            padding: "0.25rem 0.625rem",
            borderRadius: "100px",
            border: "1px solid color-mix(in srgb, var(--color-accent-blue) 25%, transparent)",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "var(--color-accent-blue)",
              display: "block",
              animation: "pulse-live 1.4s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "var(--color-accent-blue)",
              letterSpacing: "0.1em",
            }}
          >
            LIVE
          </span>
        </div>

        {/* Left fade */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "110px",
            background: "linear-gradient(to right, rgb(var(--color-background-rgb)) 0%, transparent 100%)",
            zIndex: 5,
            pointerEvents: "none",
          }}
        />
        {/* Right fade */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "80px",
            background: "linear-gradient(to left, rgb(var(--color-background-rgb)) 0%, transparent 100%)",
            zIndex: 5,
            pointerEvents: "none",
          }}
        />

        {/* Scrolling content */}
        <motion.div
          style={{ display: "flex" }}
          animate={{ x: paused ? undefined : [0, "-50%"] }}
          transition={
            paused
              ? { duration: 0 }
              : {
                  x: {
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                  },
                }
          }
        >
          <TickerRow items={doubled} />
        </motion.div>
      </div>
    </div>
  );
}

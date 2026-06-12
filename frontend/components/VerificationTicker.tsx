"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface TickerItem {
  name: string;
  score: number;
  status: "ACTIVE" | "REJECTED";
}

const TICKER_ITEMS: TickerItem[] = [
  { name: "genazo", score: 73, status: "ACTIVE" },
  { name: "defi-vault", score: 41, status: "REJECTED" },
  { name: "layerzero-bridge", score: 88, status: "ACTIVE" },
  { name: "nft-marketplace", score: 29, status: "REJECTED" },
  { name: "zkbridge", score: 91, status: "ACTIVE" },
  { name: "open-grants", score: 77, status: "ACTIVE" },
  { name: "rug-detector", score: 34, status: "REJECTED" },
  { name: "defi-analytics", score: 82, status: "ACTIVE" },
  { name: "cross-chain-swap", score: 66, status: "ACTIVE" },
  { name: "pump-clone", score: 18, status: "REJECTED" },
];

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
            borderRight: "1px solid #1E2D45",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.8125rem",
              color: "#8899AA",
              letterSpacing: "0.02em",
            }}
          >
            {item.name}
          </span>
          <span style={{ color: "#1E2D45" }}>·</span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.8125rem",
              color: "#8899AA",
            }}
          >
            Score {item.score}
          </span>
          <span style={{ color: "#1E2D45" }}>·</span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: item.status === "ACTIVE" ? "#27AE60" : "#EB5757",
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

export default function VerificationTicker() {
  const [paused, setPaused] = useState(false);
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          backgroundColor: "rgba(12,18,32,0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid #1E2D45",
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
            backgroundColor: "#060B18",
            padding: "0.25rem 0.625rem",
            borderRadius: "100px",
            border: "1px solid rgba(45,156,219,0.25)",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#2D9CDB",
              display: "block",
              animation: "pulse-live 1.4s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "#2D9CDB",
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
            background: "linear-gradient(to right, rgba(6,11,24,1) 0%, transparent 100%)",
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
            background: "linear-gradient(to left, rgba(6,11,24,1) 0%, transparent 100%)",
            zIndex: 5,
            pointerEvents: "none",
          }}
        />

        {/* Scrolling content */}
        <motion.div
          style={{ display: "flex", paddingLeft: "130px" }}
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

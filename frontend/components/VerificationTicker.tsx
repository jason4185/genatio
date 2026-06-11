"use client";

import { useRef, useState } from "react";
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
    <div style={{ display: "flex", alignItems: "center", gap: "0", flexShrink: 0 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0 2rem",
            borderRight: "1px solid #1A1D2E",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.8125rem",
              color: "#8B949E",
              letterSpacing: "0.02em",
            }}
          >
            {item.name}
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.8125rem",
              color: "#8B949E",
            }}
          >
            ·
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.8125rem",
              color: "#8B949E",
            }}
          >
            {item.score}
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.8125rem",
              color: "#8B949E",
            }}
          >
            ·
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: item.status === "ACTIVE" ? "#E8FF47" : "#FF6B35",
              letterSpacing: "0.05em",
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
    <div
      style={{
        marginTop: "2.5rem",
        maxWidth: "820px",
        width: "100%",
      }}
    >
      {/* Container pill */}
      <div
        style={{
          backgroundColor: "#0D1117",
          border: "1px solid #1A1D2E",
          borderRadius: "100px",
          padding: "0.625rem 0",
          overflow: "hidden",
          position: "relative",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* LIVE badge — left anchor */}
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
            backgroundColor: "#080B14",
            padding: "0.25rem 0.625rem",
            borderRadius: "100px",
            border: "1px solid #1A1D2E",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#E8FF47",
              display: "block",
              animation: "pulse-live 1.4s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "#E8FF47",
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
            width: "120px",
            background:
              "linear-gradient(to right, #0D1117 0%, transparent 100%)",
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
            background:
              "linear-gradient(to left, #0D1117 0%, transparent 100%)",
            zIndex: 5,
            pointerEvents: "none",
          }}
        />

        {/* Scrolling content */}
        <motion.div
          style={{ display: "flex", paddingLeft: "140px" }}
          animate={{ x: paused ? undefined : [0, "-50%"] }}
          transition={
            paused
              ? { duration: 0 }
              : {
                  x: {
                    duration: 28,
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

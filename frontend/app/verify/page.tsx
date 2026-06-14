"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

const RADIUS = 36;
const STROKE_WIDTH = 7;
const VIEW = 100;
const CIRC = 2 * Math.PI * RADIUS;

function AnimatedScoreRing({
  target,
  size = 140,
  approved,
}: {
  target: number;
  size?: number;
  approved: boolean;
}) {
  const [displayed, setDisplayed] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    setDisplayed(0);
    const duration = 2000;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(eased * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  const strokeColor = approved ? "var(--color-success)" : "var(--color-danger)";
  const dashOffset = CIRC * (1 - displayed / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      style={{ display: "block" }}
    >
      <circle
        cx={VIEW / 2}
        cy={VIEW / 2}
        r={RADIUS}
        fill="none"
        stroke="var(--color-border-subtle)"
        strokeWidth={STROKE_WIDTH}
      />
      <circle
        cx={VIEW / 2}
        cy={VIEW / 2}
        r={RADIUS}
        fill="none"
        stroke={strokeColor}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${VIEW / 2} ${VIEW / 2})`}
        style={{ transition: "stroke-dashoffset 0.05s linear" }}
      />
      <text
        x={VIEW / 2}
        y={VIEW / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
          fontSize: "22px",
          fontWeight: 700,
          fill: "currentColor",
        }}
      >
        {displayed}
      </text>
    </svg>
  );
}


function VerifyContent() {
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status") ?? "rejected";
  const scoreParam = Number(searchParams.get("score")) || 0;
  const projectId = searchParams.get("project_id");

  const approved = statusParam === "active";
  const score = scoreParam;

  const accentColor = approved ? "var(--color-success)" : "var(--color-danger)";
  const iconColor = approved ? "var(--color-success)" : "var(--color-danger)";
  const VerdictIcon = approved ? CheckCircle : XCircle;
  const stateKey = approved ? "approved" : "rejected";

  const cardStyle: React.CSSProperties = {
    backgroundColor: "rgba(var(--color-surface-rgb), 0.7)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid var(--color-border-subtle)",
    borderRadius: "12px",
    padding: "1.5rem",
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stateKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          width: "100%",
          maxWidth: "640px",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* ── Verdict card ── */}
        <motion.div
          style={{
            ...cardStyle,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "2.5rem 2rem",
            gap: "1.25rem",
          }}
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <VerdictIcon size={40} color={iconColor} strokeWidth={1.75} />
          </motion.div>

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <AnimatedScoreRing key={stateKey} target={score} size={140} approved={approved} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: accentColor,
                letterSpacing: "-0.02em",
              }}
            >
              {score} / 100
            </span>
            <span
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: accentColor,
                letterSpacing: "0.1em",
                border: `1px solid ${approved ? "color-mix(in srgb, var(--color-success) 25%, transparent)" : "color-mix(in srgb, var(--color-danger) 25%, transparent)"}`,
                borderRadius: "100px",
                padding: "0.2rem 0.75rem",
                alignSelf: "center",
              }}
            >
              {approved ? "ACTIVE" : "REJECTED"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 700,
              color: accentColor,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            {approved ? "Project Approved" : "Project Not Approved"}
          </motion.h1>

          {!approved && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9375rem",
                color: "var(--color-text-secondary)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Your project did not meet the minimum threshold of{" "}
              <span
                style={{
                  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                40 / 100
              </span>
            </motion.p>
          )}
        </motion.div>

        {/* ── CTAs ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 2.5 }}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <a
            href={approved && projectId ? `/project/${projectId}` : "/submit"}
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              backgroundColor: "var(--color-accent-blue)",
              borderRadius: "10px",
              padding: "0.875rem 1.5rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              letterSpacing: "-0.01em",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {approved ? "View Your Project →" : "Improve and Resubmit →"}
          </a>
          <a
            href="/browse"
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              background: "transparent",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "10px",
              padding: "0.75rem 1.5rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-text-primary)";
              e.currentTarget.style.borderColor = "var(--color-text-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-text-secondary)";
              e.currentTarget.style.borderColor = "var(--color-border-subtle)";
            }}
          >
            {approved ? "Browse All Projects" : "Browse Projects"}
          </a>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function VerifyPage() {
  return (
    <>
      <style>{`
        .verify-btn-ghost {
          font-family: var(--font-jakarta), system-ui, sans-serif;
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          background: transparent;
          border: 1px solid var(--color-border-subtle);
          border-radius: 10px;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .verify-btn-ghost:hover {
          color: var(--color-text-primary);
          border-color: var(--color-text-muted);
        }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />

        <main
          style={{
            flex: 1,
            paddingTop: "100px",
            paddingBottom: "5rem",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Suspense fallback={null}>
            <VerifyContent />
          </Suspense>
        </main>

        <footer
          style={{
            backgroundColor: "var(--color-background)",
            borderTop: "1px solid var(--color-border-subtle)",
            padding: "2rem 1.5rem",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                margin: 0,
                textAlign: "center",
              }}
            >
              Genatio is a testnet application. Not for real funds.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

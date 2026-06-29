"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { genLayerClient } from "@/lib/genatio";
import { useSubmission } from "@/context/SubmissionContext";

type PendingPhase = "waiting" | "check_dashboard" | "verified_flash" | "error";

function ElapsedTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const label = mins > 0
    ? `${mins}m ${secs}s`
    : `${secs}s`;

  return (
    <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace" }}>
      {label}
    </span>
  );
}

function SpinnerRing({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: "block" }}
    >
      <circle
        cx={32}
        cy={32}
        r={26}
        fill="none"
        stroke="var(--color-border-subtle)"
        strokeWidth={5}
      />
      <motion.circle
        cx={32}
        cy={32}
        r={26}
        fill="none"
        stroke="var(--color-accent-blue)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray="163.36"
        strokeDashoffset="0"
        style={{ originX: "32px", originY: "32px" }}
        animate={{ rotate: 360, strokeDashoffset: [120, 20, 120] }}
        transition={{
          rotate: { duration: 1.4, repeat: Infinity, ease: "linear" },
          strokeDashoffset: { duration: 1.4, repeat: Infinity, ease: "easeInOut" as const },
        }}
      />
    </svg>
  );
}

function CheckIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ display: "block" }}>
      <circle cx={24} cy={24} r={22} stroke="var(--color-accent-green)" strokeWidth={4} />
      <motion.path
        d="M13 24l8 8 14-14"
        stroke="var(--color-accent-green)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
      />
    </svg>
  );
}

function WaitingStatus({ startTime }: { startTime: number }) {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const tick = () => setMinutes(Math.floor((Date.now() - startTime) / 60000));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [startTime]);

  let message: string;
  let color: string;
  if (minutes < 2) {
    message = "GenLayer is reviewing your project. This may take a few minutes.";
    color = "var(--color-text-muted)";
  } else if (minutes < 5) {
    message = "Verification is still in progress.";
    color = "var(--color-accent-blue)";
  } else {
    message = "Verification is taking longer than usual. You can return to your dashboard and check again shortly.";
    color = "var(--color-text-secondary)";
  }

  return (
    <p
      style={{
        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
        fontSize: "0.8125rem",
        color,
        margin: "0.25rem 0 0",
        textAlign: "center",
        lineHeight: 1.5,
        transition: "color 0.4s ease",
      }}
    >
      {message}
    </p>
  );
}

function PendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address } = useAccount();

  const tx = searchParams.get("tx") ?? "";
  const title = searchParams.get("title") ?? "your project";

  const { setPending, clearPending } = useSubmission();

  const [startTime] = useState(() => Date.now());
  const [phase, setPhase] = useState<PendingPhase>("waiting");
  const [error, setError] = useState<string>("");
  const pollingRef = useRef(false);
  const redirectedRef = useRef(false);

  // Save tx to context so banner can pick it up if user navigates away
  useEffect(() => {
    if (tx && title) setPending(title, tx);
  }, [tx, title, setPending]);

  const truncatedTx = tx.length > 12
    ? `${tx.slice(0, 6)}…${tx.slice(-4)}`
    : tx;

  useEffect(() => {
    if (!tx || pollingRef.current) return;
    pollingRef.current = true;

    (async () => {
      try {
        const receipt = await (genLayerClient as any).waitForTransactionReceipt({
          hash: tx,
          status: "ACCEPTED",
          pollingInterval: 5000,
        });

        if (redirectedRef.current) return;

        const leaderReceipt = receipt?.consensus_data?.leader_receipt?.[0];
        const result = leaderReceipt?.result;

        let parsed: { status?: string; score?: number; project_id?: string; reason?: string } = {};
        if (typeof result === "string") {
          try { parsed = JSON.parse(result); } catch {}
        } else if (result && typeof result === "object") {
          parsed = result;
        }

        // Empty receipt — contract ran but returned no clear verdict
        if (!result || !parsed.status) {
          setPhase("check_dashboard");
          return;
        }

        if (parsed.status === "error") {
          setError("Project submission could not be completed. Please review your project details and try again.");
          setPhase("error");
          return;
        }

        const status = parsed.status;
        const score = parsed.score ?? 0;
        const projectId = parsed.project_id;
        const approved = status === "active";

        const params = new URLSearchParams({ status, score: String(score), title });
        if (approved && projectId) params.set("project_id", projectId);

        // Fetch rejection reason — wait 2s then bust cache to get fresh contract data
        if (!approved && address) {
          try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const res = await fetch(`/api/rejected?wallet=${address}&bust=${Date.now()}`);
            const list = await res.json() as { title: string; reason: string }[];
            const match = list.find((p) => p.title.toLowerCase() === title.toLowerCase());
            const reason = match?.reason || "Project did not meet the verification threshold. Review the feedback and try again with stronger project evidence.";
            params.set("reason", reason);
          } catch {
            params.set("reason", "Project did not meet the verification threshold. Review the feedback and try again with stronger project evidence.");
          }
        }

        clearPending();
        redirectedRef.current = true;
        router.push(`/verify?${params.toString()}`);
      } catch {
        // network error — keep showing the waiting state
      }
    })();
  }, [tx, title, address, router]);

  // Background refresh: check projects API every 30s as a secondary signal
  useEffect(() => {
    if (!address || !title) return;

    const check = async () => {
      if (redirectedRef.current) return;
      try {
        const res = await fetch("/api/projects?status=active");
        if (!res.ok) return;
        const raw: unknown = await res.json();
        type ActiveProject = { title?: string; wallet?: string; score?: number; id?: string };
        const list: ActiveProject[] = Array.isArray(raw) ? (raw as ActiveProject[]) : Object.values((raw as object) ?? {}) as ActiveProject[];
        const match = list.find(
          (p) =>
            p.wallet?.toLowerCase() === address.toLowerCase() &&
            p.title?.toLowerCase() === title.toLowerCase()
        );
        if (match) {
          redirectedRef.current = true;
          setPhase("verified_flash");
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const params = new URLSearchParams({
            status: "active",
            score: String(match.score ?? 0),
            title,
          });
          if (match.id != null) params.set("project_id", String(match.id));
          clearPending();
          router.push(`/verify?${params.toString()}`);
        }
      } catch {}
    };

    const interval = setInterval(check, 5_000);
    return () => clearInterval(interval);
  }, [address, title, router]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: "rgba(var(--color-surface-rgb), 0.7)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid var(--color-border-subtle)",
    borderRadius: "12px",
    padding: "2.5rem 2rem",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: "100%",
        maxWidth: "540px",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <AnimatePresence mode="wait">
        {phase === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" as const }}
            style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", textAlign: "center" }}
          >
            <SpinnerRing size={64} />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <h1
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "clamp(1.25rem, 3.5vw, 1.625rem)",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Submitting project for verification
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.9375rem",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                GenLayer is reviewing your project. This may take a few minutes.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.625rem 0.875rem",
                  backgroundColor: "rgba(var(--color-background-rgb), 0.6)",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  Transaction
                </span>
                <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                  {truncatedTx}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.625rem 0.875rem",
                  backgroundColor: "rgba(var(--color-background-rgb), 0.6)",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  Time elapsed
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                  <ElapsedTimer startTime={startTime} />
                </span>
              </div>

              <WaitingStatus startTime={startTime} />
            </div>

            <div
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                backgroundColor: "color-mix(in srgb, var(--color-accent-blue) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-accent-blue) 20%, transparent)",
                borderRadius: "8px",
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.8125rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.55,
              }}
            >
              Keep this tab open to see the result, or return to your dashboard and check again shortly.
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", width: "100%" }}>
              <button
                onClick={() => router.push("/dashboard")}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-border-subtle)",
                  color: "var(--color-text-secondary)",
                  borderRadius: "8px",
                  padding: "0.75rem 1.5rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  transition: "border-color 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--color-text-muted)";
                  e.currentTarget.style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/")}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-border-subtle)",
                  color: "var(--color-text-secondary)",
                  borderRadius: "8px",
                  padding: "0.75rem 1.5rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  transition: "border-color 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--color-text-muted)";
                  e.currentTarget.style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                Return Home
              </button>
            </div>
          </motion.div>
        )}

        {phase === "check_dashboard" && (
          <motion.div
            key="check_dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
            style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center", gap: "1.75rem", textAlign: "center" }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "color-mix(in srgb, var(--color-accent-blue) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-accent-blue) 25%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="var(--color-accent-blue)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h1
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "clamp(1.125rem, 3vw, 1.5rem)",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Project submission accepted.
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.9375rem",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                  lineHeight: 1.65,
                  maxWidth: "380px",
                }}
              >
                Your project data has been submitted for verification. Check your dashboard in a few minutes for the result.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/dashboard")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "var(--color-accent-blue)",
                color: "var(--color-background)",
                border: "none",
                borderRadius: "8px",
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Go to Dashboard
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10m-4-4l4 4-4 4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </motion.div>
        )}

        {phase === "verified_flash" && (
          <motion.div
            key="verified_flash"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.35, ease: "easeOut" as const }}
            style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", textAlign: "center" }}
          >
            <CheckIcon size={56} />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <h1
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "clamp(1.25rem, 3.5vw, 1.625rem)",
                  fontWeight: 700,
                  color: "var(--color-accent-green)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Project verified.
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.9375rem",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Redirecting to your verification result...
              </p>
            </div>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
            style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center", gap: "1.75rem", textAlign: "center" }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="var(--color-danger)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h1
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "clamp(1.125rem, 3vw, 1.5rem)",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Submission could not be completed
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.9375rem",
                  color: "var(--color-danger)",
                  margin: 0,
                  lineHeight: 1.65,
                  maxWidth: "380px",
                }}
              >
                {error}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/submit")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "var(--color-accent-blue)",
                color: "var(--color-background)",
                border: "none",
                borderRadius: "8px",
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Try again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PendingPage() {
  return (
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
          justifyContent: "center",
        }}
      >
        <Suspense fallback={null}>
          <PendingContent />
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
  );
}

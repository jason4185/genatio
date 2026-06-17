"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, XCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useSubmission } from "@/context/SubmissionContext";

// Pages where polling should be skipped (they handle submission state themselves)
const SKIP_POLL = ["/submit", "/pending", "/verify"];

type BannerState = "pending" | "approved" | "rejected";

interface BannerData {
  state: BannerState;
  title: string;
  score?: number;
  reason?: string;
  projectId?: string;
}

function MiniSpinner({ checking }: { checking: boolean }) {
  return (
    <motion.svg
      width={15} height={15} viewBox="0 0 15 15"
      style={{ flexShrink: 0 }}
      animate={checking ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
      transition={checking ? { duration: 0.6, ease: "easeInOut", repeat: 2 } : undefined}
    >
      <motion.circle
        cx={7.5} cy={7.5} r={5.5}
        fill="none"
        stroke="var(--color-accent-blue)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="34.5"
        style={{ originX: "7.5px", originY: "7.5px" }}
        animate={{ rotate: 360, strokeDashoffset: [26, 5, 26] }}
        transition={{
          rotate: { duration: 1.2, repeat: Infinity, ease: "linear" },
          strokeDashoffset: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
        }}
      />
    </motion.svg>
  );
}

export function SubmissionBanner() {
  const { pendingTx, pendingTitle, clearPending, addSubmissionNotif } = useSubmission();
  const { address } = useAccount();
  const pathname = usePathname();

  const [banner, setBanner] = useState<BannerData | null>(null);
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const resolvedRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const skipPoll = SKIP_POLL.some(p => pathname === p || pathname.startsWith(p + "/"));

  // Show pending banner whenever a pendingTx exists
  useEffect(() => {
    if (pendingTx && pendingTitle) {
      resolvedRef.current = false;
      setBanner({ state: "pending", title: pendingTitle });
      setVisible(true);
    } else if (!pendingTx && !resolvedRef.current) {
      setVisible(false);
      setBanner(null);
    }
  }, [pendingTx, pendingTitle]);

  // Poll for submission result — skip on pages that manage it themselves
  useEffect(() => {
    if (!pendingTx || !pendingTitle || !address || skipPoll) return;

    resolvedRef.current = false;

    const check = async () => {
      if (resolvedRef.current) return;
      setChecking(true);
      try {
        const res = await fetch("/api/projects?status=active");
        if (res.ok) {
          const raw = await res.json();
          type P = { title?: string; wallet?: string; score?: number; id?: string };
          const list: P[] = Array.isArray(raw) ? raw : Object.values(raw ?? {});
          const match = list.find(
            p =>
              p.wallet?.toLowerCase() === address.toLowerCase() &&
              p.title?.toLowerCase() === pendingTitle.toLowerCase()
          );
          if (match) {
            resolvedRef.current = true;
            const s = match.score ?? 0;
            const pid = String(match.id ?? "");
            addSubmissionNotif({ type: "approved", title: pendingTitle, score: s, projectId: pid });
            clearPending();
            setBanner({ state: "approved", title: pendingTitle, score: s, projectId: pid });
            setVisible(true);
            setChecking(false);
            dismissTimerRef.current = setTimeout(() => setVisible(false), 15_000);
            return;
          }
        }

        const rejRes = await fetch(`/api/rejected?wallet=${address}`);
        if (rejRes.ok) {
          const rejList = await rejRes.json() as { title: string; score: string; reason: string }[];
          const match = rejList.find(
            p => p.title.toLowerCase() === pendingTitle.toLowerCase()
          );
          if (match) {
            resolvedRef.current = true;
            const s = Number(match.score) || 0;
            addSubmissionNotif({ type: "rejected", title: pendingTitle, score: s, reason: match.reason });
            clearPending();
            setBanner({ state: "rejected", title: pendingTitle, score: s, reason: match.reason || "" });
            setVisible(true);
            setChecking(false);
            dismissTimerRef.current = setTimeout(() => setVisible(false), 15_000);
            return;
          }
        }
      } catch {}
      setChecking(false);
    };

    check();
    const interval = setInterval(check, 5_000);
    return () => clearInterval(interval);
  }, [pendingTx, pendingTitle, address, skipPoll, addSubmissionNotif, clearPending]);

  useEffect(() => {
    return () => { if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current); };
  }, []);

  // Only show on the home page
  if (!visible || !banner || pathname !== "/") return null;

  const dismiss = () => {
    setVisible(false);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  };

  let bg: string;
  let border: string;
  let icon: React.ReactNode;
  let msg: React.ReactNode;
  let action: React.ReactNode = null;

  switch (banner.state) {
    case "pending":
      bg = "color-mix(in srgb, var(--color-accent-blue) 6%, var(--color-surface))";
      border = "color-mix(in srgb, var(--color-accent-blue) 18%, transparent)";
      icon = <MiniSpinner checking={checking} />;
      msg = (
        <>
          Your project{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>
            &ldquo;{banner.title}&rdquo;
          </strong>{" "}
          is being verified by GenLayer Intelligent Contracts&hellip;
        </>
      );
      break;

    case "approved":
      bg = "color-mix(in srgb, var(--color-accent-green) 6%, var(--color-surface))";
      border = "color-mix(in srgb, var(--color-accent-green) 18%, transparent)";
      icon = <CheckCircle size={15} style={{ color: "var(--color-accent-green)", flexShrink: 0 }} />;
      msg = (
        <>
          <strong style={{ color: "var(--color-accent-green)" }}>
            &ldquo;{banner.title}&rdquo;
          </strong>{" "}
          was approved &mdash; Score{" "}
          <strong style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", color: "var(--color-text-primary)" }}>
            {banner.score}/100
          </strong>
          . Now live on Genatio.
        </>
      );
      if (banner.projectId) {
        action = (
          <a
            href={`/project/${banner.projectId}`}
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-accent-green)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            View Project &rarr;
          </a>
        );
      }
      break;

    case "rejected":
      bg = "color-mix(in srgb, var(--color-danger) 6%, var(--color-surface))";
      border = "color-mix(in srgb, var(--color-danger) 18%, transparent)";
      icon = <XCircle size={15} style={{ color: "var(--color-danger)", flexShrink: 0 }} />;
      msg = (
        <>
          <strong style={{ color: "var(--color-danger)" }}>
            &ldquo;{banner.title}&rdquo;
          </strong>{" "}
          was not approved &mdash; Score{" "}
          <strong style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", color: "var(--color-text-primary)" }}>
            {banner.score}/100
          </strong>
          {banner.reason ? <>. {banner.reason}</> : null}
        </>
      );
      action = (
        <a
          href="/submit"
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-danger)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Resubmit &rarr;
        </a>
      );
      break;

    default:
      return null;
  }

  return (
    <AnimatePresence>
      {visible && pathname === "/" && (
        <motion.div
          key="submission-banner"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            zIndex: 45,
            backgroundColor: bg,
            borderBottom: `1px solid ${border}`,
            padding: "0.5625rem 1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
            }}
          >
            {icon}
            <p
              style={{
                flex: 1,
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.8125rem",
                color: "var(--color-text-secondary)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {msg}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
              {action}
              {banner.state !== "pending" && (
                <button
                  onClick={dismiss}
                  aria-label="Dismiss"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0.125rem",
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

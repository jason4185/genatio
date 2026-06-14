"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, GitFork, ExternalLink, Shield, Flag, Clock,
  Loader2, X, CheckCircle, XCircle,
} from "lucide-react";
import { useAccount } from "wagmi";
import { createClient } from "genlayer-js";
import { testnetBradbury as glTestnetBradbury } from "genlayer-js/chains";
import type { Address } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import ScoreRing from "@/components/ScoreRing";
import FundingProgress from "@/components/FundingProgress";
import { useProject } from "@/hooks/useProject";
import { useFunders } from "@/hooks/useFunders";
import { DISPUTE_CONTRACT } from "@/lib/genatio";

type FlagPhase = "form" | "submitting" | "pending" | "waiting" | "resolved_invalid" | "resolved_valid";
type BannerType = "pending" | "invalid" | "valid";

const FLAG_REASONS = [
  "GitHub repo doesn't exist or is private",
  "GitHub repo doesn't match the project description",
  "Live URL doesn't load or shows unrelated content",
  "Project story appears copied or AI-generated",
  "Commits look fake or artificially created",
  "Funding purpose is vague or misleading",
  "README is empty or unrelated to the project",
];

function weiToGen(raw: number | string): number {
  return Number(raw) / 1e18;
}

function formatAmount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function truncateHash(hash: string): string {
  if (!hash || hash.length < 14) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

function extractRepo(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, "").replace(/\/$/, "");
  } catch {
    return url;
  }
}

function useCountdown(createdAt: string | number, durationDays: string | number) {
  const endTime = useMemo(
    () => new Date(createdAt).getTime() + Number(durationDays) * 24 * 3600 * 1000,
    [createdAt, durationDays]
  );
  const [remaining, setRemaining] = useState(endTime - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(endTime - Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const ms = Math.max(0, remaining);
  return {
    d: Math.floor(ms / (1000 * 60 * 60 * 24)),
    h: Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    m: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)),
    s: Math.floor((ms % (1000 * 60)) / 1000),
    ended: remaining <= 0,
  };
}

async function resolveFlag(hash: string): Promise<{ resolution: "valid" | "invalid"; reason: string }> {
  const glClient = createClient({ chain: glTestnetBradbury });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const receipt = await (glClient as any).waitForTransactionReceipt({
    hash,
    status: "ACCEPTED",
    timeout: 300000,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultRaw = (receipt as any)?.consensus_data?.leader_receipt?.[0]?.result;
  try {
    const parsed = JSON.parse(resultRaw as string);
    const res = String(parsed.resolution ?? "").toUpperCase();
    return {
      resolution: res === "VALID" ? "valid" : "invalid",
      reason: String(parsed.reason ?? ""),
    };
  } catch {
    return { resolution: "invalid", reason: "" };
  }
}

// ── Banner ─────────────────────────────────────────────────────────────────

interface FlagBannerProps {
  type: BannerType;
  reason: string;
  onDismiss: () => void;
}

function FlagBanner({ type, reason, onDismiss }: FlagBannerProps) {
  const cfg = {
    pending: {
      text: "Your flag is being investigated by GenLayer Intelligent Contracts",
      icon: <Loader2 size={14} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />,
      accentColor: "var(--color-accent-blue)",
    },
    invalid: {
      text: "Your flag was reviewed. Project appears legitimate.",
      icon: <CheckCircle size={14} style={{ flexShrink: 0 }} />,
      accentColor: "var(--color-success)",
    },
    valid: {
      text: "Your flag was confirmed. Project has been removed.",
      icon: <XCircle size={14} style={{ flexShrink: 0 }} />,
      accentColor: "var(--color-danger)",
    },
  }[type];

  return (
    <motion.div
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -48, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      style={{
        position: "fixed",
        top: "64px",
        left: 0,
        right: 0,
        zIndex: 40,
        backgroundColor: "var(--color-elevated)",
        borderBottom: `1px solid ${cfg.accentColor}`,
        padding: "0.625rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          color: cfg.accentColor,
          minWidth: 0,
        }}
      >
        {cfg.icon}
        <span
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: cfg.accentColor,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cfg.text}
          {reason ? ` — ${reason}` : ""}
        </span>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          padding: "0.125rem",
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ── Skeleton / Shimmer ──────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  backgroundColor: "rgba(var(--color-surface-rgb), 0.7)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: "12px",
  padding: "1.5rem",
};

const statBoxStyle: React.CSSProperties = {
  backgroundColor: "rgba(var(--color-surface-rgb), 0.5)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: "8px",
  padding: "0.75rem",
};

function Shimmer({ width = "100%", height = "1rem", radius = "6px" }: { width?: string; height?: string; radius?: string }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: "var(--color-elevated)",
        animation: "skeleton-shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="project-layout">
      <div className="project-left" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Shimmer height="2.5rem" width="70%" />
          <Shimmer height="1rem" width="45%" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Shimmer width="100px" height="100px" radius="50%" />
          <Shimmer width="80px" height="1.75rem" radius="100px" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Shimmer height="0.75rem" width="28%" />
            <Shimmer />
            <Shimmer />
            <Shimmer width="65%" />
          </div>
        ))}
      </div>
      <div className="project-right" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Shimmer height="0.5rem" />
          <Shimmer height="2rem" width="50%" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Shimmer height="4.5rem" />
            <Shimmer height="4.5rem" />
          </div>
          <Shimmer height="5rem" />
          <Shimmer height="3rem" radius="10px" />
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? null;

  const { address, isConnected } = useAccount();
  const { project, loading: projectLoading, error: projectError } = useProject(projectId);

  // Flag modal state
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [flagPhase, setFlagPhase] = useState<FlagPhase>("form");
  const [flagTxHash, setFlagTxHash] = useState<string | null>(null);
  const [flagResolutionReason, setFlagResolutionReason] = useState("");
  const [flagError, setFlagError] = useState<string | null>(null);

  // Banner state (returning user)
  const [flagBanner, setFlagBanner] = useState<BannerType | null>(null);
  const [bannerReason, setBannerReason] = useState("");

  // Tracks whether "Keep waiting" polling should update modal vs banner
  const keepWaitingActiveRef = useRef(false);

  const isOwnProject =
    !!address && !!project?.wallet &&
    address.toLowerCase() === project.wallet.toLowerCase();

  // ── CHANGE 4: Page load: check contract for flag via API ────────────────
  useEffect(() => {
    if (!address || !projectId || !project) return;
    fetch(`/api/flags/${projectId}`)
      .then(r => r.json())
      .then(flag => {
        if (!flag) return;
        if (flag.raised_by?.toLowerCase() === address.toLowerCase()) {
          const isValid = String(flag.resolution ?? "").toUpperCase().startsWith("VALID");
          setFlagBanner(isValid ? "valid" : "invalid");
          setBannerReason(flag.resolution ?? "");
        }
      })
      .catch(() => {});
  }, [address, projectId, project]);

  // ── Flag modal helpers ───────────────────────────────────────────────────
  const closeFlagModal = () => {
    if (flagPhase === "submitting") return;
    if (flagPhase === "pending" || flagPhase === "waiting") {
      keepWaitingActiveRef.current = false;
      setFlagBanner("pending");
    }
    setFlagModalOpen(false);
    setSelectedReasons([]);
    setFlagError(null);
    setFlagPhase("form");
    setFlagTxHash(null);
    setFlagResolutionReason("");
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleFlagSubmit = async () => {
    if (!address || selectedReasons.length === 0 || !project || !projectId) return;
    setFlagPhase("submitting");
    setFlagError(null);

    try {
      const glClient = createClient({ chain: glTestnetBradbury, account: address });
      const hash = await glClient.writeContract({
        address: DISPUTE_CONTRACT as Address,
        functionName: "flag_project",
        args: [project.title, selectedReasons.join(", ")],
        value: 0n,
      });

      const hashStr = String(hash);
      setFlagTxHash(hashStr);
      setFlagPhase("pending");
    } catch (err: unknown) {
      const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (errMsg.includes("user rejected") || errMsg.includes("rejected the request")) {
        setFlagError("Transaction cancelled.");
      } else if (errMsg.includes("insufficient funds") || errMsg.includes("insufficient balance")) {
        setFlagError("Insufficient GEN balance. Please add funds to your wallet.");
      } else if (errMsg.includes("reverted") || errMsg.includes("execution failed")) {
        setFlagError("Transaction failed. Please try again.");
      } else if (errMsg.includes("failed to fetch") || errMsg.includes("network error")) {
        setFlagError("Unable to connect. Please check your internet connection and try again.");
      } else {
        setFlagError("Something went wrong. Please try again.");
      }
      setFlagPhase("form");
    }
  };

  const handleKeepWaiting = async () => {
    if (!flagTxHash || !projectId) return;
    keepWaitingActiveRef.current = true;
    setFlagPhase("waiting");
    setFlagError(null);

    try {
      const { resolution, reason } = await resolveFlag(flagTxHash);

      if (keepWaitingActiveRef.current) {
        // Modal is still open — update modal state
        setFlagResolutionReason(reason);
        setFlagPhase(resolution === "valid" ? "resolved_valid" : "resolved_invalid");
      } else {
        // User closed modal while waiting — update banner
        setBannerReason(reason);
        setFlagBanner(resolution === "valid" ? "valid" : "invalid");
      }
    } catch (err: unknown) {
      if (keepWaitingActiveRef.current) {
        const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
        if (errMsg.includes("timed out") || errMsg.includes("timeout")) {
          setFlagError("Investigation is taking longer than expected. Please check back in a few minutes.");
        } else if (errMsg.includes("failed to fetch") || errMsg.includes("network error")) {
          setFlagError("Unable to connect. Please check your internet connection and try again.");
        } else {
          setFlagError("Something went wrong checking the status. Please try again.");
        }
        setFlagPhase("pending");
      }
    }
  };

  const handleCloseAndCheckLater = () => {
    keepWaitingActiveRef.current = false;
    setFlagBanner("pending");
    setFlagModalOpen(false);
    setFlagPhase("form");
    setSelectedReasons([]);
    setFlagError(null);
  };

  const [showFundToast, setShowFundToast] = useState(false);

  // ── Funders (staggered) ──────────────────────────────────────────────────
  const [fundersId, setFundersId] = useState<string | null>(null);
  useEffect(() => {
    if (!projectLoading && project && projectId) {
      const timer = setTimeout(() => setFundersId(projectId), 2000);
      return () => clearTimeout(timer);
    }
  }, [projectLoading, project, projectId]);

  const { funders, loading: fundersLoading } = useFunders(fundersId);

  const raised = project ? weiToGen(project.raised_gen) : 0;
  const goal = project ? weiToGen(project.goal_gen) : 0;
  const fundedPct = goal > 0 ? Math.round((raised / goal) * 100) : 0;
  const countdown = useCountdown(project?.created_at ?? 0, project?.duration_days ?? 0);

  const statusColor =
    project?.status === "ACTIVE"
      ? "var(--color-success)"
      : project?.status === "DISPUTED"
      ? "var(--color-warning)"
      : "var(--color-text-muted)";

  const statusBorderColor =
    project?.status === "ACTIVE"
      ? "color-mix(in srgb, var(--color-success) 20%, transparent)"
      : project?.status === "DISPUTED"
      ? "color-mix(in srgb, var(--color-warning) 20%, transparent)"
      : "color-mix(in srgb, var(--color-text-secondary) 20%, transparent)";

  const endDate = project
    ? new Date(new Date(project.created_at).getTime() + Number(project.duration_days) * 24 * 3600 * 1000)
    : null;
  const endDateStr = endDate
    ? endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .project-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        @media (min-width: 1024px) {
          .project-layout { flex-direction: row; align-items: flex-start; }
          .project-left { flex: 65; min-width: 0; }
          .project-right { flex: 35; min-width: 300px; position: sticky; top: 88px; }
        }
        .ext-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-family: var(--font-jetbrains), ui-monospace, monospace;
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .ext-link:hover { color: var(--color-accent-blue); }
        .section-eyebrow {
          font-family: var(--font-jetbrains), ui-monospace, monospace;
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--color-accent-blue);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin: 0 0 0.875rem;
        }
        .donor-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
        }
        .project-footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 640px) {
          .project-footer-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .project-main {
          flex: 1;
          padding-top: 88px;
          padding-bottom: 5rem;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
        }
        @media (min-width: 768px) {
          .project-main { padding-top: 100px; }
        }
      `}</style>

      {/* ── Flag banner (flagger-only, per-browser) ────────────────────── */}
      <AnimatePresence>
        {flagBanner && (
          <FlagBanner
            type={flagBanner}
            reason={bannerReason}
            onDismiss={() => { setFlagBanner(null); setBannerReason(""); }}
          />
        )}
      </AnimatePresence>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />

        <main className="project-main">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
            <a
              href="/browse"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              <ArrowLeft size={14} />
              Browse
            </a>
            <span style={{ color: "var(--color-border-subtle)", userSelect: "none" }}>/</span>
            <span
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "240px",
              }}
            >
              {project?.title ?? "Loading…"}
            </span>
          </div>

          {/* Error state */}
          {projectError && (
            <div
              style={{
                ...cardStyle,
                borderColor: "color-mix(in srgb, var(--color-danger) 30%, transparent)",
                textAlign: "center",
                padding: "4rem 2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                Project not found
              </p>
              <p style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
                {projectError}
              </p>
              <a
                href="/browse"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-accent-blue)",
                  textDecoration: "none",
                  border: "1px solid var(--color-accent-blue)",
                  borderRadius: "8px",
                  padding: "0.625rem 1.25rem",
                  marginTop: "0.5rem",
                }}
              >
                <ArrowLeft size={14} />
                Back to Browse
              </a>
            </div>
          )}

          {/* Loading skeleton */}
          {projectLoading && !projectError && <LoadingSkeleton />}

          {/* Not found (no error but null project) */}
          {!projectLoading && !projectError && !project && (
            <div style={{ ...cardStyle, textAlign: "center", padding: "4rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                Project not found
              </p>
              <a href="/browse" style={{ color: "var(--color-accent-blue)", fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.375rem", textDecoration: "none" }}>
                <ArrowLeft size={14} /> Back to Browse
              </a>
            </div>
          )}

          {/* Loaded content */}
          {!projectLoading && !projectError && project && (
            <div className="project-layout">
              {/* ── LEFT COLUMN ─────────────────────────────────── */}
              <div className="project-left" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                {/* Title + external links */}
                <div>
                  <h1
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.15,
                      margin: "0 0 1rem",
                    }}
                  >
                    {project.title}
                  </h1>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                    {project.github_repo_url && (
                      <a href={project.github_repo_url} target="_blank" rel="noopener noreferrer" className="ext-link">
                        <GitFork size={14} />
                        {extractRepo(project.github_repo_url)}
                      </a>
                    )}
                    {project.live_url && (
                      <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="ext-link">
                        <ExternalLink size={14} />
                        {project.live_url.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>

                {/* Score ring + status */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  <ScoreRing score={Number(project.score) || 0} size={100} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color: statusColor,
                        letterSpacing: "0.08em",
                        border: `1px solid ${statusBorderColor}`,
                        borderRadius: "100px",
                        padding: "0.25rem 0.875rem",
                        alignSelf: "flex-start",
                      }}
                    >
                      {project.status}
                    </span>
                    <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      GenLayer Score
                    </span>
                  </div>
                </div>

                {/* About / Story */}
                <div style={cardStyle}>
                  <p className="section-eyebrow">About this project</p>
                  <p
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.9375rem",
                      color: "var(--color-text-secondary)",
                      lineHeight: 1.75,
                      margin: 0,
                    }}
                  >
                    {project.story}
                  </p>
                </div>

                {/* Funding Purpose */}
                {project.funding_purpose && (
                  <div style={cardStyle}>
                    <p className="section-eyebrow">Funding Purpose</p>
                    <p
                      style={{
                        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                        fontSize: "0.9375rem",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.75,
                        margin: 0,
                      }}
                    >
                      {project.funding_purpose}
                    </p>
                  </div>
                )}

                {/* Recent Funders */}
                <div style={cardStyle}>
                  <p className="section-eyebrow">Recent Donors</p>

                  {fundersLoading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <Shimmer width="32px" height="32px" radius="50%" />
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                              <Shimmer width="120px" height="0.8125rem" />
                              <Shimmer width="70px" height="0.75rem" />
                            </div>
                          </div>
                          <Shimmer width="60px" height="0.875rem" />
                        </div>
                      ))}
                    </div>
                  ) : funders.length === 0 ? (
                    <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
                      No donors yet — be the first to fund this project.
                    </p>
                  ) : (
                    <div>
                      {funders.map((funder, i) => (
                        <div
                          key={i}
                          className="donor-row"
                          style={{ borderBottom: i < funders.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                backgroundColor: "color-mix(in srgb, var(--color-accent-blue) 10%, transparent)",
                                border: "1px solid color-mix(in srgb, var(--color-accent-blue) 20%, transparent)",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.5625rem", fontWeight: 700, color: "var(--color-accent-blue)" }}>
                                0x
                              </span>
                            </div>
                            <div>
                              <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.8125rem", color: "var(--color-text-primary)", display: "block" }}>
                                {truncateAddress(String(funder.address))}
                              </span>
                              {funder.timestamp && (
                                <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                  <Clock size={10} />
                                  {funder.timestamp}
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", flexShrink: 0 }}>
                            {formatAmount(weiToGen(funder.amount))} GEN
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT COLUMN ─────────────────────────────────── */}
              <div className="project-right" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                {/* Funding Card */}
                <div style={cardStyle}>
                  <FundingProgress raised={raised} goal={goal} />

                  <div style={{ marginTop: "1rem", marginBottom: "1.25rem" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                        fontSize: "1.625rem",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        letterSpacing: "-0.02em",
                        display: "block",
                        lineHeight: 1.1,
                      }}
                    >
                      {formatAmount(raised)} GEN
                    </span>
                    <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                      raised of {formatAmount(goal)} GEN goal
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={statBoxStyle}>
                      <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-accent-blue)", display: "block", letterSpacing: "-0.01em" }}>
                        {fundedPct}%
                      </span>
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        funded
                      </span>
                    </div>
                    <div style={statBoxStyle}>
                      <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)", display: "block", letterSpacing: "-0.01em" }}>
                        {project.donor_count}
                      </span>
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        donors
                      </span>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div style={{ ...statBoxStyle, marginBottom: "1rem" }}>
                    <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>
                      {countdown.ended ? "Campaign ended" : "Campaign ends in"}
                    </span>
                    {!countdown.ended && (
                      <div style={{ display: "flex", gap: "0.875rem", alignItems: "baseline", marginBottom: "0.5rem" }}>
                        {([
                          { val: countdown.d, unit: "d" },
                          { val: countdown.h, unit: "h" },
                          { val: countdown.m, unit: "m" },
                          { val: countdown.s, unit: "s" },
                        ] as const).map(({ val, unit }) => (
                          <div key={unit} style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
                            <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", minWidth: "2ch", display: "inline-block" }}>
                              {String(val).padStart(2, "0")}
                            </span>
                            <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                              {unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {endDateStr && (
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {countdown.ended ? "Ended" : "Ends"} {endDateStr}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <button
                      title="GEN transfers coming soon — Bradbury support pending"
                      aria-disabled="true"
                      onClick={() => {
                        setShowFundToast(true);
                        setTimeout(() => setShowFundToast(false), 3500);
                      }}
                      style={{
                        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: "var(--color-text-muted)",
                        backgroundColor: "var(--color-elevated)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: "10px",
                        padding: "0.875rem 1rem",
                        cursor: "not-allowed",
                        width: "100%",
                        letterSpacing: "-0.01em",
                        opacity: 0.75,
                      }}
                    >
                      Fund Project
                    </button>

                    <AnimatePresence>
                      {showFundToast ? (
                        <motion.p
                          key="fund-toast"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                            fontSize: "0.8125rem",
                            color: "var(--color-accent-blue)",
                            margin: 0,
                            textAlign: "center",
                          }}
                        >
                          GEN transfers coming soon — Bradbury support pending
                        </motion.p>
                      ) : (
                        <motion.p
                          key="fund-hint"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                            fontSize: "0.8125rem",
                            color: "var(--color-text-muted)",
                            margin: 0,
                            textAlign: "center",
                          }}
                        >
                          GEN transfers coming soon
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Verification Card */}
                <div style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--color-success) 20%, transparent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Shield size={15} color="var(--color-success)" />
                    </div>
                    <p className="section-eyebrow" style={{ margin: 0 }}>Verification</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {([
                      { label: "Verified by", value: "GenLayer Intelligent Contracts", mono: false, highlight: false },
                      { label: "Score", value: `${Number(project.score) || 0}/100`, mono: true, highlight: true },
                      { label: "Method", value: "Optimistic Democracy", mono: false, highlight: false },
                      { label: "Validators", value: "5 reached consensus", mono: true, highlight: false },
                      ...(project.wallet ? [{ label: "Creator", value: truncateAddress(project.wallet), mono: true, highlight: false }] : []),
                    ] as const).map(({ label, value, mono, highlight }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                        <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-muted)", flexShrink: 0 }}>
                          {label}
                        </span>
                        <span
                          style={{
                            fontFamily: mono ? "var(--font-jetbrains), ui-monospace, monospace" : "var(--font-jakarta), system-ui, sans-serif",
                            fontSize: "0.8125rem",
                            color: highlight ? "var(--color-success)" : "var(--color-text-primary)",
                            fontWeight: highlight ? 700 : 500,
                            textAlign: "right",
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flag Card */}
                <div style={{ ...cardStyle, borderColor: "color-mix(in srgb, var(--color-danger) 18%, transparent)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <Flag size={13} color="var(--color-danger)" />
                    <p className="section-eyebrow" style={{ margin: 0, color: "var(--color-danger)" }}>
                      Flag this project
                    </p>
                  </div>
                  <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
                    Report suspicious activity, misleading claims, or policy violations.
                  </p>
                  <button
                    disabled={!isConnected || isOwnProject}
                    onClick={() => { if (isConnected && !isOwnProject) setFlagModalOpen(true); }}
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-danger)",
                      backgroundColor: "transparent",
                      border: "1px solid var(--color-danger)",
                      borderRadius: "8px",
                      padding: "0.625rem 1rem",
                      cursor: (!isConnected || isOwnProject) ? "not-allowed" : "pointer",
                      width: "100%",
                      opacity: (!isConnected || isOwnProject) ? 0.45 : 1,
                      transition: "opacity 0.2s ease, background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (isConnected && !isOwnProject)
                        e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--color-danger) 6%, transparent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Flag Project
                  </button>
                  {!isConnected && (
                    <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.625rem 0 0", textAlign: "center" }}>
                      Connect wallet to flag
                    </p>
                  )}
                  {isConnected && isOwnProject && (
                    <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.625rem 0 0", textAlign: "center" }}>
                      Cannot flag your own project
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{ backgroundColor: "var(--color-background)", borderTop: "1px solid var(--color-border-subtle)", padding: "3.5rem 1.5rem 2rem" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div className="project-footer-grid" style={{ marginBottom: "3rem", alignItems: "start" }}>
              <div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <Logo size={22} />
                </div>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6, maxWidth: "220px" }}>
                  Trustless grants for open source builders.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[{ label: "Browse", href: "/browse" }, { label: "Submit Project", href: "/submit" }, { label: "GitHub", href: "#" }, { label: "Twitter / X", href: "#" }].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-secondary)", textDecoration: "none", transition: "color 0.2s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0 0 0.375rem" }}>Built on</p>
                <p style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-accent-blue)", margin: 0, letterSpacing: "0.02em" }}>
                  GenLayer Bradbury
                </p>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0" }}>
                  AI-native blockchain
                </p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "1.5rem", display: "flex", justifyContent: "center" }}>
              <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, textAlign: "center" }}>
                Genatio is a testnet application. Not for real funds.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* ── Flag Modal ──────────────────────────────────────────────────────── */}
      {flagModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            backgroundColor: "rgba(var(--color-background-rgb), 0.8)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeFlagModal(); }}
        >
          <div
            style={{
              ...cardStyle,
              width: "100%",
              maxWidth: "480px",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            {/* Close button — hidden during submitting */}
            {flagPhase !== "submitting" && (
              <button
                onClick={closeFlagModal}
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={18} />
              </button>
            )}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", paddingRight: "2rem" }}>
              <Flag size={15} color="var(--color-danger)" />
              <h2
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Flag this project
              </h2>
            </div>

            {/* ── SUBMITTING phase ── */}
            {flagPhase === "submitting" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem 0", textAlign: "center" }}>
                <Loader2 size={28} color="var(--color-accent-blue)" style={{ animation: "spin 1s linear infinite" }} />
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                  Confirm in your wallet
                </p>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  Submitting flag to GenLayer Intelligent Contracts... This may take 2–5 minutes
                </p>
              </div>
            )}

            {/* ── PENDING phase ── */}
            {flagPhase === "pending" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0", textAlign: "center" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-elevated)",
                      border: "1px solid var(--color-border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Loader2 size={22} color="var(--color-accent-blue)" style={{ animation: "spin 1s linear infinite" }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                    GenLayer Intelligent Contracts are investigating...
                  </p>
                  {flagTxHash && (
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                        backgroundColor: "var(--color-elevated)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: "6px",
                        padding: "0.25rem 0.625rem",
                      }}
                    >
                      {truncateHash(flagTxHash)}
                    </span>
                  )}
                  <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    This takes 2–5 minutes. You can close this page and check back.
                  </p>
                </div>

                {flagError && (
                  <div style={{ padding: "0.75rem 1rem", backgroundColor: "color-mix(in srgb, var(--color-danger) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)", borderRadius: "8px" }}>
                    <p style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.8125rem", color: "var(--color-danger)", margin: 0, wordBreak: "break-word" }}>
                      {flagError}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={handleCloseAndCheckLater}
                    style={{
                      flex: 1,
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--color-text-secondary)",
                      backgroundColor: "transparent",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "8px",
                      padding: "0.625rem 1rem",
                      cursor: "pointer",
                    }}
                  >
                    Close and check later
                  </button>
                  <button
                    onClick={handleKeepWaiting}
                    style={{
                      flex: 1,
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-accent-blue)",
                      backgroundColor: "transparent",
                      border: "1px solid var(--color-accent-blue)",
                      borderRadius: "8px",
                      padding: "0.625rem 1rem",
                      cursor: "pointer",
                    }}
                  >
                    Keep waiting
                  </button>
                </div>
              </div>
            )}

            {/* ── WAITING phase ── */}
            {flagPhase === "waiting" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem 0", textAlign: "center" }}>
                <Loader2 size={28} color="var(--color-accent-blue)" style={{ animation: "spin 1s linear infinite" }} />
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                  Waiting for consensus...
                </p>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  GenLayer validators are reaching a decision. This may take a few minutes.
                </p>
              </div>
            )}

            {/* ── RESOLVED: INVALID (flag dismissed) ── */}
            {flagPhase === "resolved_invalid" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem 0", textAlign: "center" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-elevated)",
                    border: "1px solid var(--color-success)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle size={22} color="var(--color-success)" />
                </div>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-success)", margin: 0 }}>
                  Flag dismissed. Project appears legitimate.
                </p>
                {flagResolutionReason && (
                  <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    {flagResolutionReason}
                  </p>
                )}
                <button
                  onClick={closeFlagModal}
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    backgroundColor: "var(--color-elevated)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "8px",
                    padding: "0.625rem 1.5rem",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                  }}
                >
                  Close
                </button>
              </div>
            )}

            {/* ── RESOLVED: VALID (project removed) ── */}
            {flagPhase === "resolved_valid" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem 0", textAlign: "center" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-elevated)",
                    border: "1px solid var(--color-danger)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <XCircle size={22} color="var(--color-danger)" />
                </div>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-danger)", margin: 0 }}>
                  Project removed. Flag confirmed.
                </p>
                {flagResolutionReason && (
                  <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    {flagResolutionReason}
                  </p>
                )}
                <button
                  onClick={closeFlagModal}
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    backgroundColor: "var(--color-elevated)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "8px",
                    padding: "0.625rem 1.5rem",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                  }}
                >
                  Close
                </button>
              </div>
            )}

            {/* ── FORM phase ── */}
            {flagPhase === "form" && (
              !isConnected ? (
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6, textAlign: "center", padding: "1rem 0" }}>
                  Connect your wallet to flag projects.
                </p>
              ) : (
                <>
                  <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: "0 0 1.125rem", lineHeight: 1.55 }}>
                    Select all that apply:
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.25rem" }}>
                    {FLAG_REASONS.map((reason) => {
                      const checked = selectedReasons.includes(reason);
                      return (
                        <label
                          key={reason}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.75rem",
                            cursor: "pointer",
                            padding: "0.625rem 0.875rem",
                            borderRadius: "8px",
                            border: `1px solid ${checked ? "color-mix(in srgb, var(--color-danger) 30%, transparent)" : "var(--color-border-subtle)"}`,
                            backgroundColor: checked ? "color-mix(in srgb, var(--color-danger) 4%, transparent)" : "transparent",
                            transition: "border-color 0.15s ease, background-color 0.15s ease",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleReason(reason)}
                            style={{ marginTop: "2px", flexShrink: 0, accentColor: "var(--color-danger)", cursor: "pointer" }}
                          />
                          <span
                            style={{
                              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                              fontSize: "0.875rem",
                              color: checked ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                              lineHeight: 1.5,
                              transition: "color 0.15s ease",
                            }}
                          >
                            {reason}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {flagError && (
                    <div style={{ padding: "0.75rem 1rem", backgroundColor: "color-mix(in srgb, var(--color-danger) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)", borderRadius: "8px", marginBottom: "1rem" }}>
                      <p style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.8125rem", color: "var(--color-danger)", margin: 0, wordBreak: "break-word" }}>
                        {flagError}
                      </p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={closeFlagModal}
                      style={{
                        flex: 1,
                        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "var(--color-text-secondary)",
                        backgroundColor: "transparent",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: "8px",
                        padding: "0.625rem 1rem",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFlagSubmit}
                      disabled={selectedReasons.length === 0}
                      style={{
                        flex: 2,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--color-danger)",
                        backgroundColor: "transparent",
                        border: "1px solid var(--color-danger)",
                        borderRadius: "8px",
                        padding: "0.625rem 1rem",
                        cursor: selectedReasons.length === 0 ? "not-allowed" : "pointer",
                        opacity: selectedReasons.length === 0 ? 0.5 : 1,
                        transition: "opacity 0.2s ease, background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedReasons.length > 0)
                          e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--color-danger) 6%, transparent)";
                      }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <Flag size={13} />
                      Submit Flag
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}

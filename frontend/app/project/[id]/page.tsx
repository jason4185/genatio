"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowLeft, Clock3, Coins, ExternalLink, Flag,
  GitFork, HeartHandshake, Loader2, ShieldCheck, Users, Wallet, X, CheckCircle, XCircle,
} from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { createClient } from "genlayer-js";
import { testnetBradbury as glTestnetBradbury } from "genlayer-js/chains";
import type { Address } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import ScoreRing from "@/components/ScoreRing";
import { useCountdown } from "@/hooks/useCountdown";
import { useFunders } from "@/hooks/useFunders";
import { useProject } from "@/hooks/useProject";
import { DISPUTE_CONTRACT, EXPLORER_URL, GENATIO_CONTRACT } from "@/lib/genatio";

type FlagPhase = "form" | "submitting" | "pending" | "waiting" | "resolved_invalid" | "resolved_valid";

type BannerType = "pending" | "invalid" | "valid";

const FLAG_REASONS = [
  "GitHub repository does not exist or cannot be accessed",
  "Project description does not match the GitHub repository content",
  "No commits or development activity found in the repository",
  "Live URL does not load or shows unrelated content",
  "Funding purpose appears vague or unrelated to the project",
  "Project story contains false or misleading claims",
  "Significant inconsistency between project claims and evidence",
];

function weiToGen(raw: number | string): number {
  return Number(raw) / 1e18;
}

function formatGenFromWei(raw?: number | string): string {
  return formatAmount(weiToGen(raw ?? 0));
}

function parseGenToWei(raw: string): bigint | null {
  const normalized = raw.trim();
  if (!normalized || normalized.startsWith("-")) return null;
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;

  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > 18) return null;

  const wholeWei = BigInt(whole || "0") * 10n ** 18n;
  const paddedFraction = (fraction + "0".repeat(18)).slice(0, 18);
  const fractionWei = BigInt(paddedFraction || "0");
  const total = wholeWei + fractionWei;

  return total > 0n ? total : null;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseReceiptResult(receipt: any): { resolution: "valid" | "invalid"; reason: string } {
  const leaderReceipt = receipt?.consensus_data?.leader_receipt?.[0];
  const resultRaw = leaderReceipt?.result;

  // Handle raw "0" or "1" from new contract format
  if (resultRaw === "1" || resultRaw === 1) {
    return { resolution: "valid", reason: "Report confirmed. The project has been removed from Genatio." };
  }
  if (resultRaw === "0" || resultRaw === 0) {
    return { resolution: "invalid", reason: "Report reviewed. The project remains listed." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any = {};

  if (typeof resultRaw === "string") {
    try { parsed = JSON.parse(resultRaw); } catch {}
  } else if (resultRaw && typeof resultRaw === "object") {
    parsed = resultRaw;
  }

  // Handle JSON {"status": "success", "resolution": "VALID"/"INVALID", "reason": "..."}
  if (!parsed.resolution && !parsed.status) {
    return { resolution: "invalid", reason: "No resolution was available. Please check again shortly." };
  }

  const res = String(parsed.resolution ?? "").toUpperCase();
  return {
    resolution: res.startsWith("VALID") ? "valid" : "invalid",
    reason: String(parsed.reason ?? "Investigation complete."),
  };
}

async function resolveFlag(hash: string): Promise<{ resolution: "valid" | "invalid"; reason: string }> {
  const glClient = createClient({ chain: glTestnetBradbury });

  try {
    // First try to get transaction directly — it may already be ACCEPTED
    const tx = await (glClient as any).getTransaction({ hash });

    if (tx?.status === "ACCEPTED" || tx?.consensus_data) {
      // Already ACCEPTED — read result directly
      return parseReceiptResult(tx);
    }
  } catch {
    // Transaction not found yet — continue to waitForTransactionReceipt
  }

  // Wait for ACCEPTED
  const receipt = await (glClient as any).waitForTransactionReceipt({
    hash,
    status: "ACCEPTED",
    pollingInterval: 5000,
  });

  return parseReceiptResult(receipt);
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
      text: "Your report has been submitted for review.",
      icon: <Loader2 size={14} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />,
      accentColor: "var(--color-warning)",
    },
    invalid: {
      text: "Your report was reviewed. The project remains listed.",
      icon: <CheckCircle size={14} style={{ flexShrink: 0 }} />,
      accentColor: "var(--color-success)",
    },
    valid: {
      text: "Report confirmed. This project has been removed from Genatio.",
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
  backgroundColor: "rgba(var(--color-surface-rgb), 0.94)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid var(--color-border-strong)",
  borderRadius: "12px",
  padding: "1.5rem",
};

const statBoxStyle: React.CSSProperties = {
  backgroundColor: "rgba(var(--color-surface-rgb), 0.72)",
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
  const router = useRouter();
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const { address, isConnected } = useAccount();

  // Flag modal state
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [flagPhase, setFlagPhase] = useState<FlagPhase>("form");

  const pollInterval = (flagPhase === "waiting" || flagPhase === "pending") ? 5_000 : 30_000;
  const { project, loading: projectLoading, error: projectError, refetch: refetchProject } = useProject(projectId, pollInterval);
  const { funders, loading: fundersLoading, error: fundersError, refetch: refetchFunders } = useFunders(projectId);
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
  const raisedGen = weiToGen(project?.raised_gen ?? 0);
  const goalGen = weiToGen(project?.goal_gen ?? 0);
  const donorCount = Number(project?.donor_count ?? 0);
  const countdown = useCountdown(project?.created_at, project?.duration_days);
  const fundingProgress = goalGen > 0 ? Math.min(100, (raisedGen / goalGen) * 100) : 0;
  const donorCountLabel = `${donorCount} ${donorCount === 1 ? "donor" : "donors"}`;

  // Fund modal state
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundPhase, setFundPhase] = useState<"form" | "submitting" | "pending" | "success">("form");
  const [fundError, setFundError] = useState<string | null>(null);
  const [fundTxHash, setFundTxHash] = useState<string | null>(null);

  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const closeFundModal = () => {
    if (fundPhase === "submitting" || fundPhase === "pending") return;
    setFundModalOpen(false);
    setFundAmount("");
    setFundPhase("form");
    setFundError(null);
    setFundTxHash(null);
  };

  const handleSendGen = async () => {
    const weiAmount = parseGenToWei(fundAmount);
    if (!address || !projectId || !project?.wallet || !weiAmount) {
      setFundError("Enter a valid GEN amount. GEN amount can include up to 18 decimal places.");
      return;
    }
    setFundPhase("submitting");
    setFundError(null);

    if (chainId !== 4221) {
      try {
        await switchChainAsync({ chainId: 4221 });
      } catch {
        setFundError("Switch your wallet to the GenLayer Bradbury network, then try again.");
        setFundPhase("form");
        return;
      }
    }

    const glClient = createClient({
      chain: glTestnetBradbury,
      account: address,
    });

    let hash: string;
    try {
      const result = await glClient.writeContract({
        address: GENATIO_CONTRACT as Address,
        functionName: "fund_project",
        args: [projectId],
        value: weiAmount,
      });
      hash = String(result);
    } catch (err: unknown) {
      const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (errMsg.includes("user rejected") || errMsg.includes("rejected the request")) {
        setFundError("Transaction was declined in your wallet.");
      } else if (errMsg.includes("insufficient funds") || errMsg.includes("insufficient balance")) {
        setFundError("Your wallet does not have enough GEN to complete this transaction.");
      } else if (errMsg.includes("project not found")) {
        setFundError("We could not find this project on the current contract.");
      } else if (errMsg.includes("project not accepting funds")) {
        setFundError("This project is not accepting funding right now.");
      } else if (errMsg.includes("no gen sent")) {
        setFundError("Amount must be greater than 0.");
      } else {
        setFundError("Funding transaction could not be completed. Please check your wallet, network, and GEN balance, then try again.");
      }
      setFundPhase("form");
      return;
    }

    setFundTxHash(hash);
    setFundPhase("pending");

    try {
      await (glClient as unknown as {
        waitForTransactionReceipt: (args: {
          hash: string;
          status: "ACCEPTED";
          pollingInterval: number;
        }) => Promise<unknown>;
      }).waitForTransactionReceipt({
        hash,
        status: "ACCEPTED",
        pollingInterval: 5_000,
      });
        await refetchProject(false);
        await refetchFunders(false);
        setFundPhase("success");
    } catch (err: unknown) {
      setFundError("We could not confirm the transaction yet. Please use the transaction link to check its status.");
      setFundPhase("form");
    }
  };

  // Page load: check contract for existing flag result via API
  useEffect(() => {
    if (!address || !projectId || !project) return;
    fetch(`/api/flags/${projectId}`)
      .then(r => r.json())
      .then(flag => {
        if (!flag) return;
        if (flag.raised_by?.toLowerCase() === address.toLowerCase()) {
          const resStr = String(flag.resolution ?? "");
          const isValid = resStr === "1" || resStr.toUpperCase().startsWith("VALID");
          setFlagBanner(isValid ? "valid" : "invalid");
          setBannerReason("");
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
        setFlagError("Transaction was declined in your wallet.");
      } else if (errMsg.includes("insufficient funds") || errMsg.includes("insufficient balance")) {
        setFlagError("Your wallet does not have enough GEN to complete this transaction.");
      } else if (errMsg.includes("reverted") || errMsg.includes("execution failed")) {
        setFlagError("Report could not be submitted. Please review your selection and try again.");
      } else if (errMsg.includes("failed to fetch") || errMsg.includes("network error")) {
        setFlagError("We could not connect to the network. Please check your connection and try again.");
      } else {
        setFlagError("Report could not be submitted. Please try again shortly.");
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
      const { resolution } = await resolveFlag(flagTxHash);

      if (!mountedRef.current) return;

      // Close the modal and redirect to /verify with flag result — same flow as project submission
      setFlagModalOpen(false);
      setFlagBanner(null);
      router.push(
        `/verify?type=flag&resolution=${resolution}&title=${encodeURIComponent(project?.title ?? "")}&project_id=${projectId ?? ""}`
      );
    } catch (err: unknown) {
      if (keepWaitingActiveRef.current) {
        const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
        if (errMsg.includes("timed out") || errMsg.includes("timeout")) {
          setFlagError("Review is taking longer than expected. Please check back in a few minutes.");
        } else if (errMsg.includes("failed to fetch") || errMsg.includes("network error")) {
          setFlagError("We could not connect to the network. Please check your connection and try again.");
        } else {
          setFlagError("We could not refresh the report status. Please try again shortly.");
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
                We could not find this project.
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
                Browse Projects
              </a>
            </div>
          )}

          {/* Loading skeleton */}
          {projectLoading && !projectError && <LoadingSkeleton />}

          {/* Not found (no error but null project) */}
          {!projectLoading && !projectError && !project && (
            <div style={{ ...cardStyle, textAlign: "center", padding: "4rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                We could not find this project.
              </p>
              <a href="/browse" style={{ color: "var(--color-accent-blue)", fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.375rem", textDecoration: "none" }}>
                <ArrowLeft size={14} /> Browse Projects
              </a>
            </div>
          )}

          {/* Loaded content */}
          {!projectLoading && !projectError && project && (
            <div className="project-layout">
              {/* ── LEFT COLUMN ─────────────────────────────────── */}
              <div className="project-left" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                {/* Project header */}
                <div style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.25rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    <div style={{ flex: 1, minWidth: "240px" }}>
                      <h1
                        style={{
                          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                          fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                          fontWeight: 700,
                          color: "var(--color-text-primary)",
                          letterSpacing: "-0.03em",
                          lineHeight: 1.15,
                          margin: "0 0 0.875rem",
                        }}
                      >
                        {project.title}
                      </h1>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
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
                          }}
                        >
                          {project.status}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Score {Number(project.score) || 0}/100
                        </span>
                      </div>
                    </div>

                    <ScoreRing score={Number(project.score) || 0} size={92} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
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

                <div style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    <p className="section-eyebrow" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                      <HeartHandshake size={14} color="var(--color-primary)" />
                      Recent Donors
                    </p>
                    <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      Latest funding activity
                    </span>
                  </div>

                  {/* TODO: Full donor history requires a deployed contract that exposes get_funders(project_id). */}
                  {funders.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {funders.map((funder, index) => (
                        <div
                          key={`${funder.wallet}-${funder.timestamp}-${index}`}
                          style={{ ...statBoxStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", backgroundColor: "var(--color-surface)", borderColor: "color-mix(in srgb, var(--color-primary) 18%, var(--color-border-subtle))" }}
                        >
                          <div>
                            <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", display: "block", marginBottom: "0.25rem" }}>
                              {truncateAddress(funder.wallet)}
                            </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-accent-cyan)" }}>
                            <Coins size={12} />
                            {formatGenFromWei(funder.amount_gen)} GEN
                          </span>
                          </div>
                          <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            {new Date(funder.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : project.last_donor ? (
                    <div style={{ ...statBoxStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", backgroundColor: "var(--color-surface)", borderColor: "color-mix(in srgb, var(--color-primary) 18%, var(--color-border-subtle))" }}>
                      <div>
                        <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", display: "block", marginBottom: "0.25rem" }}>
                          {truncateAddress(project.last_donor)}
                        </span>
                        <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          Latest donor
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Recently
                      </span>
                    </div>
                  ) : (
                    <div style={{ ...statBoxStyle, textAlign: "center" }}>
                      <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}>
                        No donors yet. Be the first to fund this project.
                      </p>
                    </div>
                  )}
                  {!funders.length && fundersError && (
                    <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.75rem 0 0" }}>
                      Full donor history will appear when available.
                    </p>
                  )}
                  {fundersLoading && (
                    <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.75rem 0 0" }}>
                      Loading donor history...
                    </p>
                  )}
                </div>

              </div>

              {/* ── RIGHT COLUMN ─────────────────────────────────── */}
              <div className="project-right" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                {/* Fund Card */}
                <div style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        backgroundColor: "var(--color-accent-blue-soft)",
                        border: "1px solid color-mix(in srgb, var(--color-accent-blue) 18%, transparent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <HeartHandshake size={15} color="var(--color-accent-blue)" />
                    </div>
                    <p className="section-eyebrow" style={{ margin: 0 }}>
                      Support this project
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ ...statBoxStyle, padding: "0.875rem" }}>
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>
                        Goal
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                          fontSize: "1.125rem",
                          fontWeight: 700,
                          color: "var(--color-text-primary)",
                          letterSpacing: "0",
                        }}
                      >
                        {formatAmount(goalGen)} GEN
                      </span>
                    </div>
                    <div style={{ ...statBoxStyle, padding: "0.875rem" }}>
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>
                        Raised
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                          fontSize: "1.125rem",
                          fontWeight: 700,
                          color: "var(--color-accent-cyan)",
                          letterSpacing: "0",
                        }}
                      >
                        {formatAmount(raisedGen)} GEN
                      </span>
                    </div>
                  </div>

                  <div style={{ ...statBoxStyle, marginBottom: "1.125rem", display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.875rem", backgroundColor: "var(--color-accent-blue-soft)", borderColor: "color-mix(in srgb, var(--color-accent-blue) 18%, var(--color-border-subtle))" }}>
                    <Wallet size={16} color="var(--color-accent-blue)" style={{ marginTop: "0.125rem", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.8125rem", color: "var(--color-text-primary)", fontWeight: 700, display: "block", marginBottom: "0.25rem", overflowWrap: "anywhere" }}>
                        {truncateAddress(project.wallet ?? "")}
                      </span>
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", lineHeight: 1.45, color: "var(--color-text-muted)", display: "block" }}>
                        Funds are forwarded to the creator wallet after finalization.
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: "1.125rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "0.625rem" }}>
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>
                        Funding progress
                      </span>
                      <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.8125rem", color: "var(--color-text-primary)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {Math.round(fundingProgress)}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "10px", borderRadius: "999px", backgroundColor: "var(--color-elevated)", overflow: "hidden", border: "1px solid var(--color-border-subtle)" }}>
                      <div
                        style={{
                          width: `${fundingProgress}%`,
                          height: "100%",
                          backgroundColor: "var(--color-primary)",
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ ...statBoxStyle, minHeight: "96px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                      <Clock3 size={15} color="var(--color-accent-blue)" />
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.6875rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Days left
                      </span>
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", lineHeight: 1.25, color: "var(--color-text-primary)", fontWeight: 700 }}>
                        {countdown.label}
                      </span>
                    </div>
                    <div style={{ ...statBoxStyle, minHeight: "96px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                      <Users size={15} color="var(--color-accent-blue)" />
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.6875rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Donors
                      </span>
                      <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", lineHeight: 1.25, color: "var(--color-text-primary)", fontWeight: 700 }}>
                        {donorCountLabel}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={!isConnected || isOwnProject}
                    onClick={() => { if (isConnected && !isOwnProject) setFundModalOpen(true); }}
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: (!isConnected || isOwnProject) ? "var(--color-text-muted)" : "var(--color-primary-foreground)",
                      backgroundColor: (!isConnected || isOwnProject) ? "var(--color-elevated)" : "var(--color-primary)",
                      border: (!isConnected || isOwnProject) ? "1px solid var(--color-border-subtle)" : "1px solid transparent",
                      borderRadius: "10px",
                      padding: "0.875rem 1rem",
                      cursor: (!isConnected || isOwnProject) ? "not-allowed" : "pointer",
                      width: "100%",
                      letterSpacing: "-0.01em",
                      opacity: (!isConnected || isOwnProject) ? 0.72 : 1,
                      transition: "opacity 0.2s ease",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", width: "100%" }}>
                      {!isOwnProject && <HeartHandshake size={16} />}
                      {isOwnProject ? "You cannot fund your own project." : "Fund Project"}
                    </span>
                  </button>
                  {!isConnected && (
                    <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.625rem 0 0", textAlign: "center" }}>
                      Connect your wallet to fund this project.
                    </p>
                  )}
                  {isConnected && isOwnProject && (
                    <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.625rem 0 0", textAlign: "center" }}>
                      You cannot fund your own project.
                    </p>
                  )}
                </div>

                {/* Verification Card */}
                <div style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        backgroundColor: "var(--color-accent-blue-soft)",
                        border: "1px solid color-mix(in srgb, var(--color-accent-blue) 18%, transparent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ShieldCheck size={15} color="var(--color-accent-blue)" />
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
                            color: highlight ? "var(--color-accent-blue)" : "var(--color-text-primary)",
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
                      Report this project
                    </p>
                  </div>
                  <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>
                    Report misleading claims, unavailable proof, or policy concerns for review.
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
                    Report Project
                  </button>
                  {!isConnected && (
                    <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.625rem 0 0", textAlign: "center" }}>
                      Connect your wallet to report this project.
                    </p>
                  )}
                  {isConnected && isOwnProject && (
                    <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0.625rem 0 0", textAlign: "center" }}>
                      You cannot report your own project.
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

      {/* ── Fund Modal ──────────────────────────────────────────────────────── */}
      {fundModalOpen && (
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
          onClick={(e) => { if (e.target === e.currentTarget) closeFundModal(); }}
        >
          <div
            style={{
              ...cardStyle,
              width: "100%",
              maxWidth: "420px",
              position: "relative",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            {fundPhase !== "submitting" && fundPhase !== "pending" && (
              <button
                onClick={closeFundModal}
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

            <h2
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "0 0 1.25rem",
                letterSpacing: "-0.02em",
                paddingRight: "2rem",
              }}
            >
              Fund {project?.title}
            </h2>

            {/* Submitting */}
            {fundPhase === "submitting" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem 0", textAlign: "center" }}>
                <AlertTriangle size={28} color="var(--color-warning)" />
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                  Submitting funding transaction...
                </p>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  Please confirm the transaction in your wallet.
                </p>
                <div style={{ padding: "0.75rem 1rem", backgroundColor: "color-mix(in srgb, var(--color-accent-cyan) 22%, white)", border: "1px solid color-mix(in srgb, var(--color-accent-cyan) 45%, var(--color-border-subtle))", borderRadius: "8px" }}>
                  <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
                    GEN is delivered to the creator after finalization, usually within 20-30 minutes.
                  </p>
                </div>
              </div>
            )}

            {/* Pending — waiting for on-chain confirmation */}
            {fundPhase === "pending" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem 0", textAlign: "center" }}>
                <AlertTriangle size={28} color="var(--color-warning)" />
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                  Refreshing funding status...
                </p>
                {fundTxHash && (
                  <a
                    href={`${EXPLORER_URL}/tx/${fundTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                      fontSize: "0.75rem",
                      color: "var(--color-warning)",
                      textDecoration: "none",
                      backgroundColor: "color-mix(in srgb, var(--color-accent-cyan) 18%, white)",
                      border: "1px solid color-mix(in srgb, var(--color-accent-cyan) 45%, var(--color-border-subtle))",
                      borderRadius: "6px",
                      padding: "0.25rem 0.625rem",
                    }}
                  >
                    View transaction
                  </a>
                )}
                <div style={{ padding: "0.75rem 1rem", backgroundColor: "color-mix(in srgb, var(--color-accent-cyan) 22%, white)", border: "1px solid color-mix(in srgb, var(--color-accent-cyan) 45%, var(--color-border-subtle))", borderRadius: "8px" }}>
                  <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    Project funding data is refreshing. Final delivery to the creator will complete after finalization.
                  </p>
                </div>
              </div>
            )}

            {/* Success */}
            {fundPhase === "success" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1rem 0", textAlign: "center" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "color-mix(in srgb, var(--color-success) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--color-success) 25%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle size={22} color="var(--color-success)" />
                </div>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-success)", margin: 0 }}>
                  Funding transaction accepted.
                </p>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
                  Your contribution has been recorded. GEN will be delivered to the project creator after finalization, which usually takes 20-30 minutes.
                </p>
                {fundTxHash && (
                  <a
                    href={`${EXPLORER_URL}/tx/${fundTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                      fontSize: "0.75rem",
                      color: "var(--color-accent-blue)",
                      textDecoration: "none",
                      backgroundColor: "color-mix(in srgb, var(--color-accent-cyan) 14%, white)",
                      border: "1px solid color-mix(in srgb, var(--color-accent-cyan) 35%, var(--color-border-subtle))",
                      borderRadius: "6px",
                      padding: "0.25rem 0.625rem",
                    }}
                  >
                    View transaction
                  </a>
                )}
                <button
                  onClick={closeFundModal}
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    backgroundColor: "var(--color-surface-soft)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "8px",
                    padding: "0.625rem 1.5rem",
                    cursor: "pointer",
                    marginTop: "0.25rem",
                  }}
                >
                  Done
                </button>
              </div>
            )}

            {/* Form */}
            {fundPhase === "form" && (
              <>
                {/* Wallet display */}
                <div style={{ ...statBoxStyle, marginBottom: "1.25rem" }}>
                  <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", display: "block", marginBottom: "0.25rem" }}>
                    {truncateAddress(project?.wallet ?? "")}
                  </span>
                  <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    GEN is delivered to this creator wallet after finalization.
                  </span>
                </div>

                <div style={{ ...statBoxStyle, marginBottom: "1rem", backgroundColor: "color-mix(in srgb, var(--color-accent-cyan) 18%, white)", border: "1px solid color-mix(in srgb, var(--color-accent-cyan) 40%, var(--color-border-subtle))" }}>
                  <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-secondary)", margin: 0 }}>
                    GEN is delivered to the creator after finalization, usually within 20-30 minutes.
                  </p>
                </div>

                <div style={{ ...statBoxStyle, marginBottom: "1rem" }}>
                  <span style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.375rem" }}>
                    Project funding summary
                  </span>
                  <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.8125rem", color: "var(--color-text-primary)", display: "block", marginBottom: "0.25rem" }}>
                    Raised: {formatGenFromWei(project?.raised_gen)} GEN
                  </span>
                  <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.8125rem", color: "var(--color-text-primary)", display: "block", marginBottom: "0.25rem" }}>
                    Donors: {Number(project?.donor_count ?? 0)}
                  </span>
                  <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.8125rem", color: "var(--color-text-primary)", display: "block" }}>
                    Last donor: {project?.last_donor ? truncateAddress(project.last_donor) : "None yet"}
                  </span>
                </div>

                {/* Amount input */}
                <label
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-secondary)",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Amount (GEN)
                </label>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="any"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "8px",
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                    fontSize: "1rem",
                    marginBottom: "1rem",
                    outline: "none",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent-blue)"; e.currentTarget.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--color-accent-blue) 12%, transparent)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}
                />

                {fundError && (
                  <div style={{ padding: "0.75rem 1rem", backgroundColor: "color-mix(in srgb, var(--color-danger) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)", borderRadius: "8px", marginBottom: "1rem" }}>
                    <p style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: "0.8125rem", color: "var(--color-danger)", margin: 0 }}>
                      {fundError}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={closeFundModal}
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
                    onClick={handleSendGen}
                    disabled={!parseGenToWei(fundAmount)}
                    style={{
                      flex: 2,
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: !parseGenToWei(fundAmount) ? "var(--color-text-primary)" : "var(--color-primary-foreground)",
                      backgroundColor: !parseGenToWei(fundAmount) ? "var(--color-elevated)" : "var(--color-primary)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.625rem 1rem",
                      cursor: !parseGenToWei(fundAmount) ? "not-allowed" : "pointer",
                      opacity: !parseGenToWei(fundAmount) ? 0.5 : 1,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    Fund Project
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                Report this project
              </h2>
            </div>

            {/* ── SUBMITTING phase ── */}
            {flagPhase === "submitting" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem 0", textAlign: "center" }}>
                <Loader2 size={28} color="var(--color-accent-blue)" style={{ animation: "spin 1s linear infinite" }} />
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                  Submit report
                </p>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  Please confirm the report transaction in your wallet.
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
                    Report submitted
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
                    Your report has been submitted for review. This may take a few minutes.
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
                    Check later
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
                  Review in progress
                </p>
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  GenLayer validators are reviewing the report. This may take a few minutes.
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
                  Report reviewed. The project remains listed.
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
                  Done
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
                  Report confirmed. This project has been removed from Genatio.
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
                  Done
                </button>
              </div>
            )}

            {/* ── FORM phase ── */}
            {flagPhase === "form" && (
              !isConnected ? (
                <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6, textAlign: "center", padding: "1rem 0" }}>
                  Connect your wallet to report projects.
                </p>
              ) : (
                <>
                  <p style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: "0 0 1.125rem", lineHeight: 1.55 }}>
                    Select all reasons that apply:
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
                      Submit report
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

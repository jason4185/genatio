"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Loader2, Clock, ExternalLink, RefreshCw, Flag } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Project {
  id: string;
  title: string;
  status: string;
  score: number;
  goal_gen: number | string;
  created_at: string | number;
  duration_days: string | number;
  wallet?: string;
}

interface RejectedProject {
  id: string;
  title: string;
  wallet: string;
  score: string;
  status: string;
  reason: string;
  created_at: string;
}

interface FlagResult {
  projectId: string;
  projectTitle: string;
  resolution: "VALID" | "INVALID";
  reason: string;
  flagReasons: string;
  raisedAt: string;
}

function parseProjects(data: unknown): Project[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Project[];
  if (typeof data === "object") return Object.values(data as object) as Project[];
  return [];
}

function daysLeft(createdAt: string | number, durationDays: string | number): number {
  const end = new Date(createdAt).getTime() + Number(durationDays) * 24 * 3600 * 1000;
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 3600 * 1000)));
}

function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor(diff / (1000 * 60));
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  } catch {
    return "";
  }
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const, delay: i * 0.07 },
  }),
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: "Active",   color: "var(--color-success)", bg: "color-mix(in srgb, var(--color-success) 8%, transparent)" },
  ENDED:    { label: "Ended",    color: "var(--color-text-muted)", bg: "color-mix(in srgb, var(--color-text-muted) 8%, transparent)" },
  DISPUTED: { label: "Disputed", color: "var(--color-accent-blue)", bg: "color-mix(in srgb, var(--color-accent-blue) 8%, transparent)" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status.toUpperCase()] ?? STATUS_CONFIG.ENDED;
  return (
    <span
      style={{
        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.color}`,
        borderRadius: "100px",
        padding: "0.2rem 0.6rem",
        flexShrink: 0,
      }}
    >
      {cfg.label.toUpperCase()}
    </span>
  );
}

const FLAG_STATUS_CONFIG = {
  VALID: {
    label: "VALID",
    text: "Flag confirmed. Project removed.",
    color: "var(--color-danger)",
    bg: "color-mix(in srgb, var(--color-danger) 8%, transparent)",
    border: "color-mix(in srgb, var(--color-danger) 25%, transparent)",
  },
  INVALID: {
    label: "INVALID",
    text: "Flag dismissed. Project appears legitimate.",
    color: "var(--color-success)",
    bg: "color-mix(in srgb, var(--color-success) 8%, transparent)",
    border: "color-mix(in srgb, var(--color-success) 25%, transparent)",
  },
  PENDING: {
    label: "PENDING",
    text: "Under investigation",
    color: "var(--color-accent-blue)",
    bg: "color-mix(in srgb, var(--color-accent-blue) 8%, transparent)",
    border: "color-mix(in srgb, var(--color-accent-blue) 25%, transparent)",
  },
  NONE: {
    label: "NO RESOLUTION",
    text: "No resolution this time.",
    color: "var(--color-warning)",
    bg: "color-mix(in srgb, var(--color-warning) 8%, transparent)",
    border: "color-mix(in srgb, var(--color-warning) 25%, transparent)",
  },
} as const;

function FlagStatusBadge({ resolution }: { resolution: string }) {
  const cfg = FLAG_STATUS_CONFIG[resolution as keyof typeof FLAG_STATUS_CONFIG] ?? FLAG_STATUS_CONFIG.NONE;
  return (
    <span
      style={{
        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.color}`,
        borderRadius: "100px",
        padding: "0.2rem 0.6rem",
        flexShrink: 0,
      }}
    >
      {cfg.label}
    </span>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const left = daysLeft(project.created_at, project.duration_days);
  const st = (project.status ?? "").toUpperCase();

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{
        backgroundColor: "rgba(var(--color-surface-rgb), 0.8)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {project.title}
          </span>
          <StatusBadge status={project.status} />
        </div>
        <span
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.8125rem",
            color: "var(--color-text-secondary)",
          }}
        >
          {st === "ACTIVE" && `${left} day${left !== 1 ? "s" : ""} left`}
          {st === "ENDED" && "Campaign ended"}
          {st === "DISPUTED" && "Under community review"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
        <span
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-accent-blue)",
          }}
        >
          {project.score} / 100
        </span>
        <a
          href={`/project/${project.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-accent-blue)",
            textDecoration: "none",
            border: "1px solid color-mix(in srgb, var(--color-accent-blue) 30%, transparent)",
            borderRadius: "8px",
            padding: "0.375rem 0.875rem",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--color-accent-blue) 8%, transparent)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          View <ExternalLink size={12} />
        </a>
      </div>
    </motion.div>
  );
}

function RejectedProjectCard({ project, index }: { project: RejectedProject; index: number }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{
        backgroundColor: "rgba(var(--color-surface-rgb), 0.8)",
        border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)",
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          {project.title}
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--color-danger)",
            backgroundColor: "color-mix(in srgb, var(--color-danger) 8%, transparent)",
            border: "1px solid var(--color-danger)",
            borderRadius: "100px",
            padding: "0.2rem 0.6rem",
            flexShrink: 0,
          }}
        >
          Score {project.score}/100
        </span>
      </div>

      <p
        style={{
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.8125rem",
          color: "var(--color-text-secondary)",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {project.reason}
      </p>

      <p
        style={{
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          margin: 0,
        }}
      >
        Submitted: {new Date(project.created_at).toLocaleDateString()}
      </p>

      <a
        href="/submit"
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "var(--color-accent-blue)",
          textDecoration: "none",
          border: "1px solid color-mix(in srgb, var(--color-accent-blue) 35%, transparent)",
          borderRadius: "8px",
          padding: "0.375rem 0.875rem",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--color-accent-blue) 8%, transparent)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <RefreshCw size={12} /> Resubmit
      </a>
    </motion.div>
  );
}

function FlagCard({ flag, index }: { flag: FlagResult; index: number }) {
  const cfg = FLAG_STATUS_CONFIG[flag.resolution as keyof typeof FLAG_STATUS_CONFIG] ?? FLAG_STATUS_CONFIG.NONE;
  const relTime = formatRelativeTime(flag.raisedAt);
  const reasons = flag.flagReasons
    ? flag.flagReasons.split(",").map((r) => r.trim()).filter(Boolean)
    : [];

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{
        backgroundColor: "rgba(var(--color-surface-rgb), 0.8)",
        border: `1px solid ${cfg.border}`,
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
            <a
              href={`/project/${flag.projectId}`}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                textDecoration: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent-blue)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
            >
              {flag.projectTitle}
            </a>
            <FlagStatusBadge resolution={flag.resolution} />
          </div>
          {relTime && (
            <span
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Clock size={10} />
              {relTime}
            </span>
          )}
        </div>
      </div>

      {/* Flag reasons */}
      {reasons.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.625rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
            }}
          >
            Reasons flagged
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {reasons.map((r, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.8125rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                · {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Resolution result */}
      <div
        style={{
          padding: "0.625rem 0.875rem",
          backgroundColor: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "0.125rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: cfg.color,
          }}
        >
          {cfg.text}
        </span>
        {flag.reason && (
          <span
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.8125rem",
              color: "var(--color-text-secondary)",
              lineHeight: 1.55,
            }}
          >
            {flag.reason}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
        fontSize: "1rem",
        fontWeight: 700,
        color: "var(--color-text-primary)",
        letterSpacing: "-0.02em",
        margin: "0 0 0.75rem",
      }}
    >
      {children}
    </h2>
  );
}

function DashboardContent() {
  const { address, isConnected } = useAccount();

  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [rejectedProjects, setRejectedProjects] = useState<RejectedProject[]>([]);
  const [rejectedLoading, setRejectedLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const [myFlags, setMyFlags] = useState<FlagResult[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);

  const fetchProjects = useCallback(
    async (isInitial = false) => {
      if (!isConnected || !address) return;
      if (isInitial) setProjectsLoading(true);

      try {
        const [active, ended, disputed] = await Promise.all([
          fetch("/api/projects?status=active").then((r) => r.json()).catch(() => []),
          fetch("/api/projects?status=ended").then((r) => r.json()).catch(() => []),
          fetch("/api/projects?status=disputed").then((r) => r.json()).catch(() => []),
        ]);
        const all = [
          ...parseProjects(active),
          ...parseProjects(ended),
          ...parseProjects(disputed),
        ];
        setMyProjects(all.filter((p) => p.wallet?.toLowerCase() === address.toLowerCase()));
        setLastUpdated(Date.now());
      } finally {
        if (isInitial) setProjectsLoading(false);
      }
    },
    [isConnected, address]
  );

  const fetchFlags = useCallback(
    async (isInitial = false) => {
      if (!isConnected || !address) return;
      if (isInitial) setFlagsLoading(true);
      try {
        const res = await fetch(`/api/my-flags?wallet=${address}`);
        if (res.ok) {
          const data: unknown = await res.json();
          setMyFlags(Array.isArray(data) ? (data as FlagResult[]) : []);
        }
      } finally {
        if (isInitial) setFlagsLoading(false);
      }
    },
    [isConnected, address]
  );

  const fetchRejected = useCallback(
    async (isInitial = false) => {
      if (!isConnected || !address) return;
      if (isInitial) setRejectedLoading(true);
      try {
        const res = await fetch(`/api/rejected?wallet=${address}`);
        if (res.ok) {
          const data: unknown = await res.json();
          setRejectedProjects(Array.isArray(data) ? (data as RejectedProject[]) : []);
        }
      } finally {
        if (isInitial) setRejectedLoading(false);
      }
    },
    [isConnected, address]
  );

  useEffect(() => {
    if (!isConnected || !address) return;

    fetchProjects(true);
    fetchFlags(true);
    fetchRejected(true);
    const interval = setInterval(() => {
      fetchProjects(false);
      fetchFlags(false);
      fetchRejected(false);
    }, 30_000);

    return () => clearInterval(interval);
  }, [isConnected, address, fetchProjects, fetchFlags, fetchRejected]);

  useEffect(() => {
    if (!lastUpdated) return;
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          backgroundColor: "rgba(var(--color-surface-rgb), 0.8)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "12px",
          padding: "4rem 2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "1.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "1rem",
            color: "var(--color-text-secondary)",
            margin: 0,
          }}
        >
          Connect your wallet to view your dashboard
        </p>
        <ConnectButton />
      </motion.div>
    );
  }

  const initialLoading = projectsLoading || flagsLoading || rejectedLoading;

  if (initialLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <Loader2 size={22} color="var(--color-text-muted)" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* ── My Projects ── */}
      <section>
        <SectionHeading>My Projects</SectionHeading>

        <AnimatePresence mode="wait">
          {myProjects.length === 0 ? (
            <motion.div
              key="no-projects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundColor: "rgba(var(--color-surface-rgb), 0.8)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "12px",
                padding: "2.5rem 2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "1.25rem",
              }}
            >
              <Clock size={28} color="var(--color-text-muted)" strokeWidth={1.5} />
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    margin: "0 0 0.375rem",
                  }}
                >
                  No projects yet
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.875rem",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  Submit an open source project to get verified on-chain.
                </p>
              </div>
              <a
                href="/submit"
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  backgroundColor: "var(--color-accent-blue)",
                  textDecoration: "none",
                  borderRadius: "8px",
                  padding: "0.625rem 1.5rem",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Submit Your Project →
              </a>
            </motion.div>
          ) : (
            <motion.div
              key="projects-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              {myProjects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {lastUpdated !== null && (
          <p
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              margin: "0.5rem 0 0",
              textAlign: "right",
            }}
          >
            Updated {secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}
          </p>
        )}
      </section>

      {/* ── Not Approved ── */}
      {rejectedProjects.length > 0 && (
        <section>
          <SectionHeading>Not Approved</SectionHeading>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {rejectedProjects.map((p, i) => (
              <RejectedProjectCard key={p.id} project={p} index={i} />
            ))}
          </motion.div>
        </section>
      )}

      {/* ── My Flags ── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <Flag size={14} color="var(--color-danger)" />
          <SectionHeading>My Flags</SectionHeading>
        </div>

        <AnimatePresence mode="wait">
          {myFlags.length === 0 ? (
            <motion.div
              key="no-flags"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundColor: "rgba(var(--color-surface-rgb), 0.8)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "12px",
                padding: "2rem 1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <Flag size={18} color="var(--color-text-muted)" strokeWidth={1.5} />
              <p
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                You have not flagged any projects yet.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="flags-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              {myFlags.map((f, i) => (
                <FlagCard key={`${f.projectId}-${i}`} flag={f} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%", maxWidth: "680px", marginBottom: "2rem" }}
          >
            <p
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "var(--color-accent-blue)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: "0 0 0.5rem",
              }}
            >
              My Account
            </p>
            <h1
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              My Dashboard
            </h1>
          </motion.div>

          <div style={{ width: "100%", maxWidth: "680px" }}>
            <Suspense
              fallback={
                <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                  <Loader2 size={24} color="var(--color-text-muted)" style={{ animation: "spin 1s linear infinite" }} />
                </div>
              }
            >
              <DashboardContent />
            </Suspense>
          </div>
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

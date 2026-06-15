"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useAccount } from "wagmi";
import { motion, type Variants } from "framer-motion";
import { Loader2, Clock, ExternalLink, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Project {
  id: string;
  title: string;
  status: string;
  score: number;
  raised_gen: number | string;
  goal_gen: number | string;
  created_at: string | number;
  duration_days: string | number;
  wallet?: string;
}

interface Rejection {
  title: string;
  score: number;
  timestamp: number;
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

function RejectionCard({ rejection, index }: { rejection: Rejection; index: number }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{
        backgroundColor: "rgba(var(--color-surface-rgb), 0.8)",
        border: "1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)",
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
            }}
          >
            {rejection.title}
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
            REJECTED
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.8125rem",
            color: "var(--color-text-secondary)",
          }}
        >
          Score {rejection.score}/100 — Did not meet minimum threshold of 40/100
        </span>
      </div>

      <a
        href="/submit"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          backgroundColor: "var(--color-accent-blue)",
          textDecoration: "none",
          borderRadius: "8px",
          padding: "0.375rem 0.875rem",
          flexShrink: 0,
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <RefreshCw size={12} /> Resubmit
      </a>
    </motion.div>
  );
}

function DashboardContent() {
  const { address, isConnected } = useAccount();

  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejection, setRejection] = useState<Rejection | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchProjects = useCallback(
    async (isInitial = false) => {
      if (!isConnected || !address) return;
      if (isInitial) setLoading(true);

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
        if (isInitial) setLoading(false);
      }
    },
    [isConnected, address]
  );

  useEffect(() => {
    if (!isConnected || !address) return;

    fetchProjects(true);
    const interval = setInterval(() => fetchProjects(false), 30_000);

    try {
      const stored = sessionStorage.getItem(`rejection_${address}`);
      if (stored) setRejection(JSON.parse(stored));
    } catch {}

    return () => clearInterval(interval);
  }, [isConnected, address, fetchProjects]);

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
          padding: "3rem 2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "1rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          Connect your wallet to see your projects
        </p>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <Loader2 size={22} color="var(--color-text-muted)" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (myProjects.length === 0 && !rejection) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          backgroundColor: "rgba(var(--color-surface-rgb), 0.8)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "12px",
          padding: "3rem 2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "1.25rem",
        }}
      >
        <Clock size={32} color="var(--color-text-muted)" strokeWidth={1.5} />
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
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {myProjects.map((p, i) => (
        <ProjectCard key={p.id} project={p} index={i} />
      ))}
      {rejection && (
        <RejectionCard rejection={rejection} index={myProjects.length} />
      )}
      {lastUpdated !== null && (
        <p
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            margin: "0.25rem 0 0",
            textAlign: "right",
          }}
        >
          Updated {secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}
        </p>
      )}
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

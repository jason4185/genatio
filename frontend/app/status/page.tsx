"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { motion, type Variants } from "framer-motion";
import { Loader2, CheckCircle2, Clock, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
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
  ACTIVE:    { label: "Active",    color: "var(--color-success)", bg: "color-mix(in srgb, var(--color-success) 8%, transparent)" },
  ENDED:     { label: "Ended",     color: "var(--color-text-muted)", bg: "color-mix(in srgb, var(--color-text-muted) 8%, transparent)" },
  DISPUTED:  { label: "Disputed",  color: "var(--color-warning, var(--color-accent-blue))", bg: "color-mix(in srgb, var(--color-accent-blue) 8%, transparent)" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status.toUpperCase()] ?? STATUS_CONFIG.ENDED;
  return (
    <span style={{
      fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
      fontSize: "0.625rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      color: cfg.color,
      backgroundColor: cfg.bg,
      border: `1px solid ${cfg.color}`,
      borderRadius: "100px",
      padding: "0.2rem 0.6rem",
    }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {project.title}
          </span>
          <StatusBadge status={project.status} />
        </div>
        <span style={{
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.8125rem",
          color: "var(--color-text-secondary)",
        }}>
          {st === "ACTIVE" && `${left} day${left !== 1 ? "s" : ""} left`}
          {st === "ENDED" && "Campaign ended"}
          {st === "DISPUTED" && "Under community review"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
        <span style={{
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "var(--color-accent-blue)",
        }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}>
            {rejection.title}
          </span>
          <span style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--color-danger)",
            backgroundColor: "color-mix(in srgb, var(--color-danger) 8%, transparent)",
            border: "1px solid var(--color-danger)",
            borderRadius: "100px",
            padding: "0.2rem 0.6rem",
          }}>
            REJECTED
          </span>
        </div>
        <span style={{
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.8125rem",
          color: "var(--color-text-secondary)",
        }}>
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

function StatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const tx = searchParams.get("tx");
  const titleParam = searchParams.get("title") ?? "Your project";

  // Section 1: verification polling
  type VerifyPhase = "polling" | "timeout" | "error";
  const [verifyPhase, setVerifyPhase] = useState<VerifyPhase>("polling");
  const [verifyErrorMsg, setVerifyErrorMsg] = useState("");

  // Section 2: my projects
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [rejection, setRejection] = useState<Rejection | null>(null);

  // Poll for receipt
  useEffect(() => {
    if (!tx) return;

    const glClient = createClient({ chain: testnetBradbury });
    let cancelled = false;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const receipt = await (glClient as any).waitForTransactionReceipt({
          hash: tx,
          status: "ACCEPTED",
          timeout: 300000,
        });

        if (cancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resultRaw = (receipt as any)?.consensus_data?.leader_receipt?.[0]?.result;
        let status = "rejected";
        let score = 0;
        let projectId: string | undefined;

        try {
          const parsed = JSON.parse(resultRaw as string);
          status = String(parsed.status ?? "rejected");
          score = Number(parsed.score) || 0;
          projectId = parsed.project_id != null ? String(parsed.project_id) : undefined;
        } catch {
          // parse failed, default to rejected
        }

        if (status === "active") {
          const params = new URLSearchParams({ status: "active", score: String(score) });
          if (projectId) params.set("project_id", projectId);
          router.push(`/verify?${params}`);
        } else {
          if (address) {
            try {
              sessionStorage.setItem(`rejection_${address}`, JSON.stringify({
                title: titleParam,
                score,
                timestamp: Date.now(),
              }));
            } catch {}
          }
          const params = new URLSearchParams({ status: "rejected", score: String(score), title: titleParam });
          router.push(`/verify?${params}`);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
        if (msg.includes("timed out") || msg.includes("timeout")) {
          setVerifyPhase("timeout");
        } else {
          setVerifyErrorMsg("Something went wrong. Please check back later.");
          setVerifyPhase("error");
        }
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx]);

  // Fetch my projects
  useEffect(() => {
    if (!isConnected || !address) return;

    setProjectsLoading(true);

    Promise.all([
      fetch("/api/projects?status=active").then((r) => r.json()).catch(() => []),
      fetch("/api/projects?status=ended").then((r) => r.json()).catch(() => []),
      fetch("/api/projects?status=disputed").then((r) => r.json()).catch(() => []),
    ]).then(([active, ended, disputed]) => {
      const all = [
        ...parseProjects(active),
        ...parseProjects(ended),
        ...parseProjects(disputed),
      ];
      const mine = all.filter((p) => p.wallet?.toLowerCase() === address.toLowerCase());
      setMyProjects(mine);
    }).finally(() => {
      setProjectsLoading(false);
    });

    try {
      const stored = sessionStorage.getItem(`rejection_${address}`);
      if (stored) setRejection(JSON.parse(stored));
    } catch {}
  }, [isConnected, address]);

  const sectionTitle: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--color-text-muted)",
    margin: "0 0 1rem",
  };

  return (
    <div style={{ width: "100%", maxWidth: "680px", display: "flex", flexDirection: "column", gap: "3rem" }}>

      {/* ── Section 1: Under Verification ── */}
      {tx && (
        <section>
          <p style={sectionTitle}>Under Verification</p>

          {verifyPhase === "polling" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                backgroundColor: "rgba(var(--color-surface-rgb), 0.8)",
                border: "1px solid color-mix(in srgb, var(--color-accent-blue) 25%, transparent)",
                borderRadius: "12px",
                padding: "2rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "1rem",
              }}
            >
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                backgroundColor: "color-mix(in srgb, var(--color-accent-blue) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-accent-blue) 30%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Loader2 size={24} color="var(--color-accent-blue)" style={{ animation: "spin 1s linear infinite" }} />
              </div>
              <div>
                <p style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: "0 0 0.375rem",
                }}>
                  {titleParam} — GenLayer Intelligent Contracts are verifying...
                </p>
                <p style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}>
                  This takes 2–5 minutes. You can safely close this tab and check My Projects later.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.375rem" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-accent-blue)",
                    animation: `pulse-live 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </motion.div>
          )}

          {(verifyPhase === "timeout" || verifyPhase === "error") && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                backgroundColor: "rgba(var(--color-surface-rgb), 0.8)",
                border: "1px solid color-mix(in srgb, var(--color-warning, var(--color-accent-blue)) 25%, transparent)",
                borderRadius: "12px",
                padding: "1.5rem",
                display: "flex",
                gap: "0.875rem",
                alignItems: "flex-start",
              }}
            >
              <AlertTriangle size={18} color="var(--color-accent-blue)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: "0 0 0.25rem",
                }}>
                  {verifyPhase === "timeout"
                    ? "Verification is taking longer than expected."
                    : verifyErrorMsg}
                </p>
                <p style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}>
                  Check back in a few minutes — your project may still be processing.
                </p>
              </div>
            </motion.div>
          )}
        </section>
      )}

      {/* ── Section 2: My Projects ── */}
      {isConnected && (
        <section>
          <p style={sectionTitle}>My Projects</p>

          {projectsLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <Loader2 size={20} color="var(--color-text-muted)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}

          {!projectsLoading && myProjects.length === 0 && !rejection && (
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
                <p style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: "0 0 0.375rem",
                }}>
                  You have not submitted any projects yet
                </p>
                <p style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}>
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
          )}

          {!projectsLoading && (myProjects.length > 0 || rejection) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {myProjects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
              {rejection && (
                <RejectionCard
                  rejection={rejection}
                  index={myProjects.length}
                />
              )}
            </div>
          )}
        </section>
      )}

      {!isConnected && !tx && (
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
          <CheckCircle2 size={32} color="var(--color-text-muted)" strokeWidth={1.5} />
          <p style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
          }}>
            Connect your wallet to see your projects
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default function StatusPage() {
  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-live {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />

        <main style={{
          flex: 1,
          paddingTop: "100px",
          paddingBottom: "5rem",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <div style={{ width: "100%", maxWidth: "680px", marginBottom: "2rem" }}>
            <p style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.75rem",
              color: "var(--color-accent-blue)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: "0 0 0.5rem",
            }}>
              Status
            </p>
            <h1 style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.03em",
              margin: 0,
            }}>
              My Projects
            </h1>
          </div>

          <Suspense fallback={
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
              <Loader2 size={24} color="var(--color-text-muted)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          }>
            <StatusContent />
          </Suspense>
        </main>

        <footer style={{
          backgroundColor: "var(--color-background)",
          borderTop: "1px solid var(--color-border-subtle)",
          padding: "2rem 1.5rem",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "center" }}>
            <p style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              margin: 0,
              textAlign: "center",
            }}>
              Genatio is a testnet application. Not for real funds.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

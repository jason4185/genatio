"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { genLayerClient } from "@/lib/genatio";

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
    message = "This takes 2–5 minutes";
    color = "var(--color-text-muted)";
  } else if (minutes < 5) {
    message = "Still verifying... taking a bit longer than usual";
    color = "var(--color-accent-blue)";
  } else {
    message = "Taking longer than expected. You can close this tab and check My Dashboard later.";
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

  const [startTime] = useState(() => Date.now());
  const pollingRef = useRef(false);
  const redirectedRef = useRef(false);

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
        });

        if (redirectedRef.current) return;

        const leaderReceipt = receipt?.consensus_data?.leader_receipt?.[0];
        const result = leaderReceipt?.result;

        let parsed: { status?: string; score?: number; project_id?: string } = {};
        if (typeof result === "string") {
          try { parsed = JSON.parse(result); } catch {}
        } else if (result && typeof result === "object") {
          parsed = result;
        }

        const status = parsed.status ?? "rejected";
        const score = parsed.score ?? 0;
        const projectId = parsed.project_id;
        const approved = status === "active";

        if (!approved && address) {
          try {
            sessionStorage.setItem(`rejection_${address}`, JSON.stringify({
              title,
              score,
              timestamp: Date.now(),
            }));
          } catch {}
        }

        const params = new URLSearchParams({ status, score: String(score), title });
        if (approved && projectId) params.set("project_id", projectId);

        redirectedRef.current = true;
        router.push(`/verify?${params.toString()}`);
      } catch {
        // network error — keep showing the waiting state; background refresh may still succeed
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
          const params = new URLSearchParams({
            status: "active",
            score: String(match.score ?? 0),
            title,
          });
          if (match.id != null) params.set("project_id", String(match.id));
          router.push(`/verify?${params.toString()}`);
        }
      } catch {}
    };

    const interval = setInterval(check, 30_000);
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
      <motion.div
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
            Verifying {title}
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
            GenLayer Intelligent Contracts are reviewing your project
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
          Keep this tab open to see your result. If you close it, check My Dashboard in 5 minutes.
        </div>
      </motion.div>
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

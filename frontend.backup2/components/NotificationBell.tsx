"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import type { ContractFlagResult } from "@/app/api/my-flags/route";
import { useSubmission, type SubmissionNotification } from "@/context/SubmissionContext";

// ── Flag item ──────────────────────────────────────────────────────────────

function FlagItem({
  flag,
  onDismiss,
}: {
  flag: ContractFlagResult;
  onDismiss: () => void;
}) {
  const isValid = flag.resolution === "VALID";
  const accentColor = isValid ? "var(--color-danger)" : "var(--color-success)";
  const text = isValid
    ? `Flag confirmed — "${flag.projectTitle}" has been removed`
    : `Flag reviewed — "${flag.projectTitle}" appears legitimate`;

  return (
    <div
      style={{
        padding: "0.875rem 1rem",
        borderBottom: "1px solid var(--color-border-subtle)",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flexShrink: 0, paddingTop: "1px", color: accentColor }}>
        {isValid ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.8125rem",
            color: "var(--color-text-primary)",
            margin: "0 0 0.25rem",
            lineHeight: 1.5,
          }}
        >
          {text}
        </p>
        {flag.reason && (
          <p
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {flag.reason}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        style={{
          flexShrink: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          padding: "0.125rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ── Submission item ────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const h = Math.floor(d / 3_600_000);
  const m = Math.floor(d / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

function SubmissionItem({
  notif,
  onDismiss,
}: {
  notif: SubmissionNotification;
  onDismiss: () => void;
}) {
  const isApproved = notif.type === "approved";
  const accentColor = isApproved ? "var(--color-success)" : "var(--color-danger)";
  const text = isApproved
    ? `"${notif.title}" was approved — Score ${notif.score}/100`
    : `"${notif.title}" was not approved — Score ${notif.score}/100`;

  return (
    <div
      style={{
        padding: "0.875rem 1rem",
        borderBottom: "1px solid var(--color-border-subtle)",
        backgroundColor: notif.read
          ? "transparent"
          : "color-mix(in srgb, var(--color-accent-blue) 4%, transparent)",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flexShrink: 0, paddingTop: "1px", color: accentColor }}>
        {isApproved ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.8125rem",
            color: "var(--color-text-primary)",
            margin: "0 0 0.25rem",
            lineHeight: 1.5,
          }}
        >
          {text}
        </p>
        {!isApproved && notif.reason && (
          <p
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              margin: "0 0 0.25rem",
              lineHeight: 1.5,
            }}
          >
            {notif.reason}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.125rem" }}>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.6875rem",
              color: "var(--color-text-muted)",
            }}
          >
            {timeAgo(notif.timestamp)}
          </span>
          {isApproved && notif.projectId && (
            <a
              href={`/project/${notif.projectId}`}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.6875rem",
                color: "var(--color-accent-blue)",
                textDecoration: "none",
              }}
            >
              View project →
            </a>
          )}
          {!isApproved && (
            <a
              href="/submit"
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.6875rem",
                color: "var(--color-accent-blue)",
                textDecoration: "none",
              }}
            >
              Resubmit →
            </a>
          )}
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          flexShrink: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          padding: "0.125rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ── Bell ───────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { address } = useAccount();
  const { notifications: submissionNotifs, markAllNotifsRead, dismissNotif } = useSubmission();

  const [flags, setFlags] = useState<ContractFlagResult[]>([]);
  const [dismissedFlags, setDismissedFlags] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!address) { setFlags([]); return; }
    const fetchFlags = () => {
      fetch(`/api/my-flags?wallet=${address}`)
        .then(r => r.ok ? r.json() : [])
        .then((data: ContractFlagResult[]) => {
          setFlags(Array.isArray(data) ? data : []);
        })
        .catch(() => {});
    };
    fetchFlags();
    const interval = setInterval(fetchFlags, 30_000);
    return () => clearInterval(interval);
  }, [address]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Mark all submission notifs as read when bell opens
  useEffect(() => {
    if (open) markAllNotifsRead();
  }, [open, markAllNotifsRead]);

  if (!address) return null;

  const visibleFlags = flags.filter(f => !dismissedFlags.has(f.projectId));

  // Show submission notifs from last 24h
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recentSubmissions = submissionNotifs.filter(n => n.timestamp > cutoff);

  const unreadCount = recentSubmissions.filter(n => !n.read).length;
  const totalVisible = visibleFlags.length + recentSubmissions.length;

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: open ? "var(--color-text-primary)" : "var(--color-text-secondary)",
          display: "flex",
          alignItems: "center",
          padding: "0.375rem",
          borderRadius: "6px",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text-primary)")}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = "var(--color-text-secondary)"; }}
      >
        <Bell size={18} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="dot"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--color-danger)",
                border: "2px solid var(--color-background)",
                display: "block",
              }}
            />
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              top: "calc(100% + 0.625rem)",
              right: 0,
              width: "340px",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "12px",
              boxShadow:
                "0 8px 24px color-mix(in srgb, var(--color-elevated) 80%, transparent), 0 2px 8px color-mix(in srgb, var(--color-elevated) 60%, transparent)",
              zIndex: 200,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "0.875rem 1rem",
                borderBottom: "1px solid var(--color-border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                    fontSize: "0.6875rem",
                    color: "var(--color-danger)",
                    fontWeight: 600,
                  }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {totalVisible === 0 ? (
                <div
                  style={{
                    padding: "2.5rem 1rem",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.875rem",
                  }}
                >
                  No notifications yet.
                </div>
              ) : (
                <>
                  {recentSubmissions.map(notif => (
                    <SubmissionItem
                      key={notif.id}
                      notif={notif}
                      onDismiss={() => dismissNotif(notif.id)}
                    />
                  ))}
                  {visibleFlags.map(flag => (
                    <FlagItem
                      key={flag.projectId}
                      flag={flag}
                      onDismiss={() => setDismissedFlags(prev => new Set(prev).add(flag.projectId))}
                    />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

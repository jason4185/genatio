"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import {
  type FlagNotification,
  getFlagNotifications,
  saveFlagNotification,
  updateFlagNotification,
  clearFlagNotification,
} from "@/lib/flagNotifications";
import type { ContractFlagResult } from "@/app/api/my-flags/route";

// ── Notification item ──────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
}: {
  notification: FlagNotification;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  const isPending = notification.status === "pending";
  const isValid = notification.resolution === "VALID";

  const icon = isPending ? (
    <Clock size={14} />
  ) : isValid ? (
    <AlertCircle size={14} />
  ) : (
    <CheckCircle size={14} />
  );

  const text = isPending
    ? `Your flag on "${notification.projectTitle}" is being investigated`
    : isValid
    ? `Flag confirmed — "${notification.projectTitle}" has been removed`
    : `Flag reviewed — "${notification.projectTitle}" appears legitimate`;

  const accentColor = isPending
    ? "var(--color-text-muted)"
    : isValid
    ? "var(--color-danger)"
    : "var(--color-success)";

  return (
    <div
      style={{
        padding: "0.875rem 1rem",
        borderBottom: "1px solid var(--color-border-subtle)",
        backgroundColor: notification.read
          ? "transparent"
          : "color-mix(in srgb, var(--color-accent-blue) 4%, transparent)",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flexShrink: 0, paddingTop: "1px", color: accentColor }}>
        {icon}
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
        {notification.reason && !isPending && (
          <p
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              margin: "0 0 0.5rem",
              lineHeight: 1.5,
            }}
          >
            {notification.reason}
          </p>
        )}
        {!notification.read && !isPending && (
          <button
            onClick={onMarkRead}
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.6875rem",
              color: "var(--color-accent-blue)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Mark as read
          </button>
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

// ── Bell ───────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { address } = useAccount();
  const [notifications, setNotifications] = useState<FlagNotification[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    if (!address) { setNotifications([]); return; }
    setNotifications(getFlagNotifications(address));
  }, [address]);

  // Load from localStorage whenever address changes
  useEffect(() => { refresh(); }, [refresh]);

  // Sync with contract on wallet connect
  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/my-flags?wallet=${address}`);
        if (!res.ok || cancelled) return;
        const contractFlags: ContractFlagResult[] = await res.json();

        for (const cf of contractFlags) {
          if (cancelled) return;
          const current = getFlagNotifications(address).find(
            (n) => n.projectId === cf.projectId
          );
          if (!current) {
            saveFlagNotification(address, {
              projectId: cf.projectId,
              projectTitle: cf.projectTitle,
              txHash: `contract_${cf.projectId}`,
              status: "complete",
              resolution: cf.resolution,
              reason: cf.reason,
              timestamp: Date.now(),
              read: false,
            });
          } else if (current.status === "pending") {
            updateFlagNotification(address, current.txHash, {
              status: "complete",
              resolution: cf.resolution,
              reason: cf.reason,
              read: false,
            });
          }
        }

        if (!cancelled) refresh();
      } catch {
        // non-critical — silently skip
      }
    })();

    return () => { cancelled = true; };
  }, [address, refresh]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!address) return null;

  const unreadCount = notifications.filter(
    (n) => n.status === "complete" && !n.read
  ).length;

  const markRead = (txHash: string) => {
    if (!address) return;
    updateFlagNotification(address, txHash, { read: true });
    refresh();
  };

  const dismiss = (txHash: string) => {
    if (!address) return;
    clearFlagNotification(address, txHash);
    refresh();
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
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
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.color = "var(--color-text-secondary)";
        }}
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

      {/* Dropdown */}
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
            {/* Header */}
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

            {/* Body */}
            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {notifications.length === 0 ? (
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
                notifications.map((notif) => (
                  <NotificationItem
                    key={notif.txHash}
                    notification={notif}
                    onMarkRead={() => markRead(notif.txHash)}
                    onDismiss={() => dismiss(notif.txHash)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

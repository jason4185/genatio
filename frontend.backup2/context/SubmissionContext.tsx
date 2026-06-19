"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useAccount } from "wagmi";

export type SubmissionNotification = {
  id: string;
  type: "approved" | "rejected";
  title: string;
  score: number;
  reason?: string;
  projectId?: string;
  timestamp: number;
  read: boolean;
};

type ContextValue = {
  pendingTx: string | null;
  pendingTitle: string | null;
  setPending: (title: string, tx: string) => void;
  clearPending: () => void;
  notifications: SubmissionNotification[];
  addSubmissionNotif: (n: Omit<SubmissionNotification, "id" | "timestamp" | "read">) => void;
  markAllNotifsRead: () => void;
  dismissNotif: (id: string) => void;
  seenFlagIds: Set<string>;
  seeFlagId: (id: string) => void;
};

const SubmissionContext = createContext<ContextValue | null>(null);

function writeSession(address: string, tx: string, title: string, seenIds: Set<string>) {
  try {
    sessionStorage.setItem(`submission_${address}`, JSON.stringify({
      pendingTx: tx,
      pendingTitle: title,
      seenFlagIds: Array.from(seenIds),
    }));
  } catch {}
}

export function SubmissionProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();

  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<SubmissionNotification[]>([]);
  const [seenFlagIds, setSeenFlagIds] = useState<Set<string>>(new Set());

  // Refs let callbacks always read the latest values without stale closures
  const addressRef = useRef<string | undefined>(undefined);
  const pendingTxRef = useRef<string | null>(null);
  const pendingTitleRef = useRef<string | null>(null);
  const seenFlagIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => { addressRef.current = address; }, [address]);
  useEffect(() => { pendingTxRef.current = pendingTx; }, [pendingTx]);
  useEffect(() => { pendingTitleRef.current = pendingTitle; }, [pendingTitle]);
  useEffect(() => { seenFlagIdsRef.current = seenFlagIds; }, [seenFlagIds]);

  // Load from sessionStorage when wallet connects or switches
  useEffect(() => {
    if (!address) {
      setPendingTx(null);
      setPendingTitle(null);
      setSeenFlagIds(new Set());
      setNotifications([]);
      return;
    }
    try {
      const stored = sessionStorage.getItem(`submission_${address}`);
      if (stored) {
        const data = JSON.parse(stored);
        setPendingTx(data.pendingTx || null);
        setPendingTitle(data.pendingTitle || null);
        setSeenFlagIds(new Set(data.seenFlagIds || []));
      } else {
        setPendingTx(null);
        setPendingTitle(null);
        setSeenFlagIds(new Set());
      }
    } catch {}
    setNotifications([]);
  }, [address]);

  const setPending = useCallback((title: string, tx: string) => {
    setPendingTx(tx);
    setPendingTitle(title);
    if (addressRef.current) {
      writeSession(addressRef.current, tx, title, seenFlagIdsRef.current);
    }
  }, []);

  const clearPending = useCallback(() => {
    setPendingTx(null);
    setPendingTitle(null);
    if (addressRef.current) {
      writeSession(addressRef.current, "", "", seenFlagIdsRef.current);
    }
  }, []);

  const addSubmissionNotif = useCallback((n: Omit<SubmissionNotification, "id" | "timestamp" | "read">) => {
    setNotifications(prev => {
      const duplicate = prev.find(
        x => x.type === n.type && x.title === n.title && Date.now() - x.timestamp < 120_000
      );
      if (duplicate) return prev;
      const notif: SubmissionNotification = {
        ...n,
        id: `${n.type}-${Date.now()}`,
        timestamp: Date.now(),
        read: false,
      };
      return [notif, ...prev].slice(0, 30);
    });
  }, []);

  const markAllNotifsRead = useCallback(() => {
    setNotifications(prev => {
      if (prev.every(n => n.read)) return prev;
      return prev.map(n => ({ ...n, read: true }));
    });
  }, []);

  const dismissNotif = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const seeFlagId = useCallback((id: string) => {
    setSeenFlagIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      if (addressRef.current) {
        writeSession(
          addressRef.current,
          pendingTxRef.current || "",
          pendingTitleRef.current || "",
          next
        );
      }
      return next;
    });
  }, []);

  return (
    <SubmissionContext.Provider value={{
      pendingTx, pendingTitle, setPending, clearPending,
      notifications, addSubmissionNotif, markAllNotifsRead, dismissNotif,
      seenFlagIds, seeFlagId,
    }}>
      {children}
    </SubmissionContext.Provider>
  );
}

export function useSubmission() {
  const ctx = useContext(SubmissionContext);
  if (!ctx) throw new Error("useSubmission must be used within SubmissionProvider");
  return ctx;
}

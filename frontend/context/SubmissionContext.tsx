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

export function SubmissionProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();

  return (
    <SubmissionProviderState key={address ?? "disconnected"}>{children}</SubmissionProviderState>
  );
}

function SubmissionProviderState({ children }: { children: ReactNode }) {

  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<SubmissionNotification[]>([]);
  const [seenFlagIds, setSeenFlagIds] = useState<Set<string>>(new Set());

  // Refs let callbacks always read the latest values without stale closures
  const pendingTxRef = useRef<string | null>(null);
  const pendingTitleRef = useRef<string | null>(null);
  const seenFlagIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => { pendingTxRef.current = pendingTx; }, [pendingTx]);
  useEffect(() => { pendingTitleRef.current = pendingTitle; }, [pendingTitle]);
  useEffect(() => { seenFlagIdsRef.current = seenFlagIds; }, [seenFlagIds]);

  const setPending = useCallback((title: string, tx: string) => {
    setPendingTx(tx);
    setPendingTitle(title);
  }, []);

  const clearPending = useCallback(() => {
    setPendingTx(null);
    setPendingTitle(null);
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
      return new Set(prev).add(id);
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

export interface FlagNotification {
  projectId: string;
  projectTitle: string;
  txHash: string;
  status: "pending" | "complete";
  resolution?: "VALID" | "INVALID";
  reason?: string;
  timestamp: number;
  read?: boolean;
}

function storageKey(walletAddress: string): string {
  return `flags_${walletAddress.toLowerCase()}`;
}

export function getFlagNotifications(walletAddress: string): FlagNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(walletAddress));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFlagNotification(
  walletAddress: string,
  notification: FlagNotification
): void {
  if (typeof window === "undefined") return;
  const existing = getFlagNotifications(walletAddress);
  const filtered = existing.filter((n) => n.txHash !== notification.txHash);
  filtered.unshift(notification);
  localStorage.setItem(storageKey(walletAddress), JSON.stringify(filtered));
}

export function updateFlagNotification(
  walletAddress: string,
  txHash: string,
  update: Partial<FlagNotification>
): void {
  if (typeof window === "undefined") return;
  const existing = getFlagNotifications(walletAddress);
  const updated = existing.map((n) =>
    n.txHash === txHash ? { ...n, ...update } : n
  );
  localStorage.setItem(storageKey(walletAddress), JSON.stringify(updated));
}

export function clearFlagNotification(
  walletAddress: string,
  txHash: string
): void {
  if (typeof window === "undefined") return;
  const existing = getFlagNotifications(walletAddress);
  const filtered = existing.filter((n) => n.txHash !== txHash);
  localStorage.setItem(storageKey(walletAddress), JSON.stringify(filtered));
}

export function getProjectFlag(
  walletAddress: string,
  projectId: string
): FlagNotification | null {
  return getFlagNotifications(walletAddress).find((n) => n.projectId === projectId) ?? null;
}

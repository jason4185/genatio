"use client";

import { useState, useEffect, useCallback } from "react";
import { getCached, setCached, FUNDERS_TTL } from "@/lib/contractCache";

export interface Funder {
  project_id: string;
  wallet: string;
  amount_gen: number | string;
  timestamp: string;
}

function parseFunders(result: unknown): Funder[] {
  if (!result) return [];
  if (Array.isArray(result)) return result as Funder[];
  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (typeof result === "object") return Object.values(result) as Funder[];
  return [];
}

export function useFunders(projectId: string | null) {
  const [funders, setFunders] = useState<Funder[]>([]);
  const [loading, setLoading] = useState(!!projectId);
  const [error, setError] = useState<string | null>(null);

  const fetchFunders = useCallback(async (isInitial = false) => {
    if (!projectId) {
      setFunders([]);
      setLoading(false);
      return;
    }

    if (isInitial) setLoading(true);

    const cacheKey = `get_funders:${projectId}`;
    if (isInitial) {
      const cached = getCached(cacheKey);
      if (cached !== null) {
        setFunders(parseFunders(cached));
        setError(null);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/funders/${encodeURIComponent(projectId)}`);
      if (!res.ok) throw new Error("server_error");
      const result = await res.json();
      setCached(cacheKey, result, FUNDERS_TTL);
      setFunders(parseFunders(result));
      setError(null);
    } catch {
      setError("Full donor history will appear when available.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFunders(true);
  }, [fetchFunders]);

  return { funders, loading, error, refetch: fetchFunders };
}

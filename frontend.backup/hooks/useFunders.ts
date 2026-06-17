"use client";

import { useState, useEffect } from "react";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { GENATIO_CONTRACT } from "@/lib/genatio";
import { getCached, setCached, FUNDERS_TTL } from "@/lib/contractCache";
import type { Address } from "viem";

const client = createClient({ chain: testnetBradbury });

export interface Funder {
  address: string;
  amount: number | string;
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

  useEffect(() => {
    if (!projectId) {
      setFunders([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const cacheKey = `get_funders:${projectId}`;
    const cached = getCached(cacheKey);
    if (cached !== null) {
      if (!cancelled) {
        setFunders(parseFunders(cached));
        setError(null);
        setLoading(false);
      }
      return () => { cancelled = true; };
    }

    client
      .readContract({
        address: GENATIO_CONTRACT as Address,
        functionName: "get_funders",
        args: [projectId],
      })
      .then((result) => {
        if (cancelled) return;
        setCached(cacheKey, result, FUNDERS_TTL);
        setFunders(parseFunders(result));
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load funders");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId]);

  return { funders, loading, error };
}

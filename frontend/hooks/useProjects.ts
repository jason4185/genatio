"use client";

import { useState, useEffect, useCallback } from "react";
import { useSubmission } from "@/context/SubmissionContext";

export interface Project {
  id: string;
  title: string;
  story: string;
  github_repo_url: string;
  live_url: string;
  score: number;
  status: "ACTIVE" | "DISPUTED" | "ENDED";
  goal_gen: number | string;
  funding_purpose?: string;
  created_at: string | number;
  duration_days: string | number;
  wallet?: string;
}

function parseProjectsResult(data: unknown): Project[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Project[];
  if (typeof data === "object") return Object.values(data) as Project[];
  return [];
}

export function useProjects(status: string = "", enabled = true) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pendingTx } = useSubmission();

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects?status=${encodeURIComponent(status)}`);
      if (!res.ok) throw new Error("server_error");
      const data = await res.json();
      setProjects(parseProjectsResult(data));
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network")) {
        setError("Unable to connect. Please check your internet connection and try again.");
      } else {
        setError("Unable to load projects. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (!enabled) return;
    fetchProjects();
    const interval = setInterval(fetchProjects, pendingTx ? 5_000 : 30_000);
    return () => clearInterval(interval);
  }, [fetchProjects, enabled, pendingTx]);

  return { projects, loading, error, refetch: fetchProjects };
}

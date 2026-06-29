"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project } from "./useProjects";

export function useProject(projectId: string | null, pollInterval = 30_000) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(!!projectId);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async (isInitial = false) => {
    if (!projectId) return;
    if (isInitial) setLoading(true);

    try {
      const res = await fetch(`/api/project/${encodeURIComponent(projectId)}`);
      if (!res.ok) throw new Error(res.status === 404 ? "not_found" : "server_error");
      const data: Project = await res.json();
      setProject(data);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "not_found") {
        setError("We could not find this project.");
      } else if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network")) {
        setError("We could not load this data right now. Please check your connection and try again.");
      } else {
        setError("We could not load this project right now. Please refresh the page or try again shortly.");
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    fetchProject(true);
    const interval = setInterval(() => fetchProject(false), pollInterval);
    return () => clearInterval(interval);
  }, [projectId, fetchProject, pollInterval]);

  return { project, loading, error, refetch: fetchProject };
}

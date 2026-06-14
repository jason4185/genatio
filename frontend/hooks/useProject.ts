"use client";

import { useState, useEffect } from "react";
import type { Project } from "./useProjects";

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(!!projectId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/project/${encodeURIComponent(projectId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "not_found" : "server_error");
        return res.json();
      })
      .then((data: Project) => {
        if (!cancelled) {
          setProject(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "";
          if (msg === "not_found") {
            setError("Project not found.");
          } else if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network")) {
            setError("Unable to connect. Please check your internet connection and try again.");
          } else {
            setError("Unable to load this project. Please try again.");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { project, loading, error };
}

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
        if (!res.ok) throw new Error(res.status === 404 ? "Project not found" : `HTTP ${res.status}`);
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
          setError(err instanceof Error ? err.message : "Failed to load project");
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

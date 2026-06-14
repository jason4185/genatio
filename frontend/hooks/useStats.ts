"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project } from "./useProjects";

interface Stats {
  totalProjects: number;
  totalDonors: number;
  totalRaised: number;
}

function computeStats(projects: Project[]): Stats {
  return {
    totalProjects: projects.length,
    totalDonors: projects.reduce((sum, p) => sum + parseInt(String(p.donor_count ?? 0), 10), 0),
    totalRaised: projects.reduce((sum, p) => sum + parseInt(String(p.raised_gen ?? 0), 10) / 1e18, 0),
  };
}

export function useStats() {
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalDonors: 0,
    totalRaised: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/projects?status=active");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Project[] = await res.json();
      setStats(computeStats(Array.isArray(data) ? data : []));
    } catch {
      // keep zeros on error — stats are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 180_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { ...stats, loading };
}

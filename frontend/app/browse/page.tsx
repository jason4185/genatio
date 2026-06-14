"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Package, ChevronDown, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProjectCard from "@/components/ProjectCard";
import { useProjects } from "@/hooks/useProjects";
import type { Project } from "@/hooks/useProjects";
import { Logo } from "@/components/Logo";

type FilterTab = "all" | "active" | "ending-soon" | "recently-verified" | "ended";
type SortKey = "recently-added" | "highest-score" | "most-funded" | "ending-soon";

const PAGE_SIZE = 9;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "ending-soon", label: "Ending Soon" },
  { value: "recently-verified", label: "Recently Verified" },
  { value: "ended", label: "Ended" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recently-added", label: "Recently Added" },
  { value: "highest-score", label: "Highest Score" },
  { value: "most-funded", label: "Most Funded" },
  { value: "ending-soon", label: "Ending Soon" },
];

function weiToGen(raw: number | string | undefined): number {
  if (raw === undefined || raw === null) return 0;
  return Number(raw) / 1e18;
}

function extractRepo(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, "").replace(/\/$/, "") || url;
  } catch {
    return url;
  }
}

function computeDaysLeft(createdAt: string | number, durationDays: string | number): number {
  const endDate = new Date(createdAt).getTime() + (parseInt(String(durationDays)) * 24 * 60 * 60 * 1000);
  return Math.max(0, Math.floor((endDate - Date.now()) / (1000 * 60 * 60 * 24)));
}

function toCardProps(p: Project) {
  return {
    projectId: String(p.id),
    name: p.title,
    repo: extractRepo(p.github_repo_url),
    description: p.story,
    score: Number(p.score) || 0,
    status: p.status,
    raised: weiToGen(p.raised_gen),
    goal: weiToGen(p.goal_gen),
    daysLeft: computeDaysLeft(p.created_at, p.duration_days),
  };
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "12px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div className="skeleton-pulse" style={{ height: "12px", width: "60%", borderRadius: "6px" }} />
          <div className="skeleton-pulse" style={{ height: "18px", width: "80%", borderRadius: "6px" }} />
        </div>
        <div
          className="skeleton-pulse"
          style={{ width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0 }}
        />
      </div>
      {/* Description */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <div className="skeleton-pulse" style={{ height: "13px", width: "100%", borderRadius: "6px" }} />
        <div className="skeleton-pulse" style={{ height: "13px", width: "75%", borderRadius: "6px" }} />
      </div>
      {/* Progress */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div className="skeleton-pulse" style={{ height: "3px", width: "100%", borderRadius: "2px" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="skeleton-pulse" style={{ height: "12px", width: "40%", borderRadius: "6px" }} />
          <div className="skeleton-pulse" style={{ height: "12px", width: "20%", borderRadius: "6px" }} />
        </div>
      </div>
      {/* Button */}
      <div className="skeleton-pulse" style={{ height: "38px", width: "100%", borderRadius: "8px" }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const { projects, loading, error, refetch } = useProjects("active");

  // Delay ended fetch by 1s to avoid simultaneous RPC calls on page load
  const [endedEnabled, setEndedEnabled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setEndedEnabled(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  const { projects: endedProjects, loading: endedLoading } = useProjects("ended", endedEnabled);

  // Derive stats from the already-fetched active projects
  const totalProjects = projects.length;
  const totalDonors = projects.reduce((sum, p) => sum + (Number(p.donor_count) || 0), 0);
  const totalRaised = projects.reduce((sum, p) => sum + Number(p.raised_gen || 0) / 1e18, 0);
  const statsLoading = loading;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortKey>("recently-added");
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const formatRaised = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toFixed(n % 1 === 0 ? 0 : 2);
  };

  const isEndedTab = filter === "ended";

  const filtered = useMemo(() => {
    const source = isEndedTab ? endedProjects : projects;
    let result = source.map(toCardProps);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.repo.toLowerCase().includes(q)
      );
    }

    if (!isEndedTab) {
      if (filter === "ending-soon") {
        result = result.filter((p) => p.daysLeft <= 7);
      } else if (filter === "recently-verified") {
        result = result.filter((p) => p.score >= 70);
      }
    }

    switch (sort) {
      case "highest-score":
        result.sort((a, b) => b.score - a.score);
        break;
      case "most-funded":
        result.sort((a, b) => b.raised - a.raised);
        break;
      case "ending-soon":
        if (!isEndedTab) result.sort((a, b) => a.daysLeft - b.daysLeft);
        break;
    }

    return result;
  }, [projects, endedProjects, search, filter, sort, isEndedTab]);

  const handleFilter = (f: FilterTab) => { setFilter(f); setDisplayCount(PAGE_SIZE); };
  const handleSearch = (s: string) => { setSearch(s); setDisplayCount(PAGE_SIZE); };
  const handleSort = (s: SortKey) => { setSort(s); setDisplayCount(PAGE_SIZE); };

  const visible = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;

  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        .skeleton-pulse {
          background-color: var(--color-elevated);
          animation: skeleton-shimmer 1.6s ease-in-out infinite;
        }
        .browse-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 640px) {
          .browse-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .browse-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .browse-controls {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        @media (min-width: 640px) {
          .browse-controls { flex-direction: row; align-items: center; }
        }
        .browse-search-input::placeholder { color: var(--color-text-muted); }
        .browse-search-input:focus { outline: none; border-color: var(--color-accent-blue) !important; }
        .browse-sort-select:focus { outline: none; border-color: var(--color-accent-blue); }
        .browse-sort-select option { background-color: var(--color-surface); color: var(--color-text-primary); }
        .browse-sort-wrap { position: relative; flex-shrink: 0; }
        @media (max-width: 639px) {
          .browse-sort-wrap { width: 100%; }
          .browse-sort-select { width: 100%; }
        }
        .footer-browse-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 640px) {
          .footer-browse-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .browse-header {
          padding-top: 88px;
          padding-bottom: 2.5rem;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
        }
        @media (min-width: 768px) {
          .browse-header { padding-top: 120px; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />

        {/* ── PAGE HEADER ────────────────────────────────────────── */}
        <section className="browse-header">
          <p
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: "0.75rem",
              color: "var(--color-accent-blue)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Browse Projects
          </p>

          <h1
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: "0 0 0.625rem",
            }}
          >
            Active Projects
          </h1>

          <p
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "1rem",
              color: "var(--color-text-secondary)",
              margin: "0 0 2rem",
            }}
          >
            Verified by GenLayer Intelligent Contracts
          </p>

          {/* Live stats row */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
            {[
              {
                value: statsLoading ? "—" : String(totalProjects),
                label: "Active",
              },
              {
                value: statsLoading ? "—" : `${formatRaised(totalRaised)} GEN`,
                label: "Raised",
              },
              {
                value: statsLoading ? "—" : String(totalDonors),
                label: "Donors",
              },
            ].map((stat, i, arr) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                    fontSize: "0.875rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                    {stat.value}
                  </span>{" "}
                  {stat.label}
                </span>
                {i < arr.length - 1 && (
                  <span style={{ color: "var(--color-border-subtle)" }}>|</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── SEARCH + FILTERS ───────────────────────────────────── */}
        <div
          style={{
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            maxWidth: "1280px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div className="browse-controls" style={{ marginBottom: "0" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                  pointerEvents: "none",
                  flexShrink: 0,
                }}
              />
              <input
                className="browse-search-input"
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search projects..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  paddingLeft: "2.375rem",
                  paddingRight: "1rem",
                  paddingTop: "0.625rem",
                  paddingBottom: "0.625rem",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "8px",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  transition: "border-color 0.2s ease",
                }}
              />
            </div>

            {/* Sort */}
            <div className="browse-sort-wrap">
              <select
                className="browse-sort-select"
                value={sort}
                onChange={(e) => handleSort(e.target.value as SortKey)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  paddingLeft: "0.875rem",
                  paddingRight: "2.25rem",
                  paddingTop: "0.625rem",
                  paddingBottom: "0.625rem",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "8px",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  minWidth: "180px",
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Sort: {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div
            style={{
              display: "flex",
              marginTop: "1.25rem",
              borderBottom: "1px solid var(--color-border-subtle)",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = filter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleFilter(tab.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: isActive
                      ? "2px solid var(--color-accent-blue)"
                      : "2px solid transparent",
                    marginBottom: "-1px",
                    padding: "0.625rem 1rem",
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "var(--color-accent-blue)" : "var(--color-text-secondary)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "color 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── PROJECTS GRID ──────────────────────────────────────── */}
        <section
          style={{
            flex: 1,
            paddingTop: "2rem",
            paddingBottom: "5rem",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            maxWidth: "1280px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Loading skeleton */}
          {(isEndedTab ? endedLoading : loading) && (
            <div className="browse-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {!(isEndedTab ? endedLoading : loading) && !isEndedTab && error && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "5rem 1.5rem",
                gap: "1.25rem",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "1rem",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                Failed to load projects
              </p>
              <button
                onClick={refetch}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-accent-blue)",
                  backgroundColor: "transparent",
                  border: "1px solid var(--color-accent-blue)",
                  borderRadius: "8px",
                  padding: "0.625rem 1.25rem",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!(isEndedTab ? endedLoading : loading) && filtered.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "5rem 1.5rem",
                gap: "1.25rem",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  backgroundColor: "color-mix(in srgb, var(--color-accent-blue) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-accent-blue) 18%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-accent-blue)",
                }}
              >
                <Package size={28} strokeWidth={1.5} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    margin: "0 0 0.5rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {search.trim() ? "No projects found" : isEndedTab ? "No ended campaigns yet" : "No active projects yet"}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.9rem",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  {search.trim()
                    ? `No results for "${search}"`
                    : isEndedTab
                    ? "Campaigns will appear here once their duration expires."
                    : "Be the first to submit your project."}
                </p>
              </div>
              <a
                href="/submit"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  backgroundColor: "var(--color-accent-blue)",
                  borderRadius: "8px",
                  padding: "0.625rem 1.25rem",
                  textDecoration: "none",
                }}
              >
                Submit Your Project →
              </a>
            </div>
          )}

          {/* Projects grid */}
          {!(isEndedTab ? endedLoading : loading) && filtered.length > 0 && (
            <>
              <p
                style={{
                  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  margin: "0 0 1.5rem",
                }}
              >
                Showing {Math.min(displayCount, filtered.length)} of {filtered.length}{" "}
                project{filtered.length !== 1 ? "s" : ""}
              </p>

              <div className="browse-grid">
                {visible.map((props) => (
                  <ProjectCard key={props.projectId} {...props} />
                ))}
              </div>

              {hasMore ? (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
                  <button
                    onClick={() => setDisplayCount((d) => d + 6)}
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      color: "var(--color-accent-blue)",
                      backgroundColor: "transparent",
                      border: "1px solid var(--color-accent-blue)",
                      borderRadius: "8px",
                      padding: "0.75rem 2.5rem",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease, color 0.2s ease",
                      letterSpacing: "-0.01em",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-accent-blue)";
                      e.currentTarget.style.color = "var(--color-text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--color-accent-blue)";
                    }}
                  >
                    Load More Projects
                  </button>
                </div>
              ) : filtered.length > PAGE_SIZE ? (
                <p
                  style={{
                    textAlign: "center",
                    marginTop: "3rem",
                    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  All {filtered.length} projects shown
                </p>
              ) : null}
            </>
          )}
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer
          style={{
            backgroundColor: "var(--color-background)",
            borderTop: "1px solid var(--color-border-subtle)",
            padding: "3.5rem 1.5rem 2rem",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div
              className="footer-browse-grid"
              style={{ marginBottom: "3rem", alignItems: "start" }}
            >
              <div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <Logo size={22} />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.875rem",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                    lineHeight: 1.6,
                    maxWidth: "220px",
                  }}
                >
                  Trustless grants for open source builders.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[
                  { label: "Browse", href: "/browse" },
                  { label: "Submit Project", href: "/submit" },
                  { label: "GitHub", href: "#" },
                  { label: "Twitter / X", href: "#" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--color-text-primary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--color-text-secondary)")
                    }
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div>
                <p
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    margin: "0 0 0.375rem",
                  }}
                >
                  Built on
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--color-accent-blue)",
                    margin: 0,
                    letterSpacing: "0.02em",
                  }}
                >
                  GenLayer Bradbury
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    margin: "0.25rem 0 0",
                  }}
                >
                  AI-native blockchain
                </p>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--color-border-subtle)",
                paddingTop: "1.5rem",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                Genatio is a testnet application. Not for real funds.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

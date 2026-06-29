"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, Coins, HeartHandshake, ShieldCheck, Sprout, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProjectCard from "@/components/ProjectCard";
import { LiveStatsCard } from "@/components/LiveStatsCard";
import { useProjects } from "@/hooks/useProjects";
import { useStats } from "@/hooks/useStats";
import type { Project } from "@/hooks/useProjects";
import { Logo } from "@/components/Logo";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function SectionReveal({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function AnimatedQuote({ text, inView }: { text: string; inView: boolean }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.35, delay: 0.2 + i * 0.045, ease: "easeOut" }}
          style={{ display: "inline-block", marginRight: "0.28em" }}
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}


function StatPill({
  value,
  label,
  inView,
  Icon,
}: {
  value: number;
  label: string;
  inView: boolean;
  Icon: React.ElementType;
}) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);
  const started = useRef(false);

  useEffect(() => {
    // wait for a real value — don't animate while stats are still loading
    if (!inView || value === 0 || started.current) return;
    started.current = true;
    const start = performance.now();
    const duration = 1400;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplayed(Math.round(easeOut(t) * value));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [inView, value]);

  return (
    <div
      style={{
        padding: "0.625rem 1.25rem",
        backgroundColor: "var(--color-accent-blue-soft)",
        border: "1px solid color-mix(in srgb, var(--color-accent-blue) 18%, var(--color-border-subtle))",
        borderRadius: "100px",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", color: "var(--color-accent-blue)" }}>
        <Icon size={14} />
      </span>
      <span
        style={{
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
          fontSize: "0.9375rem",
          fontWeight: 700,
          color: "var(--color-accent-blue)",
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        } as React.CSSProperties}
      >
        {displayed}
      </span>
      <span
        style={{
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          fontSize: "0.8125rem",
          color: "var(--color-text-secondary)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

const nodeEntrance = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

function HiwNode({
  number,
  Icon,
  title,
  body,
  delay,
}: {
  number: string;
  Icon: React.ElementType;
  title: string;
  body: string;
  delay: number;
}) {
  return (
    <motion.div
      className="hiw-node"
      variants={nodeEntrance}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 1.5rem 2.5rem",
        cursor: "default",
      }}
    >
      {/* Large faint number — centered behind everything */}
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
          fontSize: "8rem",
          fontWeight: 800,
          lineHeight: 1,
          color: "var(--color-accent-cyan)",
          opacity: 0.06,
          letterSpacing: "-0.05em",
          userSelect: "none",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {number}
      </span>

      {/* Icon circle — connecting line centers on this (56px → center at 28px) */}
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "var(--color-elevated)",
          border: "1px solid var(--color-border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-accent-blue)",
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
          boxShadow: "0 12px 24px color-mix(in srgb, var(--color-accent-blue) 14%, transparent)",
          transition: "box-shadow 0.25s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 18px 36px color-mix(in srgb, var(--color-accent-blue) 18%, transparent)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 12px 24px color-mix(in srgb, var(--color-accent-blue) 14%, transparent)";
        }}
      >
        <Icon size={24} />
      </div>

      {/* Text content below icon */}
      <div
        style={{
          marginTop: "1.5rem",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: "0 0 0.75rem",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "0.9rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {body}
        </p>
      </div>
    </motion.div>
  );
}

function extractRepo(url: string): string {
  try {
    const parts = url.replace(/\.git$/, "").replace(/\/$/, "").split("/");
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  } catch {
    return url;
  }
}

function toCardProps(p: Project) {
  return {
    name: p.title,
    repo: extractRepo(p.github_repo_url),
    description: p.story,
    score: Number(p.score),
    status: "ACTIVE" as const,
    projectId: String(p.id),
    githubUrl: p.github_repo_url,
    liveUrl: p.live_url,
    raisedGen: Number(p.raised_gen ?? 0) / 1e18,
    goalGen: Number(p.goal_gen ?? 0) / 1e18,
    donorCount: Number(p.donor_count ?? 0),
    createdAt: p.created_at,
    durationDays: p.duration_days,
  };
}

function isRecentlyVerified(p: Project): boolean {
  return Date.now() - new Date(p.created_at).getTime() < 7 * 24 * 3600 * 1000;
}

const QUOTE_TEXT =
  "Approved builders get funded by the community. Genatio verifies submissions first, so supporters can back real open source work with more confidence.";

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });
  const quoteInView = useInView(quoteRef, { once: true, margin: "-80px" });

  const { projects: activeProjects, loading: projectsLoading } =
    useProjects("active");

  const {
    totalProjects,
    totalDonors,
    totalRaisedGen,
    loading: statsLoading,
  } = useStats();

  const statPills = [
    { value: statsLoading ? 0 : totalProjects, label: "Projects Verified", Icon: ShieldCheck },
    { value: statsLoading ? 0 : totalDonors, label: "Community Donors", Icon: Users },
    { value: statsLoading ? 0 : Math.round(totalRaisedGen), label: "GEN Raised", Icon: Coins },
  ];


  return (
    <>
      <style>{`
        @keyframes dash-flow {
          from { background-position: 0 0; }
          to { background-position: 14px 0; }
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          align-items: center;
        }
        @media (min-width: 900px) {
          .hero-grid { grid-template-columns: 1fr 1fr; }
          .hero-text { text-align: left !important; }
          .hero-ctas { justify-content: flex-start !important; }
          .hero-eyebrow { justify-content: flex-start !important; }
        }
        .stats-card { display: none; }
        @media (min-width: 900px) {
          .stats-card { display: flex !important; }
        }
        .projects-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 640px) {
          .projects-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .projects-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .hiw-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }
        @media (min-width: 640px) {
          .hiw-grid { grid-template-columns: repeat(3, 1fr); gap: 0; }
          .hiw-connecting-line { display: block !important; }
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 640px) {
          .footer-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div style={{ minHeight: "100vh" }}>
        <Navbar />

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          style={{
            paddingTop: "140px",
            paddingBottom: "80px",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            maxWidth: "1280px",
            margin: "0 auto",
          }}
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            className="hero-grid"
          >
            {/* Left: copy */}
            <div
              className="hero-text"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                textAlign: "center",
              }}
            >
              <motion.p
                variants={fadeIn}
                transition={{ duration: 0.6 }}
                className="hero-eyebrow"
                style={{
                  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--color-accent-blue)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  margin: "0 auto",
                }}
              >
                VERIFIED BUILDER FUNDING
              </motion.p>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.7 }}
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  margin: 0,
                  lineHeight: 1.08,
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "var(--color-text-primary)",
                    fontSize: "clamp(2.5rem, 5vw, 4rem)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Open source grants
                </span>
                <span
                  style={{
                    display: "block",
                    color: "var(--color-accent-blue)",
                    fontSize: "clamp(1.125rem, 2.2vw, 1.75rem)",
                    whiteSpace: "nowrap",
                    marginTop: "0.375rem",
                  }}
                >
                  Powered by Intelligent Contracts
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.7 }}
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "clamp(1rem, 2vw, 1.125rem)",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.7,
                  margin: 0,
                  maxWidth: "500px",
                }}
              >
                Genatio verifies builder submissions with GenLayer, then lets
                supporters fund approved projects with GEN. Creator payouts
                complete after on-chain finalization.
              </motion.p>

              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  justifyContent: "center",
                }}
              >
                {statPills.map((pill) => (
                  <StatPill key={pill.label} {...pill} inView={heroInView} />
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                className="hero-ctas"
                style={{
                  display: "flex",
                  gap: "0.875rem",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <motion.div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "8px",
                      border: "2px solid var(--color-primary)",
                      pointerEvents: "none",
                    }}
                    animate={{ scale: [1, 1.22, 1.22], opacity: [0.55, 0, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", repeatDelay: 0.8 }}
                  />
                  <motion.a
                    href="/submit"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "var(--color-primary-foreground)",
                      backgroundColor: "var(--color-primary)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.75rem 1.5rem",
                      textDecoration: "none",
                      cursor: "pointer",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <Sprout size={16} />
                    Submit Project
                    <ArrowRight size={16} />
                  </motion.a>
                </div>
                <motion.a
                  href="/browse"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    backgroundColor: "transparent",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "8px",
                    padding: "0.75rem 1.5rem",
                    textDecoration: "none",
                    cursor: "pointer",
                    letterSpacing: "-0.01em",
                    transition: "border-color 0.2s ease, color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-accent-blue)";
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                >
                  <ShieldCheck size={16} />
                  Browse Projects
                  <ArrowRight size={16} />
                </motion.a>
              </motion.div>
            </div>

            {/* Right: LiveStatsCard */}
            <motion.div
              className="stats-card"
              variants={slideFromRight}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ flexDirection: "column", minWidth: "320px", width: "100%", maxWidth: "420px" }}
            >
              <LiveStatsCard
                totalProjects={totalProjects}
                totalDonors={totalDonors}
                totalRaisedGen={totalRaisedGen}
                loading={statsLoading || projectsLoading}
              />
            </motion.div>
          </motion.div>

        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────── */}
        <section
          style={{
            padding: "100px 1.5rem",
            maxWidth: "1280px",
            margin: "0 auto",
          }}
        >
          <SectionReveal
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "4rem",
            }}
          >
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--color-accent-blue)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                margin: "0 0 1rem",
              }}
            >
              HOW IT WORKS
            </motion.p>
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
                fontWeight: 800,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Trustless by design
            </motion.h2>
          </SectionReveal>

          <div style={{ position: "relative" }}>
            {/* Connecting dashed line — absolutely positioned at icon center (56px / 2 = 28px from top) */}
            <div
              className="hiw-connecting-line"
              style={{
                display: "none",
                position: "absolute",
                top: "28px",
                left: "calc(100% / 6)",
                right: "calc(100% / 6)",
                height: "2px",
                zIndex: 0,
                pointerEvents: "none",
              }}
            >
              <motion.div
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                whileInView={{ clipPath: "inset(0 0% 0 0)" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                style={{
                  height: "100%",
                  width: "100%",
                  backgroundImage:
                    "repeating-linear-gradient(to right, var(--color-primary) 0, var(--color-primary) 8px, transparent 8px, transparent 18px)",
                  backgroundSize: "18px 2px",
                  opacity: 0.3,
                  animation: "dash-flow 1.2s linear infinite",
                }}
              />
            </div>

            <div className="hiw-grid">
              <HiwNode
                number="01"
                Icon={Sprout}
                title="Submit your project"
                body="Builders submit project details, GitHub proof, live URL, funding goal, and campaign duration."
                delay={0}
              />
              <HiwNode
                number="02"
                Icon={ShieldCheck}
                title="GenLayer verifies"
                body="Genatio uses an Intelligent Contract to review the submission and assign a verification score."
                delay={0.3}
              />
              <HiwNode
                number="03"
                Icon={HeartHandshake}
                title="Community funds"
                body="Supporters fund approved projects with GEN. Contributions are recorded on-chain, and creator payouts complete after finalization."
                delay={0.6}
              />
            </div>
          </div>
        </section>

        {/* ── PROJECTS ────────────────────────────────────────── */}
        <section
          id="projects"
          style={{
            padding: "100px 1.5rem",
            maxWidth: "1280px",
            margin: "0 auto",
          }}
        >
          <SectionReveal
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "3.5rem",
            }}
          >
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--color-accent-blue)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                margin: "0 0 1rem",
              }}
            >
              LIVE ON CHAIN
            </motion.p>
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
                fontWeight: 800,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.03em",
                margin: "0 0 0.75rem",
                lineHeight: 1.1,
              }}
            >
              {projectsLoading ? "Projects Verified" : `${activeProjects.length} Projects Verified`}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "1rem",
                color: "var(--color-text-secondary)",
                margin: 0,
                maxWidth: "440px",
              }}
            >
              Verified by GenLayer Intelligent Contracts
            </motion.p>
          </SectionReveal>

          {/* Recently Verified */}
          {(() => {
            const recent = activeProjects.filter(isRecentlyVerified).slice(0, 3);
            return (
              <div style={{ marginBottom: "4rem" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      letterSpacing: "-0.02em",
                      margin: 0,
                    }}
                  >
                    Recently Verified
                  </h3>
                  <span
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Last 7 days
                  </span>
                </div>
                {projectsLoading ? (
                  <div style={{ textAlign: "center", padding: "2rem 0", fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", color: "var(--color-text-muted)" }}>
                    Loading verified projects...
                  </div>
                ) : recent.length === 0 ? (
                  <div style={{ padding: "2rem 1.5rem", fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", color: "var(--color-text-muted)", border: "1px dashed var(--color-border-subtle)", borderRadius: "12px", textAlign: "center" }}>
                    No projects verified in the last 7 days.
                  </div>
                ) : (
                  <div className="projects-grid">
                    {recent.map((project, index) => (
                      <motion.div
                        key={project.id}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={fadeUp}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <ProjectCard {...toCardProps(project)} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Top Rated */}
          {(() => {
            const topRated = [...activeProjects].sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 3);
            return (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      letterSpacing: "-0.02em",
                      margin: 0,
                    }}
                  >
                    Top Rated
                  </h3>
                  <span
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Highest AI verification scores
                  </span>
                </div>
                {projectsLoading ? (
                  <div style={{ textAlign: "center", padding: "2rem 0", fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", color: "var(--color-text-muted)" }}>
                    Loading verified projects...
                  </div>
                ) : topRated.length === 0 ? (
                  <div style={{ padding: "2rem 1.5rem", fontFamily: "var(--font-jakarta), system-ui, sans-serif", fontSize: "0.9375rem", color: "var(--color-text-muted)", border: "1px dashed var(--color-border-subtle)", borderRadius: "12px", textAlign: "center" }}>
                    No active projects yet. Verified projects will appear here after they are approved.
                  </div>
                ) : (
                  <div className="projects-grid">
                    {topRated.map((project, index) => (
                      <motion.div
                        key={project.id}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={fadeUp}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <ProjectCard {...toCardProps(project)} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <SectionReveal
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "3rem",
            }}
          >
            <motion.a
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              href="/browse"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                textDecoration: "none",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "8px",
                padding: "0.75rem 2rem",
                display: "inline-block",
                transition: "border-color 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-accent-blue)";
                e.currentTarget.style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                e.currentTarget.style.color = "var(--color-text-secondary)";
              }}
            >
              View All Projects →
            </motion.a>
          </SectionReveal>
        </section>

        {/* ── PITCH / QUOTE ───────────────────────────────────── */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            backgroundColor: "color-mix(in srgb, var(--color-surface) 50%, transparent)",
            borderTop: "1px solid var(--color-border-subtle)",
            borderBottom: "1px solid var(--color-border-subtle)",
            padding: "100px 1.5rem",
          }}
        >
          {/* Radial spotlight */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, color-mix(in srgb, var(--color-accent-cyan) 10%, transparent) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <motion.div
            ref={quoteRef}
            variants={stagger}
            initial="hidden"
            animate={quoteInView ? "visible" : "hidden"}
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: "860px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "2rem",
            }}
          >
            <motion.blockquote
              variants={fadeUp}
              transition={{ duration: 0.7 }}
              style={{
                borderLeft: "4px solid var(--color-accent-blue)",
                paddingLeft: "2rem",
                margin: 0,
                textAlign: "left",
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "clamp(1.25rem, 2.5vw, 1.875rem)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                lineHeight: 1.5,
                letterSpacing: "-0.025em",
                fontStyle: "italic",
              }}
            >
              <AnimatedQuote text={QUOTE_TEXT} inView={quoteInView} />
            </motion.blockquote>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              style={{
                paddingLeft: "2rem",
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9rem",
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              Built on{" "}
              <span style={{ color: "var(--color-accent-blue)" }}>
                GenLayer Bradbury
              </span>{" "}
              the first AI-native blockchain.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              style={{
                paddingLeft: "2rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              {statPills.map((pill) => (
                <StatPill key={pill.label} {...pill} inView={quoteInView} />
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <footer
          style={{
            backgroundColor: "var(--color-background)",
            borderTop: "1px solid var(--color-border-subtle)",
            padding: "3.5rem 1.5rem 2rem",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div
              className="footer-grid"
              style={{ marginBottom: "3rem", alignItems: "start" }}
            >
              {/* Logo + tagline */}
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

              {/* Nav links */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem",
                }}
              >
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

              {/* Attribution */}
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
                  AI-native blockchain testnet
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

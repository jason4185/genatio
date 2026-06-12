"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { GitBranch, Shield, Wallet, Quote } from "lucide-react";
import Navbar from "@/components/Navbar";
import VerificationTicker from "@/components/VerificationTicker";
import ProjectCard from "@/components/ProjectCard";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
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

const PROJECTS = [
  {
    name: "LayerZero Bridge SDK",
    score: 88,
    status: "ACTIVE" as const,
    repo: "layerzero-labs/bridge-sdk",
    description:
      "A cross-chain bridging SDK supporting 15+ EVM-compatible networks. Built for developers who need reliable, low-latency asset transfers.",
    raised: 3200,
    goal: 5000,
    daysLeft: 6,
  },
  {
    name: "zkAudit Framework",
    score: 82,
    status: "ACTIVE" as const,
    repo: "zktools/zkaudit",
    description:
      "Zero-knowledge proof-based smart contract auditing. Generates verifiable audit reports without revealing proprietary contract logic.",
    raised: 1800,
    goal: 4000,
    daysLeft: 11,
  },
  {
    name: "Open Grant DAO",
    score: 77,
    status: "ACTIVE" as const,
    repo: "opengrant/dao-contracts",
    description:
      "Decentralized autonomous organization contracts for community-governed grant allocation. Fully on-chain governance with quadratic voting.",
    raised: 2600,
    goal: 3500,
    daysLeft: 3,
  },
  {
    name: "DeFi Analytics Dashboard",
    score: 75,
    status: "ACTIVE" as const,
    repo: "defi-labs/analytics-dash",
    description:
      "Real-time on-chain analytics for DeFi protocols. Tracks TVL, volume, and yield across 20+ protocols with sub-second latency.",
    raised: 980,
    goal: 2000,
    daysLeft: 19,
  },
  {
    name: "GenLayer Dev Toolkit",
    score: 91,
    status: "ACTIVE" as const,
    repo: "genlayer/dev-toolkit",
    description:
      "CLI tooling, testing harnesses, and local simulation environment for building Intelligent Contracts on GenLayer Bradbury.",
    raised: 4200,
    goal: 5000,
    daysLeft: 7,
  },
  {
    name: "Cross-Chain NFT Bridge",
    score: 69,
    status: "ACTIVE" as const,
    repo: "nft-labs/x-chain-bridge",
    description:
      "Trustless NFT bridging protocol enabling seamless transfer of ERC-721 and ERC-1155 tokens across Ethereum, Polygon, and Arbitrum.",
    raised: 720,
    goal: 3000,
    daysLeft: 14,
  },
];

const HOW_IT_WORKS = [
  {
    number: "01",
    Icon: GitBranch,
    title: "Submit your project",
    body: "Paste your GitHub URL, write your story, set your funding goal and duration.",
  },
  {
    number: "02",
    Icon: Shield,
    title: "Intelligent Contract verifies",
    body: "5 validators on GenLayer Bradbury independently verify your project on-chain. No human sees your submission.",
  },
  {
    number: "03",
    Icon: Wallet,
    title: "Community funds directly",
    body: "Approved projects go live immediately. Donors send GLY straight to your wallet.",
  },
];

const TRUST_STATS = ["24 Projects Verified", "5 Validators", "2 Chains Supported"];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <>
      {/* Responsive styles */}
      <style>{`
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          align-items: center;
        }
        @media (min-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr 1fr;
          }
          .hero-text { text-align: left !important; }
          .hero-ctas { justify-content: flex-start !important; }
          .hero-eyebrow { justify-content: flex-start !important; }
        }
        .stats-card {
          display: none;
        }
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
          gap: 1.5rem;
        }
        @media (min-width: 640px) {
          .hiw-grid { grid-template-columns: repeat(3, 1fr); }
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
              style={{ display: "flex", flexDirection: "column", gap: "1.5rem", textAlign: "center" }}
            >
              {/* Eyebrow */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="hero-eyebrow"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "rgba(45,156,219,0.08)",
                  border: "1px solid rgba(45,156,219,0.25)",
                  borderRadius: "100px",
                  padding: "0.35rem 0.875rem",
                  width: "fit-content",
                  margin: "0 auto",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#2D9CDB",
                    display: "block",
                    animation: "pulse-live 1.4s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#2D9CDB",
                    letterSpacing: "0.08em",
                  }}
                >
                  GenLayer Bradbury — Live Testnet
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.7 }}
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  fontWeight: 800,
                  color: "#F0F4FF",
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                  margin: 0,
                }}
              >
                Open source grants.{" "}
                <span style={{ color: "#2D9CDB" }}>Verified on-chain.</span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.7 }}
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "clamp(1rem, 2vw, 1.125rem)",
                  color: "#8899AA",
                  lineHeight: 1.7,
                  margin: 0,
                  maxWidth: "500px",
                }}
              >
                Intelligent Contracts on GenLayer verify every project on-chain.{" "}
                <span style={{ color: "#F0F4FF" }}>No humans. No middlemen.</span> The
                validators decide.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                className="hero-ctas"
                style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", justifyContent: "center" }}
              >
                <motion.a
                  href="#submit"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "#F0F4FF",
                    backgroundColor: "#2D9CDB",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.75rem 1.5rem",
                    textDecoration: "none",
                    cursor: "pointer",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Submit Your Project →
                </motion.a>
                <motion.a
                  href="#projects"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    color: "#8899AA",
                    backgroundColor: "transparent",
                    border: "1px solid #1E2D45",
                    borderRadius: "8px",
                    padding: "0.75rem 1.5rem",
                    textDecoration: "none",
                    cursor: "pointer",
                    letterSpacing: "-0.01em",
                    transition: "border-color 0.2s ease, color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#2D9CDB";
                    e.currentTarget.style.color = "#F0F4FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#1E2D45";
                    e.currentTarget.style.color = "#8899AA";
                  }}
                >
                  Browse Projects
                </motion.a>
              </motion.div>
            </div>

            {/* Right: glass stats card */}
            <motion.div
              className="stats-card"
              variants={fadeUp}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{
                flexDirection: "column",
                gap: "0",
                backgroundColor: "rgba(12,18,32,0.7)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid #1E2D45",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              {TRUST_STATS.map((stat, i) => (
                <div
                  key={stat}
                  style={{
                    padding: "1.75rem 2rem",
                    borderBottom: i < TRUST_STATS.length - 1 ? "1px solid #1E2D45" : "none",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                      fontSize: "clamp(1.5rem, 3vw, 2rem)",
                      fontWeight: 700,
                      color: "#F0F4FF",
                      margin: "0 0 0.25rem",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {stat.split(" ")[0]}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      color: "#8899AA",
                      margin: 0,
                    }}
                  >
                    {stat.split(" ").slice(1).join(" ")}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Ticker below hero */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ marginTop: "3.5rem" }}
          >
            <VerificationTicker />
          </motion.div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────── */}
        <section style={{ padding: "100px 1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
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
                color: "#2D9CDB",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                margin: "0 0 1rem",
              }}
            >
              How It Works
            </motion.p>
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
                fontWeight: 800,
                color: "#F0F4FF",
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Three steps. Zero humans.
            </motion.h2>
          </SectionReveal>

          <SectionReveal>
            <div className="hiw-grid">
              {HOW_IT_WORKS.map(({ number, Icon, title, body }) => (
                <motion.div
                  key={number}
                  variants={fadeUp}
                  transition={{ duration: 0.6 }}
                  style={{
                    backgroundColor: "rgba(12,18,32,0.6)",
                    border: "1px solid #1E2D45",
                    borderRadius: "12px",
                    padding: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                      fontSize: "2.5rem",
                      fontWeight: 700,
                      color: "rgba(45,156,219,0.08)",
                      lineHeight: 1,
                      position: "absolute",
                      top: "1.25rem",
                      right: "1.5rem",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {number}
                  </span>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(45,156,219,0.08)",
                      border: "1px solid rgba(45,156,219,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2D9CDB",
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      color: "#F0F4FF",
                      margin: 0,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.9rem",
                      color: "#8899AA",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {body}
                  </p>
                </motion.div>
              ))}
            </div>
          </SectionReveal>
        </section>

        {/* ── ACTIVE PROJECTS ─────────────────────────────────── */}
        <section
          id="projects"
          style={{ padding: "100px 1.5rem", maxWidth: "1280px", margin: "0 auto" }}
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
                color: "#2D9CDB",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                margin: "0 0 1rem",
              }}
            >
              Live on Chain
            </motion.p>
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
                fontWeight: 800,
                color: "#F0F4FF",
                letterSpacing: "-0.03em",
                margin: "0 0 0.75rem",
                lineHeight: 1.1,
              }}
            >
              Active Projects
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "1rem",
                color: "#8899AA",
                margin: 0,
                maxWidth: "440px",
              }}
            >
              Verified by Intelligent Contracts. Funded by the community.
            </motion.p>
          </SectionReveal>

          <SectionReveal>
            <div className="projects-grid">
              {PROJECTS.map((project) => (
                <motion.div key={project.name} variants={fadeUp} transition={{ duration: 0.5 }}>
                  <ProjectCard {...project} />
                </motion.div>
              ))}
            </div>
          </SectionReveal>

          <SectionReveal style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
            <motion.a
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              href="#"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: "#8899AA",
                textDecoration: "none",
                border: "1px solid #1E2D45",
                borderRadius: "8px",
                padding: "0.75rem 2rem",
                display: "inline-block",
                transition: "border-color 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2D9CDB";
                e.currentTarget.style.color = "#F0F4FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1E2D45";
                e.currentTarget.style.color = "#8899AA";
              }}
            >
              View All Projects →
            </motion.a>
          </SectionReveal>
        </section>

        {/* ── PITCH / QUOTE ───────────────────────────────────── */}
        <section
          style={{
            backgroundColor: "rgba(12,18,32,0.5)",
            borderTop: "1px solid #1E2D45",
            borderBottom: "1px solid #1E2D45",
            padding: "100px 1.5rem",
          }}
        >
          <SectionReveal
            style={{
              maxWidth: "860px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "2rem",
            }}
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              style={{ color: "rgba(45,156,219,0.2)" }}
            >
              <Quote size={48} strokeWidth={1.5} />
            </motion.div>

            <motion.blockquote
              variants={fadeUp}
              transition={{ duration: 0.7 }}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "clamp(1.375rem, 3vw, 2rem)",
                fontWeight: 600,
                color: "#F0F4FF",
                lineHeight: 1.45,
                letterSpacing: "-0.025em",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              "We can't touch your money. We can't approve or reject your project. The
              Intelligent Contract and the chain decide everything."
            </motion.blockquote>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9rem",
                color: "#8899AA",
                margin: 0,
              }}
            >
              Built on{" "}
              <span style={{ color: "#2D9CDB" }}>GenLayer Bradbury</span> — the first
              AI-native blockchain testnet.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              {TRUST_STATS.map((stat) => (
                <div
                  key={stat}
                  style={{
                    padding: "0.625rem 1.25rem",
                    backgroundColor: "rgba(45,156,219,0.06)",
                    border: "1px solid rgba(45,156,219,0.2)",
                    borderRadius: "100px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#2D9CDB",
                      letterSpacing: "0.02em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stat}
                  </span>
                </div>
              ))}
            </motion.div>
          </SectionReveal>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <footer
          style={{
            backgroundColor: "#060B18",
            borderTop: "1px solid #1E2D45",
            padding: "3.5rem 1.5rem 2rem",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div className="footer-grid" style={{ marginBottom: "3rem", alignItems: "start" }}>
              {/* Logo + tagline */}
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#F0F4FF",
                    margin: "0 0 0.5rem",
                    letterSpacing: "-0.03em",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "1px",
                  }}
                >
                  <span style={{ color: "#2D9CDB" }}>G</span>
                  <span>enatio</span>
                  <span
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      backgroundColor: "#2D9CDB",
                      display: "inline-block",
                      marginLeft: "2px",
                      marginBottom: "1px",
                    }}
                  />
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.875rem",
                    color: "#8899AA",
                    margin: 0,
                    lineHeight: 1.6,
                    maxWidth: "220px",
                  }}
                >
                  Trustless grants for open source builders.
                </p>
              </div>

              {/* Nav links */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {["Browse", "Submit Project", "GitHub", "Twitter / X"].map((link) => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      color: "#8899AA",
                      textDecoration: "none",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F4FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#8899AA")}
                  >
                    {link}
                  </a>
                ))}
              </div>

              {/* Attribution */}
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "0.8125rem",
                    color: "#4A5568",
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
                    color: "#2D9CDB",
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
                    color: "#4A5568",
                    margin: "0.25rem 0 0",
                  }}
                >
                  AI-native blockchain testnet
                </p>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid #1E2D45",
                paddingTop: "1.5rem",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.75rem",
                  color: "#4A5568",
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

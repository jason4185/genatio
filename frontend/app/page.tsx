"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { GitBranch, Cpu, Wallet, Quote } from "lucide-react";
import Navbar from "@/components/Navbar";
import VerificationTicker from "@/components/VerificationTicker";
import ProjectCard from "@/components/ProjectCard";

// ─── Shared animation variants ───────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
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
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      variants={fadeUp}
      transition={{ duration: 0.6 }}
      style={{
        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "#E8FF47",
        letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        margin: 0,
      }}
    >
      {children}
    </motion.p>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    title: "LayerZero Bridge SDK",
    score: 88,
    repo: "layerzero-labs/bridge-sdk",
    description:
      "A cross-chain bridging SDK supporting 15+ EVM-compatible networks. Built for developers who need reliable, low-latency asset transfers.",
    raised: 3200,
    goal: 5000,
    currency: "GEN",
    endsAt: new Date(Date.now() + 6 * 86400000 + 14 * 3600000 + 32 * 60000),
  },
  {
    title: "zkAudit Framework",
    score: 82,
    repo: "zktools/zkaudit",
    description:
      "Zero-knowledge proof-based smart contract auditing. Generates verifiable audit reports without revealing proprietary contract logic.",
    raised: 1800,
    goal: 4000,
    currency: "GEN",
    endsAt: new Date(Date.now() + 11 * 86400000 + 8 * 3600000 + 5 * 60000),
  },
  {
    title: "Open Grant DAO",
    score: 77,
    repo: "opengrant/dao-contracts",
    description:
      "Decentralized autonomous organization contracts for community-governed grant allocation. Fully on-chain governance with quadratic voting.",
    raised: 2600,
    goal: 3500,
    currency: "GEN",
    endsAt: new Date(Date.now() + 3 * 86400000 + 22 * 3600000 + 17 * 60000),
  },
  {
    title: "DeFi Analytics Dashboard",
    score: 75,
    repo: "defi-labs/analytics-dash",
    description:
      "Real-time on-chain analytics for DeFi protocols. Tracks TVL, volume, and yield across 20+ protocols with sub-second latency.",
    raised: 980,
    goal: 2000,
    currency: "GEN",
    endsAt: new Date(Date.now() + 19 * 86400000 + 3 * 3600000 + 44 * 60000),
  },
  {
    title: "GenLayer Dev Toolkit",
    score: 91,
    repo: "genlayer/dev-toolkit",
    description:
      "CLI tooling, testing harnesses, and local simulation environment for building Intelligent Contracts on GenLayer Bradbury.",
    raised: 4200,
    goal: 5000,
    currency: "GEN",
    endsAt: new Date(Date.now() + 7 * 86400000 + 1 * 3600000 + 58 * 60000),
  },
  {
    title: "Cross-Chain NFT Bridge",
    score: 69,
    repo: "nft-labs/x-chain-bridge",
    description:
      "Trustless NFT bridging protocol enabling seamless transfer of ERC-721 and ERC-1155 tokens across Ethereum, Polygon, and Arbitrum.",
    raised: 720,
    goal: 3000,
    currency: "GEN",
    endsAt: new Date(Date.now() + 14 * 86400000 + 6 * 3600000 + 10 * 60000),
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
    Icon: Cpu,
    title: "Intelligent Contract verifies",
    body: "5 validators on GenLayer Bradbury independently verify your project on-chain. No human sees your submission.",
  },
  {
    number: "03",
    Icon: Wallet,
    title: "Community funds directly",
    body: "Approved projects go live immediately. Donors send GEN or ETH straight to your wallet.",
  },
];

const TRUST_STATS = ["5 validators", "On-chain verification", "Zero human approval"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          paddingTop: "160px",
          paddingBottom: "100px",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={heroInView ? "visible" : "hidden"}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Live chip */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "rgba(232,255,71,0.06)",
              border: "1px solid rgba(232,255,71,0.18)",
              borderRadius: "100px",
              padding: "0.35rem 0.875rem",
              marginBottom: "2rem",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#E8FF47",
                display: "block",
                animation: "pulse-live 1.4s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#E8FF47",
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
              fontFamily: "'Clash Display', var(--font-inter), system-ui, sans-serif",
              fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
              fontWeight: 700,
              color: "#F8F9FA",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              maxWidth: "820px",
              margin: "0 0 1.5rem",
            }}
          >
            Fund the builders.{" "}
            <span style={{ color: "#E8FF47" }}>Trust the contract.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "clamp(1rem, 2vw, 1.1875rem)",
              color: "#8B949E",
              lineHeight: 1.7,
              maxWidth: "540px",
              margin: "0 0 2.5rem",
            }}
          >
            Intelligent Contracts on GenLayer verify every open source project on-chain.{" "}
            <span style={{ color: "#F8F9FA" }}>No humans. No middlemen.</span> The chain
            decides.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <motion.a
              href="#submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "#080B14",
                backgroundColor: "#E8FF47",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.625rem",
                textDecoration: "none",
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              Submit Your Project →
            </motion.a>
            <motion.a
              href="#projects"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: "#E8FF47",
                backgroundColor: "transparent",
                border: "1px solid rgba(232,255,71,0.4)",
                borderRadius: "8px",
                padding: "0.75rem 1.625rem",
                textDecoration: "none",
                cursor: "pointer",
                letterSpacing: "0.01em",
                transition: "border-color 0.2s ease, background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#E8FF47";
                e.currentTarget.style.backgroundColor = "rgba(232,255,71,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(232,255,71,0.4)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Browse Projects
            </motion.a>
          </motion.div>

          {/* Ticker */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.15 }}
            style={{ display: "flex", justifyContent: "center", width: "100%" }}
          >
            <VerificationTicker />
          </motion.div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
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
          <Eyebrow>How It Works</Eyebrow>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: "'Clash Display', var(--font-inter), system-ui, sans-serif",
              fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
              fontWeight: 700,
              color: "#F8F9FA",
              letterSpacing: "-0.025em",
              margin: "1rem 0 0",
              lineHeight: 1.15,
            }}
          >
            Three steps. Zero humans.
          </motion.h2>
        </SectionReveal>

        <SectionReveal>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {HOW_IT_WORKS.map(({ number, Icon, title, body }) => (
              <motion.div
                key={number}
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                style={{
                  backgroundColor: "#0D1117",
                  border: "1px solid #1A1D2E",
                  borderRadius: "12px",
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.125rem",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    color: "rgba(232,255,71,0.1)",
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
                    backgroundColor: "rgba(232,255,71,0.07)",
                    border: "1px solid rgba(232,255,71,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#E8FF47",
                  }}
                >
                  <Icon size={20} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Clash Display', var(--font-inter), system-ui, sans-serif",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#F8F9FA",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontSize: "0.9rem",
                    color: "#8B949E",
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

      {/* ── ACTIVE PROJECTS ───────────────────────────────────────────── */}
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
          <Eyebrow>Live on Chain</Eyebrow>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: "'Clash Display', var(--font-inter), system-ui, sans-serif",
              fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
              fontWeight: 700,
              color: "#F8F9FA",
              letterSpacing: "-0.025em",
              margin: "1rem 0 0.75rem",
              lineHeight: 1.15,
            }}
          >
            Active Projects
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "1rem",
              color: "#8B949E",
              margin: 0,
              maxWidth: "440px",
            }}
          >
            Verified by Intelligent Contracts. Funded by the community.
          </motion.p>
        </SectionReveal>

        <SectionReveal>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {PROJECTS.map((project) => (
              <motion.div
                key={project.title}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                <ProjectCard {...project} />
              </motion.div>
            ))}
          </div>
        </SectionReveal>

        <SectionReveal
          style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}
        >
          <motion.a
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            href="#"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 500,
              color: "#E8FF47",
              textDecoration: "none",
              border: "1px solid rgba(232,255,71,0.3)",
              borderRadius: "8px",
              padding: "0.75rem 2rem",
              display: "inline-block",
              transition: "border-color 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#E8FF47";
              e.currentTarget.style.backgroundColor = "rgba(232,255,71,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(232,255,71,0.3)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            View All Projects →
          </motion.a>
        </SectionReveal>
      </section>

      {/* ── TRUST / PITCH ─────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: "#0D1117",
          borderTop: "1px solid #1A1D2E",
          borderBottom: "1px solid #1A1D2E",
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
            style={{ color: "rgba(232,255,71,0.18)" }}
          >
            <Quote size={48} strokeWidth={1.5} />
          </motion.div>

          <motion.blockquote
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            style={{
              fontFamily: "'Clash Display', var(--font-inter), system-ui, sans-serif",
              fontSize: "clamp(1.375rem, 3vw, 2rem)",
              fontWeight: 500,
              color: "#F8F9FA",
              lineHeight: 1.45,
              letterSpacing: "-0.02em",
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
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "0.9rem",
              color: "#8B949E",
              margin: 0,
            }}
          >
            Built on{" "}
            <span style={{ color: "#E8FF47" }}>GenLayer Bradbury</span> — the first
            AI-native blockchain testnet.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: "0.5rem",
              border: "1px solid #1A1D2E",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {TRUST_STATS.map((stat, i) => (
              <div
                key={stat}
                style={{
                  padding: "1rem 2rem",
                  borderRight: i < TRUST_STATS.length - 1 ? "1px solid #1A1D2E" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#F8F9FA",
                    letterSpacing: "0.03em",
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

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer
        style={{
          backgroundColor: "#080B14",
          borderTop: "2px solid #E8FF47",
          padding: "3.5rem 1.5rem 2rem",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "2.5rem",
              marginBottom: "3rem",
              alignItems: "start",
            }}
          >
            {/* Logo + tagline */}
            <div>
              <p
                style={{
                  fontFamily: "'Clash Display', var(--font-inter), system-ui, sans-serif",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: "#F8F9FA",
                  margin: "0 0 0.625rem",
                  letterSpacing: "-0.02em",
                }}
              >
                <span style={{ color: "#E8FF47" }}>G</span>enatio
              </p>
              <p
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  color: "#8B949E",
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
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontSize: "0.875rem",
                    color: "#8B949E",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F8F9FA")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#8B949E")}
                >
                  {link}
                </a>
              ))}
            </div>

            {/* Attribution */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "0.8125rem",
                  color: "#8B949E",
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
                  color: "#E8FF47",
                  margin: 0,
                  letterSpacing: "0.02em",
                }}
              >
                GenLayer Bradbury
              </p>
              <p
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "0.75rem",
                  color: "#8B949E",
                  margin: "0.25rem 0 0",
                }}
              >
                AI-native blockchain testnet
              </p>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid #1A1D2E",
              paddingTop: "1.5rem",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "0.75rem",
                color: "#8B949E",
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
  );
}

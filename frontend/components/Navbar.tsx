"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { Logo } from "./Logo";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Browse", href: "/browse" },
  { label: "Submit Project", href: "/submit" },
];

const menuContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const menuItemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: "easeOut" } },
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [blurAmount, setBlurAmount] = useState(8);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isConnected } = useAccount();
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setBlurAmount(8 + Math.min(y / 120, 1) * 12);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: scrolled ? "1px solid var(--color-border-subtle)" : "1px solid transparent",
        backgroundColor: scrolled ? "rgba(var(--color-background-rgb), 0.88)" : "transparent",
        backdropFilter: scrolled ? `blur(${blurAmount}px)` : "none",
        WebkitBackdropFilter: scrolled ? `blur(${blurAmount}px)` : "none",
        transition: "border-color 0.3s ease, background-color 0.3s ease",
      }}
    >
      <style>{`
        .nav-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          padding-bottom: 2px;
        }
        .nav-link::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 1.5px;
          background-color: var(--color-accent-blue);
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.22s ease;
          border-radius: 1px;
        }
        .nav-link:hover::after {
          transform: scaleX(1);
        }
        .connect-glow {
          transition: filter 0.2s ease;
        }
        .connect-glow:hover {
          filter: drop-shadow(0 0 10px color-mix(in srgb, var(--color-accent-blue) 35%, transparent));
        }
      `}</style>

      <nav
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <motion.a
          href="/"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{ textDecoration: "none", display: "flex", alignItems: "center" }}
        >
          <Logo size={26} />
        </motion.a>

        {/* Desktop nav */}
        <div style={{ alignItems: "center", gap: "2rem" }} className="hidden md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="nav-link"
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              {link.label}
            </a>
          ))}

          {isConnected && (
            <a
              href="/status"
              className="nav-link"
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              My Projects
            </a>
          )}

          <ThemeToggle />
          <NotificationBell />

          <div className="connect-glow">
            <ConnectButton />
          </div>
        </div>

        {/* Hamburger — sits above the slide panel via zIndex */}
        <button
          className="flex md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-text-primary)",
            cursor: "pointer",
            padding: "0.25rem",
            position: "relative",
            zIndex: 60,
          }}
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            {menuOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ display: "flex" }}
              >
                <X size={22} />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ display: "flex" }}
              >
                <Menu size={22} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </nav>

      {/* Mobile menu — slides in from right */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Scrim */}
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 40,
                backgroundColor: "rgba(var(--color-background-rgb), 0.6)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
              className="md:hidden"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: "min(300px, 82vw)",
                zIndex: 50,
                backgroundColor: "rgba(var(--color-surface-rgb), 0.97)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderLeft: "1px solid var(--color-border-subtle)",
                padding: "5rem 1.75rem 2rem",
                display: "flex",
                flexDirection: "column",
              }}
              className="md:hidden"
            >
              <motion.div
                variants={menuContainerVariants}
                initial="hidden"
                animate="visible"
                style={{ display: "flex", flexDirection: "column" }}
              >
                {navLinks.map((link) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    variants={menuItemVariants}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "1.0625rem",
                      fontWeight: 500,
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                      padding: "0.875rem 0",
                      borderBottom: "1px solid var(--color-border-subtle)",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                  >
                    {link.label}
                  </motion.a>
                ))}

                {isConnected && (
                  <motion.a
                    href="/status"
                    variants={menuItemVariants}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                      fontSize: "1.0625rem",
                      fontWeight: 500,
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                      padding: "0.875rem 0",
                      borderBottom: "1px solid var(--color-border-subtle)",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                  >
                    My Projects
                  </motion.a>
                )}

                <motion.div variants={menuItemVariants} style={{ marginTop: "1.75rem" }}>
                  <ConnectButton
                    showBalance={{ smallScreen: false, largeScreen: false }}
                    chainStatus="icon"
                    accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Browse", href: "#projects" },
  { label: "Submit Project", href: "#submit" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all 0.3s ease",
        borderBottom: scrolled ? "1px solid rgba(26,29,46,0.8)" : "1px solid transparent",
        backgroundColor: scrolled ? "rgba(8,11,20,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
      }}
    >
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
        <a
          href="/"
          style={{
            fontFamily: "'Clash Display', var(--font-inter), system-ui, sans-serif",
            fontSize: "1.375rem",
            fontWeight: 600,
            color: "#F8F9FA",
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ color: "#E8FF47" }}>G</span>enatio
        </a>

        {/* Desktop links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
          }}
          className="hidden md:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "#8B949E",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#F8F9FA")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "#8B949E")
              }
            >
              {link.label}
            </a>
          ))}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#E8FF47",
              background: "transparent",
              border: "1px solid #E8FF47",
              borderRadius: "6px",
              padding: "0.5rem 1.125rem",
              cursor: "pointer",
              transition: "background 0.2s ease, color 0.2s ease",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E8FF47";
              e.currentTarget.style.color = "#080B14";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#E8FF47";
            }}
          >
            Connect Wallet
          </motion.button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "transparent",
            border: "none",
            color: "#F8F9FA",
            cursor: "pointer",
            padding: "0.25rem",
          }}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              backgroundColor: "rgba(8,11,20,0.97)",
              backdropFilter: "blur(16px)",
              borderTop: "1px solid #1A1D2E",
              overflow: "hidden",
            }}
            className="md:hidden"
          >
            <div
              style={{
                padding: "1rem 1.5rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "#8B949E",
                    textDecoration: "none",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid #1A1D2E",
                  }}
                >
                  {link.label}
                </a>
              ))}
              <button
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  color: "#E8FF47",
                  background: "transparent",
                  border: "1px solid #E8FF47",
                  borderRadius: "6px",
                  padding: "0.625rem 1.25rem",
                  cursor: "pointer",
                  marginTop: "0.25rem",
                  width: "fit-content",
                }}
              >
                Connect Wallet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

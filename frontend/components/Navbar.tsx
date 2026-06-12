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
        borderBottom: scrolled ? "1px solid rgba(30,45,69,0.8)" : "1px solid transparent",
        backgroundColor: scrolled ? "rgba(6,11,24,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
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
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize: "1.375rem",
            fontWeight: 700,
            color: "#F0F4FF",
            textDecoration: "none",
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
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: "#2D9CDB",
              display: "inline-block",
              marginLeft: "2px",
              marginBottom: "2px",
              flexShrink: 0,
            }}
          />
        </a>

        {/* Desktop links */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "2rem" }}
          className="hidden md:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "#8899AA",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F4FF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8899AA")}
            >
              {link.label}
            </a>
          ))}

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#F0F4FF",
              backgroundColor: "#2D9CDB",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 1.125rem",
              cursor: "pointer",
              letterSpacing: "-0.01em",
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
            color: "#F0F4FF",
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
              backgroundColor: "rgba(6,11,24,0.97)",
              backdropFilter: "blur(20px)",
              borderTop: "1px solid #1E2D45",
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
                    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "#8899AA",
                    textDecoration: "none",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid #1E2D45",
                  }}
                >
                  {link.label}
                </a>
              ))}
              <button
                style={{
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#F0F4FF",
                  backgroundColor: "#2D9CDB",
                  border: "none",
                  borderRadius: "8px",
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

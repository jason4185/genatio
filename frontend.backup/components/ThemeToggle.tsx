"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const options = [
    { label: "Light", value: "light", Icon: Sun },
    { label: "Dark", value: "dark", Icon: Moon },
    { label: "System", value: "system", Icon: Monitor },
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle theme"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          border: "1px solid var(--color-border-subtle)",
          backgroundColor: "transparent",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
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
        {theme === "light" ? (
          <Sun size={16} />
        ) : theme === "dark" ? (
          <Moon size={16} />
        ) : (
          <Monitor size={16} />
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              zIndex: 50,
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "10px",
              padding: "0.375rem",
              minWidth: "130px",
              boxShadow: "0 8px 32px rgba(var(--color-background-rgb), 0.4)",
            }}
          >
            {options.map(({ label, value, Icon }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: theme === value ? "color-mix(in srgb, var(--color-accent-blue) 12%, transparent)" : "transparent",
                  color: theme === value ? "var(--color-accent-blue)" : "var(--color-text-secondary)",
                  fontFamily: "var(--font-jakarta), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: theme === value ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (theme !== value) {
                    e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--color-accent-blue) 6%, transparent)";
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme !== value) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

export function Logo({
  size = 26,
  showWordmark = true,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  const dotSize = Math.max(4, Math.round(size * 0.18));
  const fontSize = `${Math.round(size * 0.846)}px`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {/* Shield icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Shield fill */}
        <path
          d="M16 2L29 8V17C29 23.5 23.5 28.5 16 30.5C8.5 28.5 3 23.5 3 17V8L16 2Z"
          style={{
            fill: "color-mix(in srgb, var(--color-accent-blue) 14%, transparent)",
          }}
        />
        {/* Shield border */}
        <path
          d="M16 2L29 8V17C29 23.5 23.5 28.5 16 30.5C8.5 28.5 3 23.5 3 17V8L16 2Z"
          style={{ stroke: "var(--color-accent-blue)" }}
          strokeWidth="1.75"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Verification checkmark */}
        <path
          d="M10 16L13.5 19.5L22 12"
          style={{ stroke: "var(--color-accent-blue)" }}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            fontSize,
            fontWeight: 700,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.03em",
            display: "flex",
            alignItems: "baseline",
            gap: "1px",
            lineHeight: 1,
          }}
        >
          <span style={{ color: "var(--color-accent-blue)" }}>G</span>
          <span>enatio</span>
          <span
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              borderRadius: "50%",
              backgroundColor: "var(--color-accent-blue)",
              display: "inline-block",
              marginLeft: "2px",
              marginBottom: "2px",
              flexShrink: 0,
            }}
          />
        </span>
      )}
    </div>
  );
}

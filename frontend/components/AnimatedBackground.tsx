"use client";

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        backgroundColor: "#080B14",
      }}
    >
      {/* Orb 1 — top-left purple */}
      <div
        style={{
          position: "absolute",
          width: "70vw",
          height: "70vw",
          borderRadius: "50%",
          top: "-20%",
          left: "-20%",
          background:
            "radial-gradient(circle, rgba(26,5,51,0.85) 0%, rgba(10,15,46,0.4) 50%, transparent 70%)",
          animation: "mesh-shift-1 18s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Orb 2 — bottom-right deep blue */}
      <div
        style={{
          position: "absolute",
          width: "65vw",
          height: "65vw",
          borderRadius: "50%",
          bottom: "-25%",
          right: "-15%",
          background:
            "radial-gradient(circle, rgba(10,15,46,0.9) 0%, rgba(26,5,51,0.35) 50%, transparent 70%)",
          animation: "mesh-shift-2 22s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Orb 3 — center accent */}
      <div
        style={{
          position: "absolute",
          width: "55vw",
          height: "55vw",
          borderRadius: "50%",
          top: "30%",
          left: "25%",
          background:
            "radial-gradient(circle, rgba(15,8,42,0.6) 0%, rgba(8,11,20,0.2) 60%, transparent 75%)",
          animation: "mesh-shift-3 26s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      {/* Subtle noise overlay for texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}

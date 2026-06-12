"use client";

import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      const t = Date.now() / 1000;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#060B18";
      ctx.fillRect(0, 0, w, h);

      // Orb 1: #1a3a5c — drifts top-left → bottom-right over 20s
      const o1x = (0.1 + 0.55 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 20))) * w;
      const o1y = (0.1 + 0.55 * (0.5 + 0.5 * Math.cos((2 * Math.PI * t) / 20))) * h;
      const g1 = ctx.createRadialGradient(o1x, o1y, 0, o1x, o1y, 0.55 * Math.min(w, h));
      g1.addColorStop(0, "rgba(26,58,92,0.15)");
      g1.addColorStop(1, "rgba(26,58,92,0)");
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.arc(o1x, o1y, 0.55 * Math.min(w, h), 0, Math.PI * 2);
      ctx.fill();

      // Orb 2: #0a1f3d — drifts top-right → bottom-left over 25s
      const o2x = (0.9 - 0.6 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 25))) * w;
      const o2y = (0.1 + 0.6 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 25 + 1.2))) * h;
      const g2 = ctx.createRadialGradient(o2x, o2y, 0, o2x, o2y, 0.5 * Math.min(w, h));
      g2.addColorStop(0, "rgba(10,31,61,0.20)");
      g2.addColorStop(1, "rgba(10,31,61,0)");
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(o2x, o2y, 0.5 * Math.min(w, h), 0, Math.PI * 2);
      ctx.fill();

      // Orb 3: #162440 — pulses gently in center over 15s
      const pulseR = 0.4 * (1 + 0.1 * Math.sin((2 * Math.PI * t) / 15));
      const g3 = ctx.createRadialGradient(0.5 * w, 0.55 * h, 0, 0.5 * w, 0.55 * h, pulseR * Math.min(w, h));
      g3.addColorStop(0, "rgba(22,36,64,0.12)");
      g3.addColorStop(1, "rgba(22,36,64,0)");
      ctx.fillStyle = g3;
      ctx.beginPath();
      ctx.arc(0.5 * w, 0.55 * h, pulseR * Math.min(w, h), 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}

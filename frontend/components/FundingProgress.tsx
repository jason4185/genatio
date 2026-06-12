"use client";

import { useEffect, useRef, useState } from "react";

interface FundingProgressProps {
  raised: number;
  goal: number;
}

export default function FundingProgress({ raised, goal }: FundingProgressProps) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const targetPct = Math.min(100, Math.round((raised / goal) * 100));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWidth(targetPct);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetPct]);

  return (
    <div ref={ref}>
      <div
        style={{
          width: "100%",
          height: "3px",
          backgroundColor: "#1E2D45",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: "linear-gradient(90deg, #2D9CDB, #00C6FF)",
            borderRadius: "2px",
            transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 8px rgba(45,156,219,0.6)",
          }}
        />
      </div>
    </div>
  );
}

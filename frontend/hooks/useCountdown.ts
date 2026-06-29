"use client";

import { useEffect, useMemo, useState } from "react";

function computeRemaining(createdAt?: string | number, durationDays?: string | number) {
  if (!createdAt || !durationDays) {
    return { ended: false, daysLeft: 0, hoursLeft: 0, label: "0 days left" };
  }

  const created = new Date(createdAt).getTime();
  const duration = Number(durationDays);
  if (!Number.isFinite(created) || !Number.isFinite(duration)) {
    return { ended: false, daysLeft: 0, hoursLeft: 0, label: "0 days left" };
  }

  const endTime = created + duration * 24 * 60 * 60 * 1000;
  const diff = endTime - Date.now();
  if (diff <= 0) {
    return { ended: true, daysLeft: 0, hoursLeft: 0, label: "Campaign ended" };
  }

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.max(1, totalHours);

  if (daysLeft >= 1) {
    return {
      ended: false,
      daysLeft,
      hoursLeft,
      label: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`,
    };
  }

  return {
    ended: false,
    daysLeft: 0,
    hoursLeft,
    label: `${hoursLeft} hour${hoursLeft === 1 ? "" : "s"} left`,
  };
}

export function useCountdown(createdAt?: string | number, durationDays?: string | number) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    void now;
    return computeRemaining(createdAt, durationDays);
  }, [createdAt, durationDays, now]);
}

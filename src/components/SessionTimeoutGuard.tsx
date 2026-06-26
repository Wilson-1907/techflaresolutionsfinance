"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SESSION_IDLE_SEC } from "@/lib/session-policy";

const IDLE_MS = SESSION_IDLE_SEC * 1000;
const POLL_MS = 30_000;

export function SessionTimeoutGuard() {
  const router = useRouter();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(
    async (reason: "idle" | "expired") => {
      await fetch("/api/logout", { method: "POST" }).catch(() => {});
      router.push(`/login?reason=${reason}`);
      router.refresh();
    },
    [router]
  );

  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => logout("idle"), IDLE_MS);
  }, [logout]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;
    const onActivity = () => resetIdle();
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    resetIdle();

    const poll = setInterval(async () => {
      const res = await fetch("/api/session", { cache: "no-store" });
      if (!res.ok) logout("expired");
    }, POLL_MS);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      clearInterval(poll);
    };
  }, [resetIdle, logout]);

  return null;
}

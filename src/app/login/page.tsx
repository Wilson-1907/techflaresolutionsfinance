"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, Landmark } from "lucide-react";
import Image from "next/image";
import { PasswordInput } from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionNotice, setSessionNotice] = useState("");

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason === "idle") {
      setSessionNotice("Signed out after 10 minutes of inactivity. Sign in again.");
    } else if (reason === "expired") {
      setSessionNotice("Session ended (30 minute limit or inactivity). Sign in again.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = challengeId
      ? { challengeId, code: otp.trim() }
      : { password };

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError((data.error as string) || "Invalid password");
      return;
    }

    if (data.requiresOtp) {
      setChallengeId(data.challengeId);
      setEmailHint(data.emailHint || "treasury email");
      setOtp("");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-deep-blue to-black">
      <header className="border-b border-gold/20 bg-black/40 px-4 py-2 flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="TechFlare Finance"
          width={96}
          height={32}
          unoptimized
          className="h-8 w-auto object-contain bg-transparent"
        />
        <span className="text-sm font-semibold text-gold">Finance</span>
      </header>
      <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gold/20 bg-deep-blue/60 p-8 backdrop-blur-xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Treasury sign in</h1>
          <p className="text-sm text-muted">Password + email verification</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!challengeId ? (
            <div>
              <label className="block text-sm font-medium mb-1.5">Treasury password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gold/20 bg-black/40 pl-10 pr-11 py-3 outline-none focus:border-gold/50"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Enter the 6-digit code sent to <strong className="text-gold">{emailHint}</strong>
              </p>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                required
                className="w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-center text-lg tracking-[0.4em] font-mono"
              />
              <button
                type="button"
                className="text-xs text-gold mt-2 hover:underline"
                onClick={() => {
                  setChallengeId(null);
                  setOtp("");
                }}
              >
                ← Use a different password
              </button>
            </div>
          )}
          {sessionNotice && <p className="text-sm text-amber-300">{sessionNotice}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gold py-3 font-medium text-black hover:bg-gold/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Landmark className="h-4 w-4" />
            {loading ? "Please wait..." : challengeId ? "Verify & enter" : "Continue"}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}

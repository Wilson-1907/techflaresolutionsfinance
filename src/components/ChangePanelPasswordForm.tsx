"use client";

import { useState } from "react";

const rules = [
  { id: "len", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { id: "lower", label: "Lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { id: "upper", label: "Uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { id: "num", label: "Number", test: (v: string) => /[0-9]/.test(v) },
  { id: "sym", label: "Symbol (!@#$%…)", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export function ChangePanelPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Password change failed.");
        return;
      }
      setSuccess("Password updated successfully. Use your new password next time you sign in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const passed = rules.filter((r) => r.test(newPassword)).length;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Current password</label>
        <input
          required
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-xl border border-gold/20 bg-deep-blue/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">New password</label>
        <input
          required
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-xl border border-gold/20 bg-deep-blue/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold"
        />
        {newPassword.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-1">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`h-1 flex-1 rounded-full ${rule.test(newPassword) ? "bg-life-green" : "bg-white/10"}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted">
              {passed}/{rules.length} requirements met
            </p>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Confirm new password</label>
        <input
          required
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`w-full rounded-xl border bg-deep-blue/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold ${
            mismatch ? "border-red-500/50" : "border-gold/20"
          }`}
        />
        {mismatch && <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-life-green">{success}</p>}
      <button
        type="submit"
        disabled={loading || mismatch}
        className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-deep-blue disabled:opacity-50"
      >
        {loading ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}

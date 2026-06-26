"use client";

export default function FinanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-deep-blue to-black">
      <div className="w-full max-w-md rounded-2xl border border-gold/20 bg-deep-blue/60 p-8 text-center">
        <h1 className="text-xl font-bold mb-2">Finance panel error</h1>
        <p className="text-sm text-muted mb-4">
          {error.message || "Something went wrong loading this page."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black"
          >
            Reload
          </button>
          <a href="/login" className="rounded-xl border border-gold/30 px-4 py-2 text-sm">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}

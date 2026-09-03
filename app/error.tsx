"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error Boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6 text-center space-y-4">
      <h2 className="text-2xl font-serif text-neutral-800">Something went wrong</h2>
      <p className="text-neutral-500 text-sm max-w-md">{error?.message || "An unexpected error occurred."}</p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-primary text-white rounded-lg font-medium shadow hover:bg-orange-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6 text-center space-y-4 font-sans">
        <h2 className="text-2xl font-serif text-neutral-800">Application Error</h2>
        <p className="text-neutral-500 text-sm max-w-md">{error?.message || "An unexpected error occurred."}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium shadow hover:bg-orange-700 transition-colors"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}

"use client";

import Button from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">😅</div>
      <h2 className="font-display text-heading-lg text-warm-800 mb-2">
        Something went wrong!
      </h2>
      <p className="text-body-md text-neutral-600 mb-8 max-w-sm">
        Don&apos;t worry — your outfits are safe. Let&apos;s try that again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

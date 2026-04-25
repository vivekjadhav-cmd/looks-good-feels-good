import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">🧦</div>
      <h2 className="font-display text-heading-lg text-warm-800 mb-2">
        Oops, lost in the closet!
      </h2>
      <p className="text-body-md text-neutral-600 mb-8 max-w-sm">
        We couldn&apos;t find that page. Maybe it wandered off to find a
        matching pair.
      </p>
      <Link href="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  );
}

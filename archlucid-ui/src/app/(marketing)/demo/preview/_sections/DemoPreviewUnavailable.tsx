import Link from "next/link";

import { MARKETING_PRIMARY_CTA_CLASS } from "@/lib/design-tokens";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";

/**
 * Customer-safe fallback when the demo preview route cannot load (no API routing, network error, or HTTP error).
 * Avoids env var names, internal URLs, and localhost hints — operators see diagnostics in server logs instead.
 */
export function DemoPreviewFriendlyUnavailable() {
  return (
    <div
      data-testid="demo-preview-friendly-unavailable"
      role="status"
      className="rounded border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
    >
      <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
        This preview is not available right now.
      </p>
      <p className="mt-2 m-0 text-neutral-600 dark:text-neutral-400">
        You can still explore a completed sample output without signing in, or start from the product home.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={CANONICAL_ANONYMOUS_PROOF_HREF}
          className={MARKETING_PRIMARY_CTA_CLASS}
        >
          View sample output
        </Link>
        <Link
          href="/get-started"
          className="inline-flex rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 no-underline hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}

export function DemoPreviewNotAvailable() {
  return (
    <div
      data-testid="demo-preview-not-available"
      role="status"
      className="rounded border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
    >
      <p className="font-medium text-neutral-900 dark:text-neutral-100">This live preview is not available on this site right now.</p>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        You can still open a completed sample output without signing in, or continue from the product home.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={CANONICAL_ANONYMOUS_PROOF_HREF}
          className={MARKETING_PRIMARY_CTA_CLASS}
        >
          View sample output
        </Link>
        <Link
          href="/see-it"
          className="inline-flex rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 no-underline hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          See it in 30 seconds
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/**
 * Short-lived navigation state only — structured page chrome (not a generic skeleton) so screenshots and
 * slow connections never look like an anonymous loading shell. Uses {@code div}, not {@code main}, so we never
 * expose two top-level {@code main} landmarks while the route segment is swapping.
 *
 * Mirrors the manifest detail {@code <h1>} wording so accessibility + E2E headings stay stable during RSC swaps.
 */
export default function ManifestDetailLoading() {
  const buyerPolishedLayout = isBuyerPolishedOperatorShellEnv();

  return (
    <div
      className="mx-auto max-w-4xl space-y-4 px-1 py-6 sm:px-0"
      data-testid="manifest-detail-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
        <Link className="text-teal-800 underline dark:text-teal-300" href="/">
          Home
        </Link>
        {" · "}
        <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
          Reviews
        </Link>
      </nav>
      <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {buyerPolishedLayout ? "Architecture review package" : "Finalized Architecture Manifest"}
      </h1>
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">Loading manifest record…</p>
    </div>
  );
}

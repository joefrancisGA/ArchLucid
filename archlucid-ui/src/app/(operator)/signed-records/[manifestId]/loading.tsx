import { cn } from "@/lib/utils";
import Link from "next/link";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
      className="w-full max-w-[1200px] space-y-4 px-1 py-6 sm:px-0"
      data-testid="manifest-detail-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <nav aria-label="Breadcrumb" className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.nav} href="/architecture/reviews?projectId=default">
          Reviews
        </Link>
      </nav>
      <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>
        {buyerPolishedLayout ? "Architecture review" : "Finalized architecture review"}
      </h1>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading review record…</p>
    </div>
  );
}

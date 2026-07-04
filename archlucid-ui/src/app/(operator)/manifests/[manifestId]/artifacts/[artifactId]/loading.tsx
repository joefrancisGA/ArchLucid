import { cn } from "@/lib/utils";
import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Short-lived navigation shell while artifact metadata and preview load. */
export default function ManifestArtifactReviewLoading() {
  return (
    <div
      className="w-full max-w-[1200px] space-y-4 p-4"
      data-testid="artifact-review-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <nav aria-label="Breadcrumb" className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.nav} href="/reviews?projectId=default">
          Reviews
        </Link>
      </nav>
      <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Artifact review</h1>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading artifact review…</p>
    </div>
  );
}
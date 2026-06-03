import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { getShowcaseManifestHref, getShowcaseWalkthroughHref } from "@/lib/buyer-safe-review-navigation";
import { cn } from "@/lib/utils";

/** Right-rail sample package shortcuts — one card, no embedded mini-checklist. */
export function SamplePackageShortcutsCard(): React.JSX.Element {
  const sampleReviewHref = getShowcaseWalkthroughHref();
  const manifestHref = getShowcaseManifestHref();

  return (
    <section
      aria-labelledby="sample-package-shortcuts-heading"
      data-testid="sample-package-shortcuts-card"
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <h2 id="sample-package-shortcuts-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle)}>
        Sample package
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
        Use a completed sample to understand the output structure before creating your own review.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Button asChild variant="primary" className="w-full justify-center">
          <Link href={sampleReviewHref}>Open sample</Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-center">
          <Link href={manifestHref}>View manifest</Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-center">
          <Link href={`${sampleReviewHref}#audit-trail`}>View evidence trail</Link>
        </Button>
      </div>
    </section>
  );
}

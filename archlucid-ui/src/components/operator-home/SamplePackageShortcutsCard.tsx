import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  BUYER_HOME_EXAMPLE_EXPLORE_LINK,
  BUYER_HOME_EXAMPLE_PACKAGE_HEADING,
  BUYER_HOME_EXAMPLE_PACKAGE_LEAD,
  BUYER_HOME_EXAMPLE_PACKAGE_SHORTCUTS_ARIA,
} from "@/lib/buyer/buyer-polish-copy";
import {
  getCanonicalReviewWorkspaceHref,
  getShowcaseManifestHref,
  getShowcaseWalkthroughHref,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { CTA_WIDTH, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

/** Right-rail example package shortcuts — secondary links (primary CTA lives on the hero card). */
export function SamplePackageShortcutsCard(): React.JSX.Element {
  const sampleReviewHref = getShowcaseWalkthroughHref();
  const manifestHref = getShowcaseManifestHref();
  const findingsHref = getCanonicalReviewWorkspaceHref(SHOWCASE_STATIC_DEMO_RUN_ID);

  return (
    <section
      aria-label={BUYER_HOME_EXAMPLE_PACKAGE_SHORTCUTS_ARIA}
      data-testid="sample-package-shortcuts-card"
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <h2 id="sample-package-shortcuts-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle)}>
        {BUYER_HOME_EXAMPLE_PACKAGE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
        {BUYER_HOME_EXAMPLE_PACKAGE_LEAD}
      </p>
      <div className="mt-3 flex flex-col items-start gap-2">
        <Button asChild variant="outline" className={CTA_WIDTH.content}>
          <Link href={sampleReviewHref}>{BUYER_HOME_EXAMPLE_EXPLORE_LINK}</Link>
        </Button>
        <Button asChild variant="outline" className={CTA_WIDTH.content}>
          <Link href={manifestHref}>View sealed record</Link>
        </Button>
        <Button asChild variant="outline" className={CTA_WIDTH.content}>
          <Link href={findingsHref}>View findings</Link>
        </Button>
      </div>
    </section>
  );
}

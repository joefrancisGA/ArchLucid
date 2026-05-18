import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { BUYER_COMPARE_SECONDARY_PAGE_LEAD } from "@/lib/buyer-polish-copy";

export type CompareBuyerScopedGateProps = {
  readonly onLoadSampleComparison: () => void;
};

/** Buyer-polished compare: steer to review package first; optional one-tap demo pair. */
export function CompareBuyerScopedGate(props: CompareBuyerScopedGateProps) {
  const { onLoadSampleComparison } = props;

  return (
    <section
      className="mb-4 max-w-3xl rounded-lg border border-teal-200/80 bg-teal-50/55 p-4 dark:border-teal-900/50 dark:bg-teal-950/30"
      data-testid="compare-buyer-scoped-gate"
      aria-labelledby="compare-buyer-scoped-gate-heading"
    >
      <h2 id="compare-buyer-scoped-gate-heading" className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Comparison is optional on the golden path
      </h2>
      <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{BUYER_COMPARE_SECONDARY_PAGE_LEAD}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" asChild>
          <Link href={getShowcaseManifestHref()}>Back to review package</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onLoadSampleComparison}>
          Load sample Claims Intake comparison
        </Button>
      </div>
    </section>
  );
}

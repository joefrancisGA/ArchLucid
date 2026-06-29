import { cn } from "@/lib/utils";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { cn } from "@/lib/utils";
import { BUYER_COMPARE_SECONDARY_PAGE_LEAD } from "@/lib/buyer-polish-copy";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CompareBuyerScopedGateProps = {
  readonly onLoadSampleComparison: () => void;
};

/** Buyer-polished compare: steer to review package first; optional one-tap demo pair. */
export function CompareBuyerScopedGate(props: CompareBuyerScopedGateProps) {
  const { onLoadSampleComparison } = props;

  return (
    <section
      className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 mb-4 max-w-3xl p-4"
      data-testid="compare-buyer-scoped-gate"
      aria-labelledby="compare-buyer-scoped-gate-heading"
    >
      <h2 id="compare-buyer-scoped-gate-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Comparison is optional on the golden path
      </h2>
      <p className={cn("m-0 mt-2 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{BUYER_COMPARE_SECONDARY_PAGE_LEAD}</p>
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

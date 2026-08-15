import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_DEMO_REVIEW_POLICY_PACK_DISPLAY_NAME } from "@/lib/operator/operator-demo-review";

export type DemoReviewPolicyCalloutProps = {
  readonly policyPackName?: string | null;
};

/** Compact banner on operator demo review detail — surfaces the governing policy pack. */
export function DemoReviewPolicyCallout(props: DemoReviewPolicyCalloutProps): React.JSX.Element {
  const policyPackName =
    props.policyPackName !== null &&
    props.policyPackName !== undefined &&
    props.policyPackName.trim().length > 0
      ? props.policyPackName.trim()
      : OPERATOR_DEMO_REVIEW_POLICY_PACK_DISPLAY_NAME;

  return (
    <aside
      data-testid="demo-review-policy-callout"
      className="rounded-lg border border-teal-200 bg-teal-50/90 px-4 py-3 dark:border-teal-900 dark:bg-teal-950/40"
      aria-label="Policy pack evaluation context"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className={cn("m-0 font-semibold uppercase tracking-wide text-teal-900 dark:text-teal-200", OPERATOR_TYPOGRAPHY.helper)}>
            Policy-aware demo review
          </p>
          <p className={cn("m-0 leading-relaxed text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            Evaluated against{" "}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{policyPackName}</span>
            . Findings below map to curated pack rules — not generic model advice.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag kind="ready" label={`Pack: ${policyPackName}`} />
          <Link
            href={GOVERNANCE_POLICY_PACKS_PATH}
            className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            View policy packs
          </Link>
        </div>
      </div>
    </aside>
  );
}

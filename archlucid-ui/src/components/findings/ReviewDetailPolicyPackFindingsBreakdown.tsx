import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PolicyPackFindingGroup } from "@/lib/group-findings-by-policy-pack";
import { cn } from "@/lib/utils";

export type ReviewDetailPolicyPackFindingsBreakdownProps = {
  readonly groups: readonly PolicyPackFindingGroup[];
  readonly className?: string;
};

/** Review-detail strip: how many findings each enabled policy pack contributed. */
export function ReviewDetailPolicyPackFindingsBreakdown(
  props: ReviewDetailPolicyPackFindingsBreakdownProps,
): ReactElement | null {
  const { groups, className } = props;

  if (groups.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
        className,
      )}
      aria-label="Findings by policy pack"
      data-testid="review-detail-policy-pack-breakdown"
    >
      <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.badge)}>
        Findings by policy pack
      </p>
      <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
        Counts reflect compliance rule keys mapped to bundled or assigned policy packs — not generic AI commentary.
      </p>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
        {groups.map((group) => (
          <li key={group.groupKey}>
            <StatusTag
              kind="in-progress"
              label={`${group.findingCount} from ${group.packDisplayName}`}
              data-testid={`policy-pack-breakdown-${group.groupKey}`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

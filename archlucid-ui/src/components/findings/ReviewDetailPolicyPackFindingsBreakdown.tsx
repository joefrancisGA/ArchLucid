import { cn } from "@/lib/utils";
import Link from "next/link";

import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PolicyPackFindingGroup } from "@/lib/group-findings-by-policy-pack";
import { resolveReviewDetailPolicyPackHref } from "@/lib/group-findings-by-policy-pack";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { policyPacksEditHref } from "@/lib/policy/policy-packs-deep-link";

export type ReviewDetailPolicyPackFindingsBreakdownProps = {
  readonly groups: readonly PolicyPackFindingGroup[];
  readonly manifestRuleSetId?: string | null;
  readonly mappedFindingCount?: number | null;
  readonly unmappedFindingCount?: number | null;
  readonly className?: string;
};

function ImpactCountLine(props: {
  readonly mappedFindingCount: number | null | undefined;
  readonly unmappedFindingCount: number | null | undefined;
}): ReactElement | null {
  const mapped = props.mappedFindingCount;
  const unmapped = props.unmappedFindingCount;

  if (mapped === null || mapped === undefined || !Number.isFinite(mapped)) {
    return null;
  }

  const mappedCount = Math.max(0, Math.trunc(mapped));
  const unmappedCount =
    unmapped !== null && unmapped !== undefined && Number.isFinite(unmapped)
      ? Math.max(0, Math.trunc(unmapped))
      : 0;

  return (
    <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} data-testid="policy-pack-impact-counts">
      {mappedCount} finding{mappedCount === 1 ? "" : "s"} cite curated policy rules
      {unmappedCount > 0
        ? `; ${unmappedCount} remain unmapped to a pack rule and should be reviewed separately.`
        : "."}
    </p>
  );
}

/** Review-detail strip: how many findings each enabled policy pack contributed. */
export function ReviewDetailPolicyPackFindingsBreakdown(
  props: ReviewDetailPolicyPackFindingsBreakdownProps,
): ReactElement | null {
  const { groups, className, manifestRuleSetId, mappedFindingCount, unmappedFindingCount } = props;

  if (groups.length === 0) {
    return null;
  }

  const manifestPackHref = resolveReviewDetailPolicyPackHref(manifestRuleSetId);
  const simulateHref =
    manifestRuleSetId?.trim().length ? policyPacksEditHref(manifestRuleSetId.trim()) : GOVERNANCE_POLICY_PACKS_PATH;

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
        Policy pack impact on this review
      </p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Counts reflect compliance rule keys mapped to bundled or assigned policy packs — not generic AI commentary.
      </p>
      <ImpactCountLine mappedFindingCount={mappedFindingCount} unmappedFindingCount={unmappedFindingCount} />
      <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
        {groups.map((group) => (
          <li
            key={group.groupKey}
            className="flex flex-wrap items-center gap-2"
            data-testid={`policy-pack-breakdown-${group.groupKey}`}
          >
            <StatusTag kind="in-progress" label={`${group.findingCount} from ${group.packDisplayName}`} />
            {group.packHref !== null ? (
              <Link
                href={group.packHref}
                className={OPERATOR_LINK.optional}
                data-testid={`policy-pack-breakdown-link-${group.groupKey}`}
              >
                View policy basis
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
        {manifestPackHref !== null ? (
          <Link
            href={manifestPackHref}
            className={OPERATOR_LINK.optional}
            data-testid="policy-pack-impact-governing-pack-link"
          >
            Open governing policy pack
          </Link>
        ) : null}
        {manifestPackHref !== null ? <span className="text-neutral-500"> · </span> : null}
        <Link
          href={simulateHref}
          className={OPERATOR_LINK.optional}
          data-testid="policy-pack-impact-simulate-link"
        >
          Simulate pack changes
        </Link>
      </p>
    </section>
  );
}

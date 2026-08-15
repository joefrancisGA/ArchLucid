import { cn } from "@/lib/utils";
import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { resolveReviewDetailPolicyPackHref } from "@/lib/group-findings-by-policy-pack";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { policyPacksAuthorHref, policyPacksEditHref } from "@/lib/policy/policy-packs-deep-link";
import { POLICY_PACK_CLOUD_MISMATCH_MESSAGE } from "@/lib/review-quality/review-intake-quality-gates";

export type ReviewDetailPolicyPackImpactCalloutProps = {
  readonly ruleSetId: string;
  readonly ruleSetVersion?: string | null;
  readonly runId: string;
  readonly mappedFindingCount?: number | null;
  readonly totalFindingCount?: number | null;
  /** TB-2322 — detail line when packs do not match stated cloud target. */
  readonly cloudMismatchDetail?: string | null;
  /** Secondary instances on the same route must not reuse the canonical Playwright test id. */
  readonly variant?: "canonical" | "secondary";
};

/**
 * Surfaces the governing policy pack on committed review detail so buyers can see policy-aware evaluation.
 */
export function ReviewDetailPolicyPackImpactCallout(
  props: ReviewDetailPolicyPackImpactCalloutProps,
): React.JSX.Element | null {
  const ruleSetId = props.ruleSetId.trim();
  const runId = props.runId.trim();

  if (ruleSetId.length === 0) {
    return null;
  }

  const packLabel = policyPackBuyerLabel(ruleSetId, props.ruleSetVersion ?? "");
  const packHref = resolveReviewDetailPolicyPackHref(ruleSetId);
  const simulateHref = policyPacksEditHref(ruleSetId);
  const authorHref = policyPacksAuthorHref(ruleSetId);
  const mappedCount =
    props.mappedFindingCount !== null &&
    props.mappedFindingCount !== undefined &&
    Number.isFinite(props.mappedFindingCount)
      ? Math.max(0, Math.trunc(props.mappedFindingCount))
      : null;
  const totalCount =
    props.totalFindingCount !== null &&
    props.totalFindingCount !== undefined &&
    Number.isFinite(props.totalFindingCount)
      ? Math.max(0, Math.trunc(props.totalFindingCount))
      : null;

  const calloutTestId =
    props.variant === "secondary"
      ? "review-detail-policy-pack-impact-callout-secondary"
      : "review-detail-policy-pack-impact-callout";

  return (
    <aside
      data-testid={calloutTestId}
      className="rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50"
      aria-label="Policy pack evaluation context"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.badge)}>
            Policy-aware review
          </p>
          <p className={cn("m-0 leading-relaxed text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            Evaluated against{" "}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{packLabel}</span>. Findings below
            should cite curated pack rules, evidence, and explainability traces — not generic model advice alone.
          </p>
          {props.cloudMismatchDetail !== null && props.cloudMismatchDetail !== undefined ? (
            <p
              className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="review-detail-policy-pack-cloud-mismatch"
            >
              {POLICY_PACK_CLOUD_MISMATCH_MESSAGE} {props.cloudMismatchDetail}
            </p>
          ) : null}
          {mappedCount !== null && totalCount !== null ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-detail-policy-pack-impact-counts">
              {mappedCount} of {totalCount} surfaced finding{totalCount === 1 ? "" : "s"} map to a policy rule on this
              review.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag kind="ready" label={`Pack: ${packLabel}`} />
          {packHref !== null ? (
            <Link
              href={packHref}
              className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.cardTitle)}
              data-testid="review-detail-policy-pack-impact-view-pack"
            >
              View policy basis
            </Link>
          ) : null}
          <Link
            href={authorHref}
            className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.cardTitle)}
            data-testid="review-detail-policy-pack-impact-edit-rules"
          >
            Edit pack rules
          </Link>
          <Link
            href={simulateHref}
            className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.cardTitle)}
            data-testid="review-detail-policy-pack-impact-simulate"
          >
            Simulate pack changes
          </Link>
          {runId.length > 0 ? (
            <Link
              href={auditTrailNavHref(runId)}
              className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.cardTitle)}
              data-testid="review-detail-policy-pack-impact-audit"
            >
              Audit trail
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

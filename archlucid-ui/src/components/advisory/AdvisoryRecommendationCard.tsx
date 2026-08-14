"use client";

import { cn } from "@/lib/utils";

import Link from "next/link";

import { GovernanceStatusTag } from "@/components/governance/GovernanceStatusTag";
import { Button } from "@/components/ui/button";
import {
  ADVISORY_SCANS_CARD_DISPOSITION_LABEL,
  ADVISORY_SCANS_CARD_EVIDENCE_LABEL,
  ADVISORY_SCANS_CARD_IMPACT_LABEL,
  ADVISORY_SCANS_CARD_OWNER_LABEL,
  ADVISORY_SCANS_CARD_RELATED_FINDING_LABEL,
  ADVISORY_SCANS_CARD_SUGGESTED_ACTION_LABEL,
  ADVISORY_SCANS_DISPOSITION_ACCEPT,
  ADVISORY_SCANS_DISPOSITION_ACCEPT_HINT,
  ADVISORY_SCANS_DISPOSITION_DEFER,
  ADVISORY_SCANS_DISPOSITION_DEFER_HINT,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED_HINT,
  ADVISORY_SCANS_DISPOSITION_REJECT,
  ADVISORY_SCANS_DISPOSITION_REJECT_HINT,
} from "@/lib/advisory-copy";
import { advisoryDispositionButtonVariant } from "@/lib/advisory-disposition-button-variant";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildRecommendationEvidenceLinkViews } from "@/lib/recommendation-source-evidence-links";
import type { RecommendationRecord } from "@/types/advisory";

type AdvisoryRecommendationCardProps = {
  readonly recommendation: RecommendationRecord;
  readonly onAction: (recommendationId: string, action: string) => void;
};

const DISPOSITION_ACTIONS: ReadonlyArray<{
  readonly action: string;
  readonly label: string;
  readonly hint: string;
}> = [
  { action: "Accept", label: ADVISORY_SCANS_DISPOSITION_ACCEPT, hint: ADVISORY_SCANS_DISPOSITION_ACCEPT_HINT },
  { action: "Defer", label: ADVISORY_SCANS_DISPOSITION_DEFER, hint: ADVISORY_SCANS_DISPOSITION_DEFER_HINT },
  { action: "Reject", label: ADVISORY_SCANS_DISPOSITION_REJECT, hint: ADVISORY_SCANS_DISPOSITION_REJECT_HINT },
  {
    action: "MarkImplemented",
    label: ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
    hint: ADVISORY_SCANS_DISPOSITION_IMPLEMENTED_HINT,
  },
];

function impactLabel(recommendation: RecommendationRecord): string {
  const impact = recommendation.expectedImpact.trim();
  const urgency = recommendation.urgency.trim();

  if (impact.length > 0) {
    return impact;
  }

  if (urgency.length > 0) {
    return urgency;
  }

  return "Not specified";
}

/** Single advisory recommendation with governance disposition actions. */
export function AdvisoryRecommendationCard(props: AdvisoryRecommendationCardProps): React.JSX.Element {
  const { recommendation, onAction } = props;
  const evidenceLinks =
    recommendation.sourceEvidenceLinks !== undefined && recommendation.sourceEvidenceLinks.length > 0
      ? buildRecommendationEvidenceLinkViews(recommendation.runId, null, recommendation.sourceEvidenceLinks)
      : [];

  return (
    <article
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "space-y-3")}
      data-testid={`advisory-recommendation-${recommendation.recommendationId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className={cn("m-0 font-medium text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
            {ADVISORY_SCANS_CARD_IMPACT_LABEL}: {impactLabel(recommendation)}
          </p>
          <h4 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {recommendation.title}
          </h4>
        </div>
        <div className="shrink-0 space-y-1 text-right">
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {ADVISORY_SCANS_CARD_DISPOSITION_LABEL}
          </p>
          <GovernanceStatusTag status={recommendation.status} />
        </div>
      </div>

      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {ADVISORY_SCANS_CARD_RELATED_FINDING_LABEL}:
        </span>{" "}
        {recommendation.category}
      </p>

      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{ADVISORY_SCANS_CARD_EVIDENCE_LABEL}:</span>{" "}
        {recommendation.rationale}
      </p>

      {evidenceLinks.length > 0 ? (
        <ul className={cn("m-0 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {evidenceLinks.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {ADVISORY_SCANS_CARD_SUGGESTED_ACTION_LABEL}:
        </span>{" "}
        {recommendation.suggestedAction}
      </p>

      {recommendation.reviewedByUserName ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">{ADVISORY_SCANS_CARD_OWNER_LABEL}:</span>{" "}
          {recommendation.reviewedByUserName}
        </p>
      ) : null}

      {recommendation.reviewComment ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">Review comment:</span>{" "}
          {recommendation.reviewComment}
        </p>
      ) : null}

      {recommendation.resolutionRationale ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">Resolution rationale:</span>{" "}
          {recommendation.resolutionRationale}
        </p>
      ) : null}

      <div
        className="flex flex-wrap gap-2 pt-1"
        data-testid="advisory-disposition-actions"
        role="group"
        aria-label={ADVISORY_SCANS_CARD_DISPOSITION_LABEL}
      >
        {DISPOSITION_ACTIONS.map((item) => (
          <Button
            key={item.action}
            type="button"
            size="sm"
            variant={advisoryDispositionButtonVariant(item.action)}
            title={item.hint}
            data-testid={`advisory-disposition-${item.action}`}
            onClick={() => {
              onAction(recommendation.recommendationId, item.action);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </article>
  );
}

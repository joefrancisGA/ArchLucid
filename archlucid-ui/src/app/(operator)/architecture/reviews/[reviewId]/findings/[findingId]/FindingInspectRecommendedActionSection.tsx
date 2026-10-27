import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const RISK_OWNER_NOT_STORED = "Risk owner was not stored";
const RISK_OWNER_STORED_EMPTY = "Risk owner was stored empty.";
const NEXT_REVIEW_NOT_STORED = "Remediation due date was not stored.";
const NEXT_REVIEW_STORED_EMPTY = "Remediation due date was stored empty.";

export type FindingInspectRecommendedActionSectionProps = {
  readonly tone: "detail" | "inspect";
  readonly structuredActions: string[];
  readonly recommendedActionParagraph: string;
  readonly showOwnerCadence?: boolean;
  readonly riskOwnerLabel?: string;
  readonly nextReviewLabel?: string;
  readonly recommendedActionsStoredEmpty?: boolean;
};

const toneSurfaces: Record<FindingInspectRecommendedActionSectionProps["tone"], string> = {
  detail:
    "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-4",
  inspect:
    "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-4",
};

/** Recommended remediation — teal framing on finding detail, violet on inspect (later in page flow). */
export function FindingInspectRecommendedActionSection({
  tone,
  structuredActions,
  recommendedActionParagraph,
  showOwnerCadence = false,
  riskOwnerLabel,
  nextReviewLabel,
  recommendedActionsStoredEmpty = false,
}: FindingInspectRecommendedActionSectionProps): ReactElement {
  const resolvedRiskOwner =
    riskOwnerLabel === undefined
      ? RISK_OWNER_NOT_STORED
      : riskOwnerLabel.length === 0
        ? RISK_OWNER_STORED_EMPTY
        : riskOwnerLabel.trim().length > 0
          ? riskOwnerLabel.trim()
          : RISK_OWNER_STORED_EMPTY;
  const resolvedNextReview =
    nextReviewLabel === undefined
      ? NEXT_REVIEW_NOT_STORED
      : nextReviewLabel.length === 0
        ? NEXT_REVIEW_STORED_EMPTY
        : nextReviewLabel.trim().length > 0
          ? nextReviewLabel.trim()
          : NEXT_REVIEW_STORED_EMPTY;
  const panelCls = toneSurfaces[tone];

  return (
    <section className={panelCls}>
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Recommended action</h2>
      {structuredActions.length > 1 ? (
        <ol className={cn("mb-0 mt-2 list-decimal space-y-1.5 pl-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {structuredActions.map((action, idx) => (
            <li key={idx}>{action}</li>
          ))}
        </ol>
      ) : (
        <p className={cn("m-0 mt-2 whitespace-pre-line text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {structuredActions.length === 1
            ? structuredActions[0]
            : recommendedActionsStoredEmpty
              ? "Recommended action was stored empty."
              : recommendedActionParagraph.trim().length > 0
                ? recommendedActionParagraph
                : "Recommended action was not stored."}
        </p>
      )}
      {showOwnerCadence ? (
        <dl className={cn("m-0 mt-3 grid gap-2 border-t border-neutral-200 pt-3 sm:grid-cols-3 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
              Risk owner
            </dt>
            <dd className="m-0 mt-0.5 text-al-text-primary">{resolvedRiskOwner}</dd>
          </div>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
              Monitoring cadence
            </dt>
            <dd className="m-0 mt-0.5 text-al-text-primary">
              Monitoring cadence was not stored.
            </dd>
          </div>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
              Next review
            </dt>
            <dd className="m-0 mt-0.5 text-al-text-primary">{resolvedNextReview}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}

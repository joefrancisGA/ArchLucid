import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import {
  BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE,
  BUYER_SHOWCASE_RESIDUAL_RISK_NEXT_REVIEW,
  BUYER_SHOWCASE_RESIDUAL_RISK_OWNER,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingInspectRecommendedActionSectionProps = {
  readonly tone: "detail" | "inspect";
  readonly structuredActions: string[];
  readonly recommendedActionParagraph: string;
  readonly showOwnerCadence?: boolean;
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
}: FindingInspectRecommendedActionSectionProps): ReactElement {
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
          {recommendedActionParagraph.trim()}
        </p>
      )}
      {showOwnerCadence ? (
        <dl className={cn("m-0 mt-3 grid gap-2 border-t border-teal-200/80 pt-3 sm:grid-cols-3 dark:border-teal-900/70", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
              Risk owner
            </dt>
            <dd className="m-0 mt-0.5 text-al-text-primary">{BUYER_SHOWCASE_RESIDUAL_RISK_OWNER}</dd>
          </div>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
              Monitoring cadence
            </dt>
            <dd className="m-0 mt-0.5 text-al-text-primary">
              {BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE}
            </dd>
          </div>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
              Next review
            </dt>
            <dd className="m-0 mt-0.5 text-al-text-primary">{BUYER_SHOWCASE_RESIDUAL_RISK_NEXT_REVIEW}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}

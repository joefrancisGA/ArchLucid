import type { ReactElement } from "react";

import {
  BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE,
  BUYER_SHOWCASE_RESIDUAL_RISK_NEXT_REVIEW,
  BUYER_SHOWCASE_RESIDUAL_RISK_OWNER,
} from "@/lib/buyer-polish-copy";

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
    "rounded-lg border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900 dark:bg-violet-950/30",
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
      <h2 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recommended action</h2>
      {structuredActions.length > 1 ? (
        <ol className="mb-0 mt-2 list-decimal space-y-1.5 pl-5 text-sm text-neutral-800 dark:text-neutral-200">
          {structuredActions.map((action, idx) => (
            <li key={idx}>{action}</li>
          ))}
        </ol>
      ) : (
        <p className="m-0 mt-2 whitespace-pre-line text-sm text-neutral-800 dark:text-neutral-200">
          {recommendedActionParagraph.trim()}
        </p>
      )}
      {showOwnerCadence ? (
        <dl className="m-0 mt-3 grid gap-2 border-t border-teal-200/80 pt-3 text-sm sm:grid-cols-3 dark:border-teal-900/70">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Risk owner
            </dt>
            <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">{BUYER_SHOWCASE_RESIDUAL_RISK_OWNER}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Monitoring cadence
            </dt>
            <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">
              {BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Next review
            </dt>
            <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">{BUYER_SHOWCASE_RESIDUAL_RISK_NEXT_REVIEW}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}

import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { BUYER_SHOWCASE_POLICY_PACK_LABEL } from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { findingDetailHeadingTitle } from "@/lib/finding-display-from-inspect";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export type FindingInspectWhyMattersSectionProps = {
  readonly payload: FindingInspectPayload;
  readonly variant: "detail" | "inspect";
  readonly demoFillGaps: boolean;
  readonly whyThisMattersNarrative: string | null;
};

/**
 * Sponsor-readable rationale plus primary rule. Technical rule id stays collapsible — opened by default only on inspect.
 */
export function FindingInspectWhyMattersSection({
  payload,
  variant,
  demoFillGaps,
  whyThisMattersNarrative,
}: FindingInspectWhyMattersSectionProps): ReactElement {
  const findingTitle = findingDetailHeadingTitle(payload);
  const whyHeading =
    findingTitle.trim().length > 0 && findingTitle !== "Finding detail"
      ? `Why ${findingTitle} matters`
      : "Why this matters";

  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
      <h2 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{whyHeading}</h2>
      {whyThisMattersNarrative ? (
        <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          {whyThisMattersNarrative}
        </p>
      ) : demoFillGaps ? (
        <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          Sensitive fields (PHI) are carried through the intake path into downstream services. The finalized review
          package documents where patient identifiers stop and how monitoring validates ongoing minimization.
        </p>
      ) : (
        <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          — (no dedicated rationale on file; see primary rule and evidence below.)
        </p>
      )}
      <dl className="mt-3 space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
        {(payload.decisionRuleName ?? payload.decisionRuleId) ? (
          <div>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Primary rule</dt>
            <dd className="m-0 mt-1">{payload.decisionRuleName ?? payload.decisionRuleId}</dd>
          </div>
        ) : isBuyerPolishedOperatorShellEnv() ? (
          <div>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Primary rule</dt>
            <dd className="m-0 mt-1">{BUYER_SHOWCASE_POLICY_PACK_LABEL} — PHI minimization at intake</dd>
          </div>
        ) : null}
      </dl>
      {payload.decisionRuleId && (variant === "inspect" || !isBuyerPolishedOperatorShellEnv()) ? (
        <div className="mt-3">
          <CollapsibleSection title="Technical rule identifier" defaultOpen={variant === "inspect"}>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-800">
                {payload.decisionRuleId}
              </code>
              <CopyIdButton value={payload.decisionRuleId} aria-label="Copy rule identifier" />
            </div>
          </CollapsibleSection>
        </div>
      ) : null}
    </section>
  );
}

import { cn } from "@/lib/utils";
import Link from "next/link";

import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { BUYER_SHOWCASE_POLICY_PACK_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { findingDetailHeadingTitle } from "@/lib/findings/finding-display-from-inspect";
import { policyPacksRuleHref } from "@/lib/policy/policy-packs-deep-link";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolvePolicyRuleIdFromInspect, resolvePolicyRuleLabelFromInspect } from "@/lib/findings/finding-policy-evidence-citations";
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
  const policyRuleId = resolvePolicyRuleIdFromInspect(payload);
  const policyRuleLabel = resolvePolicyRuleLabelFromInspect(payload, policyRuleId);
  const whyHeading =
    findingTitle.trim().length > 0 && findingTitle !== "Finding detail"
      ? `Why ${findingTitle} matters`
      : "Why this matters";

  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{whyHeading}</h2>
      {whyThisMattersNarrative ? (
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {whyThisMattersNarrative}
        </p>
      ) : demoFillGaps ? (
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Sensitive fields (PHI) are carried through the intake path into downstream services. The finalized review
          package documents where patient identifiers stop and how monitoring validates ongoing minimization.
        </p>
      ) : (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          — (no dedicated rationale on file; see primary rule and evidence below.)
        </p>
      )}
      <dl className={cn("mt-3 space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {(policyRuleLabel ?? policyRuleId) ? (
          <div>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Primary rule</dt>
            <dd className="m-0 mt-1">
              {policyRuleId !== null ? (
                <Link
                  href={policyPacksRuleHref(policyRuleId)}
                  className={OPERATOR_LINK.nav}
                >
                  {policyRuleLabel ?? policyRuleId}
                </Link>
              ) : (
                policyRuleLabel
              )}
            </dd>
          </div>
        ) : isBuyerPolishedOperatorShellEnv() ? (
          <div>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Primary rule</dt>
            <dd className="m-0 mt-1">{BUYER_SHOWCASE_POLICY_PACK_LABEL} — PHI minimization at intake</dd>
          </div>
        ) : null}
      </dl>
      {payload.decisionRuleId ? (
        <div className="mt-3">
          <CollapsibleSection title="Technical rule identifier" defaultOpen={variant === "inspect"}>
            <div className="flex flex-wrap items-center gap-2">
              <code className={cn("rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>
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

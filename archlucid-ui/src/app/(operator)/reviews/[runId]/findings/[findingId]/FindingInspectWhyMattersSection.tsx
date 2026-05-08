import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
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
  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
      <h2 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Why this matters</h2>
      {whyThisMattersNarrative ? (
        <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          {whyThisMattersNarrative}
        </p>
      ) : demoFillGaps ? (
        <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          In the Claims Intake sample, sensitive fields (PHI) are carried through the request path into downstream
          services. Without explicit redaction and access boundaries, reviewers cannot show regulators a defensible
          boundary for where patient identifiers stop.
        </p>
      ) : (
        <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          — (no dedicated rationale on file; see primary rule and evidence below.)
        </p>
      )}
      <dl className="mt-3 space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
        <div>
          <dt className="font-medium text-neutral-600 dark:text-neutral-400">Primary rule</dt>
          <dd className="m-0 mt-1">{payload.decisionRuleName ?? payload.decisionRuleId ?? "—"}</dd>
        </div>
      </dl>
      {payload.decisionRuleId ? (
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

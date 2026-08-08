"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import {
  findingConfidenceExplanation,
  findingEvidenceCountPlainLine,
} from "@/lib/finding-explainability-summary";
import type { FindingExplainability } from "@/types/explanation";
import { normalizeFindingConfidenceLevel } from "@/types/explanation";

/** Empty evidence section — distinguishes heuristic vs evidence-backed findings for compliance reviewers (TB-514). */
export const EXPLAINABILITY_TRACE_EVIDENCE_EMPTY_COPY =
  "No evidence references recorded for this finding. Evidence-backed findings show source references here. Heuristic findings rely on model reasoning rather than explicit evidence.";

export type ExplainabilityTraceTreeProps = {
  readonly data: FindingExplainability;
};

function TraceSection(props: {
  readonly title: string;
  readonly testId: string;
  readonly defaultOpen?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={props.defaultOpen ?? false} className="rounded-md border border-neutral-200 dark:border-neutral-700">
      <CollapsibleTrigger
        className={cn("flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-semibold text-neutral-900 hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-900/60", OPERATOR_TYPOGRAPHY.cardTitle)}
        data-testid={props.testId}
      >
        <span>{props.title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform [[data-state=open]_&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("border-t border-neutral-200 px-3 py-3 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}>
        {props.children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Sponsor-readable hierarchy for persisted explainability traces (assessment Tier 2).
 *
 * Ordered for a human reader: what ArchLucid decided, what evidence backs it, how certain it is —
 * with the rule identifier (an implementation detail) collapsed between them.
 */
export function ExplainabilityTraceTree(props: ExplainabilityTraceTreeProps) {
  const { data } = props;
  const decisionText =
    data.decisionsTaken.length > 0
      ? data.decisionsTaken[0]
      : (data.evidence?.conclusion?.trim() ?? "No decision recorded in trace.");

  const confidenceLabel = normalizeFindingConfidenceLevel(data.confidenceLevel ?? null);
  const evidenceRefs = data.evidence?.evidenceRefs ?? [];
  const rules = data.rulesApplied.length > 0 ? data.rulesApplied : data.evidence?.ruleId ? [data.evidence.ruleId] : [];
  const missingTraceFields = data.missingTraceFields?.filter((field) => field.trim().length > 0) ?? [];

  const confidence = findingConfidenceExplanation({
    level: confidenceLabel,
    evidenceRefCount: evidenceRefs.length,
    missingTraceFieldCount: missingTraceFields.length,
  });

  return (
    <div className="space-y-2" data-testid="explainability-trace-tree">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/90 p-3 dark:border-neutral-700 dark:bg-neutral-900/50"
        aria-labelledby="explainability-trace-decision-heading"
      >
        <h3
          id="explainability-trace-decision-heading"
          className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        >
          Decision
        </h3>
        <p className={cn("m-0 mt-2 leading-relaxed text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{decisionText}</p>
      </section>

      <TraceSection title="Evidence used" testId="explainability-trace-evidence" defaultOpen>
        {evidenceRefs.length === 0 ? (
          <p className="m-0 text-neutral-600 dark:text-neutral-400">{EXPLAINABILITY_TRACE_EVIDENCE_EMPTY_COPY}</p>
        ) : (
          <>
            <p className={cn("m-0 mb-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              {findingEvidenceCountPlainLine(evidenceRefs)}
            </p>
            <ul className="m-0 list-disc space-y-1 pl-5">
              {evidenceRefs.map((ref, index) => (
                <li key={`${ref}-${index}`} className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>
                  {ref}
                </li>
              ))}
            </ul>
          </>
        )}
      </TraceSection>

      <TraceSection title="Confidence" testId="explainability-trace-confidence" defaultOpen>
        {confidence.label !== null ? (
          <FindingConfidenceBadge level={confidenceLabel} />
        ) : null}
        <p className={cn("m-0 mt-2 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {confidence.reason}
        </p>
      </TraceSection>

      <TraceSection title="Rule applied" testId="explainability-trace-rules">
        {rules.length === 0 ? (
          <p className="m-0 text-neutral-600 dark:text-neutral-400">No rules recorded.</p>
        ) : (
          <ul className="m-0 list-disc space-y-1 pl-5">
            {rules.map((rule, index) => (
              <li key={`${rule}-${index}`}>{rule}</li>
            ))}
          </ul>
        )}
      </TraceSection>
    </div>
  );
}

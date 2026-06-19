"use client";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { FindingExplainability } from "@/types/explanation";
import { normalizeFindingConfidenceLevel } from "@/types/explanation";

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
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-neutral-900 hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-900/60"
        data-testid={props.testId}
      >
        <span>{props.title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform [[data-state=open]_&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-neutral-200 px-3 py-3 text-sm dark:border-neutral-700">
        {props.children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Sponsor-readable hierarchy for persisted explainability traces (assessment Tier 2).
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

  return (
    <div className="space-y-2" data-testid="explainability-trace-tree">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/90 p-3 dark:border-neutral-700 dark:bg-neutral-900/50"
        aria-labelledby="explainability-trace-decision-heading"
      >
        <h3
          id="explainability-trace-decision-heading"
          className="m-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400"
        >
          Decision
        </h3>
        <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-900 dark:text-neutral-100">{decisionText}</p>
      </section>

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

      <TraceSection title="Evidence cited" testId="explainability-trace-evidence">
        {evidenceRefs.length === 0 ? (
          <p className="m-0 text-neutral-600 dark:text-neutral-400">No evidence references recorded.</p>
        ) : (
          <ul className="m-0 list-disc space-y-1 pl-5">
            {evidenceRefs.map((ref, index) => (
              <li key={`${ref}-${index}`} className="font-mono text-xs">
                {ref}
              </li>
            ))}
          </ul>
        )}
      </TraceSection>

      <TraceSection title="Confidence" testId="explainability-trace-confidence" defaultOpen>
        {confidenceLabel !== null ? (
          <Badge variant="secondary">{confidenceLabel}</Badge>
        ) : (
          <p className="m-0 text-neutral-600 dark:text-neutral-400">Confidence not recorded for this finding.</p>
        )}
      </TraceSection>
    </div>
  );
}

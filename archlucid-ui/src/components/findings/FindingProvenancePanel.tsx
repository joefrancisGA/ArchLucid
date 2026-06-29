"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { getFindingProvenance, type FindingProvenanceStep, type FindingProvenanceStepKind } from "@/lib/api/finding-provenance";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingProvenancePanelProps = {
  readonly runId: string;
  readonly findingId: string;
};

function stepKindLabel(kind: FindingProvenanceStepKind): string {
  if (kind === "input") {
    return "Brief / context provided";
  }

  if (kind === "evidence") {
    return "Evidence collected";
  }

  if (kind === "policy-check") {
    return "Policy rule evaluated";
  }

  return "Conclusion";
}

function stepBorderClass(kind: FindingProvenanceStepKind): string {
  if (kind === "evidence") {
    return "border-l-2 border-teal-500 pl-3";
  }

  if (kind === "policy-check") {
    return "border-l-2 border-amber-500 pl-3";
  }

  if (kind === "conclusion") {
    return "border-l-2 border-neutral-400 pl-3";
  }

  return "pl-3";
}

function ProvenanceStepRow(props: { readonly step: FindingProvenanceStep }): React.JSX.Element {
  const { step } = props;

  return (
    <li className={cn("space-y-1", stepBorderClass(step.kind))}>
      <p className={cn("m-0 font-semibold text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper, step.kind === "conclusion" ? "font-bold" : "")}>
        {stepKindLabel(step.kind)}: {step.label}
      </p>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{step.detail}</p>
    </li>
  );
}

export function FindingProvenancePanel(props: FindingProvenancePanelProps): React.JSX.Element {
  const { runId, findingId } = props;
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<readonly FindingProvenanceStep[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!expanded || steps !== null) {
      return;
    }

    setLoading(true);
    setError(false);

    void getFindingProvenance(runId, findingId)
      .then((payload) => {
        if (payload === null || payload.steps.length === 0) {
          setError(true);

          return;
        }

        setSteps(payload.steps);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [expanded, findingId, runId, steps]);

  return (
    <section className="rounded-md border border-neutral-200 dark:border-neutral-700" data-testid="finding-provenance-panel">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded((previous) => !previous);
        }}
      >
        <span className={cn(OPERATOR_TYPOGRAPHY.badge, "font-semibold text-neutral-800 dark:text-neutral-100")}>
          Why this finding?
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", expanded ? "rotate-180" : "")} aria-hidden />
      </button>
      {expanded ? (
        <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
          {loading ? (
            <ul className="m-0 list-none space-y-2 p-0">
              <li className="h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <li className="h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <li className="h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            </ul>
          ) : null}
          {!loading && error ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>Provenance not available for this finding.</p>
          ) : null}
          {!loading && steps !== null ? (
            <ol className="m-0 list-none space-y-3 p-0">
              {steps.map((step) => (
                <ProvenanceStepRow key={`${step.kind}-${step.label}`} step={step} />
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

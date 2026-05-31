import type { ReactElement } from "react";

import { DESIGN_TOKENS } from "@/lib/design-tokens";
import type { RunDecisionExplainabilityModel } from "@/lib/run-decision-explainability-from-detail";
import { cn } from "@/lib/utils";

function formatConfidence(confidence: number | null): string {
  if (confidence === null || !Number.isFinite(confidence)) {
    return "Unknown";
  }

  if (confidence <= 1) {
    return `${Math.round(confidence * 100)}%`;
  }

  return `${Math.round(confidence)}%`;
}

function SnapshotIdList(props: { readonly label: string; readonly value: string | null }): ReactElement | null {
  if (props.value === null) {
    return null;
  }

  return (
    <li>
      <span className="font-medium">{props.label}:</span>{" "}
      <span className="font-mono text-[11px]">{props.value}</span>
    </li>
  );
}

/** Unified authority + coordinator decision explainability for run detail (TB-054). */
export function RunDecisionExplainabilitySection(props: {
  readonly model: RunDecisionExplainabilityModel;
}): ReactElement {
  const { model } = props;

  return (
    <section
      aria-label="Decision explainability"
      className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="run-decision-explainability-section"
    >
      <h3 className="m-0 mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Decision explainability
      </h3>
      <p className="m-0 mb-3 text-xs text-neutral-600 dark:text-neutral-400">
        Trace manifest decisions from authority rule audit through coordinator merge nodes. Each row is labeled by
        pipeline so operators know which engine produced it.
      </p>

      <ul className="m-0 mb-4 list-none space-y-1 p-0 text-xs text-neutral-700 dark:text-neutral-300">
        <SnapshotIdList label="Context snapshot" value={model.snapshotIds.contextSnapshotId} />
        <SnapshotIdList label="Graph snapshot" value={model.snapshotIds.graphSnapshotId} />
        <SnapshotIdList label="Findings snapshot" value={model.snapshotIds.findingsSnapshotId} />
      </ul>

      {model.authorityRuleAudit !== null ? (
        <div className="mb-4 rounded-md border border-neutral-200 bg-white/70 p-3 dark:border-neutral-700 dark:bg-neutral-950/40">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
            Authority rule audit
          </p>
          <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Rule set {model.authorityRuleAudit.ruleSetId} v{model.authorityRuleAudit.ruleSetVersion} · applied{" "}
            {model.authorityRuleAudit.appliedRuleIds.length} rules · accepted{" "}
            {model.authorityRuleAudit.acceptedFindingIds.length} findings
          </p>
        </div>
      ) : null}

      {model.findingEngineFailures.length > 0 ? (
        <div className={cn("mb-4", DESIGN_TOKENS.callout.warn, "p-3")}>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
            Finding engine failures
          </p>
          <ul className="m-0 mt-2 list-disc space-y-1 pl-4 text-xs text-amber-950 dark:text-amber-100">
            {model.findingEngineFailures.map((row) => (
              <li key={`${row.engineType}-${row.category}-${row.exceptionType}`}>
                {row.engineType}/{row.category}: {row.exceptionType} — {row.errorMessage}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {model.manifestHonestyWarnings.length > 0 ? (
        <div className="mb-4 rounded-md border border-neutral-200 bg-white/70 p-3 dark:border-neutral-700 dark:bg-neutral-950/40">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
            Manifest honesty warnings
          </p>
          <ul className="m-0 mt-2 list-disc space-y-1 pl-4 text-xs text-neutral-700 dark:text-neutral-300">
            {model.manifestHonestyWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {model.manifestDecisions.length > 0 ? (
        <div className="mb-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                <th className="px-2 py-1 font-semibold">Manifest decision</th>
                <th className="px-2 py-1 font-semibold">Selected</th>
                <th className="px-2 py-1 font-semibold">Confidence</th>
                <th className="px-2 py-1 font-semibold">Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {model.manifestDecisions.map((row) => (
                <tr key={row.decisionId} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="px-2 py-2 align-top">
                    <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">{row.title}</p>
                    <p className="m-0 mt-0.5 text-[11px] text-neutral-600 dark:text-neutral-400">{row.category}</p>
                  </td>
                  <td className="px-2 py-2 align-top">{row.selectedOption}</td>
                  <td className="px-2 py-2 align-top">
                    {formatConfidence(row.confidence)}
                    {row.buyerConfidenceSource ? (
                      <span className="block text-[10px] text-neutral-500">{row.buyerConfidenceSource}</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2 align-top font-mono text-[10px]">{row.pipeline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {model.coordinatorDecisionNodes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                <th className="px-2 py-1 font-semibold">Coordinator topic</th>
                <th className="px-2 py-1 font-semibold">Confidence</th>
                <th className="px-2 py-1 font-semibold">Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {model.coordinatorDecisionNodes.map((row) => (
                <tr key={row.decisionId} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="px-2 py-2 align-top">
                    <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">{row.topic}</p>
                    <p className="m-0 mt-0.5 text-[11px] text-neutral-600 dark:text-neutral-400">{row.rationale}</p>
                  </td>
                  <td className="px-2 py-2 align-top">{formatConfidence(row.confidence)}</td>
                  <td className="px-2 py-2 align-top font-mono text-[10px]">{row.pipeline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

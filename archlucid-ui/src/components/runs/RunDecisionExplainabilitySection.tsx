import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { DESIGN_TOKENS, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatDecisionPipelineBuyerLabel,
  normalizeDecisionConfidencePercent,
  resolveRecordedDecisionConfidenceNote,
} from "@/lib/decision-explainability-buyer-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { RunDecisionExplainabilityModel } from "@/lib/runs/run-decision-explainability-from-detail";

function formatConfidence(confidence: number | null): string {
  const normalized = normalizeDecisionConfidencePercent(confidence);

  if (normalized === null) {
    return "Unknown";
  }

  return `${normalized}%`;
}

function SnapshotIdList(props: { readonly label: string; readonly value: string | null }): ReactElement | null {
  if (props.value === null) {
    return null;
  }

  return (
    <li>
      <span className="font-medium">{props.label}:</span>{" "}
      <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.navHelper)}>{props.value}</span>
    </li>
  );
}

/** Unified authority + coordinator decision explainability for run detail (TB-054). */
export function RunDecisionExplainabilitySection(props: {
  readonly model: RunDecisionExplainabilityModel;
}): ReactElement {
  const { model } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <section
      aria-label="Decision explainability"
      className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="run-decision-explainability-section"
    >
      <h3 className={cn("m-0 mb-2 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Decision explainability
      </h3>
      <p className={cn("m-0 mb-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Trace review record decisions from authority rule audit through coordinator merge nodes. Each row is labeled by
        pipeline so operators know which engine produced it.
      </p>

      <ul className={cn("m-0 mb-4 list-none space-y-1 p-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        <SnapshotIdList label="Context snapshot" value={model.snapshotIds.contextSnapshotId} />
        <SnapshotIdList label="Graph snapshot" value={model.snapshotIds.graphSnapshotId} />
        <SnapshotIdList label="Findings snapshot" value={model.snapshotIds.findingsSnapshotId} />
      </ul>

      {model.authorityRuleAudit !== null ? (
        <div className="mb-4 rounded-md border border-neutral-200 bg-white/70 p-3 dark:border-neutral-700 dark:bg-neutral-950/40">
          <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-700 dark:text-neutral-300")}>
            Authority rule audit
          </p>
          <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Rule set {model.authorityRuleAudit.ruleSetId} v{model.authorityRuleAudit.ruleSetVersion} · applied{" "}
            {model.authorityRuleAudit.appliedRuleIds.length} rules · accepted{" "}
            {model.authorityRuleAudit.acceptedFindingIds.length} findings
          </p>
        </div>
      ) : null}

      {model.findingEngineFailures.length > 0 ? (
        <div className={cn("mb-4", DESIGN_TOKENS.callout.warn, "p-3")}>
          <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-amber-900 dark:text-amber-200")}>
            Finding engine failures
          </p>
          <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-4 text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>
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
          <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-700 dark:text-neutral-300")}>
            Manifest honesty warnings
          </p>
          <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-4 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            {model.manifestHonestyWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {model.manifestDecisions.length > 0 ? (
        <div className="mb-4 overflow-x-auto">
          <table className={cn("min-w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.helper)}>
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                <th className="px-2 py-1 font-semibold">Review record decision</th>
                <th className="px-2 py-1 font-semibold">Selected</th>
                <th className="px-2 py-1 font-semibold">Confidence</th>
                <th className="px-2 py-1 font-semibold">Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {model.manifestDecisions.map((row) => {
                const confidenceNote = resolveRecordedDecisionConfidenceNote({
                  selectedOption: row.selectedOption,
                  confidence: row.confidence,
                  buyerConfidenceSource: row.buyerConfidenceSource,
                });

                return (
                <tr key={row.decisionId} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="px-2 py-2 align-top">
                    <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">{row.title}</p>
                    <p className={cn("m-0 mt-0.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}>{row.category}</p>
                  </td>
                  <td className="px-2 py-2 align-top">{row.selectedOption}</td>
                  <td className="px-2 py-2 align-top">
                    {formatConfidence(row.confidence)}
                    {confidenceNote !== null ? (
                      <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                        {confidenceNote}
                      </span>
                    ) : row.buyerConfidenceSource ? (
                      <span className={cn("block text-neutral-500", OPERATOR_TYPOGRAPHY.micro)}>{row.buyerConfidenceSource}</span>
                    ) : null}
                  </td>
                  <td className={cn("px-2 py-2 align-top", buyerPolishedShell ? OPERATOR_TYPOGRAPHY.helper : "font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                    {buyerPolishedShell ? formatDecisionPipelineBuyerLabel(row.pipeline) : row.pipeline}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {model.coordinatorDecisionNodes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className={cn("min-w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.helper)}>
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
                    <p className={cn("m-0 mt-0.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}>{row.rationale}</p>
                  </td>
                  <td className="px-2 py-2 align-top">{formatConfidence(row.confidence)}</td>
                  <td className={cn("px-2 py-2 align-top", buyerPolishedShell ? OPERATOR_TYPOGRAPHY.helper : "font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                    {buyerPolishedShell ? formatDecisionPipelineBuyerLabel(row.pipeline) : row.pipeline}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

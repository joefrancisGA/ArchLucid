"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import { REPLAY_VALIDATION_HISTORY_EMPTY } from "@/lib/replay-validation-copy";
import {
  formatReplayDurationLabel,
  replayValidationModeDefinition,
  replayValidationOutcomeLabel,
  type ReplayValidationHistoryEntry,
} from "@/lib/replay-validation-workflow";

export type ReplayValidationHistorySectionProps = {
  readonly runId: string;
  readonly entries: readonly ReplayValidationHistoryEntry[];
};

function historyOutcomeKind(
  outcome: ReplayValidationHistoryEntry["outcome"],
): EnterpriseStatusKind {
  switch (outcome) {
    case "valid":
      return "ready";
    case "valid_with_warnings":
    case "incomplete":
      return "needs-attention";
    case "invalid":
    case "failed":
      return "blocked";
    case "canceled":
      return "neutral";
    default: {
      const exhaustive: never = outcome;
      return exhaustive;
    }
  }
}

export function ReplayValidationHistorySection(props: ReplayValidationHistorySectionProps) {
  const { runId, entries } = props;

  if (runId.trim().length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" aria-label="Validation history" data-testid="replay-validation-history">
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>Validation history</h3>
      {entries.length === 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{REPLAY_VALIDATION_HISTORY_EMPTY}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-700">
          <table className={cn("min-w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
            <thead className="bg-neutral-50 dark:bg-neutral-900/60">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Mode</th>
                <th className="px-3 py-2 font-medium">Result</th>
                <th className="px-3 py-2 font-medium">Duration</th>
                <th className="px-3 py-2 font-medium">AI usage</th>
                <th className="px-3 py-2 font-medium">Initiated by</th>
                <th className="px-3 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-neutral-200 dark:border-neutral-700">
                  <td className="px-3 py-2">{new Date(entry.occurredUtc).toLocaleString()}</td>
                  <td className="px-3 py-2">{replayValidationModeDefinition(entry.mode).title}</td>
                  <td className="px-3 py-2">
                    <StatusTag kind={historyOutcomeKind(entry.outcome)} label={replayValidationOutcomeLabel(entry.outcome)} />
                  </td>
                  <td className="px-3 py-2">{formatReplayDurationLabel(entry.durationMs)}</td>
                  <td className="px-3 py-2">{entry.aiUsageLabel}</td>
                  <td className="px-3 py-2">{entry.initiatedBy}</td>
                  <td className="px-3 py-2">
                    {entry.source === "audit" && entry.auditEventId ? (
                      <Link
                        href={`/governance/audit?runId=${encodeURIComponent(runId)}&eventType=ReplayExecuted`}
                        className={OPERATOR_LINK.nav}
                      >
                        View audit
                      </Link>
                    ) : (
                      <span className="text-neutral-600 dark:text-neutral-400">This session</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

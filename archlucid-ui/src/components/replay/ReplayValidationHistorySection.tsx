"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";
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
        <EnterpriseTable ariaLabel="Replay validation history" className={OPERATOR_TYPOGRAPHY.body}>
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Date</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Mode</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Result</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Duration</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>AI usage</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Initiated by</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Details</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {entries.map((entry) => (
              <EnterpriseTableRow key={entry.id}>
                <EnterpriseTableCell>{formatInstantForLocale(entry.occurredUtc)}</EnterpriseTableCell>
                <EnterpriseTableCell>{replayValidationModeDefinition(entry.mode).title}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <StatusTag kind={historyOutcomeKind(entry.outcome)} label={replayValidationOutcomeLabel(entry.outcome)} />
                </EnterpriseTableCell>
                <EnterpriseTableCell>{formatReplayDurationLabel(entry.durationMs)}</EnterpriseTableCell>
                <EnterpriseTableCell>{entry.aiUsageLabel}</EnterpriseTableCell>
                <EnterpriseTableCell>{entry.initiatedBy}</EnterpriseTableCell>
                <EnterpriseTableCell>
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
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      )}
    </section>
  );
}

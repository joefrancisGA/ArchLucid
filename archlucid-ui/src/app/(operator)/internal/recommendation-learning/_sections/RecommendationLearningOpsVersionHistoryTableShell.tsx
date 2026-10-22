"use client";

import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { Textarea } from "@/components/ui/textarea";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RecommendationLearningProfileHistoryItem } from "@/types/recommendation-learning-operational";

import {
  formatOperationalTimestamp,
  profileVersionStatusTagKind,
} from "./recommendation-learning-ops-display";
import type { RecommendationLearningOpsState } from "./use-recommendation-learning-ops-state";

export type RecommendationLearningOpsVersionHistoryTableShellProps = Pick<
  RecommendationLearningOpsState,
  | "history"
  | "canMutate"
  | "busyAction"
  | "rollbackProfileId"
  | "setRollbackProfileId"
  | "rollbackReason"
  | "setRollbackReason"
  | "runRollback"
>;

export function RecommendationLearningOpsVersionHistoryTableShell(
  props: RecommendationLearningOpsVersionHistoryTableShellProps,
): React.JSX.Element {
  const {
    history,
    canMutate,
    busyAction,
    rollbackProfileId,
    setRollbackProfileId,
    rollbackReason,
    setRollbackReason,
    runRollback,
  } = props;

  return (
    <section className="rounded-lg border border-al-border/70 p-4">
      <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Version history</h2>
      <EnterpriseTable ariaLabel="Recommendation learning profile version history">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Version</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Built</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Outcomes</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Action</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {history.map((item: RecommendationLearningProfileHistoryItem) => (
            <EnterpriseTableRow key={item.profileId}>
              <EnterpriseTableCell className="font-mono text-xs">{item.profileId}</EnterpriseTableCell>
              <EnterpriseTableCell>{formatOperationalTimestamp(item.generatedUtc)}</EnterpriseTableCell>
              <EnterpriseTableCell>{item.outcomeCount}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag
                  kind={profileVersionStatusTagKind(item.isActive === true)}
                  label={item.isActive ? "Active" : "Historical"}
                />
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                {!item.isActive ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canMutate || busyAction !== null}
                    onClick={() => setRollbackProfileId(item.profileId ?? null)}
                  >
                    Roll back to this version
                  </Button>
                ) : (
                  " — "
                )}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
      {rollbackProfileId ? (
        <div className="mt-4 space-y-2 rounded border border-al-border/60 p-3">
          <p className="m-0 font-mono text-sm">Rollback target: {rollbackProfileId}</p>
          <Textarea
            className="min-h-20 bg-al-surface-raised font-mono text-al-text-primary placeholder:text-al-text-placeholder"
            placeholder="Operational reason (required)"
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
          />
          <div className="flex gap-2">
            <Button type="button" disabled={busyAction !== null} onClick={() => void runRollback()}>
              Confirm rollback
            </Button>
            <Button type="button" variant="outline" onClick={() => setRollbackProfileId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

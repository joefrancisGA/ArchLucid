"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
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
import type { RiskExceptionRecord } from "@/lib/api/governance-stickiness-api";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

import { RiskExceptionsRenewPanel } from "./RiskExceptionsRenewPanel";
import { statusTagFor } from "./risk-exceptions-client-helpers";
import {
  formatRiskExceptionExpiresAtUtc,
  resolveRiskExceptionDisplayStatus,
  truncateMiddle,
} from "./risk-exception-status";

export type RiskExceptionsTableProps = {
  readonly scopedRecords: readonly RiskExceptionRecord[];
  readonly renewingId: string | null;
  readonly busyId: string | null;
  readonly canMutate: boolean;
  readonly mutationDisabledHintId: string;
  readonly mutationDisabledReason: WhyDisabledCtaReason | null;
  readonly renewExpiresAtUtc: string;
  readonly onRenewExpiresAtUtcChange: (value: string) => void;
  readonly renewRationale: string;
  readonly onRenewRationaleChange: (value: string) => void;
  readonly onSubmitRenew: (record: RiskExceptionRecord) => void;
  readonly onCancelRenew: () => void;
  readonly onStartRenew: (riskExceptionId: string) => void;
  readonly onRequestRevoke: (record: RiskExceptionRecord) => void;
};

export function RiskExceptionsTable({
  scopedRecords,
  renewingId,
  busyId,
  canMutate,
  mutationDisabledHintId,
  mutationDisabledReason,
  renewExpiresAtUtc,
  onRenewExpiresAtUtcChange,
  renewRationale,
  onRenewRationaleChange,
  onSubmitRenew,
  onCancelRenew,
  onStartRenew,
  onRequestRevoke,
}: RiskExceptionsTableProps): React.ReactElement {
  return (
    <EnterpriseTable ariaLabel="Risk exceptions">
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>
            <span>Finding ID</span>
            <span className={cn("ml-2 block font-normal", OPERATOR_TYPOGRAPHY.helper)}>
              The finding this exception covers.
            </span>
          </EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>
            <span>Owner</span>
            <span className={cn("ml-2 block font-normal", OPERATOR_TYPOGRAPHY.helper)}>
              The person recorded for the exception, not necessarily the current finding owner.
            </span>
          </EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>
            <span>Rationale</span>
            <span className={cn("ml-2 block font-normal", OPERATOR_TYPOGRAPHY.helper)}>
              Why coverage was requested for this finding. View full rationale reveals the complete recorded explanation.
            </span>
          </EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>
            <span>Status</span>
            <span className={cn("ml-2 block font-normal", OPERATOR_TYPOGRAPHY.helper)}>
              Status describes exception coverage, not finding workflow status.
            </span>
          </EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>
            <span>Expires</span>
            <span className={cn("ml-2 block font-normal", OPERATOR_TYPOGRAPHY.helper)}>
              After this time the exception no longer covers the finding.
            </span>
            <span className={cn("ml-2 block font-normal", OPERATOR_TYPOGRAPHY.helper)}>
              The exception stops covering the finding after this time.
            </span>
          </EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>
            <span>Actions</span>
            <span className={cn("ml-2 block font-normal", OPERATOR_TYPOGRAPHY.helper)}>
              Renew opens the exception record for a new coverage date and rationale. Revoke ends coverage. Neither remediates the finding.
            </span>
          </EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {scopedRecords.map((record) => {
          const displayStatus = resolveRiskExceptionDisplayStatus(record);
          const tag = statusTagFor(displayStatus);
          const isRenewing = renewingId === record.riskExceptionId;

          return (
            <EnterpriseTableRow key={record.riskExceptionId} data-risk-exception-id={record.riskExceptionId}>
              <EnterpriseTableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <code className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>
                    {truncateMiddle(record.findingId, 24)}
                  </code>
                  <CopyIdButton value={record.findingId} aria-label="Copy finding ID" />
                </div>
              </EnterpriseTableCell>
              <EnterpriseTableCell>{record.ownerUserId}</EnterpriseTableCell>
              <EnterpriseTableCell title={record.rationale ?? undefined}>
                {(record.rationale ?? "").length > 80 ? (
                  <details>
                    <summary className="cursor-pointer text-al-link underline-offset-2 hover:underline">
                      View full rationale
                    </summary>
                    <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{record.rationale}</p>
                  </details>
                ) : (
                  record.rationale ?? ""
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag kind={tag.kind} label={tag.label} />
              </EnterpriseTableCell>
              <EnterpriseTableCell>{formatRiskExceptionExpiresAtUtc(record.expiresAtUtc)}</EnterpriseTableCell>
              <EnterpriseTableCell>
                {isRenewing ? (
                  <RiskExceptionsRenewPanel
                    record={record}
                    busyId={busyId}
                    canMutate={canMutate}
                    mutationDisabledHintId={mutationDisabledHintId}
                    mutationDisabledReason={mutationDisabledReason}
                    renewExpiresAtUtc={renewExpiresAtUtc}
                    onRenewExpiresAtUtcChange={onRenewExpiresAtUtcChange}
                    renewRationale={renewRationale}
                    onRenewRationaleChange={onRenewRationaleChange}
                    onSubmitRenew={onSubmitRenew}
                    onCancelRenew={onCancelRenew}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === record.riskExceptionId || !canMutate}
                      aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                      onClick={() => onStartRenew(record.riskExceptionId)}
                    >
                      Renew
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === record.riskExceptionId || !canMutate}
                      aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                      onClick={() => onRequestRevoke(record)}
                      data-testid={`risk-exception-revoke-${record.riskExceptionId}`}
                    >
                      Revoke
                    </Button>
                  </div>
                )}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

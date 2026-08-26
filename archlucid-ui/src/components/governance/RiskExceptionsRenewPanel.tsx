"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import type { RiskExceptionRecord } from "@/lib/api/governance-stickiness-api";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

import { toDatetimeLocalInputValue } from "./risk-exceptions-client-helpers";

export type RiskExceptionsRenewPanelProps = {
  readonly record: RiskExceptionRecord;
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
};

export function RiskExceptionsRenewPanel({
  record,
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
}: RiskExceptionsRenewPanelProps): React.ReactElement {
  return (
    <form
      className="flex min-w-[16rem] flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmitRenew(record);
      }}
    >
      <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.helper)}>
        <span>New expiry (UTC)</span>
        <input
          type="datetime-local"
          className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
          value={toDatetimeLocalInputValue(renewExpiresAtUtc)}
          onChange={(event) => {
            const next = new Date(event.target.value);

            if (!Number.isNaN(next.getTime())) {
              onRenewExpiresAtUtcChange(next.toISOString());
            }
          }}
        />
      </label>
      <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.helper)}>
        <span>Rationale (optional)</span>
        <input
          className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
          value={renewRationale}
          onChange={(event) => onRenewRationaleChange(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={busyId === record.riskExceptionId || !canMutate}
          aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
        >
          Save renewal
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancelRenew}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export type RiskExceptionsRevokeConfirmProps = {
  readonly pendingRevoke: RiskExceptionRecord | null;
  readonly busyId: string | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: (record: RiskExceptionRecord) => void;
};

export function RiskExceptionsRevokeConfirm({
  pendingRevoke,
  busyId,
  onOpenChange,
  onConfirm,
}: RiskExceptionsRevokeConfirmProps): React.ReactElement {
  return (
    <ConfirmationDialog
      open={pendingRevoke !== null}
      onOpenChange={onOpenChange}
      title="Revoke risk exception?"
      description={
        pendingRevoke !== null
          ? `Revoking ends the active waiver for finding ${pendingRevoke.findingId}. The revocation is recorded on the audit trail.`
          : "Revoking ends the active waiver. The revocation is recorded on the audit trail."
      }
      confirmLabel="Revoke exception"
      variant="destructive"
      busy={pendingRevoke !== null && busyId === pendingRevoke.riskExceptionId}
      onConfirm={() => {
        if (pendingRevoke === null) {
          return;
        }

        onConfirm(pendingRevoke);
      }}
    />
  );
}

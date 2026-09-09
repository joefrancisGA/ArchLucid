"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { useResumePendingLivelihoodMutation } from "@/hooks/use-resume-pending-livelihood-mutation";
import { isLivelihoodMutation401RedirectError } from "@/lib/auth/livelihood-mutation-401-resume";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { governanceMutationCorrectionBlockedReason } from "@/lib/governance/governance-mutation-correction-blocked-reason";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import {
  GOVERNANCE_MUTATION_CORRECTION_FAILURE_MESSAGE,
  GOVERNANCE_MUTATION_CORRECTION_RATIONALE_REQUIRED,
  type GovernanceMutationCorrectionTarget,
  recordGovernanceMutationCorrectionWith401Resume,
} from "@/lib/governance/governance-mutation-correction-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type GovernanceRecordCorrectionDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly target: GovernanceMutationCorrectionTarget | null;
  readonly busy?: boolean;
  readonly onRecorded?: () => void;
};

/** Collects rationale and records an append-only governance mutation correction (LI-05). */
export function GovernanceRecordCorrectionDialog(
  props: GovernanceRecordCorrectionDialogProps,
): React.JSX.Element {
  const [rationale, setRationale] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const livelihoodReturnPath =
    searchParams.toString().length > 0 ? `${pathname}?${searchParams.toString()}` : pathname;

  useResumePendingLivelihoodMutation({
    enabled: true,
    onReplayed: () => {
      props.onOpenChange(false);
      props.onRecorded?.();
    },
    onReplayError: (error) => {
      setErrorMessage(toApiLoadFailure(error).message ?? GOVERNANCE_MUTATION_CORRECTION_FAILURE_MESSAGE);
    },
  });

  useEffect(() => {
    if (!props.open) {
      setRationale("");
      setErrorMessage(null);
    }
  }, [props.open]);

  async function handleConfirm(): Promise<void> {
    if (props.target === null) {
      return;
    }

    const trimmed = rationale.trim();

    if (trimmed.length === 0) {
      setErrorMessage(GOVERNANCE_MUTATION_CORRECTION_RATIONALE_REQUIRED);

      return;
    }

    setSubmitBusy(true);
    setErrorMessage(null);

    try {
      await recordGovernanceMutationCorrectionWith401Resume(
        {
          ...props.target,
          rationale: trimmed,
        },
        {
          idempotencyKey: createGovernanceMutationIdempotencyKey(),
          returnPath: livelihoodReturnPath,
        },
      );
      props.onOpenChange(false);
      props.onRecorded?.();
    } catch (error) {
      const failure = toApiLoadFailure(error);
      setErrorMessage(
        governanceMutationCorrectionBlockedReason(failure)
          ?? failure.message
          ?? GOVERNANCE_MUTATION_CORRECTION_FAILURE_MESSAGE,
      );
      if (isLivelihoodMutation401RedirectError(error)) {
        return;
      }

      setErrorMessage(toApiLoadFailure(error).message ?? GOVERNANCE_MUTATION_CORRECTION_FAILURE_MESSAGE);
    } finally {
      setSubmitBusy(false);
    }
  }

  const busy = props.busy === true || submitBusy;

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent data-testid="governance-record-correction-dialog">
        <DialogHeader>
          <DialogTitle>Record correction</DialogTitle>
          <DialogDescription>
            This writes a new audit-trail entry. The original action stays on the evidence trail.
          </DialogDescription>
        </DialogHeader>

        {errorMessage !== null ? (
          <OperatorMutationInlineError
            message={errorMessage}
            testId="governance-record-correction-inline-error"
          />
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="governance-record-correction-rationale">Correction rationale</Label>
          <Textarea
            id="governance-record-correction-rationale"
            rows={4}
            value={rationale}
            disabled={busy}
            placeholder="Explain what was mistaken and what reviewers should rely on instead."
            onChange={(event) => {
              setRationale(event.target.value);
              setErrorMessage(null);
            }}
            data-testid="governance-record-correction-rationale"
          />
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Required. This does not delete or rewrite the original audit event.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || props.target === null}
            data-testid="governance-record-correction-confirm"
            onClick={() => {
              void handleConfirm();
            }}
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                Recording…
              </span>
            ) : (
              "Record correction"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

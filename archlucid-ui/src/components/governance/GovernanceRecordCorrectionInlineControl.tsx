"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GovernanceRecordCorrectionDialog } from "@/components/governance/GovernanceRecordCorrectionDialog";
import { useGovernanceRecordCorrectionUrlSync } from "@/hooks/use-governance-record-correction-url-sync";
import { GOVERNANCE_MUTATION_CORRECTION_SUCCESS_MESSAGE } from "@/lib/governance/governance-mutation-correction-api";
import type { GovernanceMutationCorrectionTarget } from "@/lib/governance/governance-mutation-correction-api";
import { MUTATION_AMEND_ACTION_LABEL } from "@/lib/mutation-reversibility-registry";

export type GovernanceRecordCorrectionInlineControlProps = {
  readonly target: GovernanceMutationCorrectionTarget;
  readonly testId?: string;
  readonly onRecorded?: () => void;
};

/** Opens the record-correction dialog for a finalized governance mutation (LI-05). */
export function GovernanceRecordCorrectionInlineControl(
  props: GovernanceRecordCorrectionInlineControlProps,
): React.JSX.Element {
  const { correctionDialogOpen, setCorrectionDialogOpen } = useGovernanceRecordCorrectionUrlSync({
    correctionTarget: props.target,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {successMessage !== null ? (
        <p className="m-0 text-sm text-al-text-secondary" data-testid={`${props.testId ?? "governance-record-correction"}-success`}>
          {successMessage}
        </p>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        data-testid={props.testId ?? "governance-record-correction"}
        onClick={() => setCorrectionDialogOpen(true)}
      >
        {MUTATION_AMEND_ACTION_LABEL}
      </Button>
      <GovernanceRecordCorrectionDialog
        open={correctionDialogOpen}
        onOpenChange={setCorrectionDialogOpen}
        target={props.target}
        onRecorded={() => {
          setSuccessMessage(GOVERNANCE_MUTATION_CORRECTION_SUCCESS_MESSAGE);
          props.onRecorded?.();
        }}
      />
    </div>
  );
}

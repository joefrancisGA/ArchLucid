import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import type { MutableRefObject } from "react";
import type { GovernanceApprovalRequest, GovernancePromotionRecord } from "@/types/governance-workflow";

type GovernanceWorkflowDialogsProps = {
  pendingPromote: { manifestId: string; targetEnv: string } | null;
  setPendingPromote: (v: { manifestId: string; targetEnv: string } | null) => void;
  pendingPromoteRequestRef: MutableRefObject<GovernanceApprovalRequest | null>;
  promoteBusy: boolean;
  onConfirmPromote: () => void;
  pendingActivate: { activationId: string; env: string } | null;
  setPendingActivate: (v: { activationId: string; env: string } | null) => void;
  pendingActivatePromotionRef: MutableRefObject<GovernancePromotionRecord | null>;
  activateBusyId: string | null;
  onConfirmActivateFromPromotion: () => void;
};

export function GovernanceWorkflowDialogs(props: GovernanceWorkflowDialogsProps) {
  const {
    pendingPromote,
    setPendingPromote,
    pendingPromoteRequestRef,
    promoteBusy,
    onConfirmPromote,
    pendingActivate,
    setPendingActivate,
    pendingActivatePromotionRef,
    activateBusyId,
    onConfirmActivateFromPromotion,
  } = props;

  return (
    <>
      <ConfirmationDialog
        open={pendingPromote !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingPromote(null);
            pendingPromoteRequestRef.current = null;
          }
        }}
        title="Promote manifest?"
        description={
          pendingPromote !== null
            ? `Promoting manifest ${pendingPromote.manifestId} to ${pendingPromote.targetEnv}. This will replace the current active manifest in that environment.`
            : ""
        }
        variant="default"
        confirmLabel="Promote"
        busy={promoteBusy}
        onConfirm={() => {
          void onConfirmPromote();
        }}
      />

      <ConfirmationDialog
        open={pendingActivate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingActivate(null);
            pendingActivatePromotionRef.current = null;
          }
        }}
        title="Activate environment?"
        description={
          pendingActivate !== null
            ? `Activating governance pack in ${pendingActivate.env}. This will apply the pack's rules to all future governed changes.`
            : ""
        }
        variant="default"
        confirmLabel="Activate"
        busy={pendingActivate !== null && activateBusyId === pendingActivate.activationId}
        onConfirm={() => {
          void onConfirmActivateFromPromotion();
        }}
      />
    </>
  );
}

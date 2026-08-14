"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { GovernanceMutationReversibilityId } from "@/lib/mutation-reversibility-registry";
import {
  PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_CONFIRM_LABEL,
  PLATFORM_BUNDLED_POLICY_PACK_DEACTIVATE_CONFIRM_LABEL,
  platformBundledPolicyPackActivateDialogDescription,
  platformBundledPolicyPackActivateDialogTitle,
  platformBundledPolicyPackDeactivateDialogDescription,
  platformBundledPolicyPackDeactivateDialogTitle,
} from "@/lib/platform-bundled-policy-packs-page-copy";

type PlatformBundledPolicyPackActivationConfirmDialogProps = {
  readonly open: boolean;
  readonly busy: boolean;
  readonly displayName: string;
  readonly mode: "activate" | "deactivate";
  readonly acknowledgment: string;
  readonly onAcknowledgmentChange: (value: string) => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export function PlatformBundledPolicyPackActivationConfirmDialog(
  props: PlatformBundledPolicyPackActivationConfirmDialogProps,
): React.JSX.Element {
  const isDeactivate = props.mode === "deactivate";
  const acknowledgmentMatches = props.acknowledgment.trim() === props.displayName.trim();
  const reversibilityMutationId: GovernanceMutationReversibilityId = isDeactivate
    ? "platform_bundled_policy_pack_deactivate"
    : "platform_bundled_policy_pack_activate";

  return (
    <ConfirmationDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title={
        isDeactivate
          ? platformBundledPolicyPackDeactivateDialogTitle(props.displayName)
          : platformBundledPolicyPackActivateDialogTitle(props.displayName)
      }
      description={
        isDeactivate
          ? platformBundledPolicyPackDeactivateDialogDescription(props.displayName)
          : platformBundledPolicyPackActivateDialogDescription(props.displayName)
      }
      confirmLabel={
        isDeactivate
          ? PLATFORM_BUNDLED_POLICY_PACK_DEACTIVATE_CONFIRM_LABEL
          : PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_CONFIRM_LABEL
      }
      variant={isDeactivate ? "destructive" : "default"}
      busy={props.busy}
      confirmDisabled={isDeactivate && !acknowledgmentMatches}
      reversibilityMutationId={reversibilityMutationId}
      onConfirm={props.onConfirm}
      extraContent={
        isDeactivate
          ? (
              <div className="space-y-2">
                <Label
                  htmlFor="platform-bundled-policy-pack-deactivate-acknowledgment"
                  className={OPERATOR_TYPOGRAPHY.label}
                >
                  Type <span className="font-medium">{props.displayName}</span> to confirm
                </Label>
                <Input
                  id="platform-bundled-policy-pack-deactivate-acknowledgment"
                  value={props.acknowledgment}
                  autoComplete="off"
                  disabled={props.busy}
                  data-testid="platform-bundled-policy-pack-deactivate-acknowledgment-input"
                  onChange={(event) => {
                    props.onAcknowledgmentChange(event.target.value);
                  }}
                />
              </div>
            )
          : undefined
      }
    />
  );
}

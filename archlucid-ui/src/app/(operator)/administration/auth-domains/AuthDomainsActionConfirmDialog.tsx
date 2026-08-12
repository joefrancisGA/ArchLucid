"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
  AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE,
  AUTH_DOMAINS_ENFORCEMENT_WARNING,
  AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE,
  AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE,
} from "@/lib/auth-domains-confirm-copy";
import { labelForAuthDomainEnforcementMode } from "@/lib/auth-domains-enum-labels";

export type AuthDomainsPendingConfirm =
  | { readonly kind: "enable-enforcement" }
  | {
      readonly kind: "set-enforcement-mode";
      readonly displayDomain: string;
      readonly enforcementMode: string;
      readonly allowEmailOtpRecovery: boolean;
    }
  | {
      readonly kind: "recovery-remove";
      readonly normalizedRecoveryAdminEmail: string;
      readonly displayRecoveryAdminEmail: string;
      readonly warningMessage: string;
    };

type AuthDomainsActionConfirmDialogProps = {
  readonly pending: AuthDomainsPendingConfirm | null;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

function resolveDialogCopy(pending: AuthDomainsPendingConfirm | null): {
  title: string;
  description: string;
  confirmLabel: string;
} {
  if (pending === null) {
    return {
      title: "",
      description: "",
      confirmLabel: "Confirm",
    };
  }

  if (pending.kind === "enable-enforcement") {
    return {
      title: AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE,
      description: AUTH_DOMAINS_ENFORCEMENT_WARNING,
      confirmLabel: "Enable enforcement",
    };
  }

  if (pending.kind === "set-enforcement-mode") {
    const modeLabel = labelForAuthDomainEnforcementMode(pending.enforcementMode);

    return {
      title: AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE,
      description: `Require ${modeLabel} for ${pending.displayDomain}. ${AUTH_DOMAINS_ENFORCEMENT_WARNING}`,
      confirmLabel: `Set ${modeLabel}`,
    };
  }

  return {
    title: AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE,
    description: pending.warningMessage,
    confirmLabel: `Remove ${pending.displayRecoveryAdminEmail}`,
  };
}

/** Domain wrapper over {@link ConfirmationDialog} for sign-in domain enforcement confirms (TB-2364). */
export function AuthDomainsActionConfirmDialog(
  props: AuthDomainsActionConfirmDialogProps,
): React.JSX.Element {
  const copy = resolveDialogCopy(props.pending);

  return (
    <ConfirmationDialog
      open={props.pending !== null}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          props.onCancel();
        }
      }}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      variant="destructive"
      busy={props.busy}
      onConfirm={props.onConfirm}
    />
  );
}

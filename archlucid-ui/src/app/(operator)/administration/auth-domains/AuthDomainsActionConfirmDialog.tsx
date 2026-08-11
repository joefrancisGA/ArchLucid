"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE,
  AUTH_DOMAINS_ENFORCEMENT_WARNING,
  AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE,
  AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE,
} from "@/lib/auth-domains-confirm-copy";
import { labelForAuthDomainEnforcementMode } from "@/lib/auth-domains-enum-labels";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
  testId: string;
  title: string;
  description: string;
  confirmLabel: string;
} {
  if (pending === null) {
    return {
      testId: "auth-domains-confirm-dialog",
      title: "",
      description: "",
      confirmLabel: "Confirm",
    };
  }

  if (pending.kind === "enable-enforcement") {
    return {
      testId: "auth-domains-enable-confirm-dialog",
      title: AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE,
      description: AUTH_DOMAINS_ENFORCEMENT_WARNING,
      confirmLabel: "Enable enforcement",
    };
  }

  if (pending.kind === "set-enforcement-mode") {
    const modeLabel = labelForAuthDomainEnforcementMode(pending.enforcementMode);

    return {
      testId: "auth-domains-set-enforcement-confirm-dialog",
      title: AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE,
      description: `Require ${modeLabel} for ${pending.displayDomain}. ${AUTH_DOMAINS_ENFORCEMENT_WARNING}`,
      confirmLabel: `Set ${modeLabel}`,
    };
  }

  return {
    testId: "auth-domains-recovery-remove-confirm-dialog",
    title: AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE,
    description: pending.warningMessage,
    confirmLabel: `Remove ${pending.displayRecoveryAdminEmail}`,
  };
}

export function AuthDomainsActionConfirmDialog(
  props: AuthDomainsActionConfirmDialogProps,
): React.JSX.Element {
  const copy = resolveDialogCopy(props.pending);

  return (
    <AlertDialog
      open={props.pending !== null}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancel();
        }
      }}
    >
      <AlertDialogContent data-testid={copy.testId}>
        <AlertDialogHeader>
          <AlertDialogTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
            {copy.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy} data-testid="auth-domains-confirm-cancel">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={props.busy}
            data-testid="auth-domains-confirm-confirm"
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={(event) => {
              event.preventDefault();
              props.onConfirm();
            }}
          >
            {copy.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

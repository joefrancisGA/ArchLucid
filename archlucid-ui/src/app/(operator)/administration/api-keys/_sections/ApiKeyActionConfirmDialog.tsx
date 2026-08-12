"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Input } from "@/components/ui/input";
import {
  API_KEYS_CONFIRM_OVERLAP_DESCRIPTION,
  API_KEYS_CONFIRM_OVERLAP_TITLE,
  API_KEYS_CONFIRM_ROTATE_ADMIN_DESCRIPTION,
  API_KEYS_CONFIRM_ROTATE_ADMIN_TITLE,
  API_KEYS_CONFIRM_ROTATE_READONLY_DESCRIPTION,
  API_KEYS_CONFIRM_ROTATE_READONLY_TITLE,
  API_KEYS_CONFIRM_TYPE_PHRASE_ADMIN,
} from "@/lib/api-keys-settings-copy";
import type { ApiKeyPendingAction } from "@/lib/api-keys-settings-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ApiKeyActionConfirmDialogProps = {
  readonly pendingAction: ApiKeyPendingAction | null;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

function resolveDialogCopy(pendingAction: ApiKeyPendingAction | null): {
  title: string;
  description: string;
  confirmLabel: string;
  variant: "destructive" | "default";
  requireTypedPhrase: string | null;
} {
  if (pendingAction === null) {
    return {
      title: "",
      description: "",
      confirmLabel: "Confirm",
      variant: "default",
      requireTypedPhrase: null,
    };
  }

  if (pendingAction.kind === "rotate_admin") {
    return {
      title: API_KEYS_CONFIRM_ROTATE_ADMIN_TITLE,
      description: API_KEYS_CONFIRM_ROTATE_ADMIN_DESCRIPTION,
      confirmLabel: API_KEYS_CONFIRM_TYPE_PHRASE_ADMIN,
      variant: "destructive",
      requireTypedPhrase: API_KEYS_CONFIRM_TYPE_PHRASE_ADMIN,
    };
  }

  if (pendingAction.kind === "rotate_readonly") {
    return {
      title: API_KEYS_CONFIRM_ROTATE_READONLY_TITLE,
      description: API_KEYS_CONFIRM_ROTATE_READONLY_DESCRIPTION,
      confirmLabel: "Rotate read-only key",
      variant: "default",
      requireTypedPhrase: null,
    };
  }

  return {
    title: API_KEYS_CONFIRM_OVERLAP_TITLE,
    description: API_KEYS_CONFIRM_OVERLAP_DESCRIPTION,
    confirmLabel: "Issue overlap key",
    variant: "default",
    requireTypedPhrase: null,
  };
}

/** Domain wrapper over {@link ConfirmationDialog} for API key rotation confirms (TB-2365). */
export function ApiKeyActionConfirmDialog(props: ApiKeyActionConfirmDialogProps): React.JSX.Element {
  const [typedPhrase, setTypedPhrase] = useState("");
  const copy = useMemo(() => resolveDialogCopy(props.pendingAction), [props.pendingAction]);
  const phraseMatches =
    copy.requireTypedPhrase === null || typedPhrase.trim() === copy.requireTypedPhrase;

  return (
    <ConfirmationDialog
      open={props.pendingAction !== null}
      onOpenChange={(open) => {
        if (!open && !props.busy) {
          setTypedPhrase("");
          props.onCancel();
        }
      }}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      variant={copy.variant}
      busy={props.busy}
      confirmDisabled={!phraseMatches}
      onConfirm={props.onConfirm}
      extraContent={
        copy.requireTypedPhrase !== null ? (
          <div className="space-y-2">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Type <span className="font-medium text-al-text-primary">{copy.requireTypedPhrase}</span> to confirm.
            </p>
            <Input
              value={typedPhrase}
              onChange={(event) => setTypedPhrase(event.target.value)}
              aria-label="Confirmation phrase"
              data-testid="api-key-confirm-phrase"
              autoComplete="off"
            />
          </div>
        ) : null
      }
    />
  );
}

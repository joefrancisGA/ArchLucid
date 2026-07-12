"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
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

export function ApiKeyActionConfirmDialog(props: ApiKeyActionConfirmDialogProps): React.JSX.Element {
  const [typedPhrase, setTypedPhrase] = useState("");
  const copy = useMemo(() => resolveDialogCopy(props.pendingAction), [props.pendingAction]);
  const phraseMatches =
    copy.requireTypedPhrase === null || typedPhrase.trim() === copy.requireTypedPhrase;
  const isDestructive = copy.variant === "destructive";

  return (
    <AlertDialog
      open={props.pendingAction !== null}
      onOpenChange={(open) => {
        if (!open) {
          setTypedPhrase("");
          props.onCancel();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        {copy.requireTypedPhrase !== null ? (
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
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={props.busy || !phraseMatches}
            className={cn(
              !isDestructive &&
                "border-transparent bg-neutral-900 text-neutral-50 shadow-sm hover:bg-neutral-800 hover:text-neutral-50 focus-visible:ring-neutral-400 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 dark:focus-visible:ring-neutral-500",
            )}
            onClick={props.onConfirm}
          >
            {props.busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                Processing…
              </span>
            ) : (
              copy.confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { MutationReversibilityNotice } from "@/components/operator/MutationReversibilityNotice";
import type { GovernanceMutationReversibilityId } from "@/lib/mutation-reversibility-registry";

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

export type ConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  busy?: boolean;
  /** When true, keeps the confirm action disabled (e.g. typed-phrase gates). */
  confirmDisabled?: boolean;
  /** Rendered after the description and before the footer (e.g. optional checkboxes). */
  extraContent?: ReactNode;
  /** When set, renders governed-mutation reversibility copy before the footer (TB-2148). */
  reversibilityMutationId?: GovernanceMutationReversibilityId;
};

const defaultConfirmLabel = "Confirm";
const defaultCancelLabel = "Cancel";

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = defaultConfirmLabel,
  cancelLabel = defaultCancelLabel,
  variant = "destructive",
  onConfirm,
  busy = false,
  confirmDisabled = false,
  extraContent,
  reversibilityMutationId,
}: ConfirmationDialogProps) {
  const resolvedConfirmLabel = confirmLabel;
  const isDestructive = variant === "destructive";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {extraContent ?? null}
        {reversibilityMutationId !== undefined ? (
          <MutationReversibilityNotice mutationId={reversibilityMutationId} className="mt-2" />
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy || confirmDisabled}
            className={cn(
              !isDestructive &&
                "border-transparent bg-neutral-900 text-neutral-50 shadow-sm hover:bg-neutral-800 hover:text-neutral-50 focus-visible:ring-neutral-400 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 dark:focus-visible:ring-neutral-500",
            )}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin"
                  aria-hidden
                />
                Processing…
              </span>
            ) : (
              resolvedConfirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

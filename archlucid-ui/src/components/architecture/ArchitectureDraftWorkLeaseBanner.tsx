"use client";

import { useState } from "react";

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
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_DRAFT_WORK_LEASE_HELD_BY_OTHER_BODY,
  ARCHITECTURE_DRAFT_WORK_LEASE_HELD_BY_OTHER_TITLE,
  ARCHITECTURE_DRAFT_WORK_LEASE_LOST_BODY,
  ARCHITECTURE_DRAFT_WORK_LEASE_LOST_TITLE,
  ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CANCEL_ACTION,
  ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_ACTION,
  ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_BODY,
  ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_TITLE,
} from "@/lib/architecture/architecture-draft-work-lease-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureDraftWorkLeaseBannerProps = {
  readonly heldByOther: boolean;
  readonly leaseLost: boolean;
  readonly holderActorOid?: string | null;
  readonly expiresUtc?: string | null;
  readonly stealBusy: boolean;
  readonly stealError: string | null;
  readonly onStealLease: () => void;
  readonly className?: string;
};

export function ArchitectureDraftWorkLeaseBanner(
  props: ArchitectureDraftWorkLeaseBannerProps,
): React.JSX.Element | null {
  const [stealDialogOpen, setStealDialogOpen] = useState(false);

  if (!props.heldByOther && !props.leaseLost) {
    return null;
  }

  const title = props.leaseLost
    ? ARCHITECTURE_DRAFT_WORK_LEASE_LOST_TITLE
    : ARCHITECTURE_DRAFT_WORK_LEASE_HELD_BY_OTHER_TITLE;

  const body = props.leaseLost
    ? ARCHITECTURE_DRAFT_WORK_LEASE_LOST_BODY
    : ARCHITECTURE_DRAFT_WORK_LEASE_HELD_BY_OTHER_BODY;

  const holderLabel = props.holderActorOid?.trim() || "Another architect";
  const expiresLabel =
    props.expiresUtc && props.expiresUtc.length > 0
      ? new Date(props.expiresUtc).toLocaleString()
      : null;

  return (
    <>
      <div
        role="status"
        data-testid="architecture-draft-work-lease-banner"
        className={cn(
          "rounded-lg border border-al-border bg-al-surface-raised px-4 py-3",
          props.className,
        )}
      >
        <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{title}</p>
        <p className={cn("mt-2 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{body}</p>
        {!props.leaseLost ? (
          <p className={cn("mt-2 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Holder: {holderLabel}
            {expiresLabel !== null ? ` · lease expires about ${expiresLabel}` : null}
          </p>
        ) : null}
        {props.stealError !== null ? (
          <p className="mt-2 text-sm text-al-danger">{props.stealError}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={props.stealBusy}
            data-testid="architecture-draft-work-lease-steal-open"
            onClick={() => {
              setStealDialogOpen(true);
            }}
          >
            {ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_ACTION}
          </Button>
        </div>
      </div>

      <AlertDialog open={stealDialogOpen} onOpenChange={setStealDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>{ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_BODY}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CANCEL_ACTION}</AlertDialogCancel>
            <AlertDialogAction
              disabled={props.stealBusy}
              onClick={() => {
                props.onStealLease();
                setStealDialogOpen(false);
              }}
            >
              {ARCHITECTURE_DRAFT_WORK_LEASE_STEAL_CONFIRM_ACTION}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

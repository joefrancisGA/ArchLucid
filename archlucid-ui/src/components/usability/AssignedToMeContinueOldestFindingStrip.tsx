"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { GovernanceAssignedToMeOldestFindingTarget } from "@/lib/governance/resolve-governance-assigned-to-me-oldest-finding";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archlucid_assigned_to_me_continue_oldest_finding_strip_dismissed_v1";

export type AssignedToMeContinueOldestFindingStripProps = {
  readonly target: GovernanceAssignedToMeOldestFindingTarget;
  readonly href: string;
};

/** Dismissible strip routing assignees to their oldest open finding. */
export function AssignedToMeContinueOldestFindingStrip(
  props: AssignedToMeContinueOldestFindingStripProps,
): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    setVisible(false);
  }, []);

  if (!visible) {
    return null;
  }

  const agingLabel =
    props.target.agingDays !== null && props.target.agingDays >= 0
      ? `${props.target.agingDays} day${props.target.agingDays === 1 ? "" : "s"} open`
      : "longest open";

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="assigned-to-me-continue-oldest-finding-strip"
      role="note"
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 font-medium text-al-text-primary">Continue with your oldest assignment</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">{props.target.findingTitle}</span> has been assigned the
          longest ({agingLabel}).
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          asChild
          data-testid="assigned-to-me-continue-oldest-finding-action"
        >
          <Link href={props.href}>Open finding</Link>
        </Button>
        <DismissControl className="h-7" onDismiss={onDismiss} />
      </div>
    </div>
  );
}

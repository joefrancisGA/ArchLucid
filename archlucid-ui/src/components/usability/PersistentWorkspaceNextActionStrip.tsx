"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";
import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";
import { resolveCorePilotStepPresentation } from "@/lib/core-pilot-step-presentation";
import { resolvePersistentWorkspaceNextAction } from "@/lib/persistent-workspace-next-action";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Cross-page strip: one highlighted next action while first-review steps remain. */
export function PersistentWorkspaceNextActionStrip(): React.JSX.Element | null {
  const [hydrated, setHydrated] = useState(false);
  const commitPresentationContext = useCorePilotCommitPresentationContext();
  const { progress, nextStepIndex, isPending } = useCorePilotDerivedStepStatus();

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated || isPending) {
    return null;
  }

  const nextPresentation =
    nextStepIndex !== null
      ? resolveCorePilotStepPresentation(nextStepIndex, commitPresentationContext)
      : null;

  const action = resolvePersistentWorkspaceNextAction(
    progress,
    nextPresentation?.href ?? null,
    nextPresentation?.label ?? null,
  );

  if (action === null) {
    return null;
  }

  return (
    <div
      className="mb-3 flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/50 sm:flex-row sm:items-center sm:justify-between"
      data-testid="persistent-workspace-next-action-strip"
      role="status"
    >
      <div className="min-w-0 space-y-0.5">
        <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.body)}>
          {action.headline}
        </p>
        {action.detail !== null ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{action.detail}</p>
        ) : null}
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="persistent-workspace-next-action-cta">
        <Link href={action.href}>{action.actionLabel}</Link>
      </Button>
    </div>
  );
}

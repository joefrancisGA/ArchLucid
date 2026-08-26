"use client";

import Link from "next/link";

import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Empty-register CTA routing operators to submit approval for the workspace active review. */
export function DecisionRegisterWorkspaceActiveApprovalStrip(): React.JSX.Element | null {
  const workspaceRun = useWorkspaceActiveRun();
  const runId = (workspaceRun?.activeRunId?.trim() ?? "");

  if (runId.length === 0) {
    return null;
  }

  const href = `/governance/approval-queue?runId=${encodeURIComponent(runId)}`;

  return (
    <section
      className={cn(
        "mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="decision-register-workspace-active-approval-strip"
      role="note"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Record your first decision</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Submit an approval for the workspace active review to seed the decision register.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="decision-register-workspace-active-approval-action">
        <Link href={href}>Submit approval</Link>
      </Button>
    </section>
  );
}

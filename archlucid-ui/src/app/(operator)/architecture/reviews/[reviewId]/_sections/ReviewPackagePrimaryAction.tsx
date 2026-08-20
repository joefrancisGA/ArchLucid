"use client";

import Link from "next/link";

import { CommitRunButton } from "@/components/CommitRunButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ReviewPackagePrimaryAction } from "./resolve-review-package-primary-action";

export type ReviewPackagePrimaryActionProps = {
  readonly action: ReviewPackagePrimaryAction;
  readonly runId: string;
  readonly hasGoldenManifest: boolean;
  readonly commitBlockedReason: string | null | undefined;
  /** Secondary placement when Do this next owns the page primary (TB-2175). */
  readonly demoted?: boolean;
};

/** Single green primary next-action control for the Review Package summary header (TB-618). */
export function ReviewPackagePrimaryAction(props: ReviewPackagePrimaryActionProps): React.JSX.Element {
  const { action, runId, hasGoldenManifest, commitBlockedReason, demoted = false } = props;
  const linkVariant = demoted ? "outline" : "primary";
  const commitVariant = demoted ? "outline" : "primary";

  switch (action.kind) {
    case "finalize-package":
      return (
        <div data-testid="review-package-primary-action" data-review-package-primary-action-kind={action.kind}>
          <CommitRunButton
            runId={runId}
            disabled={hasGoldenManifest}
            commitBlockedReason={commitBlockedReason}
            buttonVariant={commitVariant}
          />
        </div>
      );
    case "review-findings":
    case "add-evidence":
    case "send-to-sponsor":
    case "open-governance-decision": {
      if (action.href === null) {
        throw new Error(`Primary action ${action.kind} requires an href.`);
      }

      return (
        <div data-testid="review-package-primary-action" data-review-package-primary-action-kind={action.kind}>
          <Link
            className={cn(buttonVariants({ variant: linkVariant, size: "sm" }))}
            href={action.href}
          >
            {action.label}
          </Link>
        </div>
      );
    }
    default: {
      const unreachable: never = action.kind;
      throw new Error(`Unhandled primary action ${unreachable}.`);
    }
  }
}

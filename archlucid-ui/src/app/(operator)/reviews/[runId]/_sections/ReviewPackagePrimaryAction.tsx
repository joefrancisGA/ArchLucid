"use client";

import Link from "next/link";

import { CommitRunButton } from "@/components/CommitRunButton";
import { Button } from "@/components/ui/button";

import type { ReviewPackagePrimaryAction } from "./resolve-review-package-primary-action";

export type ReviewPackagePrimaryActionProps = {
  readonly action: ReviewPackagePrimaryAction;
  readonly runId: string;
  readonly hasGoldenManifest: boolean;
  readonly commitBlockedReason: string | null | undefined;
};

/** Single green primary next-action control for the Review Package summary header (TB-618). */
export function ReviewPackagePrimaryAction(props: ReviewPackagePrimaryActionProps): React.JSX.Element {
  const { action, runId, hasGoldenManifest, commitBlockedReason } = props;

  switch (action.kind) {
    case "finalize-package":
      return (
        <div data-testid="review-package-primary-action" data-review-package-primary-action-kind={action.kind}>
          <CommitRunButton
            runId={runId}
            disabled={hasGoldenManifest}
            commitBlockedReason={commitBlockedReason}
            buttonVariant="primary"
          />
        </div>
      );
    case "review-findings":
    case "add-evidence":
    case "export-proof-packet":
    case "open-governance-decision": {
      if (action.href === null) {
        throw new Error(`Primary action ${action.kind} requires an href.`);
      }

      return (
        <div data-testid="review-package-primary-action" data-review-package-primary-action-kind={action.kind}>
          <Button type="button" variant="primary" size="sm" asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        </div>
      );
    }
    default: {
      const unreachable: never = action.kind;
      throw new Error(`Unhandled primary action ${unreachable}.`);
    }
  }
}

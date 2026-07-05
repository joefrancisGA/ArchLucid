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

  if (action.kind === "finalize-package") {
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
  }

  if (action.href === null) {
    const unreachable: never = action.kind;
    throw new Error(`Primary action ${unreachable} requires an href or finalize handler.`);
  }

  return (
    <div data-testid="review-package-primary-action" data-review-package-primary-action-kind={action.kind}>
      <Button type="button" variant="primary" size="sm" asChild>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </div>
  );
}

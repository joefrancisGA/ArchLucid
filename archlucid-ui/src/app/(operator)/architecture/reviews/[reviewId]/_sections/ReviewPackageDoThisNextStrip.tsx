"use client";

import Link from "next/link";

import { CommitRunButton } from "@/components/CommitRunButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { ReviewPackageDoThisNext } from "./resolve-review-package-do-this-next";

export type ReviewPackageDoThisNextStripProps = {
  readonly next: ReviewPackageDoThisNext;
  readonly runId: string;
  readonly hasGoldenManifest: boolean;
  readonly commitBlockedReason: string | null | undefined;
};

/** TB-2175: above-fold one-sentence next step with a single primary CTA for review package detail. */
export function ReviewPackageDoThisNextStrip(
  props: ReviewPackageDoThisNextStripProps,
): React.JSX.Element {
  const { next, runId, hasGoldenManifest, commitBlockedReason } = props;
  const buttonVariant = next.buttonVariant ?? "primary";

  return (
    <section
      className={cn(DESIGN_TOKENS.callout.info, "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between")}
      data-testid="review-package-do-this-next-strip"
      aria-labelledby="review-package-do-this-next-heading"
    >
      <div className="min-w-0 space-y-1">
        <h2
          id="review-package-do-this-next-heading"
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Do this next
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="review-package-do-this-next-sentence">
          {next.sentence}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end" data-testid="review-package-do-this-next-action" data-review-package-do-this-next-kind={next.kind}>
        {next.kind === "finalize-package" ? (
          <CommitRunButton
            runId={runId}
            disabled={hasGoldenManifest}
            commitBlockedReason={commitBlockedReason}
            buttonVariant="primary"
          />
        ) : next.href !== null ? (
          <Button type="button" variant={buttonVariant} size="sm" asChild>
            <Link href={next.href}>{next.actionLabel}</Link>
          </Button>
        ) : (
          <span className={cn(buttonVariants({ variant: buttonVariant, size: "sm" }), "pointer-events-none opacity-60")}>
            {next.actionLabel}
          </span>
        )}
        {next.secondaryAction !== null && next.secondaryAction !== undefined ? (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={next.secondaryAction.href} data-testid="review-package-do-this-next-secondary-action">
              {next.secondaryAction.label}
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

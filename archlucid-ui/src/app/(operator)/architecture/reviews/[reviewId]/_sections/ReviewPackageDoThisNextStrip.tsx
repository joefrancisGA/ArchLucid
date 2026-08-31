"use client";

import Link from "next/link";

import { CommitRunButton } from "@/components/CommitRunButton";
import {
  OperatorErrorCallout,
  OperatorWarningCallout,
} from "@/components/operator/OperatorShellMessage";
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

function ReviewFailureRecoveryDetails(props: {
  readonly failureRecovery: NonNullable<ReviewPackageDoThisNext["failureRecovery"]>;
}): React.JSX.Element {
  const { failureRecovery } = props;
  const Callout =
    failureRecovery.severity === "warning" ? OperatorWarningCallout : OperatorErrorCallout;

  return (
    <div className="mt-3 space-y-3" data-testid="review-package-failure-recovery">
      <Callout>
        <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)} data-testid="review-package-failure-headline">
          {failureRecovery.headline}
        </p>
        {failureRecovery.detail !== null ? (
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)} data-testid="review-package-failure-detail">
            {failureRecovery.detail}
          </p>
        ) : null}
      </Callout>

      <div data-testid="review-package-failure-recovery-steps">
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          What to do
        </p>
        <ol className={cn("m-0 mt-2 list-decimal space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {failureRecovery.recoverySteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {failureRecovery.suggestSupportTicket ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-package-failure-support-hint">
          If these steps do not resolve the failure,{" "}
          <Link href={failureRecovery.supportHref} className="text-al-link underline-offset-2 hover:underline">
            open a support ticket via Report a problem
          </Link>{" "}
          and include this review id.
        </p>
      ) : null}
    </div>
  );
}

/** TB-2175: above-fold one-sentence next step with a single primary CTA for review package detail. */
export function ReviewPackageDoThisNextStrip(
  props: ReviewPackageDoThisNextStripProps,
): React.JSX.Element {
  const { next, runId, hasGoldenManifest, commitBlockedReason } = props;
  const buttonVariant = next.buttonVariant ?? "primary";

  return (
    <section
      className={cn(DESIGN_TOKENS.callout.info, "flex flex-col gap-3 p-4")}
      data-testid="review-package-do-this-next-strip"
      aria-labelledby="review-package-do-this-next-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
      </div>

      {next.failureRecovery !== null && next.failureRecovery !== undefined ? (
        <ReviewFailureRecoveryDetails failureRecovery={next.failureRecovery} />
      ) : null}
    </section>
  );
}

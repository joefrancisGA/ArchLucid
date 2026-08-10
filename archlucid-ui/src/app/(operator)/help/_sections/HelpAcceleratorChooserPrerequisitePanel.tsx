"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import type { AcceleratorChooserPrerequisitePresentationWithRetry } from "@/hooks/use-accelerator-chooser-prerequisite-presentation";
import { ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_SCOPE } from "@/lib/accelerator-chooser-help-evidence-copy";
import {
  ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS,
  ACCELERATOR_CHOOSER_HELP_PREREQUISITE,
  ACCELERATOR_CHOOSER_HELP_PREREQUISITE_TENANT_STATE,
} from "@/lib/accelerator-chooser-help-guide-content";
import {
  prerequisiteBorderAccentClass,
  prerequisiteNeedsPrimaryFirstReviewAction,
  prerequisiteNeedsPrimaryGreenfieldAction,
  prerequisiteNeedsRetryAction,
} from "@/lib/accelerator-chooser-pack-prerequisite";
import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";
import { OPERATOR_CARD, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { cn } from "@/lib/utils";

type HelpAcceleratorChooserPrerequisitePanelProps = {
  readonly presentation: AcceleratorChooserPrerequisitePresentationWithRetry;
};

function prerequisiteStatusTag(status: AcceleratorChooserPrerequisiteStatus): React.ReactElement {
  switch (status) {
    case "checking":
      return <StatusTag kind="in-progress" label="Checking" data-testid="help-accelerator-chooser-prerequisite-status" />;
    case "met":
      return <StatusTag kind="ready" label="Met" data-testid="help-accelerator-chooser-prerequisite-status" />;
    case "not-met":
      return <StatusTag kind="blocked" label="Not met" data-testid="help-accelerator-chooser-prerequisite-status" />;
    case "unknown":
      return <StatusTag kind="neutral" label="Unknown" data-testid="help-accelerator-chooser-prerequisite-status" />;
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

function prerequisiteTenantStateCopy(status: AcceleratorChooserPrerequisiteStatus): string {
  switch (status) {
    case "checking":
      return ACCELERATOR_CHOOSER_HELP_PREREQUISITE_TENANT_STATE.checking;
    case "met":
      return ACCELERATOR_CHOOSER_HELP_PREREQUISITE_TENANT_STATE.met;
    case "not-met":
      return ACCELERATOR_CHOOSER_HELP_PREREQUISITE_TENANT_STATE.notMet;
    case "unknown":
      return ACCELERATOR_CHOOSER_HELP_PREREQUISITE_TENANT_STATE.unknown;
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

/** Prerequisite panel with live tenant signed-review-record state for `/help/accelerator-chooser`. */
export function HelpAcceleratorChooserPrerequisitePanel(
  props: HelpAcceleratorChooserPrerequisitePanelProps,
): React.ReactElement {
  const { presentation } = props;
  const elevateGreenfield = prerequisiteNeedsPrimaryGreenfieldAction(presentation.status);
  const elevateFirstReviewHelp = prerequisiteNeedsPrimaryFirstReviewAction(presentation.status);
  const showRetry = prerequisiteNeedsRetryAction(presentation.status);

  return (
    <Card
      className={cn(
        "border border-neutral-200 border-l-[3px] bg-white dark:border-neutral-800 dark:bg-neutral-950",
        prerequisiteBorderAccentClass(presentation.status),
      )}
      data-testid="help-accelerator-chooser-action-panel"
    >
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Before you pick a pack</CardTitle>
        <p
          className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="help-accelerator-chooser-claim-discipline-scope"
        >
          {ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_SCOPE}
        </p>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {ACCELERATOR_CHOOSER_HELP_PREREQUISITE}
        </p>
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="help-accelerator-chooser-prerequisite-tenant-state"
          aria-live="polite"
          aria-atomic="true"
        >
          {prerequisiteStatusTag(presentation.status)}
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {prerequisiteTenantStateCopy(presentation.status)}
          </p>
          {presentation.signedRecordHref !== null ? (
            <Link
              href={presentation.signedRecordHref}
              className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-accelerator-chooser-prerequisite-signed-record-link"
            >
              Open most recent {BUYER_SURFACE_VOCABULARY.signedReviewRecord.toLowerCase()}
            </Link>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showRetry ? (
            <Button
              type="button"
              size="sm"
              variant="primary"
              data-testid="help-accelerator-chooser-prerequisite-retry"
              onClick={() => {
                presentation.retry();
              }}
            >
              Retry prerequisite check
            </Button>
          ) : null}
          {elevateGreenfield ? (
            <>
              <Button
                asChild
                size="sm"
                variant="primary"
                data-testid="help-accelerator-chooser-baseline-review-action"
              >
                <Link href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.baselineReview.href}>
                  {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.baselineReview.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.href}>
                  {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label}
                </Link>
              </Button>
            </>
          ) : null}
          {!elevateGreenfield && elevateFirstReviewHelp ? (
            <>
              <Button
                asChild
                size="sm"
                variant="primary"
                data-testid="help-accelerator-chooser-first-review-action"
              >
                <Link href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.href}>
                  {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.pathChooser.href}>
                  {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.pathChooser.label}
                </Link>
              </Button>
            </>
          ) : null}
          {!elevateGreenfield && !elevateFirstReviewHelp && !showRetry ? (
            <>
              <Button
                asChild
                size="sm"
                variant="outline"
                data-testid="help-accelerator-chooser-first-review-action"
              >
                <Link href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.href}>
                  {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.pathChooser.href}>
                  {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.pathChooser.label}
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

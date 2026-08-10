"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import {
  ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS,
  ACCELERATOR_CHOOSER_HELP_PREREQUISITE,
  ACCELERATOR_CHOOSER_HELP_PREREQUISITE_TENANT_STATE,
} from "@/lib/accelerator-chooser-help-guide-content";
import {
  resolveAcceleratorChooserPrerequisitePresentation,
  type AcceleratorChooserPrerequisiteStatus,
} from "@/lib/resolve-accelerator-chooser-prerequisite-status";
import { OPERATOR_CARD, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { resolveGoldenManifestIdForRun } from "@/lib/resolve-golden-manifest-id-for-run";
import { cn } from "@/lib/utils";

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
export function HelpAcceleratorChooserPrerequisitePanel(): React.ReactElement {
  const commitQuery = useCorePilotCommitContextQuery();
  const committedRunId = commitQuery.data?.firstCommittedRunId ?? null;

  const manifestQuery = useQuery({
    queryKey: [...operatorQueryKeys.corePilotCommitContext, "prerequisite-manifest", committedRunId],
    queryFn: () => resolveGoldenManifestIdForRun(committedRunId!),
    enabled: committedRunId !== null && commitQuery.data?.hasCommittedManifest === true,
  });

  const presentation = resolveAcceleratorChooserPrerequisitePresentation({
    commitQueryPending: commitQuery.isPending,
    commitQueryError: commitQuery.isError,
    commitContext: commitQuery.data,
    manifestQueryPending:
      committedRunId !== null
      && commitQuery.data?.hasCommittedManifest === true
      && manifestQuery.isPending,
    manifestId: manifestQuery.data,
  });

  return (
    <Card
      className="border border-neutral-200 border-l-[3px] border-l-neutral-300 bg-white dark:border-neutral-800 dark:border-l-neutral-600 dark:bg-neutral-950"
      data-testid="help-accelerator-chooser-action-panel"
    >
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Before you pick a pack</CardTitle>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {ACCELERATOR_CHOOSER_HELP_PREREQUISITE}
        </p>
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="help-accelerator-chooser-prerequisite-tenant-state"
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
          <Button asChild size="sm" variant="outline">
            <Link href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.href}>
              {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label}
            </Link>
          </Button>
          <Link
            href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.pathChooser.href}
            className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}
          >
            {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.pathChooser.label}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { cn } from "@/lib/utils";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { useGovernancePostureQuery } from "@/hooks/use-governance-posture-query";
import type { PillarPosture } from "@/lib/api/governance-stickiness-api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import {
  pillarExaminationStatusLabel,
  pillarExaminationStatusTagKind,
  pillarFindingCount,
} from "@/lib/governance/posture-presentation";
import { operatorLastRefreshedExactLabel } from "@/lib/operator/operator-last-refreshed-label";

export type ArchitecturePosturePillarOverviewProps = {
  readonly projectId?: string;
  readonly enabled?: boolean;
};

function PillarPostureTile(props: {
  readonly pillar: PillarPosture;
  readonly isPrimary: boolean;
}): React.JSX.Element {
  const findingCount = pillarFindingCount(props.pillar.findingCounts);
  const examinationState = props.pillar.examination.state;

  return (
    <article
      className={cn(
        "rounded-md border border-al-border bg-al-surface-raised p-3",
        props.isPrimary ? "ring-2 ring-amber-500/70 dark:ring-amber-400/60" : null,
      )}
      data-testid={`architecture-posture-pillar-${props.pillar.pillarKey}`}
      data-primary-pillar={props.isPrimary ? "true" : "false"}
      aria-label={`${props.pillar.displayName}: ${finiteIntegerCountDisplay(findingCount)} findings`}
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        {props.pillar.displayName}
      </p>
      <p
        className={cn("m-0 mt-1 font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.dataValue)}
        data-testid={`architecture-posture-pillar-count-${props.pillar.pillarKey}`}
      >
        {finiteIntegerCountDisplay(findingCount)}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
        {findingCount === 1 ? "finding" : "findings"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusTag
          kind={pillarExaminationStatusTagKind(examinationState)}
          label={pillarExaminationStatusLabel(examinationState)}
          data-testid={`architecture-posture-examination-${props.pillar.pillarKey}`}
        />
      </div>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
        {props.pillar.examination.reasonText}
      </p>
    </article>
  );
}

export function ArchitecturePosturePillarOverview(
  props: ArchitecturePosturePillarOverviewProps,
): React.JSX.Element | null {
  const postureQuery = useGovernancePostureQuery({
    projectId: props.projectId,
    enabled: props.enabled ?? true,
  });

  if (props.enabled === false) {
    return null;
  }

  if (postureQuery.isPending && !postureQuery.data) {
    return (
      <section
        className={cn("rounded-md border border-al-border bg-al-surface px-4 py-3", OPERATOR_LAYOUT.sectionStack)}
        data-testid="architecture-posture-pillar-overview"
        aria-labelledby="architecture-posture-heading"
      >
        <h2 id="architecture-posture-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Architecture posture
        </h2>
        <OperatorLoadingNotice>
          <strong>Loading architecture posture.</strong>
        </OperatorLoadingNotice>
      </section>
    );
  }

  if (postureQuery.isError) {
    const failure = toApiLoadFailure(postureQuery.error);

    return (
      <section
        className={cn("rounded-md border border-al-border bg-al-surface px-4 py-3", OPERATOR_LAYOUT.sectionStack)}
        data-testid="architecture-posture-pillar-overview"
        aria-labelledby="architecture-posture-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="architecture-posture-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            Architecture posture
          </h2>
          <RefreshButton
            label="Retry posture load"
            onClick={() => {
              void postureQuery.refetch();
            }}
            busy={postureQuery.isFetching}
          />
        </div>
        <OperatorApiProblem failure={failure} variant="warning" />
      </section>
    );
  }

  const summary = postureQuery.data;

  if (!summary) {
    return null;
  }

  const snapshotFreshness =
    summary.latestSnapshotCreatedUtc !== null
      ? operatorLastRefreshedExactLabel(new Date(summary.latestSnapshotCreatedUtc))
      : undefined;

  const sortedPillars = [...summary.pillars].sort((left, right) => left.displayOrder - right.displayOrder);

  return (
    <section
      className={cn("rounded-md border border-al-border bg-al-surface px-4 py-3", OPERATOR_LAYOUT.sectionStack)}
      data-testid="architecture-posture-pillar-overview"
      aria-labelledby="architecture-posture-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="architecture-posture-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            Architecture posture
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Pack-driven examination by architecture pillar — counts only, no score.
            {snapshotFreshness !== undefined ? ` Latest review snapshot: ${snapshotFreshness}.` : null}
            {summary.uncategorizedCount > 0
              ? ` ${finiteIntegerCountDisplay(summary.uncategorizedCount)} uncategorized findings.`
              : null}
          </p>
        </div>
        <RefreshButton
          label="Refresh posture"
          onClick={() => {
            void postureQuery.refetch();
          }}
          busy={postureQuery.isFetching}
        />
      </div>

      {summary.isDegraded ? (
        <OperatorApiProblem
          problem={null}
          fallbackMessage="Posture summary is temporarily degraded. Counts may be incomplete until the next review snapshot."
          variant="warning"
        />
      ) : null}

      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7"
        data-testid="architecture-posture-pillar-grid"
      >
        {sortedPillars.map((pillar) => (
          <PillarPostureTile
            key={pillar.pillarKey}
            pillar={pillar}
            isPrimary={summary.primaryPillarKey === pillar.pillarKey}
          />
        ))}
      </div>
    </section>
  );
}

"use client";

import type { ReactElement } from "react";

import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorStickinessSnapshotCard } from "@/components/operator/OperatorStickinessSnapshotCard";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { countUnlinkedArchitectureDraftRegistryEntries } from "@/lib/architecture/architecture-draft-registry";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { resolveOperatorHomeWorkspacePhase } from "@/lib/resolve-operator-home-workspace-phase";

/**
 * TB-2191 — operator-home return-visit block: pilot and repeat-usage snapshot fed by
 * `GET /v1/tenant/customer-success/stickiness-snapshot`.
 *
 * TB-2232 — recommended next steps moved to `OperatorHomeCanonicalNextActionSlot` in the
 * command center hero so home shows one guidance widget.
 *
 * TB-2331 — hide on first-session eval-empty so stickiness does not compete with the hero onboarding spine.
 */
export function OperatorHomeStickinessCockpit(): ReactElement | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const { hasWorkspaceReviews, hasOverviewReviewRows } = useOperatorHomeWorkspaceActivity();
  const draftEntries = useArchitectureDraftRegistryEntries();
  const commitQuery = useCorePilotCommitContextQuery();
  const workspacePhase = resolveOperatorHomeWorkspacePhase({
    hasWorkspaceReviews,
    hasOverviewReviewRows,
    draftCount: countUnlinkedArchitectureDraftRegistryEntries(draftEntries),
    hasCommittedManifest:
      hasCommittedArchitectureReview || commitQuery.data?.hasCommittedManifest === true,
    openFindingsCount: 0,
    governanceWarningsCount: 0,
  });

  if (workspacePhase === "eval-empty") {
    return null;
  }

  return (
    <div
      className={OPERATOR_LAYOUT.majorSectionGap}
      data-testid="operator-home-stickiness-cockpit"
      data-attention-partition="unfinished-work"
    >
      <OperatorStickinessSnapshotCard />
    </div>
  );
}

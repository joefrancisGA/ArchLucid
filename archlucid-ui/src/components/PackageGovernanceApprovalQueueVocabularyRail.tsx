"use client";

import type { JSX } from "react";

import { ExternalPeerVocabularyRailFromModel } from "@/components/vocabulary/ExternalPeerVocabularyRailFromModel";
import {
  buildPackageGovernanceApprovalQueuePairwiseRail,
  type PackageGovernanceApprovalQueueSurfaceId,
  type PackageGovernanceApprovalQueueVocabularyModel,
} from "@/lib/vocabulary/package-governance-approval-queue-vocabulary";

export type PackageGovernanceApprovalQueueVocabularyRailProps = {
  readonly currentSurfaceId: PackageGovernanceApprovalQueueSurfaceId;
  /** Required on package Governance / Policies tabs so the current link is run-scoped. */
  readonly runId?: string | null;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: PackageGovernanceApprovalQueueVocabularyModel;
};

/** TB-2304 — Package Governance readiness vs Approval queue live workflow. */
export function PackageGovernanceApprovalQueueVocabularyRail(
  props: PackageGovernanceApprovalQueueVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          reviewSideLink: props.model.packageGovernanceLink,
          externalPeerLink: props.model.approvalQueueLink,
        }
      : buildPackageGovernanceApprovalQueuePairwiseRail(props.runId);

  return (
    <ExternalPeerVocabularyRailFromModel
      testIdPrefix="package-governance-approval-queue-vocabulary"
      reviewSurfaceId="package-governance"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

"use client";

import type { JSX } from "react";

import {
  buildPackageGovernanceApprovalQueueVocabulary,
  resolvePackageGovernanceApprovalQueuePeerLink,
  type PackageGovernanceApprovalQueueSurfaceId,
  type PackageGovernanceApprovalQueueVocabularyModel,
} from "@/lib/vocabulary/package-governance-approval-queue-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model =
    props.model ??
    buildPackageGovernanceApprovalQueueVocabulary(props.runId);
  const peer = resolvePackageGovernanceApprovalQueuePeerLink(props.currentSurfaceId, model);
  const currentLink =
    props.currentSurfaceId === "package-governance"
      ? model.packageGovernanceLink
      : model.approvalQueueLink;

  return (
    <VocabularyRail
      testIdPrefix="package-governance-approval-queue-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}

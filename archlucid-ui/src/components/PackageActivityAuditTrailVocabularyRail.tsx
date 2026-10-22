"use client";

import type { JSX } from "react";

import { ExternalPeerVocabularyRailFromModel } from "@/components/vocabulary/ExternalPeerVocabularyRailFromModel";
import {
  buildPackageActivityAuditTrailPairwiseRail,
  type PackageActivityAuditTrailSurfaceId,
  type PackageActivityAuditTrailVocabularyModel,
} from "@/lib/vocabulary/package-activity-audit-trail-vocabulary";

export type PackageActivityAuditTrailVocabularyRailProps = {
  readonly currentSurfaceId: PackageActivityAuditTrailSurfaceId;
  /** Required on package Activity tabs so the current link is run-scoped. */
  readonly runId?: string | null;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: PackageActivityAuditTrailVocabularyModel;
};

/** TB-2305 — Package Activity assessment progress vs Audit trail operator log. */
export function PackageActivityAuditTrailVocabularyRail(
  props: PackageActivityAuditTrailVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          reviewSideLink: props.model.packageActivityLink,
          externalPeerLink: props.model.auditTrailLink,
        }
      : buildPackageActivityAuditTrailPairwiseRail(props.runId);

  return (
    <ExternalPeerVocabularyRailFromModel
      testIdPrefix="package-activity-audit-trail-vocabulary"
      reviewSurfaceId="package-activity"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

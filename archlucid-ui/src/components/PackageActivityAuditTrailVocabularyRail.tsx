"use client";

import type { JSX } from "react";

import {
  buildPackageActivityAuditTrailVocabulary,
  resolvePackageActivityAuditTrailPeerLink,
  type PackageActivityAuditTrailSurfaceId,
  type PackageActivityAuditTrailVocabularyModel,
  type PackageActivityHrefKind,
} from "@/lib/vocabulary/package-activity-audit-trail-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type PackageActivityAuditTrailVocabularyRailProps = {
  readonly currentSurfaceId: PackageActivityAuditTrailSurfaceId;
  /** Required on package Activity tabs so the current link is run-scoped. */
  readonly runId?: string | null;
  readonly hrefKind?: PackageActivityHrefKind;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: PackageActivityAuditTrailVocabularyModel;
};

/** TB-2305 — Package Activity assessment progress vs Audit trail operator log. */
export function PackageActivityAuditTrailVocabularyRail(
  props: PackageActivityAuditTrailVocabularyRailProps,
): JSX.Element {
  const model =
    props.model ??
    buildPackageActivityAuditTrailVocabulary(props.runId, props.hrefKind ?? "archTab");
  const peer = resolvePackageActivityAuditTrailPeerLink(props.currentSurfaceId, model);
  const currentLink =
    props.currentSurfaceId === "package-activity"
      ? model.packageActivityLink
      : model.auditTrailLink;

  return (
    <VocabularyRail
      testIdPrefix="package-activity-audit-trail-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}

"use client";

import type { JSX } from "react";

import {
  buildReportProblemSupportWorkspaceVocabulary,
  resolveReportProblemSupportWorkspacePeerLink,
  type ReportProblemSupportWorkspaceSurfaceId,
  type ReportProblemSupportWorkspaceVocabularyModel,
} from "@/lib/vocabulary/report-problem-support-workspace-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ReportProblemSupportWorkspaceVocabularyRailProps = {
  readonly currentSurfaceId: ReportProblemSupportWorkspaceSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ReportProblemSupportWorkspaceVocabularyModel;
};

/** TB-2306 — Report a problem intake help vs Support workspace diagnostics. */
export function ReportProblemSupportWorkspaceVocabularyRail(
  props: ReportProblemSupportWorkspaceVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildReportProblemSupportWorkspaceVocabulary();
  const peer = resolveReportProblemSupportWorkspacePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "report-a-problem"
      ? model.reportAProblemLink
      : model.supportWorkspaceLink;

  return (
    <VocabularyRail
      testIdPrefix="report-problem-support-workspace-vocabulary"
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

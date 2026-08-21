"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildReportProblemSupportWorkspacePairwiseRail,
  type ReportProblemSupportWorkspaceSurfaceId,
  type ReportProblemSupportWorkspaceVocabularyModel,
} from "@/lib/vocabulary/report-problem-support-workspace-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.reportAProblemLink,
          peerLink: props.model.supportWorkspaceLink,
        }
      : buildReportProblemSupportWorkspacePairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="report-problem-support-workspace-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

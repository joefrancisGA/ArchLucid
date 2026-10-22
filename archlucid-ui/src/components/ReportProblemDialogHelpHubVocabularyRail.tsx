"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildReportProblemDialogHelpHubPairwiseRail,
  type ReportProblemDialogHelpHubSurfaceId,
  type ReportProblemDialogHelpHubVocabularyModel,
} from "@/lib/vocabulary/report-problem-dialog-help-hub-vocabulary";

export type ReportProblemDialogHelpHubVocabularyRailProps = {
  readonly currentSurfaceId: ReportProblemDialogHelpHubSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ReportProblemDialogHelpHubVocabularyModel;
};

/** TB-2318 — Report a problem dialog vs Help hub. */
export function ReportProblemDialogHelpHubVocabularyRail(
  props: ReportProblemDialogHelpHubVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.reportProblemDialogLink,
          peerLink: props.model.helpHubLink,
        }
      : buildReportProblemDialogHelpHubPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="report-problem-dialog-help-hub-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

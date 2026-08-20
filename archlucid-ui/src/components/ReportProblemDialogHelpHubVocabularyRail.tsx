"use client";

import type { JSX } from "react";

import {
  buildReportProblemDialogHelpHubVocabulary,
  resolveReportProblemDialogHelpHubPeerLink,
  type ReportProblemDialogHelpHubSurfaceId,
  type ReportProblemDialogHelpHubVocabularyModel,
} from "@/lib/vocabulary/report-problem-dialog-help-hub-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildReportProblemDialogHelpHubVocabulary();
  const peer = resolveReportProblemDialogHelpHubPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "report-problem-dialog"
      ? model.reportProblemDialogLink
      : model.helpHubLink;

  return (
    <VocabularyRail
      testIdPrefix="report-problem-dialog-help-hub-vocabulary"
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

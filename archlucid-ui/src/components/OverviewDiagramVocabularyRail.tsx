"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildOverviewDiagramPairwiseRail,
  type OverviewDiagramSurfaceId,
  type OverviewDiagramVocabularyModel,
} from "@/lib/vocabulary/overview-diagram-vocabulary";

export type OverviewDiagramVocabularyRailProps = {
  readonly runId: string;
  readonly currentSurfaceId: OverviewDiagramSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: OverviewDiagramVocabularyModel;
};

/** TB-2309 — Create-home Overview structured brief vs Diagram sketch. */
export function OverviewDiagramVocabularyRail(
  props: OverviewDiagramVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.overviewLink,
          peerLink: props.model.diagramLink,
        }
      : buildOverviewDiagramPairwiseRail(props.runId);

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="overview-diagram-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

"use client";

import type { JSX } from "react";

import {
  buildOverviewDiagramVocabulary,
  resolveOverviewDiagramPeerLink,
  type OverviewDiagramSurfaceId,
  type OverviewDiagramVocabularyModel,
} from "@/lib/vocabulary/overview-diagram-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildOverviewDiagramVocabulary(props.runId);
  const peer = resolveOverviewDiagramPeerLink(props.currentSurfaceId, model);
  const currentLink =
    props.currentSurfaceId === "overview" ? model.overviewLink : model.diagramLink;

  return (
    <VocabularyRail
      testIdPrefix="overview-diagram-vocabulary"
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

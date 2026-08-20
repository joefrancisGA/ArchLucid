"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildConnectionStatusCloudConnectionsPairwiseRail,
  type ConnectionStatusCloudConnectionsSurfaceId,
  type ConnectionStatusCloudConnectionsVocabularyModel,
} from "@/lib/vocabulary/connection-status-cloud-connections-vocabulary";

export type ConnectionStatusCloudConnectionsVocabularyRailProps = {
  readonly currentSurfaceId: ConnectionStatusCloudConnectionsSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ConnectionStatusCloudConnectionsVocabularyModel;
};

/**
 * TB-2245 — Compact vocabulary rail between connection status and cloud connections.
 * Mount on both hubs so operators do not conflate integration readiness with cloud inventory setup.
 */
export function ConnectionStatusCloudConnectionsVocabularyRail(
  props: ConnectionStatusCloudConnectionsVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.connectionStatusLink,
          peerLink: props.model.cloudConnectionsLink,
        }
      : buildConnectionStatusCloudConnectionsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="connection-status-cloud-connections-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

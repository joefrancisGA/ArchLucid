"use client";

import type { JSX } from "react";

import {
  buildConnectionStatusCloudConnectionsVocabulary,
  resolveConnectionStatusCloudConnectionsPeerLink,
  type ConnectionStatusCloudConnectionsSurfaceId,
  type ConnectionStatusCloudConnectionsVocabularyModel,
} from "@/lib/vocabulary/connection-status-cloud-connections-vocabulary";
import { toVocabularyRailPeerLink } from "@/components/vocabulary/vocabulary-rail-peer-links";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildConnectionStatusCloudConnectionsVocabulary();
  const peer = resolveConnectionStatusCloudConnectionsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "connection-status"
      ? model.connectionStatusLink
      : model.cloudConnectionsLink;

  return (
    <VocabularyRail
      testIdPrefix="connection-status-cloud-connections-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[toVocabularyRailPeerLink(peer)]}
    />
  );
}

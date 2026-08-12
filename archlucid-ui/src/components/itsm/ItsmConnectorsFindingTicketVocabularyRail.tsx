"use client";

import type { JSX } from "react";

import {
  buildItsmConnectorsFindingTicketVocabulary,
  resolveItsmConnectorsFindingTicketPeerLink,
  type ItsmConnectorsFindingTicketSurfaceId,
  type ItsmConnectorsFindingTicketVocabularyModel,
} from "@/lib/vocabulary/itsm-connectors-finding-ticket-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ItsmConnectorsFindingTicketVocabularyRailProps = {
  readonly currentSurfaceId: ItsmConnectorsFindingTicketSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ItsmConnectorsFindingTicketVocabularyModel;
};

/** TB-2310 — ITSM connector admin vs finding-scoped ticket linkage. */
export function ItsmConnectorsFindingTicketVocabularyRail(
  props: ItsmConnectorsFindingTicketVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildItsmConnectorsFindingTicketVocabulary();
  const peer = resolveItsmConnectorsFindingTicketPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "itsm-connectors"
      ? model.itsmConnectorsLink
      : model.findingTicketLinkageLink;

  return (
    <VocabularyRail
      testIdPrefix="itsm-connectors-finding-ticket-vocabulary"
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

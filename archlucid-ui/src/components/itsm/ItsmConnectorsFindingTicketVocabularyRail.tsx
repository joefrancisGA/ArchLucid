"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildItsmConnectorsFindingTicketPairwiseRail,
  type ItsmConnectorsFindingTicketSurfaceId,
  type ItsmConnectorsFindingTicketVocabularyModel,
} from "@/lib/vocabulary/itsm-connectors-finding-ticket-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.itsmConnectorsLink,
          peerLink: props.model.findingTicketLinkageLink,
        }
      : buildItsmConnectorsFindingTicketPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="itsm-connectors-finding-ticket-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildConnectionStatusWebhooksPairwiseRail,
  type ConnectionStatusWebhooksSurfaceId,
  type ConnectionStatusWebhooksVocabularyModel,
} from "@/lib/vocabulary/connection-status-webhooks-vocabulary";

export type ConnectionStatusWebhooksVocabularyRailProps = {
  readonly currentSurfaceId: ConnectionStatusWebhooksSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ConnectionStatusWebhooksVocabularyModel;
};

/** TB-2301 — Connection status readiness vs Webhooks subscription editor. */
export function ConnectionStatusWebhooksVocabularyRail(
  props: ConnectionStatusWebhooksVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.connectionStatusLink,
          peerLink: props.model.webhooksLink,
        }
      : buildConnectionStatusWebhooksPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="connection-status-webhooks-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

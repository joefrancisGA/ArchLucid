"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildWebhooksVsDlqPairwiseRail,
  type WebhooksVsDlqSurfaceId,
  type WebhooksVsDlqVocabularyModel,
} from "@/lib/vocabulary/webhooks-vs-dlq-vocabulary";

export type WebhooksVsDlqVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: WebhooksVsDlqSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildWebhooksVsDlqVocabulary}. */
  readonly model?: WebhooksVsDlqVocabularyModel;
};

/**
 * TB-2264 — Compact vocabulary rail between Webhooks outbound delivery and integration-events DLQ recovery.
 * Mount on Webhooks settings and the integration-events DLQ page.
 */
export function WebhooksVsDlqVocabularyRail(
  props: WebhooksVsDlqVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.webhooksLink,
          peerLink: props.model.dlqLink,
        }
      : buildWebhooksVsDlqPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="webhooks-vs-dlq-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

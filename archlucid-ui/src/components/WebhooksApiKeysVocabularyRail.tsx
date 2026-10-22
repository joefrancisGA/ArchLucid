"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildWebhooksApiKeysPairwiseRail,
  type WebhooksApiKeysSurfaceId,
  type WebhooksApiKeysVocabularyModel,
} from "@/lib/vocabulary/webhooks-api-keys-vocabulary";

export type WebhooksApiKeysVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: WebhooksApiKeysSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildWebhooksApiKeysVocabulary}. */
  readonly model?: WebhooksApiKeysVocabularyModel;
};

/**
 * TB-2320 — Compact vocabulary rail between Webhooks outbound delivery and API keys credentials.
 * Mount on Webhooks settings and API keys administration.
 */
export function WebhooksApiKeysVocabularyRail(
  props: WebhooksApiKeysVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.webhooksLink,
          peerLink: props.model.apiKeysLink,
        }
      : buildWebhooksApiKeysPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="webhooks-api-keys-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

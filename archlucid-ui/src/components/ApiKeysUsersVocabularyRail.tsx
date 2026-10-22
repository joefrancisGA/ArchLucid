"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildApiKeysUsersPairwiseRail,
  type ApiKeysUsersSurfaceId,
  type ApiKeysUsersVocabularyModel,
} from "@/lib/vocabulary/api-keys-users-vocabulary";

export type ApiKeysUsersVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ApiKeysUsersSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildApiKeysUsersVocabulary}. */
  readonly model?: ApiKeysUsersVocabularyModel;
};

/**
 * TB-2327 — Compact vocabulary rail between API keys credentials and Users and roles.
 * Mount on API keys administration and Users settings.
 */
export function ApiKeysUsersVocabularyRail(
  props: ApiKeysUsersVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.apiKeysLink,
          peerLink: props.model.usersLink,
        }
      : buildApiKeysUsersPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="api-keys-users-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

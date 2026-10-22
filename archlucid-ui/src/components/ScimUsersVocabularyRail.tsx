"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildScimUsersPairwiseRail,
  type ScimUsersSurfaceId,
  type ScimUsersVocabularyModel,
} from "@/lib/vocabulary/scim-users-vocabulary";

export type ScimUsersVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ScimUsersSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildScimUsersVocabulary}. */
  readonly model?: ScimUsersVocabularyModel;
};

/**
 * TB-2321 — Compact vocabulary rail between SCIM directory sync and Users invite.
 * Mount on SCIM provisioning and Users administration.
 */
export function ScimUsersVocabularyRail(props: ScimUsersVocabularyRailProps): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.scimLink,
          peerLink: props.model.usersLink,
        }
      : buildScimUsersPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="scim-users-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

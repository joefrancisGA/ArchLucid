"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildCustomRolesUsersPairwiseRail,
  type CustomRolesUsersSurfaceId,
  type CustomRolesUsersVocabularyModel,
} from "@/lib/vocabulary/custom-roles-users-vocabulary";

export type CustomRolesUsersVocabularyRailProps = {
  /** Surface hosting the strip — marks the current tab job and links to the peer. */
  readonly currentSurfaceId: CustomRolesUsersSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildCustomRolesUsersVocabulary}. */
  readonly model?: CustomRolesUsersVocabularyModel;
};

/**
 * TB-2262 — Compact vocabulary rail between Roles and permissions and Users and invitations.
 * Mount on Users and roles with currentSurfaceId from the active tab.
 */
export function CustomRolesUsersVocabularyRail(
  props: CustomRolesUsersVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.customRolesLink,
          peerLink: props.model.usersLink,
        }
      : buildCustomRolesUsersPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="custom-roles-users-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}

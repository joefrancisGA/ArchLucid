"use client";

import type { JSX } from "react";

import {
  buildCustomRolesUsersVocabulary,
  resolveCustomRolesUsersPeerLink,
  type CustomRolesUsersSurfaceId,
  type CustomRolesUsersVocabularyModel,
} from "@/lib/vocabulary/custom-roles-users-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildCustomRolesUsersVocabulary();
  const peer = resolveCustomRolesUsersPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "custom-roles" ? model.customRolesLink : model.usersLink;

  return (
    <VocabularyRail
      testIdPrefix="custom-roles-users-vocabulary"
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

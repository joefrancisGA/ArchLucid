"use client";

import type { JSX } from "react";

import {
  ScimUsersVocabularyRail,
  type ScimUsersVocabularyRailProps,
} from "@/components/ScimUsersVocabularyRail";

export type ScimVsUsersReconcilerProps = ScimUsersVocabularyRailProps;

/**
 * TB-2259 / TB-2321 — Prefer {@link ScimUsersVocabularyRail} on new mounts.
 * Kept so existing imports continue to render the shared VocabularyRail.
 */
export function ScimVsUsersReconciler(props: ScimVsUsersReconcilerProps): JSX.Element {
  return <ScimUsersVocabularyRail {...props} />;
}

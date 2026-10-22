"use client";

import type { JSX } from "react";

import {
  ApiKeysUsersVocabularyRail,
  type ApiKeysUsersVocabularyRailProps,
} from "@/components/ApiKeysUsersVocabularyRail";

export type ApiKeysVsUsersReconcilerProps = ApiKeysUsersVocabularyRailProps;

/**
 * TB-2237 / TB-2327 — Prefer {@link ApiKeysUsersVocabularyRail} on new mounts.
 * Kept so existing imports continue to render the shared VocabularyRail.
 */
export function ApiKeysVsUsersReconciler(
  props: ApiKeysVsUsersReconcilerProps,
): JSX.Element {
  return <ApiKeysUsersVocabularyRail {...props} />;
}

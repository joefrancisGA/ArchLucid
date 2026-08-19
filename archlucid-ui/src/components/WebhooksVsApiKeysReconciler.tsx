"use client";

import type { JSX } from "react";

import {
  WebhooksApiKeysVocabularyRail,
  type WebhooksApiKeysVocabularyRailProps,
} from "@/components/WebhooksApiKeysVocabularyRail";

export type WebhooksVsApiKeysReconcilerProps = WebhooksApiKeysVocabularyRailProps;

/**
 * TB-2242 / TB-2320 — Prefer {@link WebhooksApiKeysVocabularyRail} on new mounts.
 * Kept so existing imports continue to render the shared VocabularyRail.
 */
export function WebhooksVsApiKeysReconciler(
  props: WebhooksVsApiKeysReconcilerProps,
): JSX.Element {
  return <WebhooksApiKeysVocabularyRail {...props} />;
}

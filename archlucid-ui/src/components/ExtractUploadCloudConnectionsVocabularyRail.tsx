"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildExtractUploadCloudConnectionsVocabulary,
  resolveExtractUploadCloudConnectionsPeerLink,
  type ExtractUploadCloudConnectionsSurfaceId,
  type ExtractUploadCloudConnectionsVocabularyModel,
} from "@/lib/vocabulary/extract-upload-cloud-connections-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ExtractUploadCloudConnectionsVocabularyRailProps = {
  /** Surface hosting the strip — marks the current evidence-intake job and links to the peer. */
  readonly currentSurfaceId: ExtractUploadCloudConnectionsSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildExtractUploadCloudConnectionsVocabulary}. */
  readonly model?: ExtractUploadCloudConnectionsVocabularyModel;
};

/**
 * TB-2281 — Compact vocabulary rail between Extract & Upload and Cloud connections.
 * Mount on extract-upload settings and Cloud connections (optionally evidence-intake help).
 * Distinct from Connection status ≠ Cloud connections (TB-2245).
 */
export function ExtractUploadCloudConnectionsVocabularyRail(
  props: ExtractUploadCloudConnectionsVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildExtractUploadCloudConnectionsVocabulary();
  const peer = resolveExtractUploadCloudConnectionsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "extract-upload"
      ? model.extractUploadLink
      : model.cloudConnectionsLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="extract-upload-cloud-connections-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="extract-upload-cloud-connections-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="extract-upload-cloud-connections-vocabulary-heading"
      data-testid="extract-upload-cloud-connections-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="extract-upload-cloud-connections-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyTwo}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span
          className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="extract-upload-cloud-connections-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="extract-upload-cloud-connections-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}

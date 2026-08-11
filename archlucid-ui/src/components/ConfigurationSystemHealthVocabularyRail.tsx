"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildConfigurationSystemHealthVocabulary,
  resolveConfigurationSystemHealthPeerLink,
  type ConfigurationSystemHealthSurfaceId,
  type ConfigurationSystemHealthVocabularyModel,
} from "@/lib/vocabulary/configuration-system-health-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ConfigurationSystemHealthVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ConfigurationSystemHealthSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildConfigurationSystemHealthVocabulary}. */
  readonly model?: ConfigurationSystemHealthVocabularyModel;
};

/**
 * TB-2279 — Compact vocabulary rail between Configuration summary and System health.
 * Mount on Admin configuration and System health so operators do not conflate knobs with probes.
 */
export function ConfigurationSystemHealthVocabularyRail(
  props: ConfigurationSystemHealthVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildConfigurationSystemHealthVocabulary();
  const peer = resolveConfigurationSystemHealthPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "configuration-summary"
      ? model.configurationLink
      : model.systemHealthLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="configuration-system-health-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="configuration-system-health-vocabulary-peer-link"
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
      aria-labelledby="configuration-system-health-vocabulary-heading"
      data-testid="configuration-system-health-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="configuration-system-health-vocabulary-heading"
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
          data-testid="configuration-system-health-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="configuration-system-health-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}

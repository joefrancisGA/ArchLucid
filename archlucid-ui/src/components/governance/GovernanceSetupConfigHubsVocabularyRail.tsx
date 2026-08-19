"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildGovernanceSetupConfigHubsVocabulary,
  resolveGovernanceSetupConfigHubsLink,
  resolveGovernanceSetupConfigHubsPeerLinks,
  type GovernanceSetupConfigHubsSurfaceId,
  type GovernanceSetupConfigHubsVocabularyModel,
} from "@/lib/vocabulary/governance-setup-config-hubs-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type GovernanceSetupConfigHubsVocabularyRailProps = {
  readonly currentSurfaceId: GovernanceSetupConfigHubsSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: GovernanceSetupConfigHubsVocabularyModel;
};

/** TB-2297 — Governance setup guide vs live Alert rules / Policy packs / Standards hubs. */
export function GovernanceSetupConfigHubsVocabularyRail(
  props: GovernanceSetupConfigHubsVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildGovernanceSetupConfigHubsVocabulary();
  const peers = resolveGovernanceSetupConfigHubsPeerLinks(props.currentSurfaceId);
  const currentLink = resolveGovernanceSetupConfigHubsLink(props.currentSurfaceId);

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="governance-setup-config-hubs-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        {peers.map((peer, index) => (
          <span key={peer.id}>
            {index > 0 ? " · " : null}
            <Link
              href={peer.href}
              className={cn(OPERATOR_LINK.inline, "font-medium")}
              data-testid={`governance-setup-config-hubs-vocabulary-peer-${peer.id}`}
            >
              {peer.label}
            </Link>
          </span>
        ))}
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="governance-setup-config-hubs-vocabulary-heading"
      data-testid="governance-setup-config-hubs-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="governance-setup-config-hubs-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whySeparate}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {currentLink !== null ? (
          <span
            className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="governance-setup-config-hubs-vocabulary-current"
            aria-current="page"
          >
            {currentLink.label}
          </span>
        ) : null}
        {peers.map((peer) => (
          <Link
            key={peer.id}
            href={peer.href}
            className={OPERATOR_LINK.optional}
            data-testid={`governance-setup-config-hubs-vocabulary-peer-${peer.id}`}
          >
            {peer.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

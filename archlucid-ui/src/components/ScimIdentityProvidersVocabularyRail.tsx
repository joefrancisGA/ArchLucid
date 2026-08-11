"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildScimIdentityProvidersVocabulary,
  resolveScimIdentityProvidersPeerLink,
  type ScimIdentityProvidersSurfaceId,
  type ScimIdentityProvidersVocabularyModel,
} from "@/lib/vocabulary/scim-identity-providers-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ScimIdentityProvidersVocabularyRailProps = {
  readonly currentSurfaceId: ScimIdentityProvidersSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ScimIdentityProvidersVocabularyModel;
};

/** TB-2294 — SCIM directory sync vs Identity providers federation. */
export function ScimIdentityProvidersVocabularyRail(
  props: ScimIdentityProvidersVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildScimIdentityProvidersVocabulary();
  const peer = resolveScimIdentityProvidersPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "scim-provisioning"
      ? model.scimLink
      : model.identityProvidersLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="scim-identity-providers-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="scim-identity-providers-vocabulary-peer-link"
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
      aria-labelledby="scim-identity-providers-vocabulary-heading"
      data-testid="scim-identity-providers-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="scim-identity-providers-vocabulary-heading"
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
          data-testid="scim-identity-providers-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="scim-identity-providers-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}

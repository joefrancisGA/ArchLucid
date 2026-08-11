"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildWebhooksVsApiKeysReconciler,
  resolveWebhooksVsApiKeysPeerLink,
  type WebhooksVsApiKeysReconcilerModel,
  type WebhooksVsApiKeysSurfaceId,
} from "@/lib/webhooks-vs-api-keys";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type WebhooksVsApiKeysReconcilerProps = {
  /** Surface hosting the strip — marks the current integration job and links to the peer. */
  readonly currentSurfaceId: WebhooksVsApiKeysSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildWebhooksVsApiKeysReconciler}. */
  readonly model?: WebhooksVsApiKeysReconcilerModel;
};

/**
 * TB-2242 — Compact reconciler between Webhooks and API keys.
 * Mount on both hubs so operators do not treat outbound event delivery as credentials.
 */
export function WebhooksVsApiKeysReconciler(
  props: WebhooksVsApiKeysReconcilerProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildWebhooksVsApiKeysReconciler();
  const peer = resolveWebhooksVsApiKeysPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "webhooks" ? model.webhooksLink : model.apiKeysLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="webhooks-vs-api-keys"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="webhooks-vs-api-keys-peer-link"
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
      aria-labelledby="webhooks-vs-api-keys-heading"
      data-testid="webhooks-vs-api-keys"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="webhooks-vs-api-keys-heading"
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
          data-testid="webhooks-vs-api-keys-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="webhooks-vs-api-keys-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}

"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildAlertsFindingsDualInboxReconciler,
  resolveAlertsFindingsDualInboxPeerLink,
  type AlertsFindingsDualInboxReconcilerModel,
  type AlertsFindingsDualInboxSurfaceId,
} from "@/lib/alerts-findings-dual-inbox";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AlertsFindingsDualInboxReconcilerProps = {
  /** Surface hosting the strip — marks the current inbox and links to the peer. */
  readonly currentSurfaceId: AlertsFindingsDualInboxSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildAlertsFindingsDualInboxReconciler}. */
  readonly model?: AlertsFindingsDualInboxReconcilerModel;
};

/**
 * TB-2221 — Compact reconciler between alerts inbox and findings queue.
 * Mount on both hubs so operators do not treat one list as the other.
 */
export function AlertsFindingsDualInboxReconciler(
  props: AlertsFindingsDualInboxReconcilerProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildAlertsFindingsDualInboxReconciler();
  const peer = resolveAlertsFindingsDualInboxPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "alerts-inbox" ? model.alertsLink : model.findingsLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="alerts-findings-dual-inbox"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="alerts-findings-dual-inbox-peer-link"
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
      aria-labelledby="alerts-findings-dual-inbox-heading"
      data-testid="alerts-findings-dual-inbox"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="alerts-findings-dual-inbox-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyTwoInboxes}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span
          className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="alerts-findings-dual-inbox-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="alerts-findings-dual-inbox-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}

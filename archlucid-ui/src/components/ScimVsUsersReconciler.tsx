"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildScimVsUsersReconciler,
  resolveScimVsUsersPeerLink,
  type ScimVsUsersReconcilerModel,
  type ScimVsUsersSurfaceId,
} from "@/lib/scim-vs-users";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ScimVsUsersReconcilerProps = {
  /** Surface hosting the strip — marks the current admin job and links to the peer. */
  readonly currentSurfaceId: ScimVsUsersSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildScimVsUsersReconciler}. */
  readonly model?: ScimVsUsersReconcilerModel;
};

/**
 * TB-2259 — Compact reconciler between SCIM provisioning and Users and roles.
 * Mount on both hubs so operators do not treat directory sync as membership.
 */
export function ScimVsUsersReconciler(props: ScimVsUsersReconcilerProps): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildScimVsUsersReconciler();
  const peer = resolveScimVsUsersPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "scim" ? model.scimLink : model.usersLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="scim-vs-users"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="scim-vs-users-peer-link"
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
      aria-labelledby="scim-vs-users-heading"
      data-testid="scim-vs-users"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="scim-vs-users-heading"
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
          data-testid="scim-vs-users-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="scim-vs-users-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}

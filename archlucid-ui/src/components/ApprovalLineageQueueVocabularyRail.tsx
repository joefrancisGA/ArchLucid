"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildApprovalLineageQueueVocabulary,
  resolveApprovalLineageQueuePeerLink,
  type ApprovalLineageQueueSurfaceId,
  type ApprovalLineageQueueVocabularyModel,
} from "@/lib/approval-lineage-queue-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ApprovalLineageQueueVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ApprovalLineageQueueSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildApprovalLineageQueueVocabulary}. */
  readonly model?: ApprovalLineageQueueVocabularyModel;
};

/**
 * TB-2271 — Compact vocabulary rail between Approval lineage and Approval queue.
 * Mount on lineage detail and the approval queue workflow page.
 */
export function ApprovalLineageQueueVocabularyRail(
  props: ApprovalLineageQueueVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildApprovalLineageQueueVocabulary();
  const peer = resolveApprovalLineageQueuePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "approval-lineage" ? model.lineageLink : model.queueLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="approval-lineage-queue-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="approval-lineage-queue-vocabulary-peer-link"
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
      aria-labelledby="approval-lineage-queue-vocabulary-heading"
      data-testid="approval-lineage-queue-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="approval-lineage-queue-vocabulary-heading"
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
          data-testid="approval-lineage-queue-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="approval-lineage-queue-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  ACCELERATOR_PACK_CTA_PENDING_CHECKING_MESSAGE,
  ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE,
  ACCELERATOR_PACK_PREREQUISITE_BLOCKED_MESSAGE,
  resolvePackCtaState,
  type AcceleratorPackCtaState,
} from "@/lib/accelerator-chooser-pack-prerequisite";
import { buildAcceleratorPackStartScreenReaderSuffix } from "@/lib/accelerator-chooser-pack-start-aria-label";
import { ACCELERATOR_JOB_CHOOSER_START_CTA } from "@/lib/accelerator-chooser-start-copy";
import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";
import { cn } from "@/lib/utils";

type AcceleratorPackStartCtaProps = {
  readonly packId: string;
  readonly packLabel: string;
  readonly buyerJob: string;
  readonly startHref: string;
  readonly prerequisiteStatus: AcceleratorChooserPrerequisiteStatus;
  readonly startTestId?: string;
  readonly blockedMessageTestId?: string;
  readonly primaryWhenReady?: boolean;
  readonly visibleLabel?: string;
  readonly className?: string;
};

function packCtaPendingMessage(state: AcceleratorPackCtaState): string | null {
  switch (state) {
    case "pending-checking":
      return ACCELERATOR_PACK_CTA_PENDING_CHECKING_MESSAGE;
    case "pending-unknown":
      return ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE;
    case "ready":
    case "blocked-not-met":
      return null;
    default: {
      const exhaustive: never = state;

      return exhaustive;
    }
  }
}

function packCtaBlockedReasonId(startTestId: string | undefined): string {
  return `${startTestId ?? "accelerator-pack-start"}-blocked-reason`;
}

/** Shared accelerator pack start CTA with prerequisite-aware a11y (HAX). */
export function AcceleratorPackStartCta(props: AcceleratorPackStartCtaProps): React.ReactElement {
  const {
    packId,
    packLabel,
    buyerJob,
    startHref,
    prerequisiteStatus,
    startTestId,
    blockedMessageTestId,
    primaryWhenReady = false,
    visibleLabel = ACCELERATOR_JOB_CHOOSER_START_CTA,
    className,
  } = props;
  const ctaState = resolvePackCtaState(prerequisiteStatus, packId);
  const blockedReasonId = packCtaBlockedReasonId(startTestId);
  const screenReaderSuffix = buildAcceleratorPackStartScreenReaderSuffix(packLabel, buyerJob);
  const pendingMessage = packCtaPendingMessage(ctaState);

  if (ctaState === "pending-checking") {
    return (
      <>
        {pendingMessage !== null ? (
          <p className="m-0 mt-3 text-al-text-secondary text-sm" data-testid={blockedMessageTestId}>
            {pendingMessage}
          </p>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          className={cn("mt-3", className)}
          aria-busy="true"
          aria-disabled="true"
          tabIndex={-1}
          data-testid={startTestId}
        >
          {visibleLabel}
          <span className="sr-only">{screenReaderSuffix}</span>
        </Button>
      </>
    );
  }

  if (ctaState === "pending-unknown") {
    return (
      <>
        {pendingMessage !== null ? (
          <p className="m-0 mt-3 text-al-text-secondary text-sm" data-testid={blockedMessageTestId}>
            {pendingMessage}
          </p>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          className={cn("mt-3", className)}
          aria-disabled="true"
          aria-describedby={blockedReasonId}
          tabIndex={-1}
          data-testid={startTestId}
        >
          {visibleLabel}
          <span className="sr-only">{screenReaderSuffix}</span>
        </Button>
        <span id={blockedReasonId} className="sr-only">
          {ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE}
        </span>
      </>
    );
  }

  if (ctaState === "blocked-not-met") {
    return (
      <>
        <p
          id={blockedReasonId}
          className="m-0 mt-3 text-al-text-secondary text-sm"
          data-testid={blockedMessageTestId}
        >
          {ACCELERATOR_PACK_PREREQUISITE_BLOCKED_MESSAGE}
        </p>
        <Button
          size="sm"
          variant="outline"
          className={cn("mt-3", className)}
          aria-disabled="true"
          aria-describedby={blockedReasonId}
          tabIndex={-1}
          data-testid={startTestId}
        >
          {visibleLabel}
          <span className="sr-only">{screenReaderSuffix}</span>
        </Button>
      </>
    );
  }

  return (
    <Button asChild size="sm" variant={primaryWhenReady ? "primary" : "outline"} className={cn("mt-3", className)}>
      <Link href={startHref} data-testid={startTestId}>
        {visibleLabel}
        <span className="sr-only">{screenReaderSuffix}</span>
      </Link>
    </Button>
  );
}

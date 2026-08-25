"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { resolvePackCtaPresentation } from "@/lib/accelerator-chooser-pack-prerequisite";
import { buildAcceleratorPackStartScreenReaderSuffix } from "@/lib/accelerator-chooser-pack-start-aria-label";
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
  readonly onRetry?: () => void;
  readonly className?: string;
};

function packCtaStatusMessageId(startTestId: string | undefined): string {
  return `${startTestId ?? "accelerator-pack-start"}-status-message`;
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
    onRetry,
    className,
  } = props;
  const presentation = resolvePackCtaPresentation(prerequisiteStatus, packId);
  const statusMessageId = packCtaStatusMessageId(startTestId);
  const screenReaderSuffix = buildAcceleratorPackStartScreenReaderSuffix(packLabel, buyerJob);

  if (presentation.mode === "locked-status" || presentation.mode === "checking-status") {
    return (
      <p
        id={statusMessageId}
        className={cn("m-0 mt-3 text-al-text-secondary text-sm", className)}
        data-testid={blockedMessageTestId}
      >
        {presentation.statusMessage}
      </p>
    );
  }

  if (presentation.mode === "retry-button") {
    return (
      <>
        {presentation.statusMessage !== null ? (
          <p
            id={statusMessageId}
            className="m-0 mt-3 text-al-text-secondary text-sm"
            data-testid={blockedMessageTestId}
          >
            {presentation.statusMessage}
          </p>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn("mt-3", className)}
          aria-describedby={statusMessageId}
          data-testid={startTestId}
          onClick={() => {
            onRetry?.();
          }}
        >
          {presentation.visibleLabel}
          <span className="sr-only">{screenReaderSuffix}</span>
        </Button>
      </>
    );
  }

  const usePrimary = primaryWhenReady || presentation.usePrimaryVariant;

  return (
    <Button
      asChild
      size="sm"
      variant={usePrimary ? "primary" : "outline"}
      className={cn("mt-3", className)}
    >
      <Link href={startHref} data-testid={startTestId}>
        {presentation.visibleLabel}
        <span className="sr-only">{screenReaderSuffix}</span>
      </Link>
    </Button>
  );
}

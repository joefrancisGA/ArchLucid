"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import type { ColdSharedLinkUnpackPresentation } from "@/lib/cold-shared-link-unpack";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { markColdSharedLinkUnpackSeen } from "@/lib/usability/last-visited-watermark";
import { cn } from "@/lib/utils";

export type ColdSharedLinkUnpackPanelProps = {
  readonly runId: string;
  readonly presentation: ColdSharedLinkUnpackPresentation;
  readonly className?: string;
};

/** One-time orientation panel for cold shared-link opens (TB-2181). */
export function ColdSharedLinkUnpackPanel(props: ColdSharedLinkUnpackPanelProps): React.JSX.Element {
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback((): void => {
    markColdSharedLinkUnpackSeen(props.runId);
    setDismissed(true);
  }, [props.runId]);

  const content = useMemo(() => props.presentation, [props.presentation]);

  if (dismissed) {
    return <></>;
  }

  return (
    <section
      aria-labelledby="cold-shared-link-unpack-heading"
      className={cn(
        "space-y-3 rounded-md border border-al-border bg-al-surface-raised p-4",
        props.className,
      )}
      data-testid="cold-shared-link-unpack-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2
            id="cold-shared-link-unpack-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            {content.packageTitle}
          </h2>
          <StatusTag kind={content.statusKind} label={content.statusLabel} />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={dismiss} data-testid="cold-shared-link-unpack-dismiss">
          Continue to package
        </Button>
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="cold-shared-link-unpack-why">
        {content.whyYouAreHere}
      </p>
      <div>
        <Button asChild variant="primary" size="sm">
          <Link href={content.primaryCtaHref} data-testid="cold-shared-link-unpack-primary" onClick={dismiss}>
            {content.primaryCtaLabel}
          </Link>
        </Button>
      </div>
    </section>
  );
}

"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton, PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DIGESTS_LAST_UPDATED_PREFIX,
  DIGESTS_PAGE_TITLE,
} from "@/lib/digests-browse-copy";

export type DigestsPageHeaderProps = {
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly lastUpdatedUtc: string | null;
  readonly onRefresh: () => void;
  readonly refreshButtonTitle?: string;
  readonly showRefresh?: boolean;
  readonly actions?: ReactNode;
  /** Defaults to {@link DIGESTS_LAST_UPDATED_PREFIX}; use health-check label during setup. */
  readonly lastUpdatedPrefix?: string;
};

/**
 * Date plus minute-precision time. Seconds were dropped deliberately: a
 * second-ticking readout on a governance surface reads as a debug probe, and the
 * underlying data does not change per second.
 */
function formatDigestsLastUpdated(lastUpdatedUtc: string | null): string {
  if (lastUpdatedUtc === null) {
    return "—";
  }

  const parsed: Date = new Date(lastUpdatedUtc);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** Shared `/digests` hero — title, lead, contextual help, refresh, and last-updated metadata. */
export function DigestsPageHeader(props: DigestsPageHeaderProps): React.JSX.Element {
  const showRefresh = props.showRefresh !== false;
  const lastUpdatedLabel = formatDigestsLastUpdated(props.lastUpdatedUtc);
  const lastUpdatedPrefix = props.lastUpdatedPrefix ?? DIGESTS_LAST_UPDATED_PREFIX;

  return (
    <OperatorPageHeader
      title={DIGESTS_PAGE_TITLE}
      titleTestId="digests-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="digests-header-actions">
          <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
          {props.actions}
          {showRefresh ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={props.onRefresh}
              disabled={props.refreshing}
              data-testid="digests-refresh-button"
              aria-label={props.refreshButtonTitle}
            >
              {props.refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          ) : null}
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="digests-last-updated"
        >
          {lastUpdatedPrefix}: {props.refreshing ? "Refreshing…" : lastUpdatedLabel}
        </span>
      }
    />
  );
}

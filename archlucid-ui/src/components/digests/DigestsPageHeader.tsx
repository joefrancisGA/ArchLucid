"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
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
};

function formatDigestsLastUpdated(lastUpdatedUtc: string | null): string {
  if (lastUpdatedUtc === null) {
    return "—";
  }

  return new Date(lastUpdatedUtc).toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Shared `/digests` hero — title, lead, contextual help, refresh, and last-updated metadata. */
export function DigestsPageHeader(props: DigestsPageHeaderProps): React.JSX.Element {
  const showRefresh = props.showRefresh !== false;
  const lastUpdatedLabel = formatDigestsLastUpdated(props.lastUpdatedUtc);

  return (
    <OperatorPageHeader
      title={DIGESTS_PAGE_TITLE}
      titleTestId="digests-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="digests-header-actions">
          <PageContextualHelpButton />
          {props.actions}
          {showRefresh ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={props.onRefresh}
              disabled={props.refreshing}
              data-testid="digests-refresh-button"
              title={props.refreshButtonTitle}
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
          {DIGESTS_LAST_UPDATED_PREFIX}: {props.refreshing ? "Refreshing…" : lastUpdatedLabel}
        </span>
      }
    />
  );
}

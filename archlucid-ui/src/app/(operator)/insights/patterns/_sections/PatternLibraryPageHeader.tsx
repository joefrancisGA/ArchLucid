"use client";

import { PatternLibraryBreadcrumb } from "@/components/insights/PatternLibraryBreadcrumb";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import {
  PATTERN_LIBRARY_LAST_UPDATED_PREFIX,
  PATTERN_LIBRARY_PAGE_TITLE,
  PATTERN_LIBRARY_PRIVACY_NOTE,
  PATTERN_LIBRARY_REFRESHING_LABEL,
  PATTERN_LIBRARY_REFRESH_LABEL,
  PATTERN_LIBRARY_WHAT_IS_PATTERN,
} from "@/lib/pattern-library-copy";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import type { PatternLibraryProvenance } from "@/lib/pattern-library-types";
import { cn } from "@/lib/utils";

export type PatternLibraryPageHeaderProps = {
  readonly subtitle: string;
  readonly provenance: PatternLibraryProvenance;
  readonly showProvenanceDetails: boolean;
  readonly refreshing: boolean;
  readonly lastUpdatedUtc: string | null;
  readonly onRefresh: () => void;
};

/** Shared `/insights/patterns` hero — breadcrumb, help, refresh, provenance, and freshness metadata. */
export function PatternLibraryPageHeader(props: PatternLibraryPageHeaderProps): React.JSX.Element {
  const lastRefreshedAt = props.lastUpdatedUtc !== null ? new Date(props.lastUpdatedUtc) : null;
  const freshnessLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: PATTERN_LIBRARY_LAST_UPDATED_PREFIX,
    lastRefreshedAt: props.refreshing ? null : lastRefreshedAt,
    refreshingLabel: props.refreshing ? PATTERN_LIBRARY_REFRESHING_LABEL : null,
  });

  return (
    <OperatorPageHeader
      navHref={PATTERN_LIBRARY_PATH}
      title={PATTERN_LIBRARY_PAGE_TITLE}
      titleTestId="pattern-library-page-title"
      subtitle={props.subtitle}
      breadcrumb={<PatternLibraryBreadcrumb />}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="pattern-library-header-actions">
          <PageContextualHelpButton />
          <RefreshButton
            busy={props.refreshing}
            label={PATTERN_LIBRARY_REFRESH_LABEL}
            data-testid="pattern-library-refresh-button"
            onClick={() => {
              props.onRefresh();
            }}
          />
        </div>
      }
      metadata={
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" data-testid="pattern-library-provenance-badge">
            {props.provenance.badgeLabel}
          </Badge>
          <OperatorPageFreshnessMetadata testId="pattern-library-last-updated" lastRefreshedAt={lastRefreshedAt}>
            {freshnessLabel}
          </OperatorPageFreshnessMetadata>
        </div>
      }
    >
      {props.showProvenanceDetails ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{PATTERN_LIBRARY_WHAT_IS_PATTERN}</p>
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{props.provenance.notice}</p>
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.micro)}>{props.provenance.privacyNote}</p>
        </div>
      ) : (
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {PATTERN_LIBRARY_PRIVACY_NOTE}
        </p>
      )}
    </OperatorPageHeader>
  );
}

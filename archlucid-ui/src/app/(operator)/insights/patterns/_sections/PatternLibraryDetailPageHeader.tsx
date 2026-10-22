"use client";

import { PatternLibraryDetailBreadcrumb } from "@/components/insights/PatternLibraryDetailBreadcrumb";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import {
  PATTERN_LIBRARY_LAST_UPDATED_PREFIX,
  PATTERN_LIBRARY_PRIVACY_NOTE,
  PATTERN_LIBRARY_REFRESHING_LABEL,
  PATTERN_LIBRARY_REFRESH_LABEL,
} from "@/lib/pattern-library-copy";
import { patternLibraryDetailPath } from "@/lib/pattern-library-route";
import { PATTERN_LIBRARY_DETAIL_CLAIM_DISCIPLINE } from "@/lib/pattern-library-detail-evidence-copy";
import type { PatternLibraryProvenance } from "@/lib/pattern-library-types";
import { cn } from "@/lib/utils";

export type PatternLibraryDetailPageHeaderProps = {
  readonly patternKey: string;
  readonly patternName: string;
  readonly subtitle: string;
  readonly provenance: PatternLibraryProvenance;
  readonly showProvenanceDetails: boolean;
  readonly refreshing: boolean;
  readonly lastUpdatedUtc: string | null;
  readonly badges: React.ReactNode;
  readonly onRefresh: () => void;
};

/** Shared `/insights/patterns/[patternKey]` hero — breadcrumb, help, refresh, provenance, and freshness metadata. */
export function PatternLibraryDetailPageHeader(props: PatternLibraryDetailPageHeaderProps): React.JSX.Element {
  const lastRefreshedAt = props.lastUpdatedUtc !== null ? new Date(props.lastUpdatedUtc) : null;
  const freshnessLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: PATTERN_LIBRARY_LAST_UPDATED_PREFIX,
    lastRefreshedAt: props.refreshing ? null : lastRefreshedAt,
    refreshingLabel: props.refreshing ? PATTERN_LIBRARY_REFRESHING_LABEL : null,
  });

  return (
    <OperatorPageHeader
      navHref={patternLibraryDetailPath(props.patternKey)}
      title={props.patternName}
      titleTestId="pattern-library-detail-title"
      subtitle={props.subtitle}
      claimDiscipline={PATTERN_LIBRARY_DETAIL_CLAIM_DISCIPLINE}
      claimDisciplineTestId="pattern-library-detail-claim-discipline"
      breadcrumb={<PatternLibraryDetailBreadcrumb patternLabel={props.patternName} />}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="pattern-library-detail-header-actions">
          <PageContextualHelpButton />
          <RefreshButton
            busy={props.refreshing}
            label={PATTERN_LIBRARY_REFRESH_LABEL}
            data-testid="pattern-library-detail-refresh-button"
            onClick={() => {
              props.onRefresh();
            }}
          />
        </div>
      }
      metadata={
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" data-testid="pattern-library-detail-provenance-badge">
            {props.provenance.badgeLabel}
          </Badge>
          <OperatorPageFreshnessMetadata
            testId="pattern-library-detail-last-updated"
            lastRefreshedAt={lastRefreshedAt}
          >
            {freshnessLabel}
          </OperatorPageFreshnessMetadata>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {props.badges}
        {props.showProvenanceDetails ? (
          <>
            <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{props.provenance.notice}</p>
            <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.micro)}>{props.provenance.privacyNote}</p>
          </>
        ) : (
          <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {PATTERN_LIBRARY_PRIVACY_NOTE}
          </p>
        )}
      </div>
    </OperatorPageHeader>
  );
}

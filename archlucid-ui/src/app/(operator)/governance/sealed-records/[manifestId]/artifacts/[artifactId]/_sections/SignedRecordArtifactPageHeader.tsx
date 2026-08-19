import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import {
  SIGNED_RECORD_ARTIFACT_ACTION_REFRESH,
  SIGNED_RECORD_ARTIFACT_ACTION_REFRESHING,
  SIGNED_RECORD_ARTIFACT_LAST_REFRESHED_PREFIX,
  SIGNED_RECORD_ARTIFACT_PAGE_TITLE,
} from "@/lib/signed-record-artifact-page-copy";

export type SignedRecordArtifactPageHeaderProps = {
  readonly subtitle: string;
  readonly breadcrumb?: ReactNode;
  readonly refreshing?: boolean;
  readonly onRefresh?: () => void;
  readonly lastRefreshedAt?: Date | null;
};

/** Shared signed-record artifact hero — title, lead, refresh, and last-refreshed metadata. */
export function SignedRecordArtifactPageHeader(props: SignedRecordArtifactPageHeaderProps): React.JSX.Element {
  const refreshing = props.refreshing === true;
  const lastRefreshedLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: SIGNED_RECORD_ARTIFACT_LAST_REFRESHED_PREFIX,
    lastRefreshedAt: props.lastRefreshedAt ?? null,
    refreshingLabel: refreshing ? SIGNED_RECORD_ARTIFACT_ACTION_REFRESHING : null,
  });

  return (
    <OperatorPageHeader
      title={SIGNED_RECORD_ARTIFACT_PAGE_TITLE}
      titleTestId="signed-record-artifact-page-title"
      subtitle={props.subtitle}
      breadcrumb={props.breadcrumb}
      actions={
        props.onRefresh !== undefined ? (
          <div className="flex flex-wrap items-center gap-2" data-testid="signed-record-artifact-header-actions">
            <PageContextualHelpButton />
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="signed-record-artifact-refresh-button"
              disabled={refreshing}
              onClick={props.onRefresh}
            >
              {refreshing ? SIGNED_RECORD_ARTIFACT_ACTION_REFRESHING : SIGNED_RECORD_ARTIFACT_ACTION_REFRESH}
            </Button>
          </div>
        ) : (
          <PageContextualHelpButton />
        )
      }
      metadata={
        props.onRefresh !== undefined ? (
          <span
            className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="signed-record-artifact-last-refreshed"
          >
            {lastRefreshedLabel}
          </span>
        ) : null
      }
    />
  );
}

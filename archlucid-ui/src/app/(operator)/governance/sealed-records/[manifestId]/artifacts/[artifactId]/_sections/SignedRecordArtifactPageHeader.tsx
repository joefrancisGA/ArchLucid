"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
};

/** Shared signed-record artifact hero — title, lead, refresh, and last-refreshed metadata. */
export function SignedRecordArtifactPageHeader(props: SignedRecordArtifactPageHeaderProps): React.JSX.Element {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    setLastRefreshedAt(new Date());
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    try {
      router.refresh();
      setLastRefreshedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  const lastRefreshedLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: SIGNED_RECORD_ARTIFACT_LAST_REFRESHED_PREFIX,
    lastRefreshedAt,
    refreshingLabel: refreshing ? SIGNED_RECORD_ARTIFACT_ACTION_REFRESHING : null,
  });

  return (
    <OperatorPageHeader
      title={SIGNED_RECORD_ARTIFACT_PAGE_TITLE}
      titleTestId="signed-record-artifact-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="signed-record-artifact-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="signed-record-artifact-refresh-button"
            disabled={refreshing}
            onClick={() => void onRefresh()}
          >
            {refreshing ? SIGNED_RECORD_ARTIFACT_ACTION_REFRESHING : SIGNED_RECORD_ARTIFACT_ACTION_REFRESH}
          </Button>
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="signed-record-artifact-last-refreshed"
        >
          {lastRefreshedLabel}
        </span>
      }
    />
  );
}

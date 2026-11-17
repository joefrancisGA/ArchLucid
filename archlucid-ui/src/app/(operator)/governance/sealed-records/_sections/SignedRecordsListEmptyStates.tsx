"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { Button } from "@/components/ui/button";
import { getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";

import {
  SIGNED_RECORDS_LIST_EMPTY_BODY,
  SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_SAMPLE_CTA,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_TITLE,
  SIGNED_RECORDS_LIST_FILTER_CLEAR_ACTION,
  SIGNED_RECORDS_LIST_FILTER_NO_MATCH_BODY,
  SIGNED_RECORDS_LIST_FILTER_NO_MATCH_TITLE,
  resolveSignedRecordsListEmptyPrimaryHref,
  resolveSignedRecordsListEmptySecondaryHref,
} from "./signed-records-list-copy";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { SIGNED_RECORDS_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/signed-records-empty-partial-capture-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type SignedRecordsListEmptyStatesProps = {
  readonly showEmptyState: boolean;
  readonly showFilterNoMatch: boolean;
  readonly workspaceScopeTeaching: ReturnType<typeof resolveWorkspaceScopeEmptyTeachingForHub>;
  readonly showcaseSampleAvailable: boolean;
  readonly onClearFilters: () => void;
};

export function SignedRecordsListEmptyStates({
  showEmptyState,
  showFilterNoMatch,
  workspaceScopeTeaching,
  showcaseSampleAvailable,
  onClearFilters,
}: SignedRecordsListEmptyStatesProps) {
  const { isWorkingMode } = useWorkspaceMode();
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureFooter = partialCapture ? (
    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="signed-records-empty-partial-capture">
      {SIGNED_RECORDS_EMPTY_PARTIAL_CAPTURE_LINE}
    </p>
  ) : null;

  if (showEmptyState) {
    if (workspaceScopeTeaching !== null) {
      return (
        <WorkspaceScopeEmptyTeaching
          title={workspaceScopeTeaching.title}
          body={workspaceScopeTeaching.body}
          ctaLabel={workspaceScopeTeaching.ctaLabel}
        />
      );
    }

    return (
      <EnterpriseCompactEmptyState
        title={SIGNED_RECORDS_LIST_EMPTY_TITLE}
        description={SIGNED_RECORDS_LIST_EMPTY_BODY}
        footer={partialCaptureFooter ?? undefined}
        actions={[
          {
            label: SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL,
            href: resolveSignedRecordsListEmptyPrimaryHref(isWorkingMode),
            variant: "primary",
          },
          {
            label: SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
            href: resolveSignedRecordsListEmptySecondaryHref(isWorkingMode),
            variant: "outline",
          },
          ...(showcaseSampleAvailable
            ? [{ label: SIGNED_RECORDS_LIST_EMPTY_SAMPLE_CTA, href: getShowcaseManifestHref(), variant: "outline" as const }]
            : []),
        ]}
      />
    );
  }

  if (showFilterNoMatch) {
    return (
      <EnterpriseCompactEmptyState
        title={SIGNED_RECORDS_LIST_FILTER_NO_MATCH_TITLE}
        description={SIGNED_RECORDS_LIST_FILTER_NO_MATCH_BODY}
        footer={
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="signed-records-list-clear-filters"
            onClick={onClearFilters}
          >
            {SIGNED_RECORDS_LIST_FILTER_CLEAR_ACTION}
          </Button>
        }
      />
    );
  }

  return null;
}

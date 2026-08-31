"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";
import { Button } from "@/components/ui/button";
import { getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import type { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";

import {
  SIGNED_RECORDS_LIST_EMPTY_BODY,
  SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_SAMPLE_CTA,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
  SIGNED_RECORDS_LIST_EMPTY_TITLE,
  SIGNED_RECORDS_LIST_FILTER_CLEAR_ACTION,
  SIGNED_RECORDS_LIST_FILTER_NO_MATCH_BODY,
  SIGNED_RECORDS_LIST_FILTER_NO_MATCH_TITLE,
} from "./signed-records-list-copy";

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
        actions={[
          { label: SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL, href: "/architecture/reviews/new", variant: "primary" },
          {
            label: SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
            href: SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
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

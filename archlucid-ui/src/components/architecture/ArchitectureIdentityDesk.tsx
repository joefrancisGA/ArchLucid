"use client";

import Link from "next/link";

import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import { ArchitectureIdentityDeskReviewsTable } from "@/components/architecture/ArchitectureIdentityDeskReviewsTable";
import { ArchitectureIdentityDeskSkeleton } from "@/components/architecture/ArchitectureIdentityDeskSkeleton";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  architectureIdentityDraftHref,
  architectureIdentityPath,
  ARCHITECTURES_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_IDENTITY_DESK_COMPARE_LABEL,
  ARCHITECTURE_IDENTITY_DESK_CURRENT_DRAFT_LABEL,
  ARCHITECTURE_IDENTITY_DESK_LATEST_SEAL_LABEL,
  ARCHITECTURE_IDENTITY_DESK_NO_OPEN_DRAFT,
  ARCHITECTURE_IDENTITY_DESK_REVIEWS_SECTION_TITLE,
  ARCHITECTURE_IDENTITY_DESK_UPDATED_LABEL,
  architectureIdentityDeskHeadingClass,
  architectureIdentityDeskPageTitle,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { buildCompareTwoReviewsHref } from "@/lib/compare-two-reviews-route";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInventoryUpdatedAtCell } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

type ArchitectureIdentityDeskProps = {
  readonly architectureId: string;
};

export function ArchitectureIdentityDesk(props: ArchitectureIdentityDeskProps): React.JSX.Element {
  const query = useArchitectureIdentityQuery(props.architectureId);
  const identity = query.data;

  if (query.isLoading) {
    return <ArchitectureIdentityDeskSkeleton />;
  }

  if (query.isError || identity === undefined) {
    return (
      <div className="space-y-3" data-testid="architecture-identity-desk-error">
        <p className={OPERATOR_TYPOGRAPHY.body}>Could not load this architecture.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const currentDraftId = identity.currentDraftId?.trim() ?? "";
  const latestSealedManifestId = identity.latestSealedManifestId?.trim() ?? "";
  const compareHref =
    identity.reviews.length >= 2
      ? buildCompareTwoReviewsHref({
          baseRunId: identity.reviews[0]?.runId ?? identity.latestReviewId ?? "",
        })
      : null;

  return (
    <div className="space-y-4" data-testid="architecture-identity-desk">
      <header className="space-y-2">
        <h1 className={architectureIdentityDeskHeadingClass} data-testid="architecture-identity-desk-title">
          {architectureIdentityDeskPageTitle(identity.displayName)}
        </h1>
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-neutral-600 dark:text-neutral-300")}>
          <span className="font-medium text-neutral-800 dark:text-neutral-100">{ARCHITECTURE_IDENTITY_DESK_UPDATED_LABEL}:</span>
          {" "}
          {formatInventoryUpdatedAtCell(identity.updatedUtc).display}
        </p>
      </header>

      <section
        className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
        aria-labelledby="architecture-identity-current-draft-heading"
      >
        <h2 id="architecture-identity-current-draft-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {ARCHITECTURE_IDENTITY_DESK_CURRENT_DRAFT_LABEL}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {currentDraftId.length > 0 ? (
            <>
              <StatusTag kind="in-progress" label="Open draft" />
              <Link
                href={architectureIdentityDraftHref(identity.architectureId, currentDraftId)}
                className={OPERATOR_LINK.nav}
                data-testid="architecture-identity-open-current-draft"
              >
                Continue draft
              </Link>
            </>
          ) : (
            <>
              <p className={OPERATOR_TYPOGRAPHY.body}>{ARCHITECTURE_IDENTITY_DESK_NO_OPEN_DRAFT}</p>
              <Link href={ARCHITECTURES_NEW_PATH} className={OPERATOR_LINK.nav}>
                New version
              </Link>
            </>
          )}
        </div>
      </section>

      {latestSealedManifestId.length > 0 && identity.latestReviewId !== null && identity.latestReviewId !== undefined ? (
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <span className="font-medium">{ARCHITECTURE_IDENTITY_DESK_LATEST_SEAL_LABEL}:</span>
          {" "}
          <Link
            href={reviewDetailPath(identity.latestReviewId)}
            className={OPERATOR_LINK.nav}
            data-testid="architecture-identity-latest-seal-link"
          >
            Open sealed review record
          </Link>
        </p>
      ) : null}

      <section aria-labelledby="architecture-identity-reviews-heading">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 id="architecture-identity-reviews-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {ARCHITECTURE_IDENTITY_DESK_REVIEWS_SECTION_TITLE}
          </h2>
          {compareHref !== null ? (
            <Link href={compareHref} className={OPERATOR_LINK.nav} data-testid="architecture-identity-compare-entry">
              {ARCHITECTURE_IDENTITY_DESK_COMPARE_LABEL}
            </Link>
          ) : null}
        </div>
        <ArchitectureIdentityDeskReviewsTable reviews={identity.reviews} architectureId={identity.architectureId} />
      </section>

      <p className="sr-only" data-testid="architecture-identity-desk-path">
        {architectureIdentityPath(identity.architectureId)}
      </p>
    </div>
  );
}

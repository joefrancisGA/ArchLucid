"use client";

import Link from "next/link";
import { useState } from "react";

import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import { useRehydrateInFlightOperationsFromArchitecture } from "@/hooks/use-rehydrate-in-flight-from-architecture";
import { ArchitectureIdentityDeskCompareAction } from "@/components/architecture/ArchitectureIdentityDeskCompareAction";
import { ArchitectureIdentityDeskCurrentDraft } from "@/components/architecture/ArchitectureIdentityDeskCurrentDraft";
import { ArchitectureIdentityDeskReviewsTable } from "@/components/architecture/ArchitectureIdentityDeskReviewsTable";
import { ArchitectureIdentityDeskSkeleton } from "@/components/architecture/ArchitectureIdentityDeskSkeleton";
import { ArchitectureIdentityDeskVersionsSection } from "@/components/architecture/ArchitectureIdentityDeskVersionsSection";
import { ArchitectureIdentityRenameForm } from "@/components/architecture/ArchitectureIdentityRenameForm";
import { Button } from "@/components/ui/button";
import {
  architectureIdentityPath,
} from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_IDENTITY_DESK_HONESTY_LINE,
  ARCHITECTURE_IDENTITY_DESK_LATEST_SEAL_LABEL,
  ARCHITECTURE_IDENTITY_DESK_REVIEWS_SECTION_TITLE,
  ARCHITECTURE_IDENTITY_DESK_UPDATED_LABEL,
  architectureIdentityDeskHeadingClass,
  architectureIdentityDeskPageTitle,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { reviewDetailPath, startReviewFromArchitectureHref } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInventoryUpdatedAtCell } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

type ArchitectureIdentityDeskProps = {
  readonly architectureId: string;
};

export function ArchitectureIdentityDesk(props: ArchitectureIdentityDeskProps): React.JSX.Element {
  const query = useArchitectureIdentityQuery(props.architectureId);
  useRehydrateInFlightOperationsFromArchitecture(props.architectureId);
  const identity = query.data;
  const [headingOverride, setHeadingOverride] = useState<string | null>(null);

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
  const startReviewDraftId =
    currentDraftId.length > 0
      ? currentDraftId
      : identity.drafts[0]?.draftId?.trim() ?? "";
  const startReviewHref =
    startReviewDraftId.length > 0 ? startReviewFromArchitectureHref(startReviewDraftId) : null;
  const latestSealedManifestId = identity.latestSealedManifestId?.trim() ?? "";
  const deskTitle = headingOverride ?? identity.displayName;

  return (
    <div className="space-y-4" data-testid="architecture-identity-desk">
      <header className="space-y-2">
        <h1 className={architectureIdentityDeskHeadingClass} data-testid="architecture-identity-desk-title">
          {architectureIdentityDeskPageTitle(deskTitle)}
        </h1>
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-neutral-600 dark:text-neutral-300")}>
          <span className="font-medium text-neutral-800 dark:text-neutral-100">{ARCHITECTURE_IDENTITY_DESK_UPDATED_LABEL}:</span>
          {" "}
          {formatInventoryUpdatedAtCell(identity.updatedUtc).display}
        </p>
        <p
          className={cn(OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-300")}
          data-testid="architecture-identity-desk-honesty"
        >
          {ARCHITECTURE_IDENTITY_DESK_HONESTY_LINE}
        </p>
      </header>

      <ArchitectureIdentityRenameForm
        architectureId={identity.architectureId}
        displayName={identity.displayName}
        onRenamed={(displayName) => setHeadingOverride(displayName)}
      />

      <ArchitectureIdentityDeskCurrentDraft
        architectureId={identity.architectureId}
        currentDraftId={identity.currentDraftId}
        latestReviewId={identity.latestReviewId}
        drafts={identity.drafts}
      />

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

      <ArchitectureIdentityDeskVersionsSection versions={identity.versions ?? []} />

      <section aria-labelledby="architecture-identity-reviews-heading">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 id="architecture-identity-reviews-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {ARCHITECTURE_IDENTITY_DESK_REVIEWS_SECTION_TITLE}
          </h2>
          <ArchitectureIdentityDeskCompareAction reviews={identity.reviews} />
        </div>
        <ArchitectureIdentityDeskReviewsTable
          reviews={identity.reviews}
          architectureId={identity.architectureId}
          reviewCount={identity.reviewCount}
          startReviewHref={startReviewHref}
        />
      </section>

      <p className="sr-only" data-testid="architecture-identity-desk-path">
        {architectureIdentityPath(identity.architectureId)}
      </p>
    </div>
  );
}

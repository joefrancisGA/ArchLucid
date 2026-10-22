"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { DIGESTS_HUB_GET_STARTED_TAB_ID } from "@/lib/digests-hub-tab";
import { digestsHubScopedHref } from "@/lib/digests-route-paths";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DigestsBrowseContinueLastViewedRow } from "@/components/digests/DigestsBrowseContinueLastViewedRow";
import { DigestsBrowseDetailPanel } from "@/components/digests/DigestsBrowseDetailPanel";
import { DigestsBrowseHistoryList } from "@/components/digests/DigestsBrowseHistoryList";
import { DigestsBrowseNextReviewFooterClient } from "@/components/digests/DigestsBrowseNextReviewFooterClient";
import { DigestsBrowsePickReviewBeforeBrowsingStrip } from "@/components/digests/DigestsBrowsePickReviewBeforeBrowsingStrip";
import { useDigestsBrowseContent } from "@/components/digests/use-digests-browse-content";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { DigestsBrowseHistorySkeleton } from "@/components/digests/DigestsBrowseHistorySkeleton";
import { DigestsBrowseIncludesPreview } from "@/components/digests/DigestsBrowseIncludesPreview";
import { DigestsBrowseSetupChecklist } from "@/components/digests/DigestsBrowseSetupChecklist";
import {
  DIGESTS_BROWSE_EMPTY_DESCRIPTION,
  DIGESTS_BROWSE_EMPTY_TITLE,
  DIGESTS_BROWSE_INCLUDES_SECTION_TITLE,
  DIGESTS_BROWSE_LOADING_LABEL,
  DIGESTS_BROWSE_SETUP_UNKNOWN_DESCRIPTION,
  DIGESTS_BROWSE_SETUP_UNKNOWN_TITLE,
} from "@/lib/digests-browse-copy";
import {
  digestsBrowseDisclosureHrefFromSearch,
  parseDigestsBrowseIncludesOpenFromSearch,
  parseDigestsTechnicalDetailsOpenFromSearch,
} from "@/lib/digests/digests-browse-disclosure-url";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

export type DigestsBrowseContentProps = {
  /** When incremented by the hub Refresh control, reloads the digest list. */
  readonly refreshToken?: number;
  /** Called after a list load attempt finishes (success or failure). */
  readonly onLoaded?: () => void;
  /** When true, omits the page title (hub already renders OperatorPageHeader). */
  readonly hidePageHeader?: boolean;
  /** Weekly health snapshot for setup checklist and browse guidance. */
  readonly healthSnap?: WeeklyDigestHealthDto | null;
  /** Optional review scope from `?runId=` deep links. */
  readonly scopedRunId?: string | null;
  readonly onPickReview?: (reviewId: string) => void;
};

/**
 * Browse tab: architecture digest history and detail.
 */
export function DigestsBrowseContent(props: DigestsBrowseContentProps = {}): ReactElement {
  const { hidePageHeader = false, healthSnap = null } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const digestsBrowseIncludesOpenParam = searchParams.get("digestsBrowseIncludesOpen");
  const [browseIncludesOpen, setBrowseIncludesOpenState] = useState(() =>
    parseDigestsBrowseIncludesOpenFromSearch(digestsBrowseIncludesOpenParam),
  );

  const syncBrowseIncludesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        digestsBrowseDisclosureHrefFromSearch(
          searchParams.toString(),
          {
            browseIncludesOpen: open,
            technicalDetailsOpen: parseDigestsTechnicalDetailsOpenFromSearch(searchParams.get("digestsTechnicalDetailsOpen")),
          },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setBrowseIncludesOpen = useCallback(
    (open: boolean) => {
      setBrowseIncludesOpenState(open);
      syncBrowseIncludesOpenToUrl(open);
    },
    [syncBrowseIncludesOpenToUrl],
  );

  useEffect(() => {
    setBrowseIncludesOpenState(parseDigestsBrowseIncludesOpenFromSearch(digestsBrowseIncludesOpenParam));
  }, [digestsBrowseIncludesOpenParam]);

  const {
    digests,
    rowAttempts,
    selected,
    deliveryAttempts,
    previewOpen,
    setPreviewOpen,
    detailPanelRef,
    loading,
    failure,
    selectDigest,
    setupChecklist,
    setupIncomplete,
    showEmptyComposition,
    continueLastDigest,
    openContinueLastDigest,
  } = useDigestsBrowseContent({
    refreshToken: props.refreshToken,
    onLoaded: props.onLoaded,
    healthSnap,
  });

  const scopedRunId = (props.scopedRunId ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const browseClearScopeHref = digestsHubScopedHref(DIGESTS_HUB_GET_STARTED_TAB_ID, null);

  return (
    <div className={operatorPageContainerClass("dashboard")} data-testid="digests-browse-content">
      {!hidePageHeader ? (
        <>
          <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.pageTitle)}>
            Architecture digests
          </h2>
          <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Send scheduled summaries of review activity, approval signals, findings, and advisory scans.
          </p>
        </>
      ) : null}

      {!scopedRunFilterActive && props.onPickReview !== undefined ? (
        <DigestsBrowsePickReviewBeforeBrowsingStrip selectedReviewId="" onSelectReview={props.onPickReview} />
      ) : scopedRunFilterActive ? (
        <p
          className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="digests-browse-run-scope-banner"
        >
          {"Browsing digests for review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={browseClearScopeHref}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      ) : null}

      {failure !== null ? (
        <div className="mt-4" role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {loading && failure === null ? (
        <>
          <span className="sr-only">{DIGESTS_BROWSE_LOADING_LABEL}</span>
          <DigestsBrowseHistorySkeleton />
        </>
      ) : null}

      {showEmptyComposition ? (
        <div className="mt-4 space-y-3" data-testid="digests-browse-empty-state">
          {setupChecklist !== null ? (
            <DigestsBrowseSetupChecklist items={setupChecklist} />
          ) : (
            <EnterpriseCompactEmptyState
              testId="digests-empty-state"
              title={DIGESTS_BROWSE_SETUP_UNKNOWN_TITLE}
              description={DIGESTS_BROWSE_SETUP_UNKNOWN_DESCRIPTION}
            />
          )}
          <CollapsibleSection
            title={DIGESTS_BROWSE_INCLUDES_SECTION_TITLE}
            open={browseIncludesOpen}
            onToggle={setBrowseIncludesOpen}
            sectionTestId="digests-browse-includes-disclosure"
          >
            <DigestsBrowseIncludesPreview />
          </CollapsibleSection>
        </div>
      ) : null}

      {setupChecklist !== null && setupIncomplete && digests.length > 0 ? (
        <div className="mt-4">
          <DigestsBrowseSetupChecklist items={setupChecklist} />
        </div>
      ) : null}

      {digests.length > 0 ? (
        <div
          className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]"
          data-testid="digests-browse-master-detail"
          data-operator-side-rail-kind="master-detail"
        >
          {continueLastDigest !== null ? (
            <div className="xl:col-span-2">
              <DigestsBrowseContinueLastViewedRow
                target={continueLastDigest}
                onOpen={openContinueLastDigest}
              />
            </div>
          ) : null}
          <DigestsBrowseHistoryList
            digests={digests}
            rowAttempts={rowAttempts}
            selectedDigestId={selected?.digestId}
            onSelectDigest={(digestId) => void selectDigest(digestId)}
          />
          <DigestsBrowseDetailPanel
            selected={selected}
            deliveryAttempts={deliveryAttempts}
            previewOpen={previewOpen}
            onPreviewOpenChange={setPreviewOpen}
            detailPanelRef={detailPanelRef}
          />
        </div>
      ) : null}

      {scopedRunFilterActive ? <DigestsBrowseNextReviewFooterClient runId={scopedRunId} /> : null}
    </div>
  );
}

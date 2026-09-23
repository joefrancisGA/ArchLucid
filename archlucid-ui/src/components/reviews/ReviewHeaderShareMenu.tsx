"use client";

import Link from "next/link";
import { Share2, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement, type SetStateAction } from "react";

import { buildReviewMeetingPacketSteps, type ReviewMeetingPacketStep } from "@/components/reviews/ReviewMeetingPacketButton";
import { ShareableReviewLinkButton } from "@/components/usability/ShareableReviewLinkButton";
import { WorkingReviewCopyLinkButton } from "@/components/reviews/WorkingReviewCopyLinkButton";

import { Button, buttonVariants } from "@/components/ui/button";
import { SponsorExportSendHonestyStrip } from "@/components/exports/SponsorExportSendHonestyStrip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { downloadRunPackageExport } from "@/lib/api/downloads-blob-trigger-run-package";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { runPackageExportMutationBlockedReason } from "@/lib/runs/run-package-export-mutation-blocked-reason";
import { buildInviteReviewerHref, INVITE_REVIEWER_PAGE_TITLE } from "@/lib/invite-reviewer-flow";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatWhyDisabledCtaMessage, type WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import { REVIEW_DETAIL_URL_CHANGED_EVENT } from "@/lib/review-detail-workspace-tabs";
import {
  parseReviewHeaderShareMenuOpenFromSearch,
  reviewHeaderShareMenuHrefFromSearch,
} from "@/lib/reviews/review-header-share-menu-url";
import { cn } from "@/lib/utils";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { showError } from "@/lib/toast";

export type ReviewHeaderShareMenuProps = {
  readonly runId: string;
  readonly isCommitted: boolean;
  readonly findingsQueueHref: string;
  readonly manifestVersion?: string | null;
  readonly parentArchitectureId?: string | null;
  readonly canInviteReviewer?: boolean;
  readonly disabled?: boolean;
  readonly disabledReason?: WhyDisabledCtaReason | null;
  readonly disabledDescribedById?: string;
};

/** Consolidated share and export affordances on the review detail header. */
export function ReviewHeaderShareMenu(props: ReviewHeaderShareMenuProps): ReactElement {
  const pathname = usePathname() ?? `/architecture/reviews/${props.runId}`;
  const [open, setOpenState] = useState(() =>
    parseReviewHeaderShareMenuOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("shareMenuOpen"),
    ),
  );
  const [exportBusyStepId, setExportBusyStepId] = useState<string | null>(null);

  const syncShareMenuOpenToUrl = useCallback(
    (nextOpen: boolean) => {
      commitHrefIfChanged(
        reviewHeaderShareMenuHrefFromSearch(window.location.search.slice(1), nextOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (next !== current) {
          syncShareMenuOpenToUrl(next);
        }

        return next;
      });
    },
    [syncShareMenuOpenToUrl],
  );

  useEffect(() => {
    const syncShareMenuOpenFromUrl = (): void => {
      setOpenState((current) => {
        const next = parseReviewHeaderShareMenuOpenFromSearch(
          new URLSearchParams(window.location.search).get("shareMenuOpen"),
        );

        return current === next ? current : next;
      });
    };

    syncShareMenuOpenFromUrl();
    window.addEventListener("popstate", syncShareMenuOpenFromUrl);
    window.addEventListener(REVIEW_DETAIL_URL_CHANGED_EVENT, syncShareMenuOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncShareMenuOpenFromUrl);
      window.removeEventListener(REVIEW_DETAIL_URL_CHANGED_EVENT, syncShareMenuOpenFromUrl);
    };
  }, []);
  const inviteHref = buildInviteReviewerHref(props.runId, props.parentArchitectureId);
  const exportSteps = buildReviewMeetingPacketSteps({
    runId: props.runId,
    findingsQueueHref: props.findingsQueueHref,
  });
  const collateralExportBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: props.runId,
    manifestVersion: props.manifestVersion,
  });
  const disabledReasonMessage = formatWhyDisabledCtaMessage(props.disabledReason);
  const shareMenuDisabled = props.disabled === true;

  const onDownloadStep = useCallback(
    (step: ReviewMeetingPacketStep) => {
      if (step.exportFormat === undefined || collateralExportBlockedReason !== null) {
        return;
      }

      setExportBusyStepId(step.id);

      void downloadRunPackageExport(props.runId, step.exportFormat)
        .catch((error: unknown) => {
          const failure = toApiLoadFailure(error);
          const blocked = runPackageExportMutationBlockedReason(failure);

          showError(step.label, blocked ?? failure.message);
        })
        .finally(() => {
          setExportBusyStepId(null);
          setOpen(false);
        });
    },
    [collateralExportBlockedReason, props.runId, setOpen],
  );

  if (shareMenuDisabled) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled
        aria-describedby={props.disabledDescribedById}
        aria-label={disabledReasonMessage ?? "Share and export unavailable until the review completes"}
        data-testid="review-header-share-menu-trigger"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        Share &amp; export
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          data-testid="review-header-share-menu-trigger"
        >
          <Share2 className="h-4 w-4" aria-hidden />
          Share &amp; export
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3 p-3">
        <div className="space-y-2" data-testid="review-header-share-menu-links">
          <Link
            href={inviteHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-start gap-1.5")}
            data-testid="review-invite-collaborator-link"
            aria-disabled={props.canInviteReviewer === false}
            tabIndex={props.canInviteReviewer === false ? -1 : undefined}
            title={
              props.canInviteReviewer === false ? "Workspace admin access required to send invitations" : undefined
            }
            onClick={(event) => {
              if (props.canInviteReviewer === false) {
                event.preventDefault();
                return;
              }

              setOpen(false);
            }}
          >
            <Users className="h-4 w-4" aria-hidden />
            {INVITE_REVIEWER_PAGE_TITLE}
          </Link>
          <ShareableReviewLinkButton
            runId={props.runId}
            isCommitted={props.isCommitted}
            manifestVersion={props.manifestVersion}
          />
          <WorkingReviewCopyLinkButton
            runId={props.runId}
            parentArchitectureId={props.parentArchitectureId}
          />
        </div>
        <div className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800" data-testid="review-header-share-menu-exports">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
            Sponsor briefing export
          </p>
          <ul className="m-0 list-none space-y-2 p-0">
            {exportSteps.map((step) => (
              <li key={step.id}>
                {step.href !== undefined || step.exportFormat !== undefined ? (
                  step.downloadLabel !== undefined ? (
                    collateralExportBlockedReason !== null ? (
                      <span
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "w-full justify-start opacity-50",
                        )}
                        data-testid={`review-header-export-${step.id}-blocked`}
                      >
                        {step.label}
                      </span>
                    ) : step.exportFormat !== undefined ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        disabled={exportBusyStepId !== null}
                        data-testid={`review-header-export-${step.id}`}
                        onClick={() => onDownloadStep(step)}
                      >
                        {exportBusyStepId === step.id ? "Downloading…" : step.label}
                      </Button>
                    ) : (
                      <Link
                        href={step.href ?? "#"}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "w-full justify-start",
                        )}
                        data-testid={`review-header-export-${step.id}`}
                        onClick={() => setOpen(false)}
                      >
                        {step.label}
                      </Link>
                    )
                  ) : (
                    <Link
                      href={step.href ?? "#"}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "w-full justify-start",
                      )}
                      data-testid={`review-header-export-${step.id}`}
                      onClick={() => setOpen(false)}
                    >
                      {step.label}
                    </Link>
                  )
                ) : null}
              </li>
            ))}
          </ul>
          {collateralExportBlockedReason !== null ? (
            <p
              role="alert"
              className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="review-header-share-menu-export-blocked-reason"
            >
              {collateralExportBlockedReason}
            </p>
          ) : null}
          <SponsorExportSendHonestyStrip className="w-full pt-2" testIdPrefix="review-header-share-export" />
        </div>
      </PopoverContent>
    </Popover>
  );
}

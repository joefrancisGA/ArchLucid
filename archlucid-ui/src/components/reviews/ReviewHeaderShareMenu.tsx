"use client";

import Link from "next/link";
import { Share2, Users } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type ReactElement, type SetStateAction } from "react";

import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { ShareableReviewLinkButton } from "@/components/usability/ShareableReviewLinkButton";
import { buildReviewMeetingPacketSteps } from "@/components/reviews/ReviewMeetingPacketButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildInviteReviewerHref, INVITE_REVIEWER_PAGE_TITLE } from "@/lib/invite-reviewer-flow";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatWhyDisabledCtaMessage, type WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import {
  parseReviewHeaderShareMenuOpenFromSearch,
  reviewHeaderShareMenuHrefFromSearch,
} from "@/lib/reviews/review-header-share-menu-url";
import { cn } from "@/lib/utils";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";

export type ReviewHeaderShareMenuProps = {
  readonly runId: string;
  readonly isCommitted: boolean;
  readonly findingsQueueHref: string;
  readonly manifestVersion?: string | null;
  readonly canInviteReviewer?: boolean;
  readonly disabled?: boolean;
  readonly disabledReason?: WhyDisabledCtaReason | null;
  readonly disabledDescribedById?: string;
};

/** Consolidated share and export affordances on the review detail header. */
export function ReviewHeaderShareMenu(props: ReviewHeaderShareMenuProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/reviews/${props.runId}`;
  const searchParams = useSearchParams();
  const shareMenuOpenParam = searchParams.get("shareMenuOpen");
  const [open, setOpenState] = useState(() => parseReviewHeaderShareMenuOpenFromSearch(shareMenuOpenParam));

  const syncShareMenuOpenToUrl = useCallback(
    (nextOpen: boolean) => {
      router.replace(reviewHeaderShareMenuHrefFromSearch(searchParams.toString(), nextOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncShareMenuOpenToUrl(next);

        return next;
      });
    },
    [syncShareMenuOpenToUrl],
  );
  const inviteHref = buildInviteReviewerHref(props.runId);
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
        </div>
        <div className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800" data-testid="review-header-share-menu-exports">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
            Sponsor briefing export
          </p>
          <ul className="m-0 list-none space-y-2 p-0">
            {exportSteps.map((step) => (
              <li key={step.id}>
                {step.href !== undefined ? (
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
                    ) : (
                      <ExportTrackedAnchor
                        href={step.href}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "w-full justify-start",
                        )}
                        data-testid={`review-header-export-${step.id}`}
                        onClick={() => setOpen(false)}
                      >
                        {step.label}
                      </ExportTrackedAnchor>
                    )
                  ) : (
                    <Link
                      href={step.href}
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
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import Link from "next/link";
import { Share2, Users } from "lucide-react";
import { useState, type ReactElement } from "react";

import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { ShareableReviewLinkButton } from "@/components/usability/ShareableReviewLinkButton";
import { buildReviewMeetingPacketSteps } from "@/components/reviews/ReviewMeetingPacketButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildInviteReviewerHref, INVITE_REVIEWER_PAGE_TITLE } from "@/lib/invite-reviewer-flow";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatWhyDisabledCtaMessage, type WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";

export type ReviewHeaderShareMenuProps = {
  readonly runId: string;
  readonly isCommitted: boolean;
  readonly findingsQueueHref: string;
  readonly canInviteReviewer?: boolean;
  readonly disabled?: boolean;
  readonly disabledReason?: WhyDisabledCtaReason | null;
};

/** Consolidated share and export affordances on the review detail header. */
export function ReviewHeaderShareMenu(props: ReviewHeaderShareMenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const inviteHref = buildInviteReviewerHref(props.runId);
  const exportSteps = buildReviewMeetingPacketSteps({
    runId: props.runId,
    findingsQueueHref: props.findingsQueueHref,
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
          <ShareableReviewLinkButton runId={props.runId} isCommitted={props.isCommitted} />
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
        </div>
      </PopoverContent>
    </Popover>
  );
}

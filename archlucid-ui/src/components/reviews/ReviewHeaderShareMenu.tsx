"use client";

import Link from "next/link";
import { Share2, Users } from "lucide-react";
import { useState, type ReactElement } from "react";

import { ShareableReviewLinkButton } from "@/components/usability/ShareableReviewLinkButton";
import { ReviewMeetingPacketButton } from "@/components/reviews/ReviewMeetingPacketButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildInviteReviewerHref, INVITE_REVIEWER_PAGE_TITLE } from "@/lib/invite-reviewer-flow";
import { cn } from "@/lib/utils";

export type ReviewHeaderShareMenuProps = {
  readonly runId: string;
  readonly isCommitted: boolean;
  readonly findingsQueueHref: string;
  readonly canInviteReviewer?: boolean;
};

/** Consolidated share affordances on the review detail header. */
export function ReviewHeaderShareMenu(props: ReviewHeaderShareMenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const inviteHref = buildInviteReviewerHref(props.runId);

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
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3 p-3">
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
        <ReviewMeetingPacketButton
          runId={props.runId}
          findingsQueueHref={props.findingsQueueHref}
        />
      </PopoverContent>
    </Popover>
  );
}

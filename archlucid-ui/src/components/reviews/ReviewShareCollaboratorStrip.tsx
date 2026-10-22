"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import type { ReactElement } from "react";

import { ShareableReviewLinkButton } from "@/components/usability/ShareableReviewLinkButton";
import { buttonVariants } from "@/components/ui/button";
import { buildInviteReviewerHref } from "@/lib/invite-reviewer-flow";
import { cn } from "@/lib/utils";

export type ReviewShareCollaboratorStripProps = {
  readonly runId: string;
  readonly isCommitted: boolean;
  readonly manifestVersion?: string | null;
  readonly canInviteReviewer?: boolean;
};

/** Share and invite affordances on the review detail header (before and after finalize). */
export function ReviewShareCollaboratorStrip(props: ReviewShareCollaboratorStripProps): ReactElement {
  const inviteHref = buildInviteReviewerHref(props.runId);

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="review-share-collaborator-strip">
      <Link
        href={inviteHref}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        data-testid="review-invite-collaborator-link"
        title={props.canInviteReviewer === false ? "Workspace admin access required to send invitations" : undefined}
      >
        <Users className="h-4 w-4" aria-hidden />
        Invite reviewer
      </Link>
      <ShareableReviewLinkButton
        runId={props.runId}
        isCommitted={props.isCommitted}
        manifestVersion={props.manifestVersion}
      />
    </div>
  );
}

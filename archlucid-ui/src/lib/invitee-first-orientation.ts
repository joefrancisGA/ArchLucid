import type { CurrentPrincipal } from "@/lib/current-principal";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";

export type InviteeOrientationContext = {
  readonly isInviteeReviewer: boolean;
};

/** Read-tier principals invited as reviewers — not package creators (TB-2182). */
export function resolveInviteeOrientationContext(principal: CurrentPrincipal): InviteeOrientationContext {
  const role = principal.primaryAppRole;
  const isInviteeReviewer =
    principal.provenance === "auth-me" &&
    !principal.hasEnterpriseOperatorSurfaces &&
    (role === "Reader" || role === "Auditor");

  return { isInviteeReviewer };
}

export type InviteeFirstOrientationCopy = {
  readonly heading: string;
  readonly jobSentence: string;
  readonly findingsCtaHref: string;
  readonly findingsCtaLabel: string;
};

export function resolveInviteeFirstOrientationCopy(input: {
  readonly packageOwnerLabel: string | null;
  readonly runId: string;
}): InviteeFirstOrientationCopy {
  const ownerPhrase =
    input.packageOwnerLabel !== null && input.packageOwnerLabel.trim().length > 0
      ? input.packageOwnerLabel
      : "the architecture owner";

  return {
    heading: "You are reviewing someone else's architecture review",
    jobSentence: `Your job is to review findings from ${ownerPhrase}, record dispositions, and add comments — not to run intake or start a new review.`,
    findingsCtaHref: buildReviewDetailTabHref(input.runId, "findings"),
    findingsCtaLabel: "Open findings to review",
  };
}

export function resolveInviteeHomeOrientationCopy(): InviteeFirstOrientationCopy {
  return {
    heading: "You were invited to review architecture reviews",
    jobSentence:
      "Your job is to read findings, record dispositions, and add comments — not to run intake or start new reviews.",
    findingsCtaHref: "/governance/findings",
    findingsCtaLabel: "Open findings queue",
  };
}

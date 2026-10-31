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
  readonly jobSentence: string;
  readonly findingsCtaHref: string;
  readonly findingsCtaLabel: string;
};

const GUID_LIKE_OWNER_LABEL =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatInviteePackageOwnerPhrase(packageOwnerLabel: string | null): string {
  if (packageOwnerLabel === null || packageOwnerLabel.trim().length === 0) {
    return "Review owner was not stored.";
  }

  const trimmed = packageOwnerLabel.trim();

  if (GUID_LIKE_OWNER_LABEL.test(trimmed)) {
    return "Review owner display name was not stored.";
  }

  return trimmed;
}

export function resolveInviteeFirstOrientationCopy(input: {
  readonly packageOwnerLabel: string | null;
  readonly runId: string;
}): InviteeFirstOrientationCopy {
  const ownerPhrase = formatInviteePackageOwnerPhrase(input.packageOwnerLabel);

  return {
    jobSentence: `Your job is to review findings from ${ownerPhrase}, record dispositions, and add comments — not to run intake or start a new review.`,
    findingsCtaHref: buildReviewDetailTabHref(input.runId, "findings"),
    findingsCtaLabel: "Open findings to review",
  };
}

export function resolveInviteeHomeOrientationCopy(): InviteeFirstOrientationCopy {
  return {
    jobSentence:
      "Your job is to read findings, record dispositions, and add comments — not to run intake or start new reviews.",
    findingsCtaHref: "/governance/findings",
    findingsCtaLabel: "Open findings queue",
  };
}

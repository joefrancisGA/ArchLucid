import type { CurrentPrincipal } from "@/lib/current-principal";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";

import { resolveInviteeOrientationContext } from "@/lib/invitee-first-orientation";

export type ColdSharedLinkEntrySignal = "read_only_query" | "shared_query" | "invitation_token" | "none";

export function resolveColdSharedLinkEntrySignal(
  searchParams: URLSearchParams,
  hasInvitationToken: boolean,
): ColdSharedLinkEntrySignal {
  if (hasInvitationToken) {
    return "invitation_token";
  }

  if (searchParams.get("readOnly") === "1") {
    return "read_only_query";
  }

  if (searchParams.get("shared") === "1" || searchParams.get("fromShare") === "1") {
    return "shared_query";
  }

  return "none";
}

export type ColdSharedLinkUnpackPresentation = {
  readonly packageTitle: string;
  readonly statusLabel: string;
  readonly statusKind: RunDetailWorkspaceStatus["statusTagKind"];
  readonly whyYouAreHere: string;
  readonly primaryCtaHref: string;
  readonly primaryCtaLabel: string;
};

const WHY_YOU_ARE_HERE_BY_SIGNAL: Record<Exclude<ColdSharedLinkEntrySignal, "none">, string> = {
  invitation_token: "You were invited to review this architecture review.",
  read_only_query: "Someone shared a read-only link to this architecture review with you.",
  shared_query: "You opened a shared link to this architecture review.",
};

/** Pure resolver for the one-time cold-open unpack panel (TB-2181). */
export function resolveColdSharedLinkUnpackPresentation(input: {
  readonly runId: string;
  readonly packageTitle: string;
  readonly workspaceStatus: RunDetailWorkspaceStatus;
  readonly entrySignal: ColdSharedLinkEntrySignal;
  readonly principal: CurrentPrincipal;
}): ColdSharedLinkUnpackPresentation | null {
  if (input.entrySignal === "none") {
    return null;
  }

  const inviteeContext = resolveInviteeOrientationContext(input.principal);
  const primaryCtaLabel = inviteeContext.isInviteeReviewer ? "Review findings" : "Open review overview";
  const primaryCtaHref = inviteeContext.isInviteeReviewer
    ? buildReviewDetailTabHref(input.runId, "findings")
    : buildReviewDetailTabHref(input.runId, "overview");

  return {
    packageTitle: input.packageTitle,
    statusLabel: input.workspaceStatus.label,
    statusKind: input.workspaceStatus.statusTagKind,
    whyYouAreHere: WHY_YOU_ARE_HERE_BY_SIGNAL[input.entrySignal],
    primaryCtaHref,
    primaryCtaLabel,
  };
}

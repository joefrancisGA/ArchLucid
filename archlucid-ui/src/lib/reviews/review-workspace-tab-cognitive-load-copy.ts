import { buildReviewDetailTabHref, type ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  resolveReviewCognitiveLoadPrimaryAction,
  type ReviewCognitiveLoadPrimaryAction,
} from "@/lib/reviews/review-cognitive-load-copy";

export function resolveReviewWorkspaceTabCognitivePrimaryAction(input: {
  readonly lifecycle: ReviewWorkspaceLifecycle;
  readonly activeTab: ReviewDetailTabId;
  readonly runId: string;
  readonly evidenceReferenceCountNotStored: boolean;
}): ReviewCognitiveLoadPrimaryAction | null {
  const runId = input.runId.trim();

  if (runId.length === 0) {
    return null;
  }

  const sponsorPacketHref = buildReviewDetailTabHref(runId, "review-package");
  const evidenceHref = buildReviewDetailTabHref(runId, "evidence");
  const findingsHref = buildReviewDetailTabHref(runId, "findings");

  const openGateReviewTab: ReviewDetailTabId | null =
    input.activeTab === "overview" ? "findings" : input.activeTab === "findings" ? "evidence" : null;

  const openGateHref =
    openGateReviewTab === "findings"
      ? findingsHref
      : openGateReviewTab === "evidence"
        ? evidenceHref
        : null;

  if (input.lifecycle === "finalized" && input.activeTab !== "review-package") {
    return { label: "Open sponsor packet", href: sponsorPacketHref };
  }

  if (input.lifecycle === "in-review" && input.activeTab === "overview") {
    return resolveReviewCognitiveLoadPrimaryAction({
      openGateReviewTab: "findings",
      openGateLabel: "Findings",
      evidenceReferenceCountNotStored: input.evidenceReferenceCountNotStored,
      openGateHref: findingsHref,
      sponsorPacketHref,
    });
  }

  return resolveReviewCognitiveLoadPrimaryAction({
    openGateReviewTab,
    openGateLabel: openGateReviewTab !== null ? "Next tab" : null,
    evidenceReferenceCountNotStored: input.evidenceReferenceCountNotStored,
    openGateHref,
    sponsorPacketHref,
  });
}

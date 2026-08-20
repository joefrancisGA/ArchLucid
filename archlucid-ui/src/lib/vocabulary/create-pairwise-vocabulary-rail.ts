import { buildReviewWorkspaceTabHref } from "@/lib/unified-review-workspace-tabs";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

export type PairwiseVocabularyLink<TSurfaceId extends string> = {
  readonly id: TSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PairwiseVocabularyRailModel<TSurfaceId extends string> = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly currentLink: PairwiseVocabularyLink<TSurfaceId>;
  readonly peerLink: PairwiseVocabularyLink<TSurfaceId>;
};

export type CreatePairwiseVocabularyRailInput<TSurfaceId extends string> = {
  readonly runId: string;
  readonly currentTab: TSurfaceId;
  readonly currentTabId: ReviewDetailTabId;
  readonly peerTabId: ReviewDetailTabId;
  readonly copy: {
    readonly heading: string;
    readonly whyTwo: string;
    readonly compactLine: string;
    readonly currentLabel: string;
    readonly peerLabel: string;
    readonly currentWhenToUse: string;
    readonly peerWhenToUse: string;
  };
  readonly currentSurfaceId: TSurfaceId;
  readonly peerSurfaceId: TSurfaceId;
};

/** TB-2365 — shared factory for package tab vocabulary rails using reviewTab hrefs only. */
export function createPairwiseVocabularyRail<TSurfaceId extends string>(
  input: CreatePairwiseVocabularyRailInput<TSurfaceId>,
): PairwiseVocabularyRailModel<TSurfaceId> {
  const runId = input.runId.trim();
  const currentHref = buildReviewWorkspaceTabHref(runId, input.currentTabId);
  const peerHref = buildReviewWorkspaceTabHref(runId, input.peerTabId);

  const currentLink: PairwiseVocabularyLink<TSurfaceId> = {
    id: input.currentSurfaceId,
    label: input.copy.currentLabel,
    href: currentHref,
    whenToUse: input.copy.currentWhenToUse,
  };

  const peerLink: PairwiseVocabularyLink<TSurfaceId> = {
    id: input.peerSurfaceId,
    label: input.copy.peerLabel,
    href: peerHref,
    whenToUse: input.copy.peerWhenToUse,
  };

  return {
    heading: input.copy.heading,
    whyTwo: input.copy.whyTwo,
    compactLine: input.copy.compactLine,
    currentLink: input.currentTab === input.currentSurfaceId ? currentLink : peerLink,
    peerLink: input.currentTab === input.currentSurfaceId ? peerLink : currentLink,
  };
}

export function resolvePairwiseVocabularyPeerLink<TSurfaceId extends string>(
  currentSurfaceId: TSurfaceId,
  model: PairwiseVocabularyRailModel<TSurfaceId>,
): PairwiseVocabularyLink<TSurfaceId> {
  if (currentSurfaceId === model.currentLink.id) {
    return model.peerLink;
  }

  return model.currentLink;
}

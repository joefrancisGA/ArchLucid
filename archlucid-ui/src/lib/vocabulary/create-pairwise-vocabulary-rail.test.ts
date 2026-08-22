import { describe, expect, it } from "vitest";

import {
  createExternalPeerPairwiseVocabularyRail,
  createPairwiseVocabularyRail,
  resolvePairwiseVocabularyPeerLink,
} from "@/lib/vocabulary/create-pairwise-vocabulary-rail";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

describe("createPairwiseVocabularyRail (TB-2365)", () => {
  it("builds reviewTab-only peer links", () => {
    const model = createPairwiseVocabularyRail({
      runId: "run-1",
      currentTab: "overview",
      currentTabId: "overview",
      peerTabId: "architecture",
      currentSurfaceId: "overview",
      peerSurfaceId: "diagram",
      copy: {
        heading: "Overview and Diagram serve different purposes",
        whyTwo: "Overview is the structured brief; Diagram is an illustrative sketch.",
        compactLine: "Overview is the structured brief; Diagram is an illustrative sketch.",
        currentLabel: "Overview",
        peerLabel: "Diagram",
        currentWhenToUse: "Read the structured brief summary.",
        peerWhenToUse: "View the illustrative architecture sketch.",
      },
    });

    expect(model.currentLink.href).toContain("reviewTab=overview");
    expect(model.peerLink.href).toContain("reviewTab=architecture");
    expect(resolvePairwiseVocabularyPeerLink("overview", model).id).toBe("diagram");
  });
});

describe("createExternalPeerPairwiseVocabularyRail (TB-2365)", () => {
  it("builds reviewTab current side and external peer href", () => {
    const model = createExternalPeerPairwiseVocabularyRail({
      runId: "run-abc",
      reviewSurfaceId: "package-activity",
      externalSurfaceId: "audit-trail",
      reviewTabId: "activity",
      copy: {
        heading: "Package Activity and Audit trail serve different purposes",
        whyTwo: "Package Activity shows assessment progress for one architecture package.",
        compactLine: "Package Activity is assessment progress on one review; Audit trail is the operator activity log.",
        reviewSideLabel: "Activity",
        reviewSideWhenToUse: "Follow assessment progress for this architecture package.",
      },
      reviewsPeerFallbackLink: {
        id: "package-activity",
        label: "Reviews (open Activity)",
        href: "/architecture/reviews",
        whenToUse: "Open an architecture package, then use Activity for assessment progress.",
      },
      externalPeerLinkBase: {
        id: "audit-trail",
        label: "Audit trail",
        href: GOVERNANCE_AUDIT_PATH,
        whenToUse: "Search the operator activity log for approval and review events.",
      },
      buildExternalPeerHref: (scopedRunId) =>
        `${GOVERNANCE_AUDIT_PATH}?runId=${encodeURIComponent(scopedRunId)}`,
    });

    expect(model.reviewSideLink.href).toContain("reviewTab=activity");
    expect(model.externalPeerLink.href).toBe(`${GOVERNANCE_AUDIT_PATH}?runId=run-abc`);
  });
});

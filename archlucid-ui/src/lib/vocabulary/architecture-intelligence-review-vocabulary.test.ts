import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INTELLIGENCE_REVIEW_TOOL_LINK,
  buildArchitectureIntelligenceReviewVocabulary,
  resolveArchitectureIntelligenceReviewPeerLink,
} from "@/lib/vocabulary/architecture-intelligence-review-vocabulary";

describe("architecture-intelligence-review-vocabulary (TB-2358)", () => {
  it("builds run-scoped review workspace and reasoning-pass links", () => {
    const model = buildArchitectureIntelligenceReviewVocabulary("run-abc");

    expect(model.reviewWorkspaceLink.href).toContain("run-abc");
    expect(model.reviewWorkspaceLink.href).toContain("reviewTab=overview");
    expect(model.architectureIntelligenceLink.href).toContain("runId=run-abc");
    expect(model.compactLine).not.toMatch(/golden|closed-loop/i);
  });

  it("resolves peer links for each surface", () => {
    const model = buildArchitectureIntelligenceReviewVocabulary("run-abc");

    expect(resolveArchitectureIntelligenceReviewPeerLink("review-workspace", model)).toEqual(
      model.architectureIntelligenceLink,
    );
    expect(resolveArchitectureIntelligenceReviewPeerLink("architecture-intelligence", model)).toEqual(
      model.reviewWorkspaceLink,
    );
  });

  it("falls back to reviews list when runId is absent", () => {
    const model = buildArchitectureIntelligenceReviewVocabulary(null);

    expect(model.reviewWorkspaceLink.href).toContain("/architecture/reviews");
    expect(model.architectureIntelligenceLink.href).toBe(ARCHITECTURE_INTELLIGENCE_REVIEW_TOOL_LINK.href);
  });
});

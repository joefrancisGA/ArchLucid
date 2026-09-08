import { describe, expect, it } from "vitest";

import { resolveGovernanceQueueReturnLocator } from "@/lib/governance/governance-return-locator";

describe("resolveGovernanceQueueReturnLocator (AO-27)", () => {
  it("returns nested review job and architecture desk hrefs when parent id is known", () => {
    const locator = resolveGovernanceQueueReturnLocator({
      runId: "run-001",
      draftRegistryEntries: [
        {
          draftId: "draft-001",
          displayName: "Payments",
          customerStatus: "in-review",
          ownerLabel: "You",
          lastUpdatedUtc: "2026-01-01T00:00:00.000Z",
          linkedReviewId: "run-001",
          serverUpdatedUtc: "2026-01-01T00:00:00.000Z",
          parentArchitectureId: "architecture-identity-001",
        },
      ],
    });

    expect(locator.architectureDeskHref).toBe("/architecture/architectures/architecture-identity-001");
    expect(locator.reviewJobHref).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001",
    );
    expect(locator.reviewJobHref).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
  });

  it("keeps peer review href when architecture parent is unknown", () => {
    const locator = resolveGovernanceQueueReturnLocator({
      runId: "run-unlinked",
      draftRegistryEntries: [],
    });

    expect(locator.architectureDeskHref).toBeNull();
    expect(locator.reviewJobHref).toBe("/architecture/reviews/run-unlinked");
  });
});

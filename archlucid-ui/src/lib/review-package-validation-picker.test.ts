import { describe, expect, it } from "vitest";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

import {
  lookupArchitectureDraftOwnerLabel,
  lookupArchitectureDraftParentArchitectureId,
  reviewPackageFinalizedDateLabel,
  reviewPackageOwnerLabel,
  REVIEW_PACKAGE_FINALIZED_DATE_NOT_STORED,
  REVIEW_PACKAGE_OWNER_UNAVAILABLE,
  REVIEW_PACKAGE_VALIDATION_OUTCOME_NOT_STORED,
  formatLastValidationOutcomeLabel,
} from "./review-package-validation-picker";

describe("reviewPackageFinalizedDateLabel", () => {
  it("omits a finalized date label for in-progress packages", () => {
    expect(
      reviewPackageFinalizedDateLabel({
        runId: "draft-review",
        projectId: "default",
        createdUtc: "2026-01-14T12:00:00.000Z",
      } satisfies RunSummary),
    ).toBe("");
  });

  it("does not reuse run createdUtc as the finalized date", () => {
    expect(
      reviewPackageFinalizedDateLabel({
        runId: "finalized-review",
        projectId: "default",
        createdUtc: "2026-01-14T12:00:00.000Z",
        hasGoldenManifest: true,
      } satisfies RunSummary),
    ).toBe(REVIEW_PACKAGE_FINALIZED_DATE_NOT_STORED);
  });
});

describe("reviewPackageOwnerLabel", () => {
  it("returns demo package owner for showcase runs", () => {
    const label = reviewPackageOwnerLabel({
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      projectId: "default",
      createdUtc: "2026-01-14T12:00:00.000Z",
    } satisfies RunSummary);

    expect(label).toBe("Taylor Morgan");
  });

  it("returns draft registry owner when the review is linked to an architecture draft", () => {
    const label = reviewPackageOwnerLabel(
      {
        runId: "review-linked",
        projectId: "default",
        createdUtc: "2026-01-14T12:00:00.000Z",
      } satisfies RunSummary,
      {
        draftRegistryEntries: [
          {
            draftId: "draft-001",
            displayName: "Payments platform",
            customerStatus: "ready-for-review",
            ownerLabel: "alex@example.com",
            lastUpdatedUtc: "2026-01-14T12:00:00.000Z",
            linkedReviewId: "review-linked",
            serverUpdatedUtc: "2026-01-14T12:00:00.000Z",
          },
        ],
      },
    );

    expect(label).toBe("alex@example.com");
  });

  it("returns governance decision recorder when present on the run summary", () => {
    const label = reviewPackageOwnerLabel({
      runId: "finalized-review",
      projectId: "default",
      createdUtc: "2026-01-14T12:00:00.000Z",
      operatorGovernanceDecisionByUserId: "jordan.lee@example.com",
    } as RunSummary);

    expect(label).toBe("jordan.lee@example.com");
  });

  it("does not invent an owner from the signed-in user when none was stored (P-20)", () => {
    const label = reviewPackageOwnerLabel(
      {
        runId: "draft-review",
        projectId: "default",
        createdUtc: "2026-01-14T12:00:00.000Z",
      } satisfies RunSummary,
      { currentUserLabel: "Taylor Morgan" },
    );

    expect(label).toBe(REVIEW_PACKAGE_OWNER_UNAVAILABLE);
  });

  it("returns unavailable marker when the current user label is missing", () => {
    const label = reviewPackageOwnerLabel(
      {
        runId: "draft-review",
        projectId: "default",
        createdUtc: "2026-01-14T12:00:00.000Z",
      } satisfies RunSummary,
      { currentUserLabel: null },
    );

    expect(label).toBe(REVIEW_PACKAGE_OWNER_UNAVAILABLE);
  });

  it("replaces draft registry You placeholder with the signed-in username", () => {
    const label = reviewPackageOwnerLabel(
      {
        runId: "review-linked",
        projectId: "default",
        createdUtc: "2026-01-14T12:00:00.000Z",
      } satisfies RunSummary,
      {
        currentUserLabel: "alex@example.com",
        draftRegistryEntries: [
          {
            draftId: "draft-001",
            displayName: "Payments platform",
            customerStatus: "ready-for-review",
            ownerLabel: "You",
            lastUpdatedUtc: "2026-01-14T12:00:00.000Z",
            linkedReviewId: "review-linked",
            serverUpdatedUtc: "2026-01-14T12:00:00.000Z",
          },
        ],
      },
    );

    expect(label).toBe("alex@example.com");
  });

  it("returns unavailable marker when no owner can be resolved", () => {
    const label = reviewPackageOwnerLabel({
      runId: "orphan-review",
      projectId: "default",
      createdUtc: "2026-01-14T12:00:00.000Z",
    } satisfies RunSummary);

    expect(label).toBe(REVIEW_PACKAGE_OWNER_UNAVAILABLE);
  });
});

describe("formatLastValidationOutcomeLabel", () => {
  it("labels a missing validation outcome without owner copy (P-19)", () => {
    expect(formatLastValidationOutcomeLabel(null)).toBe(REVIEW_PACKAGE_VALIDATION_OUTCOME_NOT_STORED);
  });
});

describe("lookupArchitectureDraftOwnerLabel", () => {
  it("matches linked review ids after demo canonicalization", () => {
    const owner = lookupArchitectureDraftOwnerLabel("review-linked", [
      {
        draftId: "draft-001",
        displayName: "Payments platform",
        customerStatus: "ready-for-review",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-14T12:00:00.000Z",
        linkedReviewId: "review-linked",
        serverUpdatedUtc: "2026-01-14T12:00:00.000Z",
      },
    ]);

    expect(owner).toBe("You");
  });
});

describe("lookupArchitectureDraftParentArchitectureId (AO-26)", () => {
  it("returns parent architecture id for a linked review", () => {
    const architectureId = lookupArchitectureDraftParentArchitectureId("run-001", [
      {
        draftId: "draft-001",
        displayName: "Payments",
        customerStatus: "in-review",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-14T12:00:00.000Z",
        linkedReviewId: "run-001",
        serverUpdatedUtc: "2026-01-14T12:00:00.000Z",
        parentArchitectureId: "architecture-identity-001",
      },
    ]);

    expect(architectureId).toBe("architecture-identity-001");
  });
});

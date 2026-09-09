import { describe, expect, it } from "vitest";

import { resolveOpenArchitectureJobRunId } from "@/lib/architecture/resolve-open-architecture-job-run-id";
import type { ArchitectureIdentityDetail } from "@/types/architecture-identity";

const identityFixture: ArchitectureIdentityDetail = {
  architectureId: "architecture-identity-001",
  displayName: "Payments platform",
  description: null,
  currentModelId: null,
  latestSealedManifestId: null,
  currentDraftId: "draft-spawned",
  latestReviewId: "review-latest",
  draftCount: 1,
  reviewCount: 2,
  createdUtc: "2026-01-01T00:00:00Z",
  updatedUtc: "2026-01-02T00:00:00Z",
  drafts: [
    {
      draftId: "draft-spawned",
      status: "RunSpawned",
      systemName: "Payments",
      updatedUtc: "2026-01-02T00:00:00Z",
    },
  ],
  reviews: [
    {
      runId: "review-latest",
      description: "Latest review",
      createdUtc: "2026-01-02T00:00:00Z",
    },
    {
      runId: "review-older",
      description: "Older review",
      createdUtc: "2026-01-01T00:00:00Z",
    },
  ],
  versions: [],
};

describe("resolveOpenArchitectureJobRunId (AO-30 / AO-31)", () => {
  it("AO-30: prefers the nested review id in the current path", () => {
    expect(
      resolveOpenArchitectureJobRunId({
        pathname: "/architecture/architectures/architecture-identity-001/reviews/review-in-path",
        lastOpenArchitectureId: "architecture-identity-001",
        identity: identityFixture,
      }),
    ).toEqual({
      architectureId: "architecture-identity-001",
      displayName: "Payments platform",
      runId: "review-in-path",
    });
  });

  it("AO-31: binds to the architecture latest review when no path job exists", () => {
    expect(
      resolveOpenArchitectureJobRunId({
        pathname: "/architecture/architectures/architecture-identity-001",
        lastOpenArchitectureId: "architecture-identity-001",
        identity: identityFixture,
      }),
    ).toEqual({
      architectureId: "architecture-identity-001",
      displayName: "Payments platform",
      runId: "review-latest",
    });
  });

  it("returns null run id when the architecture has no current job", () => {
    expect(
      resolveOpenArchitectureJobRunId({
        pathname: "/architecture/architectures/architecture-identity-001",
        lastOpenArchitectureId: "architecture-identity-001",
        identity: {
          ...identityFixture,
          latestReviewId: null,
          reviews: [],
          drafts: [],
          currentDraftId: null,
        },
      }),
    ).toEqual({
      architectureId: "architecture-identity-001",
      displayName: "Payments platform",
      runId: null,
    });
  });
});

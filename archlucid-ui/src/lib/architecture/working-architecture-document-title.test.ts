import { beforeEach, describe, expect, it, vi } from "vitest";

import { LEGACY_UNTITLED_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-draft-status";
import {
  formatWorkingArchitectureDocumentTitle,
  metadataForWorkingArchitectureNestedReviewRoute,
  metadataForWorkingArchitectureNestedToolRoute,
  WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX,
} from "@/lib/architecture/working-architecture-document-title";
import { loadArchitectureDraftForRouteCached } from "@/lib/load-architecture-draft-for-route-cached";

vi.mock("@/lib/load-architecture-draft-for-route-cached", () => ({
  loadArchitectureDraftForRouteCached: vi.fn(),
}));

const loadArchitectureDraftForRouteCachedMock = vi.mocked(loadArchitectureDraftForRouteCached);

describe("formatWorkingArchitectureDocumentTitle (SY-61)", () => {
  it("returns the display name without a suffix for identity desk routes", () => {
    expect(formatWorkingArchitectureDocumentTitle("Claims intake")).toBe("Claims intake");
  });

  it("appends a tool suffix for nested desk tools", () => {
    expect(formatWorkingArchitectureDocumentTitle("Claims intake", " · Ask")).toBe("Claims intake · Ask");
  });
});

describe("metadataForWorkingArchitectureNestedReviewRoute (SY-61)", () => {
  beforeEach(() => {
    loadArchitectureDraftForRouteCachedMock.mockReset();
  });

  it("uses the architecture display name with a review suffix, not a generic Review title", async () => {
    loadArchitectureDraftForRouteCachedMock.mockResolvedValue({
      draftId: "arch-001",
      workspaceId: "ws",
      projectId: "default",
      status: "Drafting",
      document: {
        freeTextIntent: "Claims intake modernization",
        businessOutcome: "Reduce manual routing",
        systemName: "Claims intake",
        actorSet: { actors: [] },
        workflowIntent: "create-architecture",
      },
      spawnedRunId: null,
      createdUtc: "2026-01-01T00:00:00.000Z",
      updatedUtc: "2026-01-02T00:00:00.000Z",
    });

    const metadata = await metadataForWorkingArchitectureNestedReviewRoute("arch-001");

    expect(metadata.title).toBe(`Claims intake${WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX}`);
    expect(metadata.title).not.toBe("Architecture Review Detail");
  });

  it("falls back to the untitled architecture label when the draft cannot be loaded", async () => {
    loadArchitectureDraftForRouteCachedMock.mockRejectedValue(new Error("not found"));

    const metadata = await metadataForWorkingArchitectureNestedReviewRoute("arch-missing");

    expect(metadata.title).toBe(
      `${LEGACY_UNTITLED_ARCHITECTURE_LABEL}${WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX}`,
    );
  });
});

describe("metadataForWorkingArchitectureNestedToolRoute (SY-85)", () => {
  beforeEach(() => {
    loadArchitectureDraftForRouteCachedMock.mockReset();
  });

  it("includes the architecture display name in nested Ask titles", async () => {
    loadArchitectureDraftForRouteCachedMock.mockResolvedValue({
      draftId: "arch-001",
      workspaceId: "ws",
      projectId: "default",
      status: "Drafting",
      document: {
        freeTextIntent: "Payments platform",
        businessOutcome: "Reduce fraud",
        systemName: "Payments",
        actorSet: { actors: [] },
        workflowIntent: "create-architecture",
      },
      spawnedRunId: null,
      createdUtc: "2026-01-01T00:00:00.000Z",
      updatedUtc: "2026-01-02T00:00:00.000Z",
    });

    const metadata = await metadataForWorkingArchitectureNestedToolRoute("arch-001", "Ask");

    expect(metadata.title).toBe("Payments · Ask");
    expect(metadata.title).not.toBe("Ask");
  });
});

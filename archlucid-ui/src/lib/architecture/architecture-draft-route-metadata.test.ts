import { beforeEach, describe, expect, it, vi } from "vitest";

import { metadataForArchitectureDraftEditRoute } from "@/lib/architecture/architecture-draft-route-metadata";
import { LEGACY_UNTITLED_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-draft-status";
import { loadArchitectureDraftForRouteCached } from "@/lib/load-architecture-draft-for-route-cached";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";

vi.mock("@/lib/load-architecture-draft-for-route-cached", () => ({
  loadArchitectureDraftForRouteCached: vi.fn(),
}));

const loadArchitectureDraftForRouteCachedMock = vi.mocked(loadArchitectureDraftForRouteCached);

describe("metadataForArchitectureDraftEditRoute (TB-1451)", () => {
  beforeEach(() => {
    loadArchitectureDraftForRouteCachedMock.mockReset();
  });

  it("uses the draft display name instead of Create architecture on edit routes", async () => {
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

    const metadata = await metadataForArchitectureDraftEditRoute("arch-001");

    expect(metadata.title).toBe("Claims intake");
    expect(metadata.title).not.toBe(CREATE_ARCHITECTURE_LABEL);
  });

  it("falls back to Architecture draft when the draft cannot be loaded", async () => {
    loadArchitectureDraftForRouteCachedMock.mockRejectedValue(new Error("not found"));

    const metadata = await metadataForArchitectureDraftEditRoute("arch-missing");

    expect(metadata.title).toBe(LEGACY_UNTITLED_ARCHITECTURE_LABEL);
    expect(metadata.title).not.toBe(CREATE_ARCHITECTURE_LABEL);
  });
});

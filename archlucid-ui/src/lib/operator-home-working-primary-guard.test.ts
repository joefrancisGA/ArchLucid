import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { resolveOperatorHomeLatestDraftPrimaryAction } from "@/lib/operator-home-latest-draft-primary-action";

describe("Working Home primary guard (AO-13)", () => {
  it("does not import reviewDetailPath in latest-draft primary action", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/operator-home-latest-draft-primary-action.ts"),
      "utf8",
    );

    expect(source).not.toContain("reviewDetailPath");
  });

  it("never returns a peer review detail href from draft primary action", () => {
    const linkedReviewEntry: ArchitectureDraftRegistryEntry = {
      draftId: "draft-linked",
      displayName: "Linked",
      customerStatus: "in-review",
      ownerLabel: "You",
      lastUpdatedUtc: "2026-01-01T00:00:00.000Z",
      linkedReviewId: "run-peer-001",
      serverUpdatedUtc: "2026-01-01T00:00:00.000Z",
      serverDraftStatus: "RunSpawned",
    };

    const action = resolveOperatorHomeLatestDraftPrimaryAction(linkedReviewEntry);

    if (action !== null) {
      expect(action.href).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
    }
  });
});

import { describe, expect, it } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

import {
  resolveReviewsHubHeaderPrimary,
  shouldShowReviewsHubResumeDrafts,
} from "./reviews-hub-header-primary";

function draft(id: string, name: string): ArchitectureDraftRegistryEntry {
  return {
    architectureId: id,
    displayName: name,
    customerStatus: "draft",
    ownerLabel: "You",
    lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
    linkedReviewId: null,
    serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
  };
}

describe("resolveReviewsHubHeaderPrimary", () => {
  it("starts a new review when no drafts exist", () => {
    expect(resolveReviewsHubHeaderPrimary([])).toEqual({
      href: "/architecture/reviews/new",
      label: "Start an architecture review",
      continuesSingleDraft: false,
    });
  });

  it("continues the sole draft without showing a chooser strip", () => {
    const primary = resolveReviewsHubHeaderPrimary([draft("draft-001", "Payments")]);

    expect(primary.href).toBe("/architecture/architectures/draft-001");
    expect(primary.label).toBe("Continue editing draft");
    expect(primary.continuesSingleDraft).toBe(true);
    expect(shouldShowReviewsHubResumeDrafts(1)).toBe(false);
  });

  it("starts new when multiple drafts exist so the list can choose", () => {
    const primary = resolveReviewsHubHeaderPrimary([
      draft("draft-001", "One"),
      draft("draft-002", "Two"),
    ]);

    expect(primary).toEqual({
      href: "/architecture/reviews/new",
      label: "Start an architecture review",
      continuesSingleDraft: false,
    });
    expect(shouldShowReviewsHubResumeDrafts(2)).toBe(true);
  });
});

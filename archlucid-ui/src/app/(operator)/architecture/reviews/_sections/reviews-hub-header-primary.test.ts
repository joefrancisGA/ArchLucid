import { describe, expect, it } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

import {
  resolveReviewsHubHeaderPrimary,
  shouldShowReviewsHubResumeDrafts,
} from "./reviews-hub-header-primary";
import {
  REVIEWS_HUB_HEADER_START_LABEL,
  WORKING_REVIEWS_HUB_HEADER_OPEN_ARCHITECTURES_LABEL,
} from "./reviews-hub-copy";

function draft(
  id: string,
  name: string,
  overrides: Partial<ArchitectureDraftRegistryEntry> = {},
): ArchitectureDraftRegistryEntry {
  return {
    draftId: id,
    displayName: name,
    customerStatus: "draft",
    ownerLabel: "You",
    lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
    linkedReviewId: null,
    serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
    ...overrides,
  };
}

describe("resolveReviewsHubHeaderPrimary", () => {
  it("starts a new review when no drafts exist", () => {
    expect(resolveReviewsHubHeaderPrimary([])).toEqual({
      href: "/architecture/reviews/new",
      label: REVIEWS_HUB_HEADER_START_LABEL,
      continuesSingleDraft: false,
    });
  });

  it("continues the sole draft without showing a chooser strip", () => {
    const primary = resolveReviewsHubHeaderPrimary([draft("draft-001", "Payments")]);

    expect(primary.href).toBe("/architecture/architectures/draft-001");
    expect(primary.label).toBe("Continue editing architecture draft");
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
      label: REVIEWS_HUB_HEADER_START_LABEL,
      continuesSingleDraft: false,
    });
    expect(shouldShowReviewsHubResumeDrafts(2)).toBe(true);
  });

  it("AO-26: Working empty header opens Architectures instead of orphan review intake", () => {
    const primary = resolveReviewsHubHeaderPrimary([], { isWorkingMode: true });

    expect(primary.href).toBe("/architecture/architectures");
    expect(primary.label).toBe(WORKING_REVIEWS_HUB_HEADER_OPEN_ARCHITECTURES_LABEL);
    expect(primary.href).not.toBe("/architecture/reviews/new");
  });

  it("AO-26: Working sole draft continues nested draft path when parent architecture id is known", () => {
    const primary = resolveReviewsHubHeaderPrimary(
      [draft("draft-001", "Payments", { parentArchitectureId: "architecture-identity-001" })],
      { isWorkingMode: true },
    );

    expect(primary.href).toBe("/architecture/architectures/architecture-identity-001/drafts/draft-001");
    expect(primary.continuesSingleDraft).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_NEW_DRAFT_SEGMENT,
  architectureDraftEditorPath,
  architectureDraftPath,
  architectureIdentityPath,
  ARCHITECTURES_NEW_PATH,
  isArchitectureNewDraftSegment,
  startReviewFromArchitectureHref,
} from "@/lib/architecture/architecture-routes";

describe("architecture-routes", () => {
  it("uses distinct canonical routes for architecture creation and review intake", () => {
    expect(ARCHITECTURES_NEW_PATH).toBe("/architecture/architectures/new");
    expect(ARCHITECTURE_NEW_DRAFT_SEGMENT).toBe("new");
    expect(isArchitectureNewDraftSegment("new")).toBe(true);
    expect(isArchitectureNewDraftSegment("draft-1")).toBe(false);
    expect(architectureDraftPath("draft-1")).toBe("/architecture/architectures/draft-1");
    expect(architectureIdentityPath("arch-1")).toBe("/architecture/architectures/arch-1");
    expect(architectureDraftEditorPath("arch-1", "draft-1")).toBe(
      "/architecture/architectures/arch-1/draft/draft-1",
    );
    expect(startReviewFromArchitectureHref("draft-1")).toBe(
      "/architecture/reviews/new?path=guided-intake&sourceArchitectureId=draft-1",
    );
  });
});

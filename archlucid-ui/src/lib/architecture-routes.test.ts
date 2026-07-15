import { describe, expect, it } from "vitest";

import {
  architectureDraftPath,
  ARCHITECTURES_NEW_PATH,
  LEGACY_REVIEWS_NEW_CREATE_ARCHITECTURE_HREF,
  startReviewFromArchitectureHref,
} from "@/lib/architecture-routes";

describe("architecture-routes", () => {
  it("uses distinct canonical routes for architecture creation and review intake", () => {
    expect(ARCHITECTURES_NEW_PATH).toBe("/architectures/new");
    expect(architectureDraftPath("draft-1")).toBe("/architectures/draft-1");
    expect(startReviewFromArchitectureHref("draft-1")).toBe(
      "/reviews/new?path=guided-intake&sourceArchitectureId=draft-1",
    );
    expect(LEGACY_REVIEWS_NEW_CREATE_ARCHITECTURE_HREF).toContain("/reviews/new");
    expect(LEGACY_REVIEWS_NEW_CREATE_ARCHITECTURE_HREF).not.toBe(ARCHITECTURES_NEW_PATH);
  });
});

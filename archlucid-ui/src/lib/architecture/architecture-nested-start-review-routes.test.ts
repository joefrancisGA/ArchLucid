import { describe, expect, it } from "vitest";

import {
  architectureNestedStartReviewPath,
  parseArchitectureNestedStartReviewArchitectureId,
  startReviewFromArchitectureNestedHref,
} from "@/lib/architecture/architecture-routes";

describe("architecture nested start review routes (AO-22)", () => {
  it("builds nested start-review path under the architecture identity", () => {
    expect(architectureNestedStartReviewPath("architecture-identity-001")).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/new",
    );
    expect(startReviewFromArchitectureNestedHref("architecture-identity-001")).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/new?path=guided-intake",
    );
  });

  it("parses architecture id from nested start-review pathname", () => {
    expect(
      parseArchitectureNestedStartReviewArchitectureId(
        "/architecture/architectures/architecture-identity-001/reviews/new",
      ),
    ).toBe("architecture-identity-001");
    expect(parseArchitectureNestedStartReviewArchitectureId("/architecture/reviews/new")).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";

import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import {
  resolveShowcaseOperatorFindingHref,
  resolveShowcaseOperatorReviewHref,
} from "@/lib/showcase-operator-review-href";

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: vi.fn(() => "architecture-showcase-001"),
}));

describe("resolveShowcaseOperatorReviewHref", () => {
  it("uses desk continuity for operator showcase deep links", () => {
    expect(resolveShowcaseOperatorReviewHref("customer-intake-modernization")).toBe(
      "/architecture/architectures/architecture-showcase-001/reviews/customer-intake-modernization",
    );
  });

  it("routes finding deep links through ask buyer open review", () => {
    const href = resolveShowcaseOperatorFindingHref(
      "customer-intake-modernization",
      "sensitive-data-minimization-risk",
    );

    expect(href).toContain("/architecture/reviews/customer-intake-modernization");
    expect(href).toContain("findingId=sensitive-data-minimization-risk");
  });
});

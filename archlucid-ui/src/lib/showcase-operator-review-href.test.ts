import { describe, expect, it, vi } from "vitest";

import {
  resolveShowcaseOperatorFindingHref,
  resolveShowcaseOperatorReviewHref,
} from "@/lib/showcase-operator-review-href";

// Shared setup may preload the desk helpers before this file's mocks are registered.
vi.hoisted(() => vi.resetModules());

const desk = vi.hoisted(() => ({ id: "architecture-showcase-001" as string | null }));

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: () => desk.id,
}));

describe("resolveShowcaseOperatorReviewHref", () => {
  it("uses desk continuity for operator showcase deep links", () => {
    expect(resolveShowcaseOperatorReviewHref("customer-intake-modernization")).toBe(
      "/architecture/architectures/architecture-showcase-001/reviews/customer-intake-modernization",
    );
  });

  it("routes finding deep links through ask buyer open review when there is no cached desk", () => {
    desk.id = null;
    const href = resolveShowcaseOperatorFindingHref(
      "customer-intake-modernization",
      "sensitive-data-minimization-risk",
    );

    expect(href).toContain("/architecture/reviews/customer-intake-modernization");
    expect(href).toContain("findingId=sensitive-data-minimization-risk");
  });
});

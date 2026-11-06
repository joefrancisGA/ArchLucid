import { describe, expect, it, vi } from "vitest";

import { resolveGovernanceFindingsSponsorHandoffHref } from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: (): string | null => null,
}));

describe("resolveGovernanceFindingsSponsorHandoffHref", () => {
  it("returns null when scoped run id is missing", () => {
    expect(resolveGovernanceFindingsSponsorHandoffHref(null)).toBe(null);
    expect(resolveGovernanceFindingsSponsorHandoffHref("")).toBe(null);
  });

  it("uses peer review detail tab href when no architecture context is available", () => {
    const href = resolveGovernanceFindingsSponsorHandoffHref("run-peer");

    expect(href).toBe(`/architecture/reviews/${encodeURIComponent("run-peer")}?reviewTab=review-package`);
  });

  it("uses nested review base when pathname matches the scoped nested desk", () => {
    const href = resolveGovernanceFindingsSponsorHandoffHref("run-nested", {
      pathname: "/architecture/architectures/acme/reviews/run-nested",
    });

    expect(href).toBe(
      `/architecture/architectures/${encodeURIComponent("acme")}/reviews/${encodeURIComponent("run-nested")}?reviewTab=review-package`,
    );
  });

  it("prefers explicit scoped architecture id over pathname", () => {
    const href = resolveGovernanceFindingsSponsorHandoffHref("run-x", {
      pathname: "/governance/findings",
      scopedArchitectureId: "arch-explicit",
    });

    expect(href).toBe(
      `/architecture/architectures/${encodeURIComponent("arch-explicit")}/reviews/${encodeURIComponent("run-x")}?reviewTab=review-package`,
    );
  });
});

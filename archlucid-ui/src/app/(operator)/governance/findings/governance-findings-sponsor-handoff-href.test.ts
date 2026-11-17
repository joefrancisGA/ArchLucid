import { describe, expect, it, vi } from "vitest";

import { resolveGovernanceFindingsSponsorHandoffHref } from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";

vi.mock("@/lib/global-search-desk-architecture-id", () => ({
  resolveGlobalSearchDeskArchitectureId: vi.fn(() => null),
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

  it("uses desk continuity resolver when scoped architecture id is absent", async () => {
    const { resolveGlobalSearchDeskArchitectureId } = await import("@/lib/global-search-desk-architecture-id");

    vi.mocked(resolveGlobalSearchDeskArchitectureId).mockReturnValueOnce("arch-continuity");

    const href = resolveGovernanceFindingsSponsorHandoffHref("run-1", {
      pathname: "/governance/findings",
    });

    expect(href).toBe(
      "/architecture/architectures/arch-continuity/reviews/run-1?reviewTab=review-package",
    );
  });
});

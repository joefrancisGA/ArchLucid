import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveGlobalSearchRunHref } from "@/lib/global-search-inhabited-navigation";

vi.mock("@/lib/global-search-desk-architecture-id", () => ({
  resolveGlobalSearchDeskArchitectureId: vi.fn(({ architectureId }: { architectureId?: string | null }) => {
    const explicit = architectureId?.trim() ?? "";

    return explicit.length > 0 ? explicit : "architecture-from-cache";
  }),
}));

describe("resolveGlobalSearchRunHref desk continuity fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses resolveGlobalSearchDeskArchitectureId when wire payload omits architectureId", () => {
    expect(
      resolveGlobalSearchRunHref("run-abc", {
        isWorkingMode: true,
        pathname: "/insights/compare-two-reviews",
      }),
    ).toContain("/architecture/architectures/architecture-from-cache/");
  });
});

import { describe, expect, it } from "vitest";

import { filterNavLinksByTier } from "@/lib/nav-tier";

describe("filterNavLinksByTier", () => {
  const links = [
    { href: "/a", label: "A", tier: "essential" as const },
    { href: "/b", label: "B", tier: "extended" as const },
    { href: "/c", label: "C", tier: "advanced" as const },
  ];

  it("returns every link regardless of disclosure flags (tiering retired)", () => {
    expect(filterNavLinksByTier(links, false, false)).toEqual(links);
    expect(filterNavLinksByTier(links, true, false)).toEqual(links);
    expect(filterNavLinksByTier(links, true, true)).toEqual(links);
  });
});

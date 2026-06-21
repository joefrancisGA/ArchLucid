import { describe, expect, it } from "vitest";

import type { NavLinkItem } from "@/lib/nav-config.types";
import { filterSidebarNavClusterLinks } from "@/lib/sidebar-nav-link-filters";

const sampleLinks: NavLinkItem[] = [
  {
    href: "/compare",
    label: "Compare two reviews",
    title: "Compare",
    tier: "extended",
    requiredAuthority: "ReadAuthority",
  },
  {
    href: "/search",
    label: "Search review evidence",
    title: "Search",
    tier: "advanced",
    requiredAuthority: "ReadAuthority",
  },
];

describe("filterSidebarNavClusterLinks", () => {
  it("thins demo nav when demo UI is on without buyer-polished shell", () => {
    const filtered = filterSidebarNavClusterLinks({
      visibleLinks: sampleLinks,
      demoUi: true,
      buyerPolishedShell: false,
      hasCommittedArchitectureReview: true,
      effectiveOperateUnlockPhase: 2,
    });

    expect(filtered.map((link) => link.href)).toEqual([]);
  });

  it("keeps advanced destinations visible in buyer-polished shell even in demo UI", () => {
    const filtered = filterSidebarNavClusterLinks({
      visibleLinks: sampleLinks,
      demoUi: true,
      buyerPolishedShell: true,
      hasCommittedArchitectureReview: true,
      effectiveOperateUnlockPhase: 2,
    });

    expect(filtered.map((link) => link.href)).toEqual(["/compare", "/search"]);
  });
});

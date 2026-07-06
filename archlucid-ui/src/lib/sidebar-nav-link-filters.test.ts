import { describe, expect, it } from "vitest";

import type { NavLinkItem } from "@/lib/nav-config.types";
import { filterSidebarNavClusterLinks, presentSidebarNavLinkForCluster } from "@/lib/sidebar-nav-link-filters";

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

describe("presentSidebarNavLinkForCluster", () => {
  it("trims Internal Operations tooltips to the link label", () => {
    const presented = presentSidebarNavLinkForCluster(
      {
        href: "/admin/rag-health",
        label: "RAG health",
        title: "RAG health — per-corpus index freshness and embedding dimension",
        tier: "advanced",
        requiredAuthority: "AdminAuthority",
      },
      false,
      "system-admin",
    );

    expect(presented.title).toBe("RAG health");
  });

  it("preserves review-workflow nav titles outside Internal Operations", () => {
    const presented = presentSidebarNavLinkForCluster(
      {
        href: "/compare",
        label: "Compare two reviews",
        title: "See what changed between reviews (Alt+C)",
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
      false,
      "review-workflow",
      false,
    );

    expect(presented.title).toContain("changed");
  });

  it("TB-606: rewrites reviews-list labels for governance mode in review-workflow clusters", () => {
    const presented = presentSidebarNavLinkForCluster(
      {
        href: "/reviews?projectId=default",
        label: "Review packages",
        title: "Browse finalized review packages",
        tier: "essential",
      },
      false,
      "review-workflow",
      true,
    );

    expect(presented.label).toBe("Reviews");
  });
});

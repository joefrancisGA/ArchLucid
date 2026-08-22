import { describe, expect, it } from "vitest";

import type { NavLinkItem } from "@/lib/nav-config.types";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { filterSidebarNavClusterLinks, presentSidebarNavLinkForCluster } from "@/lib/sidebar-nav-link-filters";

const sampleLinks: NavLinkItem[] = [
  {
    href: "/insights/compare-two-reviews",
    label: "Compare two reviews",
    title: "Compare",
    tier: "extended",
    requiredAuthority: "ReadAuthority",
  },
  {
    href: "/insights/search-review-evidence",
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
    });

    expect(filtered.map((link) => link.href)).toEqual([]);
  });

  it("keeps advanced destinations visible in buyer-polished shell even in demo UI", () => {
    const filtered = filterSidebarNavClusterLinks({
      visibleLinks: sampleLinks,
      demoUi: true,
      buyerPolishedShell: true,
      hasCommittedArchitectureReview: true,
    });

    expect(filtered.map((link) => link.href)).toEqual(["/insights/compare-two-reviews", "/insights/search-review-evidence"]);
  });
});

describe("presentSidebarNavLinkForCluster", () => {
  it("strips Internal Operations tooltip labels so hover text is description-only", () => {
    const presented = presentSidebarNavLinkForCluster(
      {
        href: "/internal/rag-health",
        label: OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth,
        title: `${OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth} — per-corpus index freshness and embedding dimension`,
        tier: "advanced",
        requiredAuthority: "AdminAuthority",
      },
      false,
      "system-admin",
    );

    expect(presented.title).toBe("per-corpus index freshness and embedding dimension");
    expect(presented.title).not.toContain(OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth);
  });

  it("strips label prefixes for administration nav rows", () => {
    const presented = presentSidebarNavLinkForCluster(
      {
        href: "/administration",
        label: "Settings",
        title: "Settings — searchable index of workspace, approval, integration, billing, and support configuration",
        tier: "essential",
        requiredAuthority: "ReadAuthority",
      },
      false,
      "platform-admin",
    );

    expect(presented.title).toBe(
      "searchable index of workspace, approval, integration, billing, and support configuration",
    );
  });

  it("preserves review-workflow nav titles outside Internal Operations", () => {
    const presented = presentSidebarNavLinkForCluster(
      {
        href: "/insights/compare-two-reviews",
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
        href: "/architecture/reviews",
        label: "Reviews",
        title: "Browse finalized reviews",
        tier: "essential",
      },
      false,
      "review-workflow",
      true,
    );

    expect(presented.label).toBe("Reviews");
  });
});

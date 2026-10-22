import { describe, expect, it } from "vitest";

import { filterNavLinksByWorkspaceMode } from "@/lib/nav-workspace-mode-gate";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import type { NavLinkItem } from "@/lib/nav-config";

const links: NavLinkItem[] = [
  { href: "/architecture/reviews", label: "Reviews" },
  { href: FIRST_REVIEW_GUIDE_PATH, label: "Getting started" },
  { href: "/governance/findings", label: "Findings" },
];

describe("filterNavLinksByWorkspaceMode", () => {
  it("returns all links when Getting started stays in main nav", () => {
    expect(filterNavLinksByWorkspaceMode(links, false).map((link) => link.href)).toEqual([
      "/architecture/reviews",
      FIRST_REVIEW_GUIDE_PATH,
      "/governance/findings",
    ]);
  });

  it("hides Getting started from main nav in Working mode", () => {
    expect(filterNavLinksByWorkspaceMode(links, true).map((link) => link.href)).toEqual([
      "/architecture/reviews",
      "/governance/findings",
    ]);
  });
});

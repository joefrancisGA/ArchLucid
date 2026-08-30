import { describe, expect, it } from "vitest";

import type { NavLinkItem } from "@/lib/nav-config.types";
import { WORKSPACE_HEALTH_PATH } from "@/lib/workspace-health-route";

import { findNavLinkMatchingPathname } from "./nav-pin-current-match";

function link(href: string, label: string): NavLinkItem {
  return {
    href,
    label,
    title: label,
    tier: "extended",
  };
}

describe("findNavLinkMatchingPathname", () => {
  it("matches standalone workspace health nav links on the workspace health page", () => {
    const links = [link(WORKSPACE_HEALTH_PATH, "Workspace health")];

    expect(findNavLinkMatchingPathname(links, WORKSPACE_HEALTH_PATH)).toEqual(links[0]);
  });

  it("matches nested routes with fragments stripped from href", () => {
    const links = [link("/governance/audit#summary", "Audit")];

    expect(findNavLinkMatchingPathname(links, "/governance/audit")).toEqual(links[0]);
  });

  it("matches nested routes with query strings stripped from href", () => {
    const links = [link("/governance/audit?tab=recent", "Audit")];

    expect(findNavLinkMatchingPathname(links, "/governance/audit")).toEqual(links[0]);
  });
});

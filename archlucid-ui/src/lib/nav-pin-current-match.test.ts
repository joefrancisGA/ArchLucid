import { describe, expect, it } from "vitest";

import type { NavLinkItem } from "@/lib/nav-config.types";
import {
  SPONSOR_DASHBOARD_HREF,
  SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF,
} from "@/lib/sponsor/sponsor-dashboard-route";

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
  it("matches nav links whose href includes a fragment anchor", () => {
    const links = [link(SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF, "Workspace health")];

    expect(findNavLinkMatchingPathname(links, SPONSOR_DASHBOARD_HREF)).toEqual(links[0]);
  });

  it("matches nested routes with query strings stripped from href", () => {
    const links = [link("/governance/audit?tab=recent", "Audit")];

    expect(findNavLinkMatchingPathname(links, "/governance/audit")).toEqual(links[0]);
  });
});

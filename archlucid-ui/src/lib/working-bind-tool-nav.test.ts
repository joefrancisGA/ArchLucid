import { describe, expect, it } from "vitest";

import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import type { NavLinkItem } from "@/lib/nav-config.types";
import { applyWorkingBindToolNavPresentation } from "@/lib/working-bind-tool-nav";
import { WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_HINT } from "@/lib/working-route-roles";

function navLink(href: string): NavLinkItem {
  return {
    href,
    label: "Evidence graph",
    title: "Evidence graph",
    tier: "extended",
  };
}

describe("applyWorkingBindToolNavPresentation (AO-40)", () => {
  it("disables bind tools in Working mode when no architecture desk is open", () => {
    const presented = applyWorkingBindToolNavPresentation(navLink(EVIDENCE_GRAPH_PATH), null, true);

    expect(presented.navLinkDisabled).toBe(true);
    expect(presented.navLinkDisabledVisibleHint).toBe(WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_HINT);
    expect(presented.navLinkDisabledTitle).toBe(WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_HINT);
  });

  it("keeps bind tools enabled when last-open architecture is set", () => {
    const presented = applyWorkingBindToolNavPresentation(
      navLink(EVIDENCE_GRAPH_PATH),
      "architecture-identity-001",
      true,
    );

    expect(presented.navLinkDisabled).toBeUndefined();
    expect(presented.navLinkDisabledVisibleHint).toBeUndefined();
  });

  it("does not gate non-bind destinations or Guided mode", () => {
    const guided = applyWorkingBindToolNavPresentation(navLink(EVIDENCE_GRAPH_PATH), null, false);
    const inbox = applyWorkingBindToolNavPresentation(
      navLink("/architecture/reviews"),
      null,
      true,
    );

    expect(guided.navLinkDisabled).toBeUndefined();
    expect(inbox.navLinkDisabled).toBeUndefined();
  });
});

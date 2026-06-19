import { describe, expect, it } from "vitest";

import { resolveSidebarNavExpansionState } from "@/lib/sidebar-nav-disclosure-state";

describe("resolveSidebarNavExpansionState", () => {
  it("expands nav tiers in demo UI mode", () => {
    const state = resolveSidebarNavExpansionState({
      pathname: "/reviews",
      showExtended: false,
      showAdvanced: false,
      navDisclosurePathOverride: false,
      buyerPolishedShell: false,
      demoUi: true,
      ctoDemoNavExpandedEnv: false,
      runtimeCtoDemoTourActive: false,
    });

    expect(state.navExpanded).toBe(true);
    expect(state.navAdvanced).toBe(true);
  });

  it("collapses buyer-polished shell unless CTO demo nav is expanded", () => {
    const collapsed = resolveSidebarNavExpansionState({
      pathname: "/reviews",
      showExtended: true,
      showAdvanced: true,
      navDisclosurePathOverride: false,
      buyerPolishedShell: true,
      demoUi: false,
      ctoDemoNavExpandedEnv: false,
      runtimeCtoDemoTourActive: false,
    });

    expect(collapsed.navExpanded).toBe(false);
    expect(collapsed.navAdvanced).toBe(false);

    const expanded = resolveSidebarNavExpansionState({
      pathname: "/reviews",
      showExtended: false,
      showAdvanced: false,
      navDisclosurePathOverride: false,
      buyerPolishedShell: true,
      demoUi: false,
      ctoDemoNavExpandedEnv: true,
      runtimeCtoDemoTourActive: false,
    });

    expect(expanded.navExpanded).toBe(true);
    expect(expanded.navAdvanced).toBe(true);
  });
});

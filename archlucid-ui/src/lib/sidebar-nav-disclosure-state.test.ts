import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveSidebarNavExpansionState } from "@/lib/sidebar-nav-disclosure-state";

describe("resolveSidebarNavExpansionState", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("expands nav tiers in demo UI mode", () => {
    const state = resolveSidebarNavExpansionState({
      pathname: "/architecture/reviews",
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

  it("collapses buyer-polished shell in operator-shell builds even when CTO demo nav is flagged", () => {
    const collapsed = resolveSidebarNavExpansionState({
      pathname: "/architecture/reviews",
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

    const withCtoPackagingFlag = resolveSidebarNavExpansionState({
      pathname: "/architecture/reviews",
      showExtended: false,
      showAdvanced: false,
      navDisclosurePathOverride: false,
      buyerPolishedShell: true,
      demoUi: false,
      ctoDemoNavExpandedEnv: true,
      runtimeCtoDemoTourActive: false,
    });

    expect(withCtoPackagingFlag.navExpanded).toBe(false);
    expect(withCtoPackagingFlag.navAdvanced).toBe(false);
  });

  it("expands buyer-polished nav for packaged CTO demo when not in operator-shell mode", () => {
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "");

    const expanded = resolveSidebarNavExpansionState({
      pathname: "/architecture/reviews",
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

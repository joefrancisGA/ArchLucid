import { describe, expect, it, vi } from "vitest";

import { applyBuyerDemoSecondaryNavCollapse } from "@/lib/sidebar-nav-buyer-demo-collapse";

describe("sidebar-nav-buyer-demo-collapse (WS-21)", () => {
  it("does not collapse secondary nav when architect workspace chrome is active", () => {
    const setGroupExpanded = vi.fn();

    applyBuyerDemoSecondaryNavCollapse({
      pathname: "/architecture/architectures/arch-1",
      buyerPolishedShell: true,
      demoUi: true,
      architectWorkspaceChrome: true,
      setGroupExpanded,
    });

    expect(setGroupExpanded).not.toHaveBeenCalled();
  });

  it("still collapses Integrations and Administration on demo buyer-polished shells", () => {
    const setGroupExpanded = vi.fn();

    applyBuyerDemoSecondaryNavCollapse({
      pathname: "/architecture/architectures/arch-1",
      buyerPolishedShell: true,
      demoUi: false,
      architectWorkspaceChrome: false,
      setGroupExpanded,
    });

    expect(setGroupExpanded).toHaveBeenCalledWith("operate-integrations", false);
    expect(setGroupExpanded).toHaveBeenCalledWith("operator-admin", false);
    expect(setGroupExpanded).toHaveBeenCalledWith("operator-system-admin", false);
  });
});

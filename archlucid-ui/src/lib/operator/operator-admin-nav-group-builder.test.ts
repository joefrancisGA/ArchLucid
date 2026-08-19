import { describe, expect, it } from "vitest";

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  SETTINGS_NOTIFICATIONS_PATH,
  SETTINGS_WORKSPACE_SETTINGS_PATH,
} from "@/lib/settings-admin-route-paths";
import { OperatorAdminNavGroupBuilder } from "@/lib/operator/operator-admin-nav-group-builder";

describe("OperatorAdminNavGroupBuilder", () => {
  it("groups connector and API health under Administration for admins (TB-647)", () => {
    const links = new OperatorAdminNavGroupBuilder().build().links;

    expect(links.map((link) => link.href)).toContain("/administration/connection-status");
    expect(links.map((link) => link.href)).toContain("/administration/system-health");
    expect(
      links
        .filter((link) => link.href === "/administration/connection-status" || link.href === "/administration/system-health")
        .every((link) => link.requiredAuthority === "AdminAuthority"),
    ).toBe(true);
  });

  it("gates AI usage nav at AdminAuthority so non-admins do not see tenant cost reporting (TB-648)", () => {
    const links = new OperatorAdminNavGroupBuilder().build().links;
    const aiUsage = links.find((link) => link.href === AI_USAGE_SETTINGS_PATH);

    expect(aiUsage).toBeDefined();
    expect(aiUsage?.requiredAuthority).toBe("AdminAuthority");
  });

  it("exposes notification preference center at ReadAuthority (TB-2203)", () => {
    const links = new OperatorAdminNavGroupBuilder().build().links;
    const notifications = links.find((link) => link.href === SETTINGS_NOTIFICATIONS_PATH);

    expect(notifications).toBeDefined();
    expect(notifications?.requiredAuthority).toBe("ReadAuthority");
    expect(notifications?.label).toBe("Notifications");
  });

  it("publishes baseline settings at AdminAuthority so ROI anchors are reachable without the hub", () => {
    const links = new OperatorAdminNavGroupBuilder().build().links;
    const baseline = links.find((link) => link.href === BASELINE_SETTINGS_CANONICAL_PATH);

    expect(baseline).toBeDefined();
    expect(baseline?.label).toBe(OPERATOR_NAV_LINK_LABELS.baselineSettings);
    expect(baseline?.requiredAuthority).toBe("AdminAuthority");
  });

  it("keeps the projects recycle bin next to its parent workspace settings route", () => {
    const hrefs = new OperatorAdminNavGroupBuilder().build().links.map((link) => link.href);
    const workspaceIndex = hrefs.indexOf(SETTINGS_WORKSPACE_SETTINGS_PATH);
    const recycleBinIndex = hrefs.indexOf(`${SETTINGS_WORKSPACE_SETTINGS_PATH}/recycle-bin`);

    expect(workspaceIndex).toBeGreaterThanOrEqual(0);
    expect(recycleBinIndex).toBe(workspaceIndex + 1);
  });

});

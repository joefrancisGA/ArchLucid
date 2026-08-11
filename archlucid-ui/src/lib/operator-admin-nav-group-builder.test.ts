import { describe, expect, it } from "vitest";

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";
import { OperatorAdminNavGroupBuilder } from "@/lib/operator-admin-nav-group-builder";

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

});

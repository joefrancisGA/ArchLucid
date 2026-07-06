import { describe, expect, it } from "vitest";

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { OperatorAdminNavGroupBuilder } from "@/lib/operator-admin-nav-group-builder";

describe("OperatorAdminNavGroupBuilder", () => {
  it("gates AI usage nav at AdminAuthority so non-admins do not see tenant cost reporting (TB-648)", () => {
    const links = new OperatorAdminNavGroupBuilder().build().links;
    const aiUsage = links.find((link) => link.href === AI_USAGE_SETTINGS_PATH);

    expect(aiUsage).toBeDefined();
    expect(aiUsage?.requiredAuthority).toBe("AdminAuthority");
  });
});

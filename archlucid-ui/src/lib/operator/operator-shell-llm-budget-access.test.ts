import { describe, expect, it } from "vitest";

import { OperatorAdminNavGroupBuilder } from "@/lib/operator/operator-admin-nav-group-builder";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";

/** TB-350 / TB-648: AI usage is admin-gated in nav for tenant cost reporting. */
describe("operator shell LLM budget access (TB-350)", () => {
  it("exposes AI usage in administration nav for admins", () => {
    const links = new OperatorAdminNavGroupBuilder().build().links;
    const aiUsage = links.find((link) => link.href === AI_USAGE_SETTINGS_PATH);

    expect(aiUsage).toBeDefined();
    expect(aiUsage?.label).toBe("AI usage");
    expect(aiUsage?.requiredAuthority).toBe("AdminAuthority");
  });
});

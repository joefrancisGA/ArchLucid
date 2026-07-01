import { describe, expect, it } from "vitest";

import { OperatorAdminNavGroupBuilder } from "@/lib/operator-admin-nav-group-builder";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";

/** TB-350: AI usage and cost page is reachable from Administration nav. */
describe("operator shell LLM budget access (TB-350)", () => {
  it("exposes AI usage in administration nav for budget discovery", () => {
    const links = new OperatorAdminNavGroupBuilder().build().links;
    const aiUsage = links.find((link) => link.href === AI_USAGE_SETTINGS_PATH);

    expect(aiUsage).toBeDefined();
    expect(aiUsage?.label).toBe("AI usage");
  });
});

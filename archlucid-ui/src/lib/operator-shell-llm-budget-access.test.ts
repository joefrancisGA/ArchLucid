import { describe, expect, it } from "vitest";

import { OperatorSystemAdminNavGroupBuilder } from "@/lib/operator-system-admin-nav-group-builder";

/** TB-350: AI usage and cost page is reachable from System Administration nav. */
describe("operator shell LLM budget access (TB-350)", () => {
  it("exposes AI usage and cost in system admin nav for budget discovery", () => {
    const links = new OperatorSystemAdminNavGroupBuilder().build().links;
    const aiCost = links.find((link) => link.href === "/admin/ai-usage-cost");

    expect(aiCost).toBeDefined();
    expect(aiCost?.label).toBe("AI usage and cost");
  });
});

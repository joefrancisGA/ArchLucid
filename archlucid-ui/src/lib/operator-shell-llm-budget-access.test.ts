import { describe, expect, it } from "vitest";

import { OperatorAdminNavGroupBuilder } from "@/lib/operator-admin-nav-group-builder";

/** TB-350: buyer-polished shell hides the header pill — allowance stays on settings cost reporting. */
describe("operator shell LLM budget access (TB-350)", () => {
  it("exposes cost reporting in admin settings nav for two-click budget discovery", () => {
    const links = new OperatorAdminNavGroupBuilder().build().links;
    const costReporting = links.find((link) => link.href === "/settings/cost-reporting");

    expect(costReporting).toBeDefined();
    expect(costReporting?.label).toBe("Tenant cost");
  });
});

import { describe, expect, it } from "vitest";

import { OperatePlatformOpsNavGroupBuilder } from "@/lib/operate-platform-ops-nav-group-builder";

describe("OperatePlatformOpsNavGroupBuilder", () => {
  it("groups connector and API health under Operations for admins (TB-647)", () => {
    const group = new OperatePlatformOpsNavGroupBuilder().build();

    expect(group.id).toBe("operate-platform-ops");
    expect(group.label).toBe("Operations");
    expect(group.surface).toBe("platform-admin");
    expect(group.links.map((link) => link.href)).toEqual(["/integrations/readiness", "/health"]);
    expect(group.links.every((link) => link.requiredAuthority === "AdminAuthority")).toBe(true);
  });
});

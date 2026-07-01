import { describe, expect, it } from "vitest";

import { OperateIntegrationsNavGroupBuilder } from "@/lib/operate-integrations-nav-group-builder";

describe("OperateIntegrationsNavGroupBuilder", () => {
  it("labels integration readiness nav as Connection status (TB-530)", () => {
    const group = new OperateIntegrationsNavGroupBuilder().build();
    const readinessLink = group.links.find((link) => link.href === "/integrations/readiness");

    expect(readinessLink?.label).toBe("Connection status");
  });
});

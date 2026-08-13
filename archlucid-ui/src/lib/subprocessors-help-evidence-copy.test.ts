import { describe, expect, it } from "vitest";

import { SUBPROCESSORS_HELP_SOURCES } from "@/lib/subprocessors-help-evidence-copy";

describe("subprocessors-help-evidence-copy (TB-1658)", () => {
  it("routes tenant isolation diligence to canonical data-handling help", () => {
    const tenantIsolation = SUBPROCESSORS_HELP_SOURCES.find((link) => link.label === "Tenant isolation");

    expect(tenantIsolation?.href).toBe("/help/data-handling");
    expect(tenantIsolation?.href).not.toContain("data-handling-tenant-isolation");
  });
});

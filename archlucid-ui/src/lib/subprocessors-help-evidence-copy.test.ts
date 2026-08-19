import { describe, expect, it } from "vitest";

import { SUBPROCESSORS_HELP_PRIMARY_ACTIONS } from "@/lib/subprocessors-help-guide-content";
import {
  SUBPROCESSORS_HELP_ORIENTATION_SOURCES,
  SUBPROCESSORS_HELP_SOURCES,
} from "@/lib/subprocessors-help-evidence-copy";

describe("subprocessors-help-evidence-copy (TB-1658)", () => {
  it("routes tenant isolation diligence to canonical data-handling help", () => {
    const tenantIsolation = SUBPROCESSORS_HELP_SOURCES.find((link) => link.label === "Tenant isolation");

    expect(tenantIsolation?.href).toBe("/help/data-handling");
    expect(tenantIsolation?.href).not.toContain("data-handling-tenant-isolation");
  });

  it("excludes Continue diligence action-panel destinations from orientation Sources", () => {
    const orientationHrefs = SUBPROCESSORS_HELP_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openTrustCenter.href);
    expect(orientationHrefs).not.toContain(SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openDpaTemplate.href);
    expect(orientationHrefs).not.toContain(SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openSecurityTrust.href);
    expect(SUBPROCESSORS_HELP_ORIENTATION_SOURCES.length).toBeLessThan(SUBPROCESSORS_HELP_SOURCES.length);
    expect(SUBPROCESSORS_HELP_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});

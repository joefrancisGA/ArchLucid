import { describe, expect, it } from "vitest";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_ORIENTATION_SOURCES,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES,
  resolveDataHandlingTenantIsolationHelpClaimDiscipline,
  resolveDataHandlingTenantIsolationHelpSources,
  SECURENOW_DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES,
} from "@/lib/data-handling-tenant-isolation-help-evidence-copy";

describe("data-handling-tenant-isolation-help-evidence-copy", () => {
  it("excludes Trust Center from orientation Sources when the header CTA covers it", () => {
    const orientationHrefs = DATA_HANDLING_TENANT_ISOLATION_HELP_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain("/trust");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_ORIENTATION_SOURCES.length).toBeLessThan(
      DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES.length,
    );
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });

  it("uses SecureNow claim discipline and sources without review-package language", () => {
    expect(resolveDataHandlingTenantIsolationHelpClaimDiscipline("security")).toContain("cloud inventory evidence");
    expect(resolveDataHandlingTenantIsolationHelpClaimDiscipline("security")).not.toContain("review evidence");

    const sources = resolveDataHandlingTenantIsolationHelpSources("security");
    expect(sources).toEqual(SECURENOW_DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES);
    expect(sources.some((source) => source.label === "Finalized review record")).toBe(false);
    expect(sources.some((source) => source.label === "Audit evidence lineage")).toBe(true);
  });

  it("keeps architecture data-handling sources unchanged", () => {
    expect(resolveDataHandlingTenantIsolationHelpSources("architecture")).toEqual(
      DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES,
    );
    expect(resolveDataHandlingTenantIsolationHelpClaimDiscipline("architecture")).toContain("review evidence");
  });
});

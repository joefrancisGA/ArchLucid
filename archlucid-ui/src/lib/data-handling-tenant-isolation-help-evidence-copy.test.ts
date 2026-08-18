import { describe, expect, it } from "vitest";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_ORIENTATION_SOURCES,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES,
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
});

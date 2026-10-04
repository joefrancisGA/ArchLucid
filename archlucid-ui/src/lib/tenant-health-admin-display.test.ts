import { describe, expect, it } from "vitest";

import { formatAdminTenantHealthMetric } from "@/lib/tenant-health-admin-display";

describe("formatAdminTenantHealthMetric", () => {
  it("returns Not returned for missing values", () => {
    expect(formatAdminTenantHealthMetric(null)).toBe("Not returned");
    expect(formatAdminTenantHealthMetric(undefined)).toBe("Not returned");
  });

  it("formats finite numbers", () => {
    expect(formatAdminTenantHealthMetric(42)).toBe("42");
  });
});

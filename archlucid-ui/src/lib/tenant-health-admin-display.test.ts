import { describe, expect, it } from "vitest";

import { presentTenantHealthAdminCount } from "./tenant-health-admin-display";

describe("presentTenantHealthAdminCount", () => {
  it("returns Not returned for missing values", () => {
    expect(presentTenantHealthAdminCount(null)).toBe("Not returned");
    expect(presentTenantHealthAdminCount(undefined)).toBe("Not returned");
    expect(presentTenantHealthAdminCount(Number.NaN)).toBe("Not returned");
  });

  it("formats finite integers", () => {
    expect(presentTenantHealthAdminCount(0)).toBe("0");
    expect(presentTenantHealthAdminCount(12)).toBe("12");
  });
});

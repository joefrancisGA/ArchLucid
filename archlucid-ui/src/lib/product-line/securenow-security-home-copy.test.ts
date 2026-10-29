import { describe, expect, it } from "vitest";

import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import {
  SECURENOW_SECURITY_HOME_ROWS,
  SECURENOW_SECURITY_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-security-home-copy";

describe("SecureNow security home copy (SN-MKT-01)", () => {
  it("states the buyer job in the section lead", () => {
    expect(SECURENOW_SECURITY_HOME_SECTION_LEAD).toMatch(/possible access path/i);
    expect(SECURENOW_SECURITY_HOME_SECTION_LEAD).not.toMatch(/remediation factory/i);
    expect(SECURENOW_SECURITY_HOME_SECTION_LEAD).toMatch(/Azure/i);
  });

  it("recommends Priorities and waves first", () => {
    const recommended = SECURENOW_SECURITY_HOME_ROWS.filter((row) => row.recommendedFirst === true);
    expect(recommended).toHaveLength(1);
    expect(recommended[0]?.href).toBe(SECURENOW_REMEDIATION_FACTORY_PATH);
    expect(recommended[0]?.summary).toBe("Open one ranked path and its cited hops.");
  });
});

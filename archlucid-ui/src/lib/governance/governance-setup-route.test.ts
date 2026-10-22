import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_SETUP_HREF,
  GOVERNANCE_SETUP_LEGACY_FIRST_30_DAYS_HREF,
} from "@/lib/governance/governance-setup-route";

describe("governance-setup-route (TB-1134)", () => {
  it("keeps canonical setup path distinct from the legacy first-30-days nickname", () => {
    expect(GOVERNANCE_SETUP_HREF).toBe("/governance/setup");
    expect(GOVERNANCE_SETUP_LEGACY_FIRST_30_DAYS_HREF).toBe("/governance/first-30-days");
    expect(GOVERNANCE_SETUP_HREF).not.toBe(GOVERNANCE_SETUP_LEGACY_FIRST_30_DAYS_HREF);
  });
});

import { describe, expect, it } from "vitest";

import {
  BUYER_GOVERNANCE_OVERVIEW_PAGE_LEAD,
  governanceOverviewPageLead,
  GOVERNANCE_OVERVIEW_PAGE_LEAD,
} from "@/lib/governance/governance-overview-copy";

describe("governance-overview-copy", () => {
  it("uses shorter buyer overview lead", () => {
    expect(governanceOverviewPageLead(true)).toBe(BUYER_GOVERNANCE_OVERVIEW_PAGE_LEAD);
    expect(governanceOverviewPageLead(false)).toBe(GOVERNANCE_OVERVIEW_PAGE_LEAD);
    expect(BUYER_GOVERNANCE_OVERVIEW_PAGE_LEAD.length).toBeLessThan(GOVERNANCE_OVERVIEW_PAGE_LEAD.length);
  });
});

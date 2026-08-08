import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_API_CONTRACTS_HELP_CANONICAL_PATH,
  GOVERNANCE_API_CONTRACTS_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_API_CONTRACTS_HELP_ORIENTATION,
  GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE,
  GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS,
  GOVERNANCE_API_CONTRACTS_HELP_SOURCES,
} from "@/lib/governance-api-contracts-help-guide-content";

describe("governance-api-contracts-help-guide-content", () => {
  it("keeps title honesty without leading buyer Governance FAQ framing (TB-1386)", () => {
    expect(GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE.toLowerCase().startsWith("api contracts")).toBe(true);
    expect(GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE.toLowerCase()).not.toMatch(/^governance/);
  });

  it("offers CLI and buyer governance-approval escape hatches", () => {
    expect(GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openCliUsage.href).toBe("/help/cli-usage");
    expect(GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS.openBuyerGovernanceApproval.href).toBe(
      "/help/governance-approval",
    );
  });

  it("lists Sources without a self-link to this topic", () => {
    expect(
      GOVERNANCE_API_CONTRACTS_HELP_SOURCES.some(
        (link) => link.href === GOVERNANCE_API_CONTRACTS_HELP_CANONICAL_PATH,
      ),
    ).toBe(false);
    expect(GOVERNANCE_API_CONTRACTS_HELP_ORIENTATION).toHaveLength(3);
  });

  it("states claim discipline without implying certification", () => {
    expect(GOVERNANCE_API_CONTRACTS_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("not certification");
    expect(GOVERNANCE_API_CONTRACTS_HELP_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("cpa");
  });
});

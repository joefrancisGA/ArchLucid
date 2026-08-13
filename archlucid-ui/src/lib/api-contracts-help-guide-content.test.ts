import { describe, expect, it } from "vitest";

import {
  API_CONTRACTS_HELP_CANONICAL_PATH,
  API_CONTRACTS_HELP_PAGE_TITLE,
  API_CONTRACTS_HELP_PRIMARY_ACTIONS,
  API_CONTRACTS_HELP_SOURCES,
  API_CONTRACTS_HELP_SOURCES_STRIP_INTRO,
  API_CONTRACTS_OPENAPI_PATH,
  formatApiContractsHelpReconciliationCopy,
} from "@/lib/api-contracts-help-guide-content";

describe("api-contracts-help-guide-content", () => {
  it("keeps title honesty without leading buyer Governance FAQ framing", () => {
    expect(API_CONTRACTS_HELP_PAGE_TITLE.toLowerCase().startsWith("api contracts")).toBe(true);
    expect(API_CONTRACTS_HELP_PAGE_TITLE.toLowerCase()).not.toMatch(/^governance/);
  });

  it("leads with OpenAPI contract-of-record as the only primary action", () => {
    expect(API_CONTRACTS_OPENAPI_PATH).toBe("/openapi/v1.json");
    expect(API_CONTRACTS_HELP_PRIMARY_ACTIONS.openOpenApi.href).toBe("/openapi/v1.json");
    expect(Object.keys(API_CONTRACTS_HELP_PRIMARY_ACTIONS)).toEqual(["openOpenApi"]);
  });

  it("names engineering troubleshooting and admin diagnostics in the Sources strip intro", () => {
    expect(API_CONTRACTS_HELP_SOURCES_STRIP_INTRO.toLowerCase()).toContain("engineering troubleshooting");
    expect(API_CONTRACTS_HELP_SOURCES_STRIP_INTRO.toLowerCase()).toContain("admin diagnostics");
  });

  it("lists Sources without a self-link to this topic", () => {
    expect(
      API_CONTRACTS_HELP_SOURCES.some((link) => link.href === API_CONTRACTS_HELP_CANONICAL_PATH),
    ).toBe(false);
    expect(API_CONTRACTS_HELP_SOURCES.map((link) => link.label)).toEqual([
      "CLI usage",
      "Engineering troubleshooting",
      "Audit trail help",
      "Admin diagnostics",
    ]);
  });

  it("formats reconciliation copy with the verification date", () => {
    expect(formatApiContractsHelpReconciliationCopy("2026-08-10")).toContain("2026-08-10");
    expect(formatApiContractsHelpReconciliationCopy("2026-08-10")).toContain("API_CONTRACTS.md");
    expect(formatApiContractsHelpReconciliationCopy("2026-08-10")).toContain("/openapi/v1.json");
  });
});

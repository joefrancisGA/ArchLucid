import { describe, expect, it } from "vitest";

import {
  API_CONTRACTS_HELP_CANONICAL_PATH,
  API_CONTRACTS_HELP_CLAIM_DISCIPLINE,
  API_CONTRACTS_HELP_FOLLOW_UPS_TITLE,
  API_CONTRACTS_HELP_ORIENTATION_SOURCES,
  API_CONTRACTS_HELP_ORIENTATION_SOURCES_INTRO,
  API_CONTRACTS_HELP_SOURCES,
} from "@/lib/api-contracts-help-evidence-copy";

describe("api-contracts-help-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for HG", () => {
    expect(API_CONTRACTS_HELP_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(API_CONTRACTS_HELP_CLAIM_DISCIPLINE).toContain("API contracts reference");
    expect(API_CONTRACTS_HELP_ORIENTATION_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(API_CONTRACTS_HELP_SOURCES.length).toBeGreaterThan(0);
    expect(API_CONTRACTS_HELP_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of API_CONTRACTS_HELP_ORIENTATION_SOURCES) {
      expect(link.href).not.toBe(API_CONTRACTS_HELP_CANONICAL_PATH);
    }
  });
});

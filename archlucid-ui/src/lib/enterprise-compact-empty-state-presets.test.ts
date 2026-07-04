import { describe, expect, it } from "vitest";

import {
  DECISION_REGISTER_EMPTY_COMPACT,
  EXECUTIVE_REVIEWS_EMPTY_COMPACT,
  GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT,
  IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT,
  RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT,
  SCIM_NO_TOKENS_EMPTY_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";

describe("enterprise compact empty state presets (pass 5)", () => {
  it("assigns stable test ids for operator empty surfaces", () => {
    expect(SCIM_NO_TOKENS_EMPTY_COMPACT.testId).toBe("scim-no-tokens-empty-state");
    expect(IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT.testId).toBe("identity-providers-catalog-empty-state");
    expect(DECISION_REGISTER_EMPTY_COMPACT.testId).toBe("decision-register-empty-state");
    expect(GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT.testId).toBe(
      "governance-findings-filter-no-match-empty-state",
    );
    expect(RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT.testId).toBe(
      "run-deliverables-pending-finalize-empty-state",
    );
  });

  it("surfaces first-hour CTAs on executive and decision register empties", () => {
    expect(EXECUTIVE_REVIEWS_EMPTY_COMPACT.actions?.[0]?.href).toBe("/see-it");
    expect(DECISION_REGISTER_EMPTY_COMPACT.actions?.[0]?.href).toBe("/reviews?projectId=default");
    expect(IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT.actions?.[0]?.href).toBe("/settings/identity/sso-wizard");
  });

  it("keeps operator persona out of compact empty-state titles and descriptions", () => {
    const presets = [
      EXECUTIVE_REVIEWS_EMPTY_COMPACT,
      DECISION_REGISTER_EMPTY_COMPACT,
      GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT,
      IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT,
      RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT,
      SCIM_NO_TOKENS_EMPTY_COMPACT,
    ];

    for (const preset of presets) {
      const corpus = [preset.title, preset.description ?? ""].join(" ").toLowerCase();

      expect(corpus, preset.testId).not.toMatch(/\boperator\b/);
    }
  });
});

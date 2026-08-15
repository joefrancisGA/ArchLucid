import { describe, expect, it } from "vitest";

import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import * as enterpriseCompactEmptyStatePresets from "@/lib/enterprise-compact-empty-state-presets";
import {
  DECISION_REGISTER_EMPTY_COMPACT,
  SPONSOR_REVIEWS_EMPTY_COMPACT,
  GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT,
  IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT,
  RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT,
  SCIM_NO_TOKENS_EMPTY_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";

function compactPresetsWithActions(): Array<{ name: string; preset: EnterpriseCompactEmptyStateProps }> {
  return Object.entries(enterpriseCompactEmptyStatePresets)
    .filter(([name, value]) => name.endsWith("_COMPACT") && typeof value === "object" && value !== null)
    .map(([name, preset]) => ({ name, preset: preset as EnterpriseCompactEmptyStateProps }))
    .filter(({ preset }) => (preset.actions?.length ?? 0) > 0);
}

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

  it("surfaces first-hour CTAs on sponsor and decision register empties", () => {
    expect(SPONSOR_REVIEWS_EMPTY_COMPACT.actions?.[0]?.href).toBe("/see-it");
    expect(DECISION_REGISTER_EMPTY_COMPACT.actions?.[0]?.href).toBe("/architecture/reviews");
    expect(DECISION_REGISTER_EMPTY_COMPACT.actions?.[1]?.href).toBe("/architecture/reviews/new");
    expect(IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT.actions?.[0]?.href).toBe("/administration/identity/sso-wizard");
  });

  it("keeps operator persona out of compact empty-state titles and descriptions", () => {
    const presets = [
      SPONSOR_REVIEWS_EMPTY_COMPACT,
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

  it("uses unique action hrefs per preset (EnterpriseCompactEmptyState keys by href)", () => {
    for (const { name, preset } of compactPresetsWithActions()) {
      const hrefs = (preset.actions ?? []).map((action) => action.href);
      const uniqueHrefs = new Set(hrefs);

      expect(uniqueHrefs.size, `${name} (${preset.testId ?? "no testId"})`).toBe(hrefs.length);
    }
  });
});

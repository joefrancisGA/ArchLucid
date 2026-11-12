import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceResolutionPageView } from "./GovernanceResolutionPageView";
import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";
import {
  buildStandardsRulesSummary,
  EMPTY_STANDARDS_RULES_FILTER_STATE,
  collectStandardsRulesFilterOptions,
} from "@/lib/standards-rules-rows";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" as const }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/compliance/standards-and-rules",
  useSearchParams: () => new URLSearchParams("runId=run-1"),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("./use-governance-resolution-rows", () => ({
  useGovernanceResolutionRows: () => ({
    scopedRunId: "run-1",
    scopedRunFilterActive: true,
    currentSearch: "runId=run-1",
    pathname: "/compliance/standards-and-rules",
    filters: EMPTY_STANDARDS_RULES_FILTER_STATE,
    setFilters: vi.fn(),
    searchQuery: "",
    setSearchQuery: vi.fn(),
    clearSearch: vi.fn(),
    onPickRun: vi.fn(),
    allRuleRows: [],
    filteredRuleRows: [],
    firstUnmatchedRule: null,
    summary: buildStandardsRulesSummary([]),
    filterOptions: collectStandardsRulesFilterOptions([]),
    usesShowcaseRuleRows: false,
    freshnessLabel: null,
    showTableSkeleton: false,
    showRulesTable: false,
    governanceBanner: null,
    reviewContext: null,
    standardsRulesResolveChecklistSteps: [],
    standardsRulesResolveChecklistEmphasizedStepId: null,
  }),
}));

function buildModel(): GovernanceResolutionPageViewModel {
  return {
    buyerPolishedShell: false,
    canMutateEnterprisePolicySurfaces: false,
    data: null,
    loading: false,
    failure: null,
    blockedReason: null,
    lastRefreshedAt: null,
    load: vi.fn(async () => undefined),
  };
}

describe("GovernanceResolutionPageView SecureNow policy handoff", () => {
  it("routes preview policy pack impact to the compliance policy packs hub", () => {
    render(<GovernanceResolutionPageView model={buildModel()} />);

    expect(screen.getByTestId("standards-and-rules-policy-impact-preview-handoff")).toHaveAttribute(
      "href",
      "/compliance/policy-packs?reviewId=run-1",
    );
  });
});

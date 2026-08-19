import { describe, expect, it } from "vitest";

import {
  API_CONTRACTS_HELP_JOB_MATRIX,
  API_CONTRACTS_HELP_JOB_MATRIX_HEADING,
} from "@/lib/api-contracts-help-ia-dual";
import {
  API_CONTRACTS_HELP_RELATED_GUIDES,
  apiContractsHelpRelatedGuides,
} from "@/lib/api-contracts-help-related-guides";
import { SPECIALTY_HELP_CHROME_RELATED_GUIDES_MAX } from "@/lib/specialty-help-chrome-below-50-inventory";

describe("api-contracts help ia-dual and related guides (TB-2268 / TB-2269)", () => {
  it("keeps a three-row job matrix with API contracts marked current", () => {
    expect(API_CONTRACTS_HELP_JOB_MATRIX_HEADING).toContain("HTTP contract reference");
    expect(API_CONTRACTS_HELP_JOB_MATRIX).toHaveLength(3);
    expect(API_CONTRACTS_HELP_JOB_MATRIX.filter((row) => row.isCurrent === true)).toHaveLength(1);
    expect(API_CONTRACTS_HELP_JOB_MATRIX.some((row) => row.href === "/help/governance-approval")).toBe(true);
    expect(API_CONTRACTS_HELP_JOB_MATRIX.some((row) => row.href === "/help/configuration-reference")).toBe(true);
  });

  it("caps related guides at the specialty chrome contract", () => {
    expect(apiContractsHelpRelatedGuides()).toHaveLength(SPECIALTY_HELP_CHROME_RELATED_GUIDES_MAX);
    expect(API_CONTRACTS_HELP_RELATED_GUIDES.some((guide) => guide.href === "/help/cli-usage")).toBe(true);
    expect(API_CONTRACTS_HELP_RELATED_GUIDES.some((guide) => guide.href === "/help/api-contracts")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  buildCompareFindingCorrelationCountRows,
  coerceCompareFindingCorrelationMetadata,
  compareFindingCorrelationMethodLabel,
} from "@/lib/compare-finding-correlation";

describe("coerceCompareFindingCorrelationMetadata", () => {
  it("returns null for absent or invalid wire", () => {
    expect(coerceCompareFindingCorrelationMetadata(null)).toBeNull();
    expect(coerceCompareFindingCorrelationMetadata(undefined)).toBeNull();
    expect(coerceCompareFindingCorrelationMetadata({})).toBeNull();
    expect(coerceCompareFindingCorrelationMetadata({ primaryCorrelationMethod: "  " })).toBeNull();
  });

  it("coerces camelCase API payload with clamped counts", () => {
    const metadata = coerceCompareFindingCorrelationMetadata({
      primaryCorrelationMethod: "Mixed",
      honestyNote: "Some pairs matched on policy rule only.",
      policyRuleMatchCount: 2,
      fuzzyMatchCount: 1,
      unmatchedLeftCount: -1,
      unmatchedRightCount: 3.9,
    });

    expect(metadata).toEqual({
      primaryCorrelationMethod: "Mixed",
      honestyNote: "Some pairs matched on policy rule only.",
      policyRuleMatchCount: 2,
      fuzzyMatchCount: 1,
      unmatchedLeftCount: 0,
      unmatchedRightCount: 3,
    });
  });
});

describe("compareFindingCorrelationMethodLabel", () => {
  it("maps known backend method codes", () => {
    expect(compareFindingCorrelationMethodLabel("PolicyRuleAndFingerprint")).toBe(
      "Policy rule + fingerprint",
    );
    expect(compareFindingCorrelationMethodLabel("MessageCategoryFuzzy")).toBe(
      "Category + message (possible match)",
    );
    expect(compareFindingCorrelationMethodLabel("Mixed")).toBe("Mixed (policy rule + fuzzy)");
    expect(compareFindingCorrelationMethodLabel("CustomMethod")).toBe("CustomMethod");
  });
});

describe("buildCompareFindingCorrelationCountRows", () => {
  it("returns export-parity count labels", () => {
    const rows = buildCompareFindingCorrelationCountRows({
      primaryCorrelationMethod: "PolicyRuleAndFingerprint",
      honestyNote: "",
      policyRuleMatchCount: 4,
      fuzzyMatchCount: 0,
      unmatchedLeftCount: 1,
      unmatchedRightCount: 2,
    });

    expect(rows.map((row) => row.label)).toEqual([
      "Policy-rule matches",
      "Fuzzy (possible) matches",
      "Unmatched baseline findings",
      "Unmatched updated findings",
    ]);
    expect(rows.map((row) => row.value)).toEqual([4, 0, 1, 2]);
  });
});

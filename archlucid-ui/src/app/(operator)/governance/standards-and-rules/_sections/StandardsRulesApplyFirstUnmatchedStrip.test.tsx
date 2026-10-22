import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StandardsRulesApplyFirstUnmatchedStrip } from "./StandardsRulesApplyFirstUnmatchedStrip";

describe("StandardsRulesApplyFirstUnmatchedStrip", () => {
  it("renders apply actions for unmatched rule", () => {
    const onApplyFilter = vi.fn();

    render(
      <StandardsRulesApplyFirstUnmatchedStrip
        target={{
          ruleKey: "rule-unmatched",
          ruleName: "Require MFA",
          standardFramework: "SOC 2",
          category: "Security",
          severity: "High",
          enforcementMode: "Enforce",
          sourcePolicyPack: "Pack A",
          sourcePolicyPackHref: null,
          sourcePolicyPackProvenanceLabel: null,
          linkedFindingsLabel: null,
          linkedFindingsHref: null,
          evidenceHref: null,
        }}
        onApplyFilter={onApplyFilter}
      />,
    );

    fireEvent.click(screen.getByTestId("standards-rules-apply-first-unmatched-filter"));
    expect(onApplyFilter).toHaveBeenCalled();
  });
});

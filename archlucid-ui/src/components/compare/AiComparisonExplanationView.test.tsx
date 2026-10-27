import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AiComparisonExplanationView } from "@/components/compare/AiComparisonExplanationView";
import {
  COMPARE_AI_EXPLANATION_MAJOR_CHANGES_NOT_STORED,
  COMPARE_AI_EXPLANATION_NARRATIVE_NOT_STORED,
  COMPARE_AI_EXPLANATION_SUMMARY_NOT_STORED,
  COMPARE_AI_EXPLANATION_TRADEOFFS_NOT_STORED,
} from "@/lib/compare/compare-ai-explanation-view-honesty";

describe("AiComparisonExplanationView", () => {
  it("shows not-stored empty states for blank summary and narrative sections", () => {
    render(
      <AiComparisonExplanationView
        explanation={{
          highLevelSummary: "   ",
          majorChanges: [],
          keyTradeoffs: [],
          narrative: "",
        }}
        structuredSecurityChangeCount={0}
        structuredCostChangeCount={null}
      />,
    );

    expect(screen.getByText(COMPARE_AI_EXPLANATION_SUMMARY_NOT_STORED)).toBeInTheDocument();
    expect(screen.getByText(COMPARE_AI_EXPLANATION_NARRATIVE_NOT_STORED)).toBeInTheDocument();
    expect(screen.getByText(COMPARE_AI_EXPLANATION_MAJOR_CHANGES_NOT_STORED)).toBeInTheDocument();
    expect(screen.getByText(COMPARE_AI_EXPLANATION_TRADEOFFS_NOT_STORED)).toBeInTheDocument();
  });
});

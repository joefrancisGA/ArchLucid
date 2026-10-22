import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LlmMonthlyBudgetExceededBanner } from "@/components/llm/LlmMonthlyBudgetExceededBanner";

describe("LlmMonthlyBudgetExceededBanner", () => {
  it("uses review vocabulary when the monthly LLM budget is exhausted", () => {
    render(
      <LlmMonthlyBudgetExceededBanner
        status={{
          monthlyBudgetMonitoringActive: true,
          blocksAdditionalLlmExecution: true,
          utcMonth: "2026-06",
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("view previous reviews");
    expect(screen.getByRole("alert")).not.toHaveTextContent("view previous runs");
  });
});

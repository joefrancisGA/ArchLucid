import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AiUsageBudgetControlsPanel } from "./AiUsageBudgetControlsPanel";

describe("AiUsageBudgetControlsPanel (P0 anchors)", () => {
  it("uses distinct billing destinations for each control", () => {
    render(<AiUsageBudgetControlsPanel canManageBudget />);

    const hrefs = [
      screen.getByTestId("ai-usage-edit-monthly-budget").getAttribute("href"),
      screen.getByTestId("ai-usage-budget-limits-enforcement").getAttribute("href"),
      screen.getByTestId("ai-usage-pause-scheduled").getAttribute("href"),
    ];

    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toEqual([
      "/administration/billing#billing-ai-credits",
      "/administration/billing#billing-usage",
      "/administration/recurrence",
    ]);
  });
});

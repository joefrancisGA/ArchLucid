import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

import { TenantFindingEngineControlsCard } from "./TenantFindingEngineControlsCard";

describe("TenantFindingEngineControlsCard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads controls and disables portfolio recurrence on toggle", async () => {
    let portfolioEnabled = true;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("finding-engine-controls") && (!init?.method || init.method === "GET")) {
        return new Response(
          JSON.stringify({
            effectiveEnableLlmJudge: false,
            effectiveEnableLlmJudgeForEngineFindings: false,
            effectivePortfolioRecurrenceEnabled: portfolioEnabled,
            hostDefaultEnableLlmJudge: false,
            hostDefaultEnableLlmJudgeForEngineFindings: false,
            hostDefaultPortfolioRecurrenceEnabled: true,
            enableLlmJudgeOverridden: false,
            enableLlmJudgeForEngineFindingsOverridden: false,
            portfolioRecurrenceEnabledOverridden: !portfolioEnabled,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("finding-engine-controls") && init?.method === "PUT") {
        portfolioEnabled = false;

        return new Response(
          JSON.stringify({
            effectiveEnableLlmJudge: false,
            effectiveEnableLlmJudgeForEngineFindings: false,
            effectivePortfolioRecurrenceEnabled: false,
            hostDefaultEnableLlmJudge: false,
            hostDefaultEnableLlmJudgeForEngineFindings: false,
            hostDefaultPortfolioRecurrenceEnabled: true,
            enableLlmJudgeOverridden: false,
            enableLlmJudgeForEngineFindingsOverridden: false,
            portfolioRecurrenceEnabledOverridden: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithOperatorQuery(<TenantFindingEngineControlsCard />);

    await waitFor(() => {
      expect(screen.getByTestId("finding-engine-controls")).toBeInTheDocument();
    });

    const portfolioToggle = screen.getByTestId("finding-engine-toggle-Portfolio recurrence scan");
    fireEvent.click(portfolioToggle);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("finding-engine-controls"),
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PortfolioPageView } from "./PortfolioPageView";

describe("PortfolioPageView", () => {
  beforeEach(() => {
    const baselinePayload = {
      baselineReviewCycleHours: null,
      manualPrepHoursPerReview: null,
    };
    const configurationProblemDetails = {
      title: "Portfolio directory key not configured",
      detail:
        "This tenant does not have a portfolio directory object key configured. Contact your ArchLucid administrator to enable cross-tenant portfolio access.",
      status: 403,
      type: "https://archlucid.net/errors/portfolio-key-not-configured",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.includes("/v1/tenant/baseline")) {
          return {
            ok: true,
            status: 200,
            headers: { get: () => "application/json" },
            text: async () => JSON.stringify(baselinePayload),
          } as Response;
        }

        return {
          ok: false,
          status: 403,
          headers: { get: () => "application/problem+json" },
          text: async () => JSON.stringify(configurationProblemDetails),
        } as Response;
      }),
    );
  });

  it("renders configuration guidance when API returns 403 ProblemDetails", async () => {
    render(<PortfolioPageView />);

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-directory-key-not-configured")).toBeInTheDocument();
    });

    expect(screen.getByText(/portfolio directory object key configured/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Learn more about portfolio configuration/i })).toBeInTheDocument();
    expect(screen.getByText("ROI baseline not configured")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure ROI baseline" })).toHaveAttribute("href", "/settings/baseline");
  });
});

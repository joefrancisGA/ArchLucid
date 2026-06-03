import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PortfolioPageView } from "./PortfolioPageView";

describe("PortfolioPageView", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: { get: () => "application/problem+json" },
        text: async () =>
          JSON.stringify({
            title: "Portfolio directory key not configured",
            detail:
              "This tenant does not have a portfolio directory object key configured. Contact your ArchLucid administrator to enable cross-tenant portfolio access.",
            status: 403,
            type: "https://archlucid.net/errors/portfolio-key-not-configured",
          }),
      } as Response),
    );
  });

  it("renders configuration guidance when API returns 403 ProblemDetails", async () => {
    render(<PortfolioPageView />);

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-directory-key-not-configured")).toBeInTheDocument();
    });

    expect(screen.getByText(/portfolio directory object key configured/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Learn more about portfolio configuration/i })).toBeInTheDocument();
  });
});

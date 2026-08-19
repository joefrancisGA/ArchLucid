import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlanningBridgePanel } from "./PlanningBridgePanel";

describe("PlanningBridgePanel (TB-879)", () => {
  it("surfaces retrieval citations from materialize response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        themesInserted: 1,
        plansInserted: 1,
        skippedExistingThemeKeys: 0,
        signalLinksInserted: 2,
        retrievalCitations: [
          {
            signalId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            themeKey: "pattern:api-gateway",
            snippet: "Prior pilot signal about gateway latency",
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<PlanningBridgePanel since={null} disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: /create draft plans/i }));

    await waitFor(() => {
      expect(screen.getByTestId("planning-bridge-retrieval-citations")).toBeInTheDocument();
    });

    expect(screen.getByText(/pattern:api-gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/gateway latency/i)).toBeInTheDocument();
    expect(screen.getByText(/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});

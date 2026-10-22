import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DemoExplainResponse } from "@/types/demo-explain";

import { DemoExplainStatusBanner } from "./DemoExplainStatusBanner";

const basePayload: DemoExplainResponse = {
  generatedUtc: "2026-04-20T12:00:00.000Z",
  runId: "6e8c4a102b1f4c9a9d3e10b2a4f0c501",
  manifestVersion: "v3",
  isDemoData: true,
  demoStatusMessage: "demo tenant — replace before publishing",
  runExplanation: null,
  provenanceGraph: null,
};

describe("DemoExplainStatusBanner (TB-1320)", () => {
  it("keeps review id and manifest version out of the default summary line", () => {
    render(<DemoExplainStatusBanner payload={basePayload} />);

    const summary = screen.getByTestId("demo-explain-status-banner-summary");

    expect(summary).toHaveTextContent("demo tenant — replace before publishing");
    expect(summary.textContent).toMatch(/Generated/);
    expect(summary.textContent).not.toContain(basePayload.runId);
    expect(summary.textContent?.toLowerCase()).not.toMatch(/review\s+v3/);
    expect(summary.textContent).not.toContain("2026-04-20T12:00:00.000Z");
  });

  it("labels manifest version separately inside technical details", async () => {
    render(<DemoExplainStatusBanner payload={basePayload} />);

    fireEvent.click(screen.getByRole("button", { name: "Technical details" }));

    await waitFor(() => {
      expect(screen.getByText("Manifest version")).toBeInTheDocument();
    });
    expect(screen.getByText("v3")).toBeInTheDocument();
    expect(screen.getByText("Review ID")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailHolisticCriticPanel } from "@/app/(operator)/reviews/[runId]/_sections/RunDetailHolisticCriticPanel";

vi.mock("@/lib/api/holistic-critic-api", () => ({
  generateHolisticCritique: vi.fn(),
}));

describe("RunDetailHolisticCriticPanel", () => {
  it("renders nothing when the review package is not committed", () => {
    const { container } = render(
      <RunDetailHolisticCriticPanel runId="run-1" hasGoldenManifest={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows advisory governance label after critique is generated", async () => {
    const { generateHolisticCritique } = await import("@/lib/api/holistic-critic-api");
    vi.mocked(generateHolisticCritique).mockResolvedValue({
      disclaimer: "Advisory only.",
      critiqueMarkdown: "Consider regional failover.",
    });

    render(<RunDetailHolisticCriticPanel runId="run-1" hasGoldenManifest={true} />);

    screen.getByTestId("holistic-critic-generate").click();

    expect(await screen.findByTestId("ai-output-governance-label-advisory")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingInsightDensityBand } from "./FindingInsightDensityBand";
import { INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE } from "@/lib/findings/insight-density-band";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true, mode: "working" }),
}));

describe("FindingInsightDensityBand", () => {
  it("renders a decision-grade band for high scores in Working mode rows", () => {
    render(<FindingInsightDensityBand findingId="f-1" insightDensityScore={88} />);

    const tag = screen.getByTestId("finding-insight-density-band-tag-f-1");

    expect(tag).toHaveTextContent("Decision-grade (88)");
    expect(tag).not.toHaveAttribute("title");
    expect(tag.className).not.toMatch(/ready/i);
    expect(screen.getByText(/typed-engine scores do not hide findings/i)).toBeInTheDocument();
    expect(screen.getByText(INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE)).toBeInTheDocument();
  });

  it("renders nothing when score is absent", () => {
    const { container } = render(<FindingInsightDensityBand findingId="f-1" insightDensityScore={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});

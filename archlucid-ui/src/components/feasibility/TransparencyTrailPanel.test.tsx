import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TransparencyTrailPanel } from "@/components/feasibility/TransparencyTrailPanel";

describe("TransparencyTrailPanel", () => {
  it("renders asserted, inferred, and skipped MUST sections", () => {
    render(
      <TransparencyTrailPanel
        trail={{
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [{ key: "policy.violation.CIS-1.1", value: "Encrypt data at rest", confidence: 85 }],
          skipped: [{ questionKey: "l0.pillar.security", tier: "Must" }],
        }}
      />,
    );

    expect(screen.getByTestId("transparency-trail-panel")).toBeInTheDocument();
    expect(screen.getByText(/asserted \(1\)/i)).toBeInTheDocument();
    expect(screen.getByTestId("transparency-trail-skipped-must")).toBeInTheDocument();
    expect(screen.getByText("l0.pillar.security")).toBeInTheDocument();
  });

  it("renders nothing when the trail is not available yet", () => {
    const { container } = render(<TransparencyTrailPanel trail={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows a defect callout when the trail is missing on a completed review", () => {
    render(<TransparencyTrailPanel trail={null} missingTrailDefect />);

    expect(screen.getByTestId("transparency-trail-missing-defect")).toBeInTheDocument();
  });

  it("collapses behind a disclosure when defaultExpanded is false", () => {
    render(
      <TransparencyTrailPanel
        defaultExpanded={false}
        trail={{
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [],
          skipped: [],
        }}
      />,
    );

    const panel = screen.getByTestId("transparency-trail-panel");

    expect(panel.tagName).toBe("DETAILS");
    expect(panel).not.toHaveAttribute("open");
  });
});

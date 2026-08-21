import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceGapForecastPanel } from "@/components/evidence/EvidenceGapForecastPanel";
import type { EvidencePresenceFlags } from "@/lib/evidence-gap-forecast";

const NO_EVIDENCE: EvidencePresenceFlags = {
  hasArchitectureBrief: false,
  hasCloudInventory: false,
  hasInfrastructureAsCode: false,
  hasArchitectureDiagram: false,
  hasOperationalEvidence: false,
};

const ALL_EVIDENCE: EvidencePresenceFlags = {
  hasArchitectureBrief: true,
  hasCloudInventory: true,
  hasInfrastructureAsCode: true,
  hasArchitectureDiagram: true,
  hasOperationalEvidence: true,
};

describe("EvidenceGapForecastPanel", () => {
  it("renders nothing when no evidence class is missing", () => {
    const { container } = render(<EvidenceGapForecastPanel presence={ALL_EVIDENCE} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("keeps the per-class detail collapsed behind a disclosure by default", () => {
    render(<EvidenceGapForecastPanel presence={NO_EVIDENCE} presentation="expandable" />);

    const disclosure = screen.getByTestId("evidence-gap-forecast-panel");

    expect(disclosure).not.toHaveAttribute("open");
    expect(disclosure).toHaveTextContent("5 evidence classes present");
    expect(screen.getByTestId("evidence-gap-forecast-architecture-brief")).toBeInTheDocument();
  });

  it("reduces to a single status line with a help link on summary surfaces", () => {
    render(<EvidenceGapForecastPanel presence={NO_EVIDENCE} presentation="summary" />);

    expect(screen.queryByTestId("evidence-gap-forecast-panel")).toBeNull();
    expect(screen.queryByTestId("evidence-gap-forecast-architecture-brief")).toBeNull();
    expect(screen.getByTestId("evidence-gap-forecast-summary")).toHaveTextContent(
      "0 of 5 evidence classes present",
    );
  });

  it("points the help link at the evidence intake coverage reference", () => {
    render(<EvidenceGapForecastPanel presence={NO_EVIDENCE} presentation="summary" />);

    expect(screen.getByTestId("evidence-gap-forecast-help-link")).toHaveAttribute(
      "href",
      "/help/evidence-intake#finding-coverage",
    );
  });

  it("defaults to the expandable presentation", () => {
    render(<EvidenceGapForecastPanel presence={NO_EVIDENCE} />);

    expect(screen.getByTestId("evidence-gap-forecast-panel")).toBeInTheDocument();
  });

  it("renders per-class add-evidence links when a target href is supplied", () => {
    render(
      <EvidenceGapForecastPanel
        presence={NO_EVIDENCE}
        presentation="expandable"
        addEvidenceHref="/architecture/reviews/run-1?reviewTab=evidence"
      />,
    );

    expect(screen.getByRole("link", { name: "Add cloud inventory" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1?reviewTab=evidence",
    );
  });
});

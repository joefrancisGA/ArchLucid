import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PackagePrintTransparencyTrailSection } from "./PackagePrintTransparencyTrailSection";

describe("PackagePrintTransparencyTrailSection", () => {
  it("labels an absent trail as incomplete for print", () => {
    render(<PackagePrintTransparencyTrailSection trail={null} />);

    expect(screen.getByTestId("package-print-transparency-trail")).toBeInTheDocument();
    expect(screen.getByText(/does not include a complete transparency trail/i)).toBeInTheDocument();
  });

  it("uses formatted asserted metadata and skipped honesty on a complete trail", () => {
    render(
      <PackagePrintTransparencyTrailSection
        trail={{
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [{ key: "policy.violation.foo", value: "", confidence: 0 }],
          skipped: [],
        }}
      />,
    );

    expect(screen.getByText(/businessOutcome: Reduce triage time/)).toBeInTheDocument();
    expect(screen.getByText(/Responder was not stored\./)).toBeInTheDocument();
    expect(
      screen.getByText("Skipped questions were not recorded on this transparency trail."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Inferred value was stored empty\./)).toBeInTheDocument();
    expect(screen.getByText(/Confidence was not stored\./)).toBeInTheDocument();
    expect(screen.getByText(/not a signed export artifact/i)).toBeInTheDocument();
  });

  it("labels stored-empty asserted and inferred lists on a complete trail", () => {
    render(
      <PackagePrintTransparencyTrailSection
        trail={{
          asserted: [],
          inferred: [],
          skipped: [{ questionKey: "q1", tier: "Must" }],
        }}
      />,
    );

    expect(screen.getByText("Asserted entries were stored empty.")).toBeInTheDocument();
    expect(screen.getByText("Inferred entries were stored empty.")).toBeInTheDocument();
  });
});

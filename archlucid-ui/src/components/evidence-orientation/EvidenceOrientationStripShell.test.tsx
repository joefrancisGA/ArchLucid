import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";

describe("EvidenceOrientationStripShell", () => {
  it("renders children under the strip test id with default band spacing", () => {
    render(
      <EvidenceOrientationStripShell testId="scope-help-orientation">
        <p>claim band</p>
      </EvidenceOrientationStripShell>,
    );

    const shell = screen.getByTestId("scope-help-orientation");
    expect(shell).toHaveClass("space-y-3");
    expect(shell.textContent).toContain("claim band");
  });

  it("merges page-specific layout classes onto the strip root", () => {
    render(
      <EvidenceOrientationStripShell testId="pricing-orientation" className="mb-10 text-left">
        <p>band</p>
      </EvidenceOrientationStripShell>,
    );

    const shell = screen.getByTestId("pricing-orientation");
    expect(shell).toHaveClass("space-y-3");
    expect(shell).toHaveClass("mb-10");
    expect(shell).toHaveClass("text-left");
  });
});

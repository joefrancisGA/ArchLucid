import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceOrientationMetaLine } from "@/components/evidence-orientation/EvidenceOrientationMetaLine";

describe("EvidenceOrientationMetaLine", () => {
  it("renders the label as a scan marker ahead of the applicability sentence", () => {
    render(
      <EvidenceOrientationMetaLine
        testId="troubleshooting-help-freshness"
        label="Last reviewed 2026-07"
        text="Applies to the hosted control plane."
      />,
    );

    const line = screen.getByTestId("troubleshooting-help-freshness");
    expect(line.textContent).toBe("Last reviewed 2026-07 — Applies to the hosted control plane.");
    expect(screen.getByText("Last reviewed 2026-07")).toHaveClass("font-medium");
  });
});

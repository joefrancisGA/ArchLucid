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
    expect(shell.className).toBe("space-y-3");
    expect(shell.textContent).toContain("claim band");
  });

  it("keeps page margin ahead of band spacing and alignment after it", () => {
    render(
      <EvidenceOrientationStripShell testId="welcome-orientation" margin="mb-10" align="text-left">
        <p>band</p>
      </EvidenceOrientationStripShell>,
    );

    expect(screen.getByTestId("welcome-orientation").className).toBe("mb-10 space-y-3 text-left");
  });
});

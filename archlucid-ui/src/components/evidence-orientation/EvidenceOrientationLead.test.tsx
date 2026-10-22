import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceOrientationLead } from "@/components/evidence-orientation/EvidenceOrientationLead";

describe("EvidenceOrientationLead", () => {
  it("renders the orienting sentence under its own test id", () => {
    render(<EvidenceOrientationLead testId="procurement-help-lead" text="What this page answers." />);

    expect(screen.getByTestId("procurement-help-lead").textContent).toBe("What this page answers.");
  });
});

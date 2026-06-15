import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingEvidenceLinkChip } from "./FindingEvidenceLinkChip";

describe("FindingEvidenceLinkChip", () => {
  it("shows linked count when evidence refs exist", () => {
    render(<FindingEvidenceLinkChip href="/reviews/run-1/graph" evidenceRefCount={3} />);

    expect(screen.getByTestId("finding-evidence-link-chip")).toHaveTextContent("Evidence: 3 linked");
  });

  it("falls back to evidence trail label without count", () => {
    render(<FindingEvidenceLinkChip href="/reviews/run-1/graph" />);

    expect(screen.getByTestId("finding-evidence-link-chip")).toHaveTextContent("Evidence trail");
  });
});

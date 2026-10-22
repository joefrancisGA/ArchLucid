import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AiOutputGovernanceLabel } from "@/components/AiOutputGovernanceLabel";

describe("AiOutputGovernanceLabel", () => {
  it("renders governed label for persisted findings", () => {
    render(<AiOutputGovernanceLabel findingId="finding-123" />);

    expect(screen.getByTestId("ai-output-governance-label-governed")).toHaveTextContent("Tracked finding");
  });

  it("renders advisory label when forced", () => {
    render(<AiOutputGovernanceLabel forceAdvisory />);

    expect(screen.getByTestId("ai-output-governance-label-advisory")).toHaveTextContent(/Advisory/i);
  });
});

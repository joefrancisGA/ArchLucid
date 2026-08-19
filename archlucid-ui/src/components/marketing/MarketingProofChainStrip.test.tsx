import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingProofChainStrip } from "@/components/marketing/MarketingProofChainStrip";

describe("MarketingProofChainStrip", () => {
  it("renders the five-step proof chain as a pipeline diagram", () => {
    render(<MarketingProofChainStrip />);

    expect(screen.getByTestId("marketing-proof-chain-strip")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-proof-chain-pipeline")).toBeInTheDocument();
    expect(screen.getByText(/Why this is not a chat answer/i)).toBeInTheDocument();
    expect(screen.getByTestId("marketing-proof-chain-step-evidence")).toHaveTextContent("Evidence");
    expect(screen.getByTestId("marketing-proof-chain-step-audit")).toHaveTextContent("Audit");
    expect(screen.getByTestId("marketing-proof-chain-step-review-record")).toHaveTextContent(
      "Review record",
    );
  });
});

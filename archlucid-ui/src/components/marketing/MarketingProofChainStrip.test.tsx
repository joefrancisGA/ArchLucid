import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingProofChainStrip } from "@/components/marketing/MarketingProofChainStrip";

describe("MarketingProofChainStrip", () => {
  it("renders the five-step proof chain", () => {
    render(<MarketingProofChainStrip />);

    expect(screen.getByTestId("marketing-proof-chain-strip")).toBeInTheDocument();
    expect(screen.getByText(/Why this is not a chat answer/i)).toBeInTheDocument();
    expect(screen.getByText("1. Evidence")).toBeInTheDocument();
    expect(screen.getByText("5. Audit")).toBeInTheDocument();
  });
});

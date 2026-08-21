import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPackBasisStatusBanner } from "@/components/governance/PolicyPackBasisStatusBanner";

describe("PolicyPackBasisStatusBanner", () => {
  it("renders policy-pack basis copy and calm action links without arrow glyphs", () => {
    render(<PolicyPackBasisStatusBanner />);

    expect(screen.getByTestId("policy-pack-basis-status-banner")).toBeInTheDocument();
    expect(screen.getByText("Policy pack basis")).toBeInTheDocument();
    expect(screen.getByText(/Governance guardrails referenced by this review/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View finalized review record" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View evidence trail" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View audit trail" })).toBeInTheDocument();
    expect(screen.queryByText(/→/)).not.toBeInTheDocument();
  });
});

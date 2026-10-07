import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingCausalMiniChain } from "@/components/usability/FindingCausalMiniChain";
import { buildFindingCausalMiniChain } from "@/lib/findings/finding-causal-mini-chain";

describe("FindingCausalMiniChain (TB-2217)", () => {
  it("renders three steps with values when present", () => {
    const chain = buildFindingCausalMiniChain({
      ruleName: "Ingress rule",
      evidenceRefCount: 1,
      recommendation: "Close the port.",
    });

    render(<FindingCausalMiniChain chain={chain} />);

    expect(screen.getByTestId("finding-causal-mini-chain")).toBeInTheDocument();
    expect(screen.getByTestId("finding-causal-mini-chain-value-rule")).toHaveTextContent("Ingress rule");
    expect(screen.getByTestId("finding-causal-mini-chain-value-evidence")).toHaveTextContent(
      "1 cited evidence reference",
    );
    expect(screen.getByTestId("finding-causal-mini-chain-value-recommendation")).toHaveTextContent(
      "Close the port.",
    );
  });

  it("shows field-specific omission sentences when fields are missing", () => {
    const chain = buildFindingCausalMiniChain({});

    render(<FindingCausalMiniChain chain={chain} defaultOpen />);

    expect(screen.getByTestId("finding-causal-mini-chain-value-rule")).toHaveTextContent("Rule was not stored");
    expect(screen.getByTestId("finding-causal-mini-chain-value-evidence")).toHaveTextContent("Evidence was not stored");
    expect(screen.getByTestId("finding-causal-mini-chain-value-recommendation")).toHaveTextContent(
      "Recommendation was not stored",
    );
  });
});
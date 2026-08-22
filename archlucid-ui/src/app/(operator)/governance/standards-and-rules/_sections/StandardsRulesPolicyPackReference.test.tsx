import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StandardsRulesPolicyPackReference } from "./StandardsRulesPolicyPackReference";

describe("StandardsRulesPolicyPackReference", () => {
  it("renders pack name link with provenance tag beside it", () => {
    render(
      <StandardsRulesPolicyPackReference
        label="Security Architecture Baseline"
        href="/governance/policy-packs/security-architecture-baseline"
        provenanceLabel="Platform default"
      />,
    );

    expect(screen.getByRole("link", { name: "Security Architecture Baseline" })).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-policy-pack-provenance-tag")).toHaveTextContent("Platform default");
  });

  it("omits provenance tag when label is absent", () => {
    render(
      <StandardsRulesPolicyPackReference
        label="Workspace policy"
        href={null}
      />,
    );

    expect(screen.getByText("Workspace policy")).toBeInTheDocument();
    expect(screen.queryByTestId("standards-rules-policy-pack-provenance-tag")).not.toBeInTheDocument();
  });
});

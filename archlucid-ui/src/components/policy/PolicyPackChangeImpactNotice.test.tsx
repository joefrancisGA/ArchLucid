import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PolicyPackChangeImpactNotice } from "@/components/policy/PolicyPackChangeImpactNotice";
import { POLICY_PACK_CHANGE_IMPACT_NO_ESTIMATE_BODY } from "@/lib/policy/policy-pack-change-impact";

describe("PolicyPackChangeImpactNotice", () => {
  it("renders honest no-estimate copy", () => {
    render(<PolicyPackChangeImpactNotice findingCount={0} />);

    expect(screen.getByTestId("policy-pack-change-impact")).toBeInTheDocument();
    expect(screen.getByText(POLICY_PACK_CHANGE_IMPACT_NO_ESTIMATE_BODY)).toBeInTheDocument();
  });

  it("shows finding context when count is provided without inventing severity N", () => {
    render(<PolicyPackChangeImpactNotice findingCount={5} />);

    const root = screen.getByTestId("policy-pack-change-impact");

    expect(root).toHaveTextContent(POLICY_PACK_CHANGE_IMPACT_NO_ESTIMATE_BODY);
    expect(root).toHaveTextContent("5 findings");
    expect(root.textContent).not.toMatch(/about \d+ findings/);
  });

  it("shows severity estimate when provided", () => {
    render(<PolicyPackChangeImpactNotice findingCount={4} severityChangeEstimate={1} />);

    expect(screen.getByTestId("policy-pack-change-impact")).toHaveTextContent("about 1 finding");
  });
});
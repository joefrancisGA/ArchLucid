import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingInspectEvidenceSection } from "./FindingInspectEvidenceSection";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
}));

vi.mock("./FindingInspectPolicyRuleCallout", () => ({
  FindingInspectPolicyRuleCallout: () => (
    <div data-testid="finding-inspect-policy-rule-callout">Policy rule callout</div>
  ),
}));

describe("FindingInspectEvidenceSection", () => {
  it("renders policy callout before supporting evidence when policy context exists", () => {
    render(
      <FindingInspectEvidenceSection
        demoFillGaps={false}
        reviewContextHref="/reviews/run-1"
        reviewContextLabel="Open review"
        evidence={[
          {
            artifactId: "diagram-1",
            lineRange: "12-14",
            excerpt: "Public ingress on port 443",
          },
        ]}
        citationModel={{
          pack: {
            packId: "sec-pack",
            packName: "Security Architecture Baseline",
            href: "/policy-packs?packId=sec-pack",
          },
          policy: {
            ruleId: "sec-base-001",
            ruleLabel: "Deny public ingress",
            href: "/policy-packs?ruleId=sec-base-001",
          },
          evidence: [
            {
              label: "Open signed record section",
              detail: "Lines 12-14 · diagram-1",
              href: "/reviews/run-1#manifest-summary",
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId("finding-inspect-policy-rule-callout")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Supporting architecture evidence" })).toBeTruthy();
    expect(screen.getByText("Public ingress on port 443")).toBeTruthy();
    expect(screen.getByTestId("finding-source-evidence-link")).toHaveAttribute(
      "href",
      "/reviews/run-1#manifest-summary",
    );
  });

  it("keeps evidence-only layout when no policy context is available", () => {
    render(
      <FindingInspectEvidenceSection
        demoFillGaps={false}
        reviewContextHref="/reviews/run-1"
        reviewContextLabel="Open review"
        evidence={[
          {
            artifactId: null,
            lineRange: null,
            excerpt: "node-x",
          },
        ]}
      />,
    );

    expect(screen.queryByTestId("finding-inspect-policy-rule-callout")).toBeNull();
    expect(screen.getByRole("heading", { name: "Evidence citations" })).toBeTruthy();
  });
});

import { render, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { FindingInspectView } from "../FindingInspectView";

expect.extend(toHaveNoViolations);

vi.mock("@/components/OperatorApiProblem", () => ({
  OperatorApiProblem: ({ fallbackMessage }: { fallbackMessage: string }) => (
    <div data-testid="api-problem-mock">{fallbackMessage}</div>
  ),
}));

vi.mock("@/components/OperatorEvidenceLimitsFooter", () => ({
  OperatorEvidenceLimitsFooter: () => <div data-testid="operator-evidence-limits-footer-stub" />,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
  isNextPublicDemoMode: () => false,
}));

describe("FindingInspectView", () => {
  it("renders core labeled sections when payload matches route run", () => {
    const { container } = render(
      <FindingInspectView
        runId="6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501"
        decodedFindingId="f-1"
        failure={null}
        payload={{
          findingId: "f-1",
          typedPayload: { severity: "High" },
          decisionRuleId: "rule-a",
          decisionRuleName: "Rule A",
          evidence: [{ artifactId: null, lineRange: "12-20", excerpt: "node-x" }],
          recommendedActions: ["Tighten ingress controls for the cited subgraph."],
          reasoningSummary:
            "This warning finding was triggered because Rule A. The evidence shows node-x. The recommendation to Tighten ingress controls for the cited subgraph. addresses architecture risk.",
          auditRowId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          runId: "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501",
          manifestVersion: "v1",
        }}
      />,
    );

    const view = within(container);

    expect(view.getByRole("heading", { name: "Rule A — evidence & trace" })).toBeTruthy();
    expect(view.getByText("AI Audit Inspection")).toBeTruthy();
    expect(view.getByRole("heading", { name: "Why Rule A matters" })).toBeTruthy();
    expect(view.getByRole("heading", { name: "Evidence citations" })).toBeTruthy();
    expect(view.getByRole("heading", { name: "Reasoning summary" })).toBeTruthy();
    expect(view.getByRole("heading", { name: "Recommended action" })).toBeTruthy();
    expect(view.getByRole("heading", { name: "Audit" })).toBeTruthy();
    expect(view.getByText("rule-a")).toBeTruthy();
    expect(view.getByText("node-x")).toBeTruthy();
  });

  it("has no serious axe violations when reasoning summary is present", async () => {
    const { container } = render(
      <FindingInspectView
        runId="6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501"
        decodedFindingId="f-1"
        failure={null}
        payload={{
          findingId: "f-1",
          typedPayload: { severity: "High" },
          decisionRuleId: "rule-a",
          decisionRuleName: "Rule A",
          evidence: [{ artifactId: null, lineRange: null, excerpt: "node-x" }],
          recommendedActions: ["Do the thing."],
          reasoningSummary: "Synthetic summary text for accessibility scan.",
          auditRowId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          runId: "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501",
          manifestVersion: "v1",
        }}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

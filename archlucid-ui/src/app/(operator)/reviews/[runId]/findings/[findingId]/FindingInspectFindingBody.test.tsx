import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingInspectFindingBody } from "./FindingInspectFindingBody";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/buyer-safe-review-navigation", () => ({
  getShowcaseManifestHref: () => "/reviews/demo-manifest",
}));

vi.mock("@/lib/operator-static-demo", () => ({
  isDemoRunIdEligibleForStaticFallback: () => false,
}));

const basePayload = {
  findingId: "f-1",
  typedPayload: { severity: "High" },
  decisionRuleId: "rule-a",
  decisionRuleName: "Rule A",
  evidence: [{ artifactId: null, lineRange: "12-20", excerpt: "node-x" }],
  recommendedActions: [] as string[],
  auditRowId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  runId: "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501",
  manifestVersion: "v1",
  reasoningTrace: "step one then step two",
};

describe("FindingInspectFindingBody", () => {
  it("detail variant omits raw reasoning and typed JSON inspectors", () => {
    render(
      <FindingInspectFindingBody
        runId={basePayload.runId}
        decodedFindingId="f-1"
        payload={basePayload}
        variant="detail"
      />,
    );

    expect(screen.getByRole("heading", { name: "Why Rule A matters" })).toBeTruthy();
    expect(screen.queryByText("View AI Reasoning")).toBeNull();
    expect(screen.queryByText("AI Audit Inspection")).toBeNull();
    expect(screen.getByRole("heading", { name: "Audit" })).toBeTruthy();
  });

  it("inspect variant exposes reasoning and structured payload dumps", () => {
    render(
      <FindingInspectFindingBody
        runId={basePayload.runId}
        decodedFindingId="f-1"
        payload={basePayload}
        variant="inspect"
      />,
    );

    expect(screen.getByText("View AI Reasoning")).toBeTruthy();
    expect(screen.getByText("AI Audit Inspection")).toBeTruthy();
    expect(screen.getByText("step one then step two")).toBeTruthy();
  });
});

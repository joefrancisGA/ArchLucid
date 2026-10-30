import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingInspectFindingBody } from "./FindingInspectFindingBody";
import { buildFindingModelProvenanceRow } from "@/lib/findings/finding-model-provenance-display";

vi.mock("@/lib/findings/finding-model-provenance-display", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/findings/finding-model-provenance-display")>();

  return {
    ...actual,
    buildFindingModelProvenanceRow: vi.fn(actual.buildFindingModelProvenanceRow),
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/r1/findings/f1",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: () => false,
  isNextPublicDemoMode: () => false,
};
});

vi.mock("@/lib/buyer/buyer-safe-review-navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/buyer/buyer-safe-review-navigation")>();

  return {
    ...actual,
    getShowcaseManifestHref: () => "/architecture/reviews/demo-manifest",
  };
});

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isDemoRunIdEligibleForStaticFallback: () => false,
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

const basePayload = {
  findingId: "f-1",
  typedPayload: { title: "Rule A", severity: "High" },
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
    expect(screen.getByTestId("finding-evidence-collapsible")).toBeTruthy();
    expect(screen.queryByText("View AI Reasoning")).toBeNull();
    expect(screen.queryByText("AI Audit Inspection")).toBeNull();
    expect(screen.getByRole("heading", { name: "Audit record" })).toBeTruthy();

    const headings = screen.getAllByRole("heading").map((h) => h.textContent ?? "");
    const recIdx = headings.indexOf("Recommended action");

    expect(recIdx).toBeGreaterThanOrEqual(0);
  });

  it("sponsor surface omits operator audit linkage", () => {
    render(
      <FindingInspectFindingBody
        runId={basePayload.runId}
        decodedFindingId="f-1"
        payload={basePayload}
        variant="detail"
        surface="sponsor"
      />,
    );

    expect(screen.queryByRole("heading", { name: "Audit record" })).toBeNull();
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

  it("states when model grounding is not applicable (P-15)", () => {
    vi.mocked(buildFindingModelProvenanceRow).mockReturnValueOnce({
      origin: "Deterministic rule",
      grounding: "Not applicable",
      explanation: "Rule-backed finding.",
      trustLabelReason: null,
    });

    render(
      <FindingInspectFindingBody
        runId={basePayload.runId}
        decodedFindingId="f-1"
        payload={{
          ...basePayload,
          evidence: [],
          decisionRuleId: "sec-base-001",
        }}
        variant="inspect"
      />,
    );

    expect(screen.getByTestId("finding-model-provenance-row")).toHaveTextContent(
      "Grounding is not applicable for this finding.",
    );
  });
});

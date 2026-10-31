import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingInspectEvidenceSection } from "./FindingInspectEvidenceSection";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1/findings/finding-1",
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/findings/FindingInspectDiagramCitationPreviewDialog", () => ({
  FindingInspectDiagramCitationPreviewDialog: () => null,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: () => false,
};
});

vi.mock("./FindingInspectPolicyRuleCallout", () => ({
  FindingInspectPolicyRuleCallout: () => (
    <div data-testid="finding-inspect-policy-rule-callout">Policy rule callout</div>
  ),
}));

describe("FindingInspectEvidenceSection", () => {
  it("renders policy callout before supporting evidence when policy context exists", () => {
    render(
      <FindingInspectEvidenceSection
        runId="run-1"
        demoFillGaps={false}
        reviewContextHref="/architecture/reviews/run-1"
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
            href: "/governance/policy-packs?packId=sec-pack",
          },
          policy: {
            ruleId: "sec-base-001",
            ruleLabel: "Deny public ingress",
            href: "/governance/policy-packs?ruleId=sec-base-001",
          },
          evidence: [
            {
              label: "Open finalized record section",
              detail: "Lines 12-14 · diagram-1",
              href: "/architecture/reviews/run-1#manifest-summary",
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
      "/architecture/reviews/run-1#manifest-summary",
    );
  });

  it("renders a keyboard-reachable diagram citation link for diagram evidence refs", () => {
    render(
      <FindingInspectEvidenceSection
        runId="run-1"
        demoFillGaps={false}
        reviewContextHref="/architecture/reviews/run-1"
        reviewContextLabel="Open review"
        evidence={[
          {
            artifactId: "diagram:evidence-mermaid-1:api",
            lineRange: null,
            excerpt: "diagram:evidence-mermaid-1:api",
          },
        ]}
        citationModel={{
          pack: null,
          policy: null,
          evidence: [
            {
              label: "Cited shape id api. A display name was not stored.",
              detail: "diagram:evidence-mermaid-1:api",
              href: "#diagram-citation-preview",
              diagramCitation: {
                evidenceItemId: "evidence-mermaid-1",
                shapeOrEdgeId: "api",
              },
            },
          ],
        }}
      />,
    );

    const link = screen.getByTestId("finding-diagram-citation-link");

    expect(link).toHaveAttribute("href", expect.stringContaining("diagramCitationPreview=evidence-mermaid-1%7Capi"));
    expect(link).toHaveTextContent("Cited shape id api. A display name was not stored.");
  });

  it("keeps evidence-only layout when no policy context is available", () => {
    render(
      <FindingInspectEvidenceSection
        runId="run-1"
        demoFillGaps={false}
        reviewContextHref="/architecture/reviews/run-1"
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

  it("reports missing and stored-empty technical citation values (P-07)", () => {
    const { rerender } = render(
      <FindingInspectEvidenceSection
        runId="run-1"
        demoFillGaps={false}
        reviewContextHref="/architecture/reviews/run-1"
        reviewContextLabel="Open review"
        evidence={[{ artifactId: null, lineRange: null, excerpt: "node-x" }]}
      />,
    );

    expect(screen.getByText("Line range was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Evidence artifact id was not stored.")).toBeInTheDocument();

    rerender(
      <FindingInspectEvidenceSection
        runId="run-1"
        demoFillGaps={false}
        reviewContextHref="/architecture/reviews/run-1"
        reviewContextLabel="Open review"
        evidence={[{ artifactId: "", lineRange: "", excerpt: "node-x" }]}
      />,
    );

    expect(screen.getByText("Line range was stored empty.")).toBeInTheDocument();
    expect(screen.getByText("Evidence artifact id was stored empty.")).toBeInTheDocument();
  });

  it("does not use artifact id as link label without a diagram citation (P-08)", () => {
    render(
      <FindingInspectEvidenceSection
        runId="run-1"
        demoFillGaps={false}
        reviewContextHref="/architecture/reviews/run-1"
        reviewContextLabel="Open review summary"
        evidence={[
          {
            artifactId: "diagram-1",
            lineRange: null,
            excerpt: "Public ingress on port 443",
          },
        ]}
      />,
    );

    expect(screen.getByText("Evidence link was not stored.")).toBeInTheDocument();
    expect(screen.queryByText("Open diagram-1")).not.toBeInTheDocument();
  });

  it("labels stored artifact links when href is present", () => {
    render(
      <FindingInspectEvidenceSection
        runId="run-1"
        demoFillGaps={false}
        reviewContextHref="/architecture/reviews/run-1"
        reviewContextLabel="Open review summary"
        evidence={[
          {
            artifactId: "diagram-1",
            lineRange: null,
            excerpt: "Public ingress on port 443",
          },
        ]}
        citationModel={{
          pack: null,
          policy: null,
          evidence: [
            {
              label: "",
              detail: null,
              href: "/architecture/reviews/run-1/evidence/diagram-1",
              diagramCitation: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Open evidence artifact diagram-1")).toBeInTheDocument();
    expect(screen.queryByText("Evidence link was not stored.")).not.toBeInTheDocument();
  });

  it("labels omitted evidence list separately from stored-empty list", () => {
    render(
      <FindingInspectEvidenceSection
        runId="run-1"
        demoFillGaps={false}
        reviewContextHref="/architecture/reviews/run-1"
        reviewContextLabel="Open review"
        evidence={[]}
        evidenceListReturned={false}
      />,
    );

    expect(screen.getByText("Evidence list was not stored.")).toBeInTheDocument();
  });

  it("does not render demo citation scaffold when evidence is empty (P-09)", () => {
    render(
      <FindingInspectEvidenceSection
        runId="run-1"
        demoFillGaps={true}
        reviewContextHref="/architecture/reviews/run-1"
        reviewContextLabel="Open review"
        evidence={[]}
      />,
    );

    expect(screen.getByText("Evidence list was stored empty.")).toBeInTheDocument();
    expect(screen.queryByText("Claims intake API schema")).not.toBeInTheDocument();
    expect(screen.queryByText("Open cited evidence")).not.toBeInTheDocument();
  });
});

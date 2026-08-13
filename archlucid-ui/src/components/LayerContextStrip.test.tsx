import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LayerContextStrip } from "./LayerContextStrip";
import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";

describe("LayerContextStrip", () => {
  it.each(
    [
      {
        id: "pilot" as const,
        wantLabel: "Reviews",
        wantQuestion: "Finalized packages with findings, evidence, decisions, and audit trail."
      },
      {
        id: "operate-analysis" as const,
        wantLabel: "Advanced operations",
        wantQuestion: "What changed, why, and what does the architecture look like?"
      },
      {
        id: "operate-governance" as const,
        wantLabel: "Governance",
        wantQuestion: "How do we govern, audit, and operationalize architecture decisions?"
      },
      {
        id: "operator-admin" as const,
        wantLabel: "Admin",
        wantQuestion: "How do we configure the tenant, cost visibility, and access for this workspace?"
      }
    ] as const
  )("renders compact layer label for $id", ({ id, wantLabel, wantQuestion }) => {
    const { getByTestId, queryByTestId, unmount } = render(<LayerContextStrip layerId={id} />);
    const strip = getByTestId("layer-context-strip");
    const t = (strip.textContent ?? "").replace(/\s+/g, " ");
    expect(t).toContain(wantLabel);
    expect(t).not.toContain(wantQuestion);
    expect(strip).toHaveAttribute("aria-label", `${wantLabel}. ${wantQuestion}`);
    expect(queryByTestId("layer-context-back-pilot")).toBeNull();
    unmount();
  });

  it("uses polished operate-analysis label when provided", () => {
    const { getByTestId, unmount } = render(
      <LayerContextStrip layerId="operate-analysis" polishedOperateAnalysisLabel="Insights" />,
    );
    const strip = getByTestId("layer-context-strip");
    expect((strip.textContent ?? "").replace(/\s+/g, " ")).toContain("Insights");
    unmount();
  });

  it("renders buyer satellite back link when provided on pilot orientation routes", () => {
    const { getByTestId, unmount } = render(
      <LayerContextStrip
        layerId="pilot"
        buyerRouteOrientation={{ label: "Signed review record", line: "Demo review record copy." }}
        buyerOperateBackLink={{ label: "Back to review", href: "/architecture/reviews/demo-run" }}
      />,
    );

    const link = getByTestId("layer-context-back-pilot");
    expect(link).toHaveTextContent("Back to review");
    expect(link).toHaveAttribute("href", "/architecture/reviews/demo-run");
    unmount();
  });

  it("renders buyer journey step pills without prev/next or Step N of M summary (TB-2096)", () => {
    const { getByTestId, unmount } = render(
      <LayerContextStrip
        layerId="pilot"
        buyerRouteOrientation={{ label: "View evidence trail", line: "Demo orientation." }}
        buyerGoldenJourneyNav={{
          summaryLine: "Step 3 of 5 · View evidence trail",
          prev: { label: "Signed review record", href: "/architecture/reviews/x/signed-record" },
          next: { label: "Governance approval", href: "/governance/approval-queue" },
          currentStepIndex: 2,
        }}
      />,
    );

    expect(getByTestId("buyer-golden-journey-stepper")).toBeInTheDocument();
    expect(screen.queryByTestId("buyer-journey-prev")).toBeNull();
    expect(screen.queryByTestId("buyer-journey-next")).toBeNull();
    expect(screen.queryByText(/Step 3 of 5/i)).toBeNull();

    const indicators = getByTestId("buyer-golden-journey-step-indicators");
    const currentChip = indicators.querySelector("[aria-current='step']");

    expect(currentChip).not.toBeNull();
    expect(currentChip?.textContent ?? "").toMatch(/Evidence graph/);
    expect(currentChip).toHaveAttribute("title", BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[2].chipTooltip);
    expect(screen.queryByRole("link", { name: /3\.\s*Evidence graph/i })).toBeNull();

    unmount();
  });

  it("renders buyer journey stepper when only journey nav is provided", () => {
    const { getByTestId, unmount } = render(
      <LayerContextStrip
        layerId="operate-analysis"
        buyerGoldenJourneyNav={{
          summaryLine: "Step 3 of 5 · View evidence trail",
          prev: { label: "Signed review record", href: "/architecture/reviews/x/signed-record" },
          next: { label: "Governance approval", href: "/governance/approval-queue" },
          currentStepIndex: 2,
        }}
      />,
    );

    expect(getByTestId("buyer-golden-journey-stepper")).toBeInTheDocument();
    unmount();
  });

  it("omits operate back link when hideOperateBackLink is true", () => {
    const { queryByTestId, unmount } = render(
      <LayerContextStrip
        layerId="operate-analysis"
        buyerRouteOrientation={{ label: "Ask review questions", line: "Ask questions about a finalized review." }}
        hideOperateBackLink
      />,
    );

    expect(queryByTestId("layer-context-back-pilot")).toBeNull();
    unmount();
  });
});

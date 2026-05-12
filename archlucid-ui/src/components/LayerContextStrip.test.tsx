import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LayerContextStrip } from "./LayerContextStrip";

describe("LayerContextStrip", () => {
  it.each(
    [
      {
        id: "pilot" as const,
        wantLabel: "Architecture reviews",
        wantQuestion: "Can we produce a credible, evidence-backed review package faster?"
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
  )("renders label and question for $id", ({ id, wantLabel, wantQuestion }) => {
    const { getByTestId, queryByTestId, unmount } = render(<LayerContextStrip layerId={id} />);
    const strip = getByTestId("layer-context-strip");
    const t = (strip.textContent ?? "").replace(/\s+/g, " ");
    expect(t).toContain(wantLabel);
    expect(t).toContain(wantQuestion);
    if (id === "pilot") {
      expect(queryByTestId("layer-context-back-pilot")).toBeNull();
    } else {
      expect(getByTestId("layer-context-back-pilot")).toBeInTheDocument();
    }
    unmount();
  });

  it("uses polished operate-analysis label when provided", () => {
    const { getByTestId, unmount } = render(
      <LayerContextStrip layerId="operate-analysis" polishedOperateAnalysisLabel="Analysis" />,
    );
    const strip = getByTestId("layer-context-strip");
    expect((strip.textContent ?? "").replace(/\s+/g, " ")).toContain("Analysis");
    unmount();
  });

  it("renders buyer satellite back link when provided on pilot orientation routes", () => {
    const { getByTestId, unmount } = render(
      <LayerContextStrip
        layerId="pilot"
        buyerRouteOrientation={{ label: "Signed manifest", line: "Demo manifest copy." }}
        buyerOperateBackLink={{ label: "Back to review package", href: "/reviews/demo-run" }}
      />,
    );

    const link = getByTestId("layer-context-back-pilot");
    expect(link).toHaveTextContent("Back to review package");
    expect(link).toHaveAttribute("href", "/reviews/demo-run");
    unmount();
  });

  it("renders buyer journey stepper when orientation and journey nav are provided", () => {
    const { getByTestId, unmount } = render(
      <LayerContextStrip
        layerId="pilot"
        buyerRouteOrientation={{ label: "Evidence graph", line: "Demo orientation." }}
        buyerGoldenJourneyNav={{
          summaryLine: "Step 3 of 5 · Evidence graph",
          prev: { label: "Signed manifest", href: "/reviews/x/manifest" },
          next: { label: "Governance approval", href: "/governance" },
        }}
      />,
    );

    expect(getByTestId("buyer-golden-journey-stepper")).toBeInTheDocument();
    expect(getByTestId("buyer-journey-prev")).toHaveAttribute("href", "/reviews/x/manifest");
    expect(getByTestId("buyer-journey-next")).toHaveAttribute("href", "/governance");
    unmount();
  });
});

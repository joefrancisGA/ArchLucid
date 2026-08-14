import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("./use-product-learning-page", () => ({
  useProductLearningPage: () => ({
    range: "30d",
    setRange: vi.fn(),
    bundle: {
      summary: {
        generatedUtc: "2026-08-01T00:00:00.000Z",
        tenantId: "t1",
        workspaceId: "w1",
        projectId: "p1",
        totalSignalsInScope: 0,
        distinctRunsTouched: 1,
        topAggregateCount: 0,
        artifactTrendCount: 0,
        improvementOpportunityCount: 0,
        triageQueueItemCount: 0,
        summaryNotes: [],
      },
      opportunities: { generatedUtc: "2026-08-01T00:00:00.000Z", items: [] },
      trends: { generatedUtc: "2026-08-01T00:00:00.000Z", trends: [] },
      triage: { generatedUtc: "2026-08-01T00:00:00.000Z", items: [] },
    },
    loading: false,
    failure: null,
    load: vi.fn(),
  }),
}));

import { ProductLearningPageClient } from "@/app/(operator)/internal/product-learning/_sections/ProductLearningPageClient";

describe("ProductLearningPageClient", () => {
  it("renders the evidence orientation strip on the live admin page", () => {
    render(<ProductLearningPageClient initialBundle={null} initialFailure={null} />);

    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("product-learning-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("product-learning-claim-discipline")).not.toBeInTheDocument();
  });
});

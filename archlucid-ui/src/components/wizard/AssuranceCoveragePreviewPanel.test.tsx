import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AssuranceCoveragePreviewPanel } from "@/components/wizard/AssuranceCoveragePreviewPanel";
import * as coveragePreviewApi from "@/lib/api/coverage-preview-api";

function renderWithQuery(ui: React.ReactElement): ReturnType<typeof render> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("AssuranceCoveragePreviewPanel", () => {
  it("renders grouped preview rows when API succeeds", async () => {
    vi.spyOn(coveragePreviewApi, "postCoveragePreview").mockResolvedValue({
      focusedPilotModeEnabled: true,
      summaryLine: "This architecture will use 1 baseline quality dimension.",
      providerNeutralBaselineCount: 1,
      organizationRequiredCount: 0,
      platformOverlayCount: 0,
      contextualRecommendedCount: 0,
      additionalOptionalCount: 0,
      assignments: [
        {
          policyPackId: "11111111-1111-1111-1111-111111111111",
          policyPackDisplayName: "Security Architecture Baseline",
          policyPackVersion: "1.0.0",
          coverageType: "ProviderNeutralBaseline",
          selectionState: "AlwaysActive",
          includedInRunEvaluation: true,
          evaluationVersion: "preview-v1",
        },
      ],
    });

    renderWithQuery(
      <AssuranceCoveragePreviewPanel focusedPilotModeEnabled cloudProvider="Azure" />,
    );

    expect(await screen.findByTestId("coverage-preview-group-baseline")).toBeInTheDocument();
    expect(screen.getByText("Security Architecture Baseline")).toBeInTheDocument();
  });
});

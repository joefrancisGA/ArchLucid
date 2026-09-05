import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
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
      <AssuranceCoveragePreviewPanel
        focusedPilotModeEnabled
        cloudProvider="Azure"
        packOverrides={[]}
        onPackOverrideChange={() => undefined}
      />,
    );

    expect(await screen.findByTestId("coverage-preview-group-baseline")).toBeInTheDocument();
    expect(screen.getByText("Security Architecture Baseline")).toBeInTheDocument();
  });

  it("shows exclusion controls for optional packs", async () => {
    const onPackOverrideChange = vi.fn();

    vi.spyOn(coveragePreviewApi, "postCoveragePreview").mockResolvedValue({
      focusedPilotModeEnabled: true,
      summaryLine: "Preview",
      providerNeutralBaselineCount: 0,
      organizationRequiredCount: 0,
      platformOverlayCount: 1,
      contextualRecommendedCount: 0,
      additionalOptionalCount: 0,
      assignments: [
        {
          policyPackId: "22222222-2222-2222-2222-222222222222",
          policyPackDisplayName: "Azure Well-Architected Framework",
          policyPackVersion: "1.0.0",
          coverageType: "PlatformOverlay",
          selectionState: "OptionalAndSelected",
          includedInRunEvaluation: true,
          evaluationVersion: "preview-v1",
        },
      ],
    });

    renderWithQuery(
      <AssuranceCoveragePreviewPanel
        focusedPilotModeEnabled
        cloudProvider="Azure"
        packOverrides={[]}
        onPackOverrideChange={onPackOverrideChange}
      />,
    );

    const checkbox = await screen.findByTestId(
      "coverage-preview-exclude-22222222-2222-2222-2222-222222222222",
    );

    fireEvent.click(checkbox);

    expect(onPackOverrideChange).toHaveBeenCalledWith({
      policyPackId: "22222222-2222-2222-2222-222222222222",
      excluded: true,
      exclusionReason: "",
    });
  });
});

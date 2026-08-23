import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AssuranceCoveragePreviewPanel } from "@/components/wizard/AssuranceCoveragePreviewPanel";
import * as coveragePreviewApi from "@/lib/api/coverage-preview-api";

describe("AssuranceCoveragePreviewPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders grouped coverage preview from API", async () => {
    vi.spyOn(coveragePreviewApi, "postCoveragePreview").mockResolvedValue({
      focusedPilotModeEnabled: true,
      summaryLine: "This architecture will use 6 baseline quality dimensions.",
      providerNeutralBaselineCount: 1,
      organizationRequiredCount: 0,
      platformOverlayCount: 0,
      contextualRecommendedCount: 0,
      additionalOptionalCount: 0,
      assignments: [
        {
          policyPackId: "pack-1",
          policyPackDisplayName: "Security Architecture Baseline",
          policyPackVersion: "1.0.0",
          coverageType: "ProviderNeutralBaseline",
          selectionState: "AlwaysActive",
          includedInRunEvaluation: true,
          evaluationVersion: "coverage-preview-v1",
        },
      ],
    });

    render(
      <AssuranceCoveragePreviewPanel
        cloudProvider="Azure"
        focusedPilotModeEnabled={true}
        securityIntakeAnswer="PCI workloads"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("assurance-coverage-preview")).toBeInTheDocument();
    });

    expect(screen.getByText("Assurance coverage preview")).toBeInTheDocument();
    expect(screen.getByText("Security Architecture Baseline")).toBeInTheDocument();
    expect(screen.getByTestId("assurance-coverage-preview-group-baseline")).toBeInTheDocument();
  });
});

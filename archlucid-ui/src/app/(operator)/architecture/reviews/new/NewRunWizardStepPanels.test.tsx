import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NewRunWizardStepPanels } from "./NewRunWizardStepPanels";

vi.mock("./NewRunWizardDeferredChunks", () => ({
  WizardStepAdvanced: () => <div data-testid="wizard-step-advanced-stub" />,
  WizardStepBaselineMetrics: () => <div data-testid="wizard-step-baseline-metrics-stub" />,
  WizardStepBaselineZip: () => <div data-testid="wizard-step-baseline-zip-stub" />,
  WizardStepCloudInventoryContext: () => <div data-testid="wizard-step-cloud-inventory-stub" />,
}));

vi.mock("@/components/wizard/steps/WizardStepPreset", () => ({
  WizardStepPreset: () => <div data-testid="wizard-step-preset-stub" />,
}));

vi.mock("@/components/wizard/steps/WizardStepEvidenceUpload", () => ({
  WizardStepEvidenceUpload: () => <div data-testid="wizard-step-evidence-stub" />,
}));

vi.mock("@/components/wizard/steps/WizardStepConstraints", () => ({
  WizardStepConstraints: () => <div data-testid="wizard-step-constraints-stub" />,
}));

vi.mock("@/components/wizard/steps/WizardStepReview", () => ({
  WizardStepReview: () => <div data-testid="wizard-step-review-stub" />,
}));

vi.mock("@/components/wizard/steps/WizardStepIdentity", () => ({
  WizardStepIdentity: () => <div data-testid="wizard-step-identity-stub" />,
}));

vi.mock("@/components/wizard/steps/WizardStepDescription", () => ({
  WizardStepDescription: () => <div data-testid="wizard-step-description-stub" />,
}));

vi.mock("@/components/wizard/ReviewAssuranceCoverageSection", () => ({
  ReviewAssuranceCoverageSection: () => <div data-testid="wizard-assurance-stub" />,
}));

const evidenceStub = {
  pendingEvidenceFile: null,
  pendingDocumentFiles: [],
  handlePendingEvidenceFileChange: vi.fn(),
  setPendingDocumentFiles: vi.fn(),
} as const;

const baseProps = {
  embeddedInPathSwitcher: false,
  baselineFirst: false,
  featuredSampleRunId: null,
  stepIndex: 0,
  focusedPilotModeEnabled: true,
  setFocusedPilotModeEnabled: vi.fn(),
  baselineReviewCycleHours: "168",
  setBaselineReviewCycleHours: vi.fn(),
  baselineConfidence: "medium" as const,
  setBaselineConfidence: vi.fn(),
  baselineMetricsError: null,
  setBaselineMetricsError: vi.fn(),
  runId: null,
  postCreateEvidencePanel: null,
  pipelineTrackPanel: null,
  evidence: evidenceStub,
  tryWithDemoData: vi.fn(),
  skipEvidenceAndAdvance: vi.fn(),
  goToStep: vi.fn(),
  showToast: vi.fn(),
};

describe("NewRunWizardStepPanels", () => {
  it("renders the preset step at index 0", () => {
    render(<NewRunWizardStepPanels {...baseProps} />);

    expect(screen.getByTestId("wizard-step-preset-stub")).toBeInTheDocument();
  });

  it("wraps the embedded path-switcher preset entry", () => {
    render(<NewRunWizardStepPanels {...baseProps} embeddedInPathSwitcher />);

    expect(screen.getByTestId("reviews-new-detailed-template-entry")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-step-preset-stub")).toBeInTheDocument();
  });
});

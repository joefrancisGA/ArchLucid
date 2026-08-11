import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReplayFormView } from "@/app/(operator)/internal/replay/_sections/ReplayFormView";
import type { ReplayFormViewModel } from "@/app/(operator)/internal/replay/_sections/replay-form-view-model";
import { REPLAY_AI_BUDGET_VARIANCE_NOTE, REPLAY_PAGE_INTRO } from "@/lib/replay-validation-copy";

function buildModel(overrides: Partial<ReplayFormViewModel> = {}): ReplayFormViewModel {
  return {
    runId: "",
    setRunId: vi.fn(),
    selectedRun: null,
    setSelectedRun: vi.fn(),
    mode: "ReconstructOnly",
    setMode: vi.fn(),
    modifyConfirmed: false,
    setModifyConfirmed: vi.fn(),
    result: null,
    failure: null,
    malformedMessage: null,
    loading: false,
    onReplay: vi.fn(),
    runIdTrimmed: "",
    historyEntries: [],
    lastValidationByRunId: {},
    actionDisabledReason: "Select a finalized package to continue.",
    ...overrides,
  };
}

vi.mock("@/components/replay/ReviewPackageValidationPicker", () => ({
  ReviewPackageValidationPicker: () => <div data-testid="review-package-validation-picker-input" />,
}));

describe("ReplayFormView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a single concise introduction and validate/compare vocabulary rail", () => {
    render(<ReplayFormView model={buildModel()} />);

    expect(screen.getByText(REPLAY_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("validate-compare-vocabulary")).toBeInTheDocument();
    expect(screen.getByTestId("validate-compare-vocabulary-peer-link")).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews",
    );
    expect(screen.queryByText(/Advanced operations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No review selected/i)).not.toBeInTheDocument();
  });

  it("explains disabled action when no package is selected", () => {
    render(<ReplayFormView model={buildModel()} />);

    expect(screen.getByTestId("replay-action-disabled-reason")).toHaveTextContent("Select a finalized package to continue.");
    expect(screen.getByTestId("replay-validation-primary-action")).toBeDisabled();
  });

  it("shows read-only disclosure for check stored package mode", () => {
    render(
      <ReplayFormView
        model={buildModel({
          runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          runIdTrimmed: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          actionDisabledReason: null,
        })}
      />,
    );

    expect(screen.getByTestId("replay-validation-read-only-note")).toHaveTextContent("Read-only");
    expect(screen.getByTestId("replay-validation-primary-action")).toHaveTextContent("Check stored package");
  });

  it("requires modify confirmation and shows AI-budget disclosure for rebuild modes", () => {
    render(
      <ReplayFormView
        model={buildModel({
          runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          runIdTrimmed: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          mode: "RebuildManifest",
          actionDisabledReason: "Confirm that you understand stored outputs may be replaced before running this validation.",
        })}
      />,
    );

    expect(screen.getByTestId("replay-modify-confirmation")).toBeInTheDocument();
    expect(screen.getByTestId("replay-validation-ai-budget-disclosure")).toHaveTextContent(REPLAY_AI_BUDGET_VARIANCE_NOTE);
    expect(screen.getByTestId("replay-validation-primary-action")).toHaveTextContent("Rebuild outputs");
  });

  it("renders validation history and precise outcomes", () => {
    render(
      <ReplayFormView
        model={buildModel({
          runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          runIdTrimmed: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          actionDisabledReason: null,
          historyEntries: [
            {
              id: "1",
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              mode: "ReconstructOnly",
              occurredUtc: "2026-07-11T12:00:00.000Z",
              durationMs: 1200,
              outcome: "valid_with_warnings",
              aiUsageLabel: "None",
              initiatedBy: "You",
              source: "session",
            },
          ],
          result: {
            runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            mode: "ReconstructOnly",
            replayedUtc: "2026-07-11T12:00:00.000Z",
            validation: {
              contextPresent: true,
              graphPresent: true,
              findingsPresent: true,
              manifestPresent: true,
              tracePresent: true,
              artifactsPresent: true,
              manifestHashMatches: true,
              artifactBundlePresentAfterReplay: true,
              notes: ["warning"],
            },
          },
        })}
      />,
    );

    expect(screen.getByTestId("replay-validation-history")).toBeInTheDocument();
    expect(screen.getAllByText("Valid with warnings").length).toBeGreaterThan(0);
    expect(screen.getByTestId("replay-validation-outcome")).toBeInTheDocument();
  });

  it("invokes replay when action is enabled", async () => {
    const onReplay = vi.fn().mockResolvedValue(undefined);

    render(
      <ReplayFormView
        model={buildModel({
          runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          runIdTrimmed: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          actionDisabledReason: null,
          onReplay,
        })}
      />,
    );

    fireEvent.click(screen.getByTestId("replay-validation-primary-action"));

    await waitFor(() => {
      expect(onReplay).toHaveBeenCalledTimes(1);
    });
  });
});

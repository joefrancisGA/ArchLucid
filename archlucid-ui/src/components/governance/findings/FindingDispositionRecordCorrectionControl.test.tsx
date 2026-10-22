import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MUTATION_UNDO_WINDOW_SECONDS } from "@/lib/mutation-reversibility-registry";
import { ReversibleMutationSuccessCallout } from "@/components/operator/ReversibleMutationSuccessCallout";
import { FindingDispositionRecordCorrectionControl } from "@/components/governance/findings/FindingDispositionRecordCorrectionControl";

describe("FindingDispositionRecordCorrectionControl (WA-11)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders record correction when a disposition was recorded", () => {
    render(
      <FindingDispositionRecordCorrectionControl
        findingId="finding-1"
        runId="run-1"
        hasRecordedDisposition={true}
      />,
    );

    expect(screen.getByTestId("finding-disposition-record-correction")).toBeInTheDocument();
  });

  it("keeps record correction available after the undo window on the success callout", () => {
    render(
      <ReversibleMutationSuccessCallout
        message="Finding accepted."
        mutationId="governance_keyboard_finding_disposition"
        onUndo={vi.fn()}
        onRecordCorrection={vi.fn()}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(MUTATION_UNDO_WINDOW_SECONDS * 1000);
    });

    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record correction" })).toBeInTheDocument();
  });
});

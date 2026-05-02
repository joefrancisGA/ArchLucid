import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductLearningFeedbackControls } from "./ProductLearningFeedbackControls";

const submitProductLearningSignal = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  submitProductLearningSignal: (...args: unknown[]) => submitProductLearningSignal(...args),
}));

describe("ProductLearningFeedbackControls", () => {
  it("submits a scoped trusted signal with optional comment", async () => {
    submitProductLearningSignal.mockResolvedValue(undefined);

    render(
      <ProductLearningFeedbackControls
        runId="11111111-1111-1111-1111-111111111111"
        manifestVersion="v1"
        subjectType="Finding"
        artifactHint="finding:f-1"
        patternKey="finding-rule:r-1"
        detail={{ findingId: "f-1" }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/optional note/i), {
      target: { value: "Evidence was clear." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Trusted" }));

    await waitFor(() => {
      expect(submitProductLearningSignal).toHaveBeenCalledWith(
        expect.objectContaining({
          architectureRunId: "11111111-1111-1111-1111-111111111111",
          authorityRunId: "11111111-1111-1111-1111-111111111111",
          manifestVersion: "v1",
          subjectType: "Finding",
          disposition: "Trusted",
          artifactHint: "finding:f-1",
          patternKey: "finding-rule:r-1",
          commentShort: "Evidence was clear.",
        }),
      );
    });
    expect(screen.getByText("Feedback saved.")).toBeInTheDocument();
  });

  it("does not send non-guid demo run ids to scoped run fields", async () => {
    submitProductLearningSignal.mockResolvedValue(undefined);

    render(<ProductLearningFeedbackControls runId="claims-intake-demo" subjectType="RunOutput" />);

    fireEvent.click(screen.getByRole("button", { name: "Follow up" }));

    await waitFor(() => {
      expect(submitProductLearningSignal).toHaveBeenCalledWith(
        expect.not.objectContaining({
          architectureRunId: expect.any(String),
          authorityRunId: expect.any(String),
        }),
      );
    });
  });
});

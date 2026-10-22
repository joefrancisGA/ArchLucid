import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ImpactPreviewBaselinePickerStrip } from "./ImpactPreviewBaselinePickerStrip";

const onSelectBaseline = vi.fn();

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "run-baseline-1", displayTitle: "Baseline review" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="impact-preview-baseline-picker-mock" />,
}));

describe("ImpactPreviewBaselinePickerStrip", () => {
  it("renders baseline picker when options exist", () => {
    render(
      <ImpactPreviewBaselinePickerStrip
        baselineOptions={[{ runId: "run-baseline-1", label: "Q1 review" }]}
        selectedBaselineId={null}
        onSelectBaseline={onSelectBaseline}
      />,
    );

    expect(screen.getByTestId("impact-preview-baseline-picker-strip")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-open-latest-finalized")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-baseline-1",
    );
  });

  it("returns null when no baseline options exist", () => {
    const { container } = render(
      <ImpactPreviewBaselinePickerStrip
        baselineOptions={[]}
        selectedBaselineId={null}
        onSelectBaseline={onSelectBaseline}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

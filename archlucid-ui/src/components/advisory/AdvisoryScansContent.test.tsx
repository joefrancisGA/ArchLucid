import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdvisoryScansContent } from "@/components/advisory/AdvisoryScansContent";
import {
  ADVISORY_SCANS_EMPTY_TITLE,
  ADVISORY_SCANS_GENERATE_BUTTON_LABEL,
  ADVISORY_SCANS_GENERATE_DISABLED_HINT,
  ADVISORY_SCANS_SAMPLE_SECTION_TITLE,
} from "@/lib/advisory-copy";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 0,
}));

vi.mock("@/components/RunIdPicker", () => ({
  RunIdPicker: (props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    inputId?: string;
  }) => (
    <label htmlFor={props.inputId}>
      {props.label}
      <input
        id={props.inputId}
        aria-label={props.label}
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      />
    </label>
  ),
}));

vi.mock("@/lib/advisory-api", () => ({
  applyRecommendationAction: vi.fn(),
  listRecommendations: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getImprovementPlan: vi.fn(),
}));

describe("AdvisoryScansContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("explains disabled generate action and shows sample preview", () => {
    render(<AdvisoryScansContent />);

    expect(screen.getByText(ADVISORY_SCANS_GENERATE_DISABLED_HINT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ADVISORY_SCANS_GENERATE_BUTTON_LABEL })).toBeDisabled();
    expect(screen.getByTestId("advisory-scan-empty-state")).toHaveTextContent(ADVISORY_SCANS_EMPTY_TITLE);
    expect(screen.getByText(ADVISORY_SCANS_SAMPLE_SECTION_TITLE)).toBeInTheDocument();
    expect(screen.queryByText("Advanced: enter review ID manually")).not.toBeInTheDocument();
  });

  it("hides admin manual id entry for non-admin callers", () => {
    render(<AdvisoryScansContent />);

    fireEvent.click(screen.getByText("Can't find a review?"));

    expect(screen.queryByText("Technical details (admin)")).not.toBeInTheDocument();
  });
});

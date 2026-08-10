import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

import { AdvisoryScansContent } from "@/components/advisory/AdvisoryScansContent";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";
import {
  ADVISORY_SCANS_EMPTY_NEXT_STORY_LEAD,
  ADVISORY_SCANS_EMPTY_TITLE,
  ADVISORY_SCANS_GENERATE_BUTTON_LABEL,
  ADVISORY_SCANS_GENERATE_DISABLED_HINT,
  ADVISORY_SCANS_SAMPLE_DISPOSITION_SUMMARY,
  ADVISORY_SCANS_SAMPLE_SECTION_TITLE,
  ADVISORY_SCANS_VIEW_SAMPLE_LABEL,
} from "@/lib/advisory-copy";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 0,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 0,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 0,
    isAuthorityLoading: false,
  }),}));

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

  it("shows one empty/demo next story above the fold (TB-1126)", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    expect(screen.getByTestId("advisory-empty-next-story")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-empty-next-story-lead")).toHaveTextContent(
      ADVISORY_SCANS_EMPTY_NEXT_STORY_LEAD,
    );
    expect(screen.getByText(ADVISORY_SCANS_SAMPLE_SECTION_TITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("advisory-scan-empty-state")).not.toBeInTheDocument();
    expect(screen.queryByText(ADVISORY_SCANS_EMPTY_TITLE)).not.toBeInTheDocument();

    const dispositionDisclosure = screen.getByTestId("advisory-sample-disposition-disclosure");

    expect(dispositionDisclosure).not.toHaveAttribute("open");
    expect(screen.getByText(ADVISORY_SCANS_SAMPLE_DISPOSITION_SUMMARY)).toBeInTheDocument();
    expect(screen.getByTestId("advisory-sample-disposition-chips")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Accept|Defer|Reject|Mark implemented/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("advisory-empty-open-reviews-link")).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
  });

  it("keeps exactly one primary CTA in empty/demo state (TB-1128)", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    const primaryCta = screen.getByTestId("advisory-empty-primary-cta");

    expect(primaryCta).toHaveAttribute("href", "#advisory-sample-recommendation");
    expect(primaryCta).toHaveTextContent(ADVISORY_SCANS_VIEW_SAMPLE_LABEL);
    expect(primaryCta.className).toContain("al-primary-action-bg");

    const generate = screen.getByTestId("advisory-generate-scan-button");

    expect(generate).toBeDisabled();
    expect(generate.className).toContain("bg-white");
    expect(generate.className).not.toContain("al-primary-action-bg");

    const openReviews = screen.getByTestId("advisory-empty-open-reviews-link");

    expect(openReviews.className).not.toContain("al-primary-action-bg");
    expect(screen.getAllByTestId("advisory-empty-primary-cta")).toHaveLength(1);
  });

  it("promotes Generate to primary after a review is selected (TB-1128)", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    fireEvent.change(screen.getByLabelText("Finalized review"), {
      target: { value: "run-finalized-1" },
    });

    const generate = screen.getByTestId("advisory-generate-scan-button");

    expect(generate).not.toBeDisabled();
    expect(generate.className).toContain("al-primary-action-bg");
    expect(screen.queryByTestId("advisory-empty-primary-cta")).not.toBeInTheDocument();
    expect(screen.getByTestId("advisory-empty-open-reviews-link").className).not.toContain(
      "al-primary-action-bg",
    );
  });

  it("explains disabled generate action and shows sample preview", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    expect(screen.getByText(ADVISORY_SCANS_GENERATE_DISABLED_HINT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ADVISORY_SCANS_GENERATE_BUTTON_LABEL })).toBeDisabled();
    expect(screen.getByText(ADVISORY_SCANS_SAMPLE_SECTION_TITLE)).toBeInTheDocument();
    expect(screen.queryByText("Advanced: enter review ID manually")).not.toBeInTheDocument();
  });

  it("hides admin manual id entry for non-admin callers", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    fireEvent.click(screen.getByText("Can't find a review?"));

    expect(screen.queryByText("Technical details (admin)")).not.toBeInTheDocument();
  });
});

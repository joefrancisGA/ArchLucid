import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

import { AdvisoryScansContent } from "@/components/advisory/AdvisoryScansContent";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";
import {
  ADVISORY_SCANS_CHOOSE_REVIEW_LABEL,
  ADVISORY_SCANS_DISPOSITION_DIALOG_TITLE,
  ADVISORY_SCANS_EMPTY_NEXT_STORY_LEAD,
  ADVISORY_SCANS_EMPTY_TITLE,
  ADVISORY_SCANS_GENERATE_BUTTON_LABEL,
  ADVISORY_SCANS_GENERATE_DISABLED_HINT,
  ADVISORY_SCANS_SAMPLE_DISPOSITION_SUMMARY,
  ADVISORY_SCANS_SAMPLE_SECTION_TITLE,
  ADVISORY_SCANS_VIEW_SAMPLE_LABEL,
} from "@/lib/advisory-copy";
import { applyRecommendationAction, listRecommendations } from "@/lib/advisory-api";
import type { RecommendationRecord } from "@/types/advisory";

function sampleRecommendation(): RecommendationRecord {
  return {
    recommendationId: "rec-1",
    tenantId: "t1",
    workspaceId: "w1",
    projectId: "p1",
    runId: "run-finalized-1",
    title: "Tighten auth boundary",
    category: "Security",
    rationale: "Evidence from findings",
    suggestedAction: "Require MFA on admin paths",
    urgency: "High",
    expectedImpact: "High",
    priorityScore: 90,
    status: "Open",
    createdUtc: "2026-07-01T00:00:00Z",
    lastUpdatedUtc: "2026-07-01T00:00:00Z",
  };
}

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 0,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 0,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 0,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/components/runs/RunIdPicker", () => ({
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
    vi.mocked(listRecommendations).mockResolvedValue([sampleRecommendation()]);
  });

  it("shows one empty/demo next story above the fold without form or sample (TB-1126 / TB-1567)", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    expect(screen.getByTestId("advisory-empty-next-story")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-empty-next-story-lead")).toHaveTextContent(
      ADVISORY_SCANS_EMPTY_NEXT_STORY_LEAD,
    );
    expect(screen.queryByTestId("advisory-scan-form")).not.toBeInTheDocument();
    expect(screen.queryByText(ADVISORY_SCANS_SAMPLE_SECTION_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("advisory-scan-empty-state")).not.toBeInTheDocument();
    expect(screen.queryByText(ADVISORY_SCANS_EMPTY_TITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("advisory-empty-open-reviews-link")).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
  });

  it("reveals sample preview after View sample without mounting the generate form (TB-1567)", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    fireEvent.click(screen.getByTestId("advisory-empty-view-sample-cta"));

    expect(screen.getByText(ADVISORY_SCANS_SAMPLE_SECTION_TITLE)).toBeInTheDocument();

    const dispositionDisclosure = screen.getByTestId("advisory-sample-disposition-disclosure");

    expect(dispositionDisclosure).not.toHaveAttribute("open");
    expect(screen.getByText(ADVISORY_SCANS_SAMPLE_DISPOSITION_SUMMARY)).toBeInTheDocument();
    expect(screen.getByTestId("advisory-sample-disposition-chips")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Accept|Defer|Reject|Mark implemented/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("advisory-scan-form")).not.toBeInTheDocument();
  });

  it("keeps exactly one primary CTA in empty intro state (TB-1128 / TB-1569)", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    const primaryCta = screen.getByTestId("advisory-choose-review-cta");

    expect(primaryCta).toHaveTextContent(ADVISORY_SCANS_CHOOSE_REVIEW_LABEL);
    expect(primaryCta.className).toContain("al-primary-action-bg");

    const viewSample = screen.getByTestId("advisory-empty-view-sample-cta");

    expect(viewSample.className).not.toContain("al-primary-action-bg");

    const openReviews = screen.getByTestId("advisory-empty-open-reviews-link");

    expect(openReviews.className).not.toContain("al-primary-action-bg");
    expect(screen.queryByTestId("advisory-generate-scan-button")).not.toBeInTheDocument();
  });

  it("reveals the generate form after Choose review and promotes Generate to primary (TB-1128 / TB-1569)", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    fireEvent.click(screen.getByTestId("advisory-choose-review-cta"));

    expect(screen.getByTestId("advisory-scan-form")).toBeInTheDocument();

    const generate = screen.getByTestId("advisory-generate-scan-button");

    expect(generate).toBeDisabled();
    expect(generate.className).toContain("bg-white");
    expect(generate.className).not.toContain("al-primary-action-bg");

    fireEvent.change(screen.getByLabelText("Finalized review"), {
      target: { value: "run-finalized-1" },
    });

    expect(generate).not.toBeDisabled();
    expect(generate.className).toContain("al-primary-action-bg");
    expect(screen.queryByTestId("advisory-choose-review-cta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("advisory-empty-view-sample-cta")).not.toBeInTheDocument();
  });

  it("explains disabled generate action after the form is revealed", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    fireEvent.click(screen.getByTestId("advisory-choose-review-cta"));

    expect(screen.getByText(ADVISORY_SCANS_GENERATE_DISABLED_HINT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ADVISORY_SCANS_GENERATE_BUTTON_LABEL })).toBeDisabled();
    expect(screen.queryByText("Advanced: enter review ID manually")).not.toBeInTheDocument();
  });

  it("does not use pageTitle tokens on the scans panel (TB-1568)", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "components", "advisory", "AdvisoryScansContent.tsx"),
      "utf8",
    );

    expect(source).not.toContain("OPERATOR_TYPOGRAPHY.pageTitle");
    expect(source).not.toContain("DocumentLayout");
  });

  it("opens an on-system disposition dialog instead of window.prompt (TB-1566)", async () => {
    const promptSpy = vi.spyOn(window, "prompt").mockImplementation(() => "");

    renderWithOperatorQuery(<AdvisoryScansContent initialRunId="run-finalized-1" />);

    const accept = await screen.findByRole("button", { name: "Accept" });

    fireEvent.click(accept);

    expect(promptSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("advisory-recommendation-disposition-dialog")).toBeInTheDocument();
    expect(screen.getByText(ADVISORY_SCANS_DISPOSITION_DIALOG_TITLE)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("advisory-recommendation-disposition-confirm"));

    await waitFor(() => {
      expect(applyRecommendationAction).toHaveBeenCalledWith("rec-1", "Accept", "", "");
    });

    promptSpy.mockRestore();
  });

  it("hides admin manual id entry for non-admin callers", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    fireEvent.click(screen.getByTestId("advisory-choose-review-cta"));
    fireEvent.click(screen.getByText("Can't find a review?"));

    expect(screen.queryByText("Technical details (admin)")).not.toBeInTheDocument();
  });
});

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

import { AdvisoryScansContent } from "@/components/advisory/AdvisoryScansContent";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";
import {
  ADVISORY_SCANS_DISPOSITION_DIALOG_TITLE,
  ADVISORY_SCANS_GENERATE_DISABLED_HINT,
  ADVISORY_SCANS_HOW_IT_WORKS_BODY,
  ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY,
  ADVISORY_SCANS_LAST_LOADED_PREFIX,
  ADVISORY_SCANS_LIST_HEADING,
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

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => null,
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
    vi.mocked(listRecommendations).mockResolvedValue({ recommendations: [sampleRecommendation()] });
  });

  it("shows the generate form and list header on first load without a choose-review gate", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    expect(screen.getByTestId("advisory-scans-list-header")).toBeInTheDocument();
    expect(screen.getByText(ADVISORY_SCANS_LIST_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId("advisory-scan-form")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-scans-pick-review-before-scanning-strip")).toBeInTheDocument();
    expect(screen.getByLabelText("Finalized review")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-scans-inline-boundary")).toHaveTextContent(
      ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY,
    );
    expect(screen.getByTestId("advisory-scans-empty-actions")).toBeInTheDocument();
    expect(screen.queryByTestId("advisory-choose-review-cta")).not.toBeInTheDocument();
    expect(screen.queryByText(ADVISORY_SCANS_SAMPLE_SECTION_TITLE)).not.toBeInTheDocument();
  });

  it("reveals sample preview with focus target and aria-expanded on first click", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    const trigger = screen.getByTestId("advisory-empty-view-sample-cta");

    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls");

    const region = screen.getByTestId("advisory-sample-preview-region");

    expect(region).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText(ADVISORY_SCANS_SAMPLE_SECTION_TITLE)).toBeInTheDocument();

    const dispositionDisclosure = screen.getByTestId("advisory-sample-disposition-disclosure");

    expect(dispositionDisclosure).not.toHaveAttribute("open");
    expect(screen.getByText(ADVISORY_SCANS_SAMPLE_DISPOSITION_SUMMARY)).toBeInTheDocument();
    expect(screen.getByTestId("advisory-sample-disposition-chips")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Accept|Defer|Reject|Mark implemented/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("advisory-scan-form")).toBeInTheDocument();
  });

  it("keeps generate disabled with aria-describedby until a review is selected", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    const generate = screen.getByTestId("advisory-generate-scan-button");

    expect(generate).toBeDisabled();
    expect(generate).toHaveAttribute("aria-describedby");
    expect(screen.getByTestId("advisory-generate-disabled-hint")).toHaveTextContent(
      ADVISORY_SCANS_GENERATE_DISABLED_HINT,
    );
    expect(generate).not.toHaveAttribute("title");

    fireEvent.change(screen.getByLabelText("Finalized review"), {
      target: { value: "run-finalized-1" },
    });

    expect(generate).not.toBeDisabled();
    expect(generate.className).toContain("al-primary-action-bg");
    expect(generate).not.toHaveAttribute("aria-describedby");
  });

  it("shows persistent scope metadata and refresh in the list header", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    expect(screen.getByTestId("advisory-scans-count")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-scans-last-loaded")).toHaveTextContent(
      ADVISORY_SCANS_LAST_LOADED_PREFIX,
    );
    expect(screen.getByTestId("advisory-scans-refresh")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-empty-open-reviews-link")).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
  });

  it("places one vocabulary rail and folded orientation below the form", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    const form = screen.getByTestId("advisory-scan-form");
    const rail = screen.getByTestId("advisory-results-schedules-vocabulary");
    const howItWorks = screen.getByTestId("advisory-scans-how-it-works");

    expect(screen.queryByTestId("digests-advisory-scans-vocabulary")).not.toBeInTheDocument();
    expect(form.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rail.compareDocumentPosition(howItWorks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(howItWorks).not.toHaveAttribute("open");
    expect(screen.getByText(ADVISORY_SCANS_HOW_IT_WORKS_BODY)).toBeInTheDocument();
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

    fireEvent.click(screen.getByText("Can't find a review?"));

    expect(screen.queryByText("Technical details (admin)")).not.toBeInTheDocument();
  });
});

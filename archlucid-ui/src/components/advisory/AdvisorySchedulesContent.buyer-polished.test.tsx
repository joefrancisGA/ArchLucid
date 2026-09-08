import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
  fullShell: false,
  evalChrome: true,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => demoEnvMock.evalChrome,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
    isOperatorExperienceFullShellEnv: () => demoEnvMock.fullShell,
  };
});

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

vi.mock("@/components/advisory/use-advisory-schedules-page", () => ({
  useAdvisorySchedulesPage: () => ({
    projectLabel: "claims-intake",
    listHeading: "Existing schedules",
    schedules: [],
    lastLoadedLabel: "2026-07-01T00:00:00Z",
    loading: false,
    refresh: vi.fn(),
    failure: null,
    statusMessage: null,
    canMutateSchedules: true,
    sampleModeBlocked: false,
    prerequisiteBlocksSchedules: false,
    showHeaderCreate: true,
    showCreateForm: true,
    showCreatePanel: false,
    setShowCreatePanel: vi.fn(),
    scopedRunFilterActive: false,
    scopedRunId: "",
    schedulesClearScopeHref: "/governance/advisory-scans?tab=schedules",
    onPickReview: vi.fn(),
    onCreate: vi.fn(),
  }),
}));

vi.mock("@/components/advisory/AdvisorySchedulesTable", () => ({
  AdvisorySchedulesTable: () => <div data-testid="advisory-schedules-table" />,
}));

vi.mock("@/components/advisory/AdvisoryScheduleCreateForm", () => ({
  AdvisoryScheduleCreateForm: () => <div data-testid="advisory-schedule-create-form" />,
}));

vi.mock("@/components/advisory/AdvisorySchedulesPickReviewBeforeSchedulingStrip", () => ({
  AdvisorySchedulesPickReviewBeforeSchedulingStrip: () => (
    <div data-testid="advisory-schedules-pick-review-before-scheduling-strip" />
  ),
}));

vi.mock("@/components/advisory/AdvisorySchedulesNextReviewFooterClient", () => ({
  AdvisorySchedulesNextReviewFooterClient: () => null,
}));

import { AdvisorySchedulesContent } from "@/components/advisory/AdvisorySchedulesContent";
import {
  ADVISORY_SCANS_SCHEDULES_BUYER_START_HERE_HELPER,
  ADVISORY_SCANS_SCHEDULES_INTRO,
} from "@/lib/advisory-copy";
import {
  ADVISORY_SCHEDULES_CLAIM_DISCIPLINE,
  ADVISORY_SCHEDULES_FOLLOW_UPS_TITLE,
  ADVISORY_SCHEDULES_ORIENTATION_SOURCES,
} from "@/lib/advisory-schedules-evidence-copy";

describe("AdvisorySchedulesContent buyer-polished shell (AD)", () => {
  it("renders first-viewport intro, hides operator chrome, and orients below schedule workspace", () => {
    render(<AdvisorySchedulesContent />);

    const content = screen.getByTestId("advisory-schedules-content");
    const firstViewport = screen.getByTestId("advisory-schedules-first-viewport");
    const existingSection = screen.getByTestId("advisory-schedules-existing");
    const orientationBottom = screen.getByTestId("advisory-schedules-orientation-bottom");
    const sourcesSection = screen.getByTestId("advisory-schedules-sources");

    expect(content).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(screen.getByTestId("advisory-schedules-intro"));
    expect(screen.getByTestId("advisory-schedules-intro")).toHaveTextContent(ADVISORY_SCANS_SCHEDULES_INTRO);
    expect(screen.getByTestId("advisory-schedules-buyer-start-here-helper")).toHaveTextContent(
      ADVISORY_SCANS_SCHEDULES_BUYER_START_HERE_HELPER,
    );
    expect(screen.queryByTestId("advisory-recurrence-schedule-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("advisory-schedules-create-action")).not.toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedules-claim-discipline")).toHaveTextContent(
      ADVISORY_SCHEDULES_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: ADVISORY_SCHEDULES_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    expect(content).toContainElement(existingSection);
    expect(content).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(existingSection.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(ADVISORY_SCHEDULES_ORIENTATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});

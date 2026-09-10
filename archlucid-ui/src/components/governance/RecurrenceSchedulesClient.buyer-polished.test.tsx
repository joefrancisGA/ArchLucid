import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let canMutate = true;

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => canMutate,
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "", displayTitle: "" }),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams({ runId: "22222222-2222-2222-2222-222222222222" }),
  };
});

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  createArchitectureReviewRecurrenceSchedule: vi.fn(),
  listArchitectureReviewRecurrenceSchedules: vi.fn(),
  updateArchitectureReviewRecurrenceSchedule: vi.fn(),
  previewRecurrenceScheduleRuns: vi.fn(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => null,
}));

import * as governanceApi from "@/lib/api/governance-stickiness-api";
import RecurrenceSchedulesClient from "@/components/governance/RecurrenceSchedulesClient";
import {
  RECURRENCE_SCHEDULES_BUYER_START_HERE_HELPER,
  RECURRENCE_SCHEDULES_PAGE_LEAD,
  RECURRENCE_SCHEDULES_PRIMARY_CONTENT_ID,
  RECURRENCE_SCHEDULES_SKIP_LINK_LABEL,
  RECURRENCE_SCHEDULES_SKIP_TARGET_ID,
} from "@/lib/recurrence-schedules-page-copy";
import {
  RECURRENCE_SCHEDULES_FOLLOW_UPS_TITLE,
  RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE,
} from "@/lib/recurrence-schedules-evidence-copy";
import {
  RECURRENCE_SCHEDULES_PAGE_SUBTITLE,
  RECURRENCE_SCHEDULES_PAGE_SUBTITLE_BUYER,
} from "@/lib/recurrence-schedules-copy";

describe("RecurrenceSchedulesClient buyer-polished shell (GRX)", () => {
  beforeEach(() => {
    canMutate = true;
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([]);
  });

  it("renders skip link, first-viewport intro, and orientation after schedule workspace", async () => {
    render(<RecurrenceSchedulesClient />);

    expect(screen.getByRole("link", { name: RECURRENCE_SCHEDULES_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${RECURRENCE_SCHEDULES_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(RECURRENCE_SCHEDULES_PRIMARY_CONTENT_ID)).toBeInTheDocument();
    expect(screen.getByTestId("governance-recurrence-schedules-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("governance-recurrence-schedules-intro")).toHaveTextContent(RECURRENCE_SCHEDULES_PAGE_LEAD);
    expect(screen.getByTestId("governance-recurrence-schedules-buyer-start-here-helper")).toHaveTextContent(
      RECURRENCE_SCHEDULES_BUYER_START_HERE_HELPER,
    );
    expect(screen.getByTestId("recurrence-schedules-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: RECURRENCE_SCHEDULES_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digest-recurrence-schedule-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("advisory-recurrence-schedule-vocabulary")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("recurrence-schedules-empty-state")).toBeInTheDocument();
    });

    const primary = screen.getByTestId(RECURRENCE_SCHEDULES_PRIMARY_CONTENT_ID);
    const emptyState = screen.getByTestId("recurrence-schedules-empty-state");
    const orientationBottom = screen.getByTestId("recurrence-schedules-orientation-bottom");

    expect(primary).toContainElement(emptyState);
    expect(primary).toContainElement(orientationBottom);
    expect(emptyState.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("uses buyer subtitle in the header without duplicate operator subtitle", () => {
    render(<RecurrenceSchedulesClient />);

    expect(screen.getByText(RECURRENCE_SCHEDULES_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(RECURRENCE_SCHEDULES_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedules-claim-discipline").textContent).toContain(
      RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE.slice(0, 40),
    );
  });
});

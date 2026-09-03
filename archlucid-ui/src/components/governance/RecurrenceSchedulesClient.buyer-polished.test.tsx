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

import * as governanceApi from "@/lib/api/governance-stickiness-api";
import RecurrenceSchedulesClient from "@/components/governance/RecurrenceSchedulesClient";
import {
  RECURRENCE_SCHEDULES_FIRST_VIEWPORT_ID,
  RECURRENCE_SCHEDULES_SKIP_LINK_LABEL,
  RECURRENCE_SCHEDULES_SKIP_TARGET_ID,
} from "@/lib/recurrence-schedules-page-copy";

describe("RecurrenceSchedulesClient buyer-polished shell", () => {
  beforeEach(() => {
    canMutate = true;
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([]);
  });

  it("exposes skip link, claim discipline, and sources orientation after schedule workspace", async () => {
    render(<RecurrenceSchedulesClient />);

    expect(screen.getByRole("link", { name: RECURRENCE_SCHEDULES_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${RECURRENCE_SCHEDULES_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(RECURRENCE_SCHEDULES_FIRST_VIEWPORT_ID)).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedules-claim-discipline")).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("recurrence-schedules-empty-state")).toBeInTheDocument();
    });

    const firstViewport = screen.getByTestId(RECURRENCE_SCHEDULES_FIRST_VIEWPORT_ID);
    const orientation = screen.getByTestId("recurrence-schedules-orientation");

    expect(
      firstViewport.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecurrenceSchedulesTable } from "@/components/governance/RecurrenceSchedulesTable";
import type { ArchitectureReviewRecurrenceSchedule } from "@/lib/api/governance-stickiness-api";
import { RECURRENCE_SCHEDULE_REVIEW_PACKAGE_LINK_LABEL } from "@/components/governance/recurrence-schedules-presentation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/recurrence-schedules",
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const noop = (): void => undefined;

const scheduleWithArchitecture: ArchitectureReviewRecurrenceSchedule = {
  scheduleId: "schedule-nested-001",
  sourceRunId: "run-nested-recurrence",
  architectureId: "architecture-recurrence-desk",
  name: "Monthly review",
  cronExpression: "0 9 1 * *",
  nextRunUtc: "2026-07-01T09:00:00.000Z",
  lastTriggeredUtc: null,
  isEnabled: true,
  lastRunStatus: null,
  consecutiveFailureCount: 0,
  lastErrorMessage: null,
};

describe("RecurrenceSchedulesTable review package link", () => {
  it("opens nested review when schedule stores architecture id", () => {
    render(
      <RecurrenceSchedulesTable
        schedules={[scheduleWithArchitecture]}
        displayTimeZoneId="UTC"
        editingId={null}
        editorState={null}
        busyId={null}
        canMutate={true}
        mutationDisabledReason={null}
        mutationDisabledHintId="recurrence-mutation-hint"
        onRememberSchedule={noop}
        onToggleEnabled={noop}
        onBeginEdit={noop}
        onCancelEdit={noop}
        onEditorNameChange={noop}
        onEditorCronExpressionChange={noop}
        onSavePaused={noop}
        onEnableRecurring={noop}
        onSaveChanges={noop}
      />,
    );

    expect(
      screen.getByRole("link", { name: RECURRENCE_SCHEDULE_REVIEW_PACKAGE_LINK_LABEL }),
    ).toHaveAttribute(
      "href",
      "/architecture/architectures/architecture-recurrence-desk/reviews/run-nested-recurrence",
    );
  });
});

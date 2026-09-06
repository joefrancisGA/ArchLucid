import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecurrenceSchedulePostCommitCard } from "@/components/governance/RecurrenceSchedulePostCommitCard";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import {
  hasDeclinedRecurrenceProposal,
  recordRecurrenceProposalDecline,
} from "@/lib/governance/recurrence-proposal-decline";
import {
  RECURRENCE_AI_BUDGET_DISCLOSURE,
  RECURRENCE_COMPLETION_RECIPIENTS_DISCLOSURE,
  RECURRENCE_DECLINED_STATUS,
  RECURRENCE_PROPOSAL_LEAD,
} from "@/lib/recurrence-schedule-activation-copy";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  createArchitectureReviewRecurrenceSchedule: vi.fn(),
  listArchitectureReviewRecurrenceSchedules: vi.fn(),
  previewRecurrenceScheduleRuns: vi.fn(),
}));

describe("RecurrenceSchedulePostCommitCard", () => {
  const runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([]);
    vi.mocked(governanceApi.previewRecurrenceScheduleRuns).mockResolvedValue({
      isValid: true,
      nextRunUtc: ["2026-06-09T08:00:00Z"],
    });
    vi.mocked(governanceApi.createArchitectureReviewRecurrenceSchedule).mockResolvedValue({
      scheduleId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      sourceRunId: runId,
      name: "Weekly architecture review",
      cronExpression: "0 8 * * 1",
      isEnabled: true,
      nextRunUtc: "2026-06-09T08:00:00Z",
    });
  });

  it("creates an inactive schedule when saving paused", async () => {
    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    fireEvent.change(screen.getByTestId("recurrence-schedule-name"), {
      target: { value: "Monday review" },
    });
    fireEvent.click(screen.getByTestId("recurrence-save-paused"));

    await waitFor(() => {
      expect(governanceApi.createArchitectureReviewRecurrenceSchedule).toHaveBeenCalledWith({
        sourceRunId: runId,
        name: "Monday review",
        cronExpression: "0 8 * * 1",
        isEnabled: false,
      });
    });

    expect(await screen.findByText("Recurrence schedule saved (paused).")).toBeInTheDocument();
  });

  it("creates an active schedule when enabling recurring assessments", async () => {
    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    fireEvent.change(screen.getByTestId("cron-expression-input"), {
      target: { value: "0 9 * * 2" },
    });
    fireEvent.click(screen.getByTestId("recurrence-enable-recurring"));

    await waitFor(() => {
      expect(governanceApi.createArchitectureReviewRecurrenceSchedule).toHaveBeenCalledWith({
        sourceRunId: runId,
        name: "Weekly architecture review",
        cronExpression: "0 9 * * 2",
        isEnabled: true,
      });
    });

    expect(await screen.findByText("Recurring assessments enabled.")).toBeInTheDocument();
  });

  it("shows AI-budget disclosure before the enable action", async () => {
    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    expect(await screen.findByTestId("recurrence-ai-budget-disclosure")).toHaveTextContent(
      RECURRENCE_AI_BUDGET_DISCLOSURE,
    );
    expect(screen.getByTestId("recurrence-enable-recurring")).toBeInTheDocument();
    expect(screen.queryByTestId("recurrence-schedule-enabled")).not.toBeInTheDocument();
  });

  it("shows error when create fails", async () => {
    vi.mocked(governanceApi.createArchitectureReviewRecurrenceSchedule).mockRejectedValue(new Error("API down"));

    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);
    fireEvent.click(screen.getByTestId("recurrence-enable-recurring"));

    expect(await screen.findByText("API down")).toBeInTheDocument();
  });

  it("links to the management page when a schedule already exists", async () => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([
      {
        scheduleId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        sourceRunId: runId,
        name: "Weekly architecture review",
        cronExpression: "0 8 * * 1",
        isEnabled: true,
        nextRunUtc: "2026-06-09T08:00:00Z",
      },
    ]);

    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    expect(await screen.findByTestId("recurrence-schedule-manage-link")).toHaveAttribute(
      "href",
      "/governance/recurrence-schedules",
    );
  });

  it("proposes a concrete cadence with the pre-filled default after commit (TB-2192)", async () => {
    render(
      <RecurrenceSchedulePostCommitCard
        runId={runId}
        architectureId="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
        architectureDisplayName="Payments platform"
        hasStickinessPrompt
      />,
    );

    expect(await screen.findByTestId("recurrence-architecture-scope-lead")).toHaveTextContent("Payments platform");
    expect(await screen.findByTestId("recurrence-proposal-lead")).toHaveTextContent(RECURRENCE_PROPOSAL_LEAD);
    expect(screen.getByTestId("recurrence-schedule-name")).toHaveValue("Weekly architecture review");
    expect(screen.getByTestId("cron-expression-input")).toHaveValue("0 8 * * 1");
  });

  it("lists schedules for the same architecture identity, not only the source review (CA-45)", async () => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([
      {
        scheduleId: "11111111-1111-1111-1111-111111111111",
        sourceRunId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        architectureId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        name: "Earlier weekly review",
        cronExpression: "0 8 * * 1",
        isEnabled: true,
        nextRunUtc: "2026-06-09T08:00:00Z",
      },
      {
        scheduleId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        sourceRunId: runId,
        architectureId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        name: "Weekly architecture review",
        cronExpression: "0 8 * * 1",
        isEnabled: true,
        nextRunUtc: "2026-06-09T08:00:00Z",
      },
    ]);

    render(
      <RecurrenceSchedulePostCommitCard
        runId={runId}
        architectureId="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
        hasStickinessPrompt
      />,
    );

    expect(await screen.findByTestId("recurrence-schedule-manage-link")).toBeInTheDocument();
    expect(screen.getByText("Earlier weekly review — 0 8 * * 1")).toBeInTheDocument();
  });

  it("discloses who receives completion email before enabling (TB-2192)", async () => {
    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    expect(await screen.findByTestId("recurrence-completion-recipients-disclosure")).toHaveTextContent(
      RECURRENCE_COMPLETION_RECIPIENTS_DISCLOSURE,
    );
  });

  it("records a decline without creating any schedule (TB-2192)", async () => {
    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    fireEvent.click(await screen.findByTestId("recurrence-decline-proposal"));

    expect(await screen.findByTestId("recurrence-proposal-declined")).toHaveTextContent(
      RECURRENCE_DECLINED_STATUS,
    );
    expect(governanceApi.createArchitectureReviewRecurrenceSchedule).not.toHaveBeenCalled();
    expect(hasDeclinedRecurrenceProposal(runId)).toBe(true);
  });

  it("stops proposing on a later visit once declined, and stays reopenable (TB-2192)", async () => {
    recordRecurrenceProposalDecline(runId);

    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    await waitFor(() => {
      expect(screen.queryByTestId("recurrence-schedule-name")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Show"));

    expect(await screen.findByTestId("recurrence-proposal-declined")).toBeInTheDocument();
  });

  it("restores the proposal when the operator reconsiders (TB-2192)", async () => {
    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    fireEvent.click(await screen.findByTestId("recurrence-decline-proposal"));
    fireEvent.click(await screen.findByTestId("recurrence-reconsider-proposal"));

    expect(await screen.findByTestId("recurrence-schedule-name")).toBeInTheDocument();
    expect(hasDeclinedRecurrenceProposal(runId)).toBe(false);
  });
});

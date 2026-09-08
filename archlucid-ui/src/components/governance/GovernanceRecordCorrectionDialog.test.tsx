import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GovernanceRecordCorrectionDialog } from "@/components/governance/GovernanceRecordCorrectionDialog";

const recordGovernanceMutationCorrectionWith401Resume = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/findings",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-resume-pending-livelihood-mutation", () => ({
  useResumePendingLivelihoodMutation: () => undefined,
}));

vi.mock("@/lib/governance/governance-mutation-correction-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/governance/governance-mutation-correction-api")>();

  return {
    ...actual,
    recordGovernanceMutationCorrectionWith401Resume: (...args: unknown[]) =>
      recordGovernanceMutationCorrectionWith401Resume(...args),
  };
});

describe("GovernanceRecordCorrectionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records a second audit event without implying the original was deleted", async () => {
    recordGovernanceMutationCorrectionWith401Resume.mockResolvedValue({
      correctionId: "corr-1",
      mutationKind: "governance_quick_approve",
      subjectId: "apr-1",
      runId: "run-1",
      rationale: "Wrong package approved.",
      recordedAtUtc: "2026-09-03T00:00:00Z",
      recordedByUserId: "operator-1",
    });

    const onRecorded = vi.fn();

    render(
      <GovernanceRecordCorrectionDialog
        open
        onOpenChange={vi.fn()}
        target={{
          mutationKind: "governance_quick_approve",
          subjectId: "apr-1",
          runId: "run-1",
        }}
        onRecorded={onRecorded}
      />,
    );

    fireEvent.change(screen.getByTestId("governance-record-correction-rationale"), {
      target: { value: "Wrong package approved." },
    });
    fireEvent.click(screen.getByTestId("governance-record-correction-confirm"));

    await waitFor(() => {
      expect(recordGovernanceMutationCorrectionWith401Resume).toHaveBeenCalledWith(
        {
          mutationKind: "governance_quick_approve",
          subjectId: "apr-1",
          runId: "run-1",
          rationale: "Wrong package approved.",
        },
        expect.objectContaining({
          returnPath: "/governance/findings",
          idempotencyKey: expect.any(String),
        }),
      );
    });

    expect(onRecorded).toHaveBeenCalledTimes(1);
  });
});

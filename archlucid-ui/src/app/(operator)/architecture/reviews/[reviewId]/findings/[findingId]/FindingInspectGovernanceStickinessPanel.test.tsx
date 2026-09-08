import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import type { FindingDispositionEvent } from "@/lib/api/governance-stickiness-api";
import { formatDispositionConcurrentUpdateMessage } from "@/lib/findings/finding-disposition-concurrent-update";
import { DISPOSITION_RATIONALE_REQUIRED_MESSAGE } from "@/lib/review-quality/finding-governance-gates";
import { FindingInspectGovernanceStickinessPanel } from "./FindingInspectGovernanceStickinessPanel";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

const listFindingDispositions = vi.fn(async () => [] as FindingDispositionEvent[]);
const recordFindingDisposition = vi.fn();
const listRiskExceptions = vi.fn(async () => []);
const revokeRiskException = vi.fn();

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  listFindingDispositions: (...args: unknown[]) => listFindingDispositions(...args),
  listRiskExceptions: (...args: unknown[]) => listRiskExceptions(...args),
  createRiskException: vi.fn(),
  recordFindingDisposition: (...args: unknown[]) => recordFindingDisposition(...args),
  recordFindingDispositionWith401Resume: (...args: unknown[]) => recordFindingDisposition(...args),
  revokeRiskException: (...args: unknown[]) => revokeRiskException(...args),
  defaultRiskExceptionExpiresAtUtc: () => "2099-01-01T00:00:00.000Z",
}));

vi.mock("@/lib/api/finding-remediation-assignment-api", () => ({
  upsertFindingRemediationAssignment: vi.fn(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

describe("FindingInspectGovernanceStickinessPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listFindingDispositions.mockResolvedValue([]);
    listRiskExceptions.mockResolvedValue([]);
  });

  it("shows concurrent-update copy when another disposition wins after save (TB-987)", async () => {
    const saved: FindingDispositionEvent = {
      eventId: "evt-saved",
      findingId: "sensitive-data-minimization-risk",
      disposition: "Accepted",
      reviewerUserId: "reviewer-1",
      occurredAtUtc: "2026-08-10T11:00:00.000Z",
    };
    const winner: FindingDispositionEvent = {
      eventId: "evt-winner",
      findingId: "sensitive-data-minimization-risk",
      disposition: "RejectedAsNotApplicable",
      reviewerUserId: "reviewer-2",
      occurredAtUtc: "2026-08-10T12:00:00.000Z",
    };

    recordFindingDisposition.mockResolvedValueOnce(saved);
    listFindingDispositions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([winner, saved]);

    render(
      <FindingInspectGovernanceStickinessPanel
        findingId="sensitive-data-minimization-risk"
        runId="customer-intake-modernization"
      />,
    );

    fireEvent.change(screen.getByLabelText(DISPOSITION_RATIONALE_REQUIRED_MESSAGE, { exact: false }), {
      target: { value: "Accepted residual latency risk for pilot window." },
    });
    fireEvent.change(screen.getByTestId("finding-disposition-trade-off-ack"), {
      target: { value: "Accepted residual latency risk for pilot window." },
    });
    fireEvent.click(screen.getByTestId("finding-disposition-save"));
    fireEvent.click(screen.getByRole("button", { name: "Record disposition" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(formatDispositionConcurrentUpdateMessage(winner));
    });
  });

  it("uses one primary save action per subsection", () => {
    render(
      <FindingInspectGovernanceStickinessPanel
        findingId="sensitive-data-minimization-risk"
        runId="customer-intake-modernization"
      />,
    );

    const remediationSave = screen.getByTestId("finding-remediation-save");
    const dispositionSave = screen.getByTestId("finding-disposition-save");
    const markRemediated = screen.getByTestId("finding-mark-remediated");

    expect(remediationSave).toBeEnabled();
    expect(dispositionSave).toBeEnabled();
    expect(markRemediated.className).not.toContain("bg-teal");
    expect(screen.getByLabelText(/Remediation owner/i)).toBeTruthy();
  });

  it("shows export impact before confirming a disposition (TB-2184)", () => {
    render(
      <FindingInspectGovernanceStickinessPanel
        findingId="sensitive-data-minimization-risk"
        runId="customer-intake-modernization"
      />,
    );

    fireEvent.click(screen.getByTestId("finding-disposition-save"));

    expect(screen.getByTestId("disposition-export-impact-notice-Accepted")).toBeInTheDocument();
    expect(screen.getByTestId("disposition-export-before-after")).toBeInTheDocument();
    expect(screen.getByTestId("disposition-export-impact-signed_review_record")).toBeInTheDocument();
    expect(screen.getByTestId("disposition-export-impact-sponsor_packet")).toBeInTheDocument();
  });

  it("requires confirmation before revoking an active waiver", async () => {
    listRiskExceptions.mockResolvedValue([
      {
        riskExceptionId: "waiver-1",
        findingId: "sensitive-data-minimization-risk",
        status: "Active",
        ownerUserId: "owner-1",
        rationale: "Temporary exception",
        expiresAtUtc: "2099-01-01T00:00:00.000Z",
      },
    ]);

    render(
      <FindingInspectGovernanceStickinessPanel
        findingId="sensitive-data-minimization-risk"
        runId="customer-intake-modernization"
      />,
    );

    fireEvent.click(await screen.findByTestId("finding-waiver-revoke"));

    expect(screen.getByRole("heading", { name: /Revoke risk exception/i })).toBeInTheDocument();
    expect(revokeRiskException).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Revoke waiver" }));

    await waitFor(() => {
      expect(revokeRiskException).toHaveBeenCalledWith("waiver-1");
    });
  });
});

function historyEvent(
  overrides: Partial<FindingDispositionEvent> = {},
): FindingDispositionEvent {
  return {
    eventId: "evt-history",
    findingId: "sensitive-data-minimization-risk",
    disposition: "Accepted",
    reviewerUserId: "reviewer-1",
    occurredAtUtc: "2026-09-08T10:00:00.000Z",
    currentDispositionRowVersionBase64: "AQID",
    ...overrides,
  };
}

async function waitForCurrentDisposition(label: string): Promise<void> {
  await waitFor(() => {
    expect(screen.getByText(/Current state:/i).textContent).toContain(label);
  });
}

async function fillAcceptedDispositionAndConfirm(): Promise<void> {
  fireEvent.change(screen.getByLabelText(DISPOSITION_RATIONALE_REQUIRED_MESSAGE, { exact: false }), {
    target: { value: "Accepted residual latency risk for pilot window." },
  });
  fireEvent.change(screen.getByTestId("finding-disposition-trade-off-ack"), {
    target: { value: "Accepted residual latency risk for pilot window." },
  });
  fireEvent.click(screen.getByTestId("finding-disposition-save"));
  fireEvent.click(screen.getByRole("button", { name: "Record disposition" }));
}

describe("FindingInspectGovernanceStickinessPanel pointer CAS (FP-08/FP-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listFindingDispositions.mockResolvedValue([]);
    listRiskExceptions.mockResolvedValue([]);
  });

  it("sends expectedCurrentDispositionRowVersionBase64 from history on inspect save", async () => {
    listFindingDispositions.mockResolvedValue([historyEvent()]);
    recordFindingDisposition.mockResolvedValue(historyEvent({ eventId: "evt-saved" }));

    render(
      <FindingInspectGovernanceStickinessPanel
        findingId="sensitive-data-minimization-risk"
        runId="customer-intake-modernization"
      />,
    );

    await waitForCurrentDisposition("Accepted");
    await fillAcceptedDispositionAndConfirm();

    await waitFor(() => {
      expect(recordFindingDisposition).toHaveBeenCalledWith(
        "sensitive-data-minimization-risk",
        expect.objectContaining({
          expectedCurrentDispositionRowVersionBase64: "AQID",
        }),
        expect.any(Object),
      );
    });
  });

  it("omits expectedCurrentDispositionRowVersionBase64 on first disposition", async () => {
    listFindingDispositions.mockResolvedValue([]);
    recordFindingDisposition.mockResolvedValue(historyEvent({ eventId: "evt-first" }));

    await waitForCurrentDisposition("No disposition recorded");
    await fillAcceptedDispositionAndConfirm();

    const body = recordFindingDisposition.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(body.expectedCurrentDispositionRowVersionBase64).toBeUndefined();
  });

  it("sends the same token on mark as remediated", async () => {
    listFindingDispositions.mockResolvedValue([historyEvent()]);
    recordFindingDisposition.mockResolvedValue(
      historyEvent({ eventId: "evt-remediated", disposition: "Remediated" }),
    );

    render(
      <FindingInspectGovernanceStickinessPanel
        findingId="sensitive-data-minimization-risk"
        runId="customer-intake-modernization"
      />,
    );

    await waitForCurrentDisposition("Accepted");
    fireEvent.change(screen.getByLabelText(DISPOSITION_RATIONALE_REQUIRED_MESSAGE, { exact: false }), {
      target: { value: "Remediated after the change was applied in production." },
    });
    fireEvent.click(screen.getByTestId("finding-mark-remediated"));
    fireEvent.click(screen.getByRole("button", { name: "Record disposition" }));

    await waitFor(() => {
      expect(recordFindingDisposition).toHaveBeenCalledWith(
        "sensitive-data-minimization-risk",
        expect.objectContaining({
          disposition: "Remediated",
          expectedCurrentDispositionRowVersionBase64: "AQID",
        }),
        expect.any(Object),
      );
    });
  });

  it("shows the conflict panel on 409 and retries with the winner version", async () => {
    listFindingDispositions.mockResolvedValue([historyEvent()]);
    recordFindingDisposition
      .mockRejectedValueOnce(
        new ApiRequestError("Conflict", {
          httpStatus: 409,
          correlationId: null,
          problem: {
            type: "conflict",
            title: "Conflict",
            status: 409,
            detail: "lost race",
            currentDisposition: {
              eventId: "evt-winner",
              findingId: "sensitive-data-minimization-risk",
              disposition: "Remediated",
              reviewerUserId: "reviewer-2",
              occurredAtUtc: "2026-09-08T12:00:00.000Z",
              currentDispositionRowVersionBase64: "WIN=",
            },
          },
        }),
      )
      .mockResolvedValueOnce(historyEvent({ eventId: "evt-retry", currentDispositionRowVersionBase64: "CCC=" }));

    render(
      <FindingInspectGovernanceStickinessPanel
        findingId="sensitive-data-minimization-risk"
        runId="customer-intake-modernization"
      />,
    );

    await waitForCurrentDisposition("Accepted");
    await fillAcceptedDispositionAndConfirm();

    expect(await screen.findByTestId("finding-inspect-disposition-conflict")).toBeInTheDocument();
    expect(screen.getByTestId("finding-disposition-trade-off-ack")).toHaveValue(
      "Accepted residual latency risk for pilot window.",
    );

    fireEvent.click(screen.getByTestId("finding-disposition-save"));
    fireEvent.click(screen.getByRole("button", { name: "Record disposition" }));

    await waitFor(() => {
      expect(recordFindingDisposition).toHaveBeenCalledTimes(2);
    });

    expect(recordFindingDisposition.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        expectedCurrentDispositionRowVersionBase64: "WIN=",
      }),
    );
  });
});

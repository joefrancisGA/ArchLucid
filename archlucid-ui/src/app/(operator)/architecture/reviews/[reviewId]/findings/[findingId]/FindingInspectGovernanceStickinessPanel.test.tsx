import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FindingDispositionEvent } from "@/lib/api/governance-stickiness-api";
import { formatDispositionConcurrentUpdateMessage } from "@/lib/findings/finding-disposition-concurrent-update";
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
    isBuyerPolishedOperatorShellEnv: () => true,
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
      findingId: "phi-minimization-risk",
      disposition: "Accepted",
      reviewerUserId: "reviewer-1",
      occurredAtUtc: "2026-08-10T11:00:00.000Z",
    };
    const winner: FindingDispositionEvent = {
      eventId: "evt-winner",
      findingId: "phi-minimization-risk",
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
        findingId="phi-minimization-risk"
        runId="claims-intake-modernization"
      />,
    );

    fireEvent.click(screen.getByTestId("finding-disposition-save"));
    fireEvent.click(screen.getByRole("button", { name: "Record disposition" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(formatDispositionConcurrentUpdateMessage(winner));
    });
  });

  it("uses one primary save action per subsection", () => {
    render(
      <FindingInspectGovernanceStickinessPanel
        findingId="phi-minimization-risk"
        runId="claims-intake-modernization"
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
        findingId="phi-minimization-risk"
        runId="claims-intake-modernization"
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
        findingId: "phi-minimization-risk",
        status: "Active",
        ownerUserId: "owner-1",
        rationale: "Temporary exception",
        expiresAtUtc: "2099-01-01T00:00:00.000Z",
      },
    ]);

    render(
      <FindingInspectGovernanceStickinessPanel
        findingId="phi-minimization-risk"
        runId="claims-intake-modernization"
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

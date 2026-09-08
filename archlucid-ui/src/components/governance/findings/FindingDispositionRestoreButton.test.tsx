import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import {
  recordFindingDispositionRestoreSnapshot,
  clearFindingDispositionRestoreSnapshot,
  readFindingDispositionRestoreSnapshot,
} from "@/lib/findings/finding-disposition-restore-snapshot";

const listFindingDispositions = vi.fn();
const recordFindingDisposition = vi.fn();

vi.mock("@/lib/api/governance-stickiness-api-dispositions", () => ({
  listFindingDispositions: (...args: unknown[]) => listFindingDispositions(...args),
  recordFindingDisposition: (...args: unknown[]) => recordFindingDisposition(...args),
}));

import { FindingDispositionRestoreButton } from "@/components/governance/findings/FindingDispositionRestoreButton";

describe("FindingDispositionRestoreButton (FP-11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    recordFindingDispositionRestoreSnapshot({
      findingId: "finding-1",
      previousDisposition: "Deferred",
      appliedDisposition: "Accepted",
      appliedAtUtc: "2026-09-08T10:00:00.000Z",
      revisitDueUtc: "2099-01-01T00:00:00.000Z",
    });
  });

  it("sends expectedCurrentDispositionRowVersionBase64 from history", async () => {
    listFindingDispositions.mockResolvedValue([{ currentDispositionRowVersionBase64: "AQID" }]);
    recordFindingDisposition.mockResolvedValue({ eventId: "evt-restore" });

    render(<FindingDispositionRestoreButton findingId="finding-1" runId="run-1" />);

    fireEvent.click(screen.getByTestId("finding-disposition-restore-finding-1"));

    await waitFor(() => {
      expect(recordFindingDisposition).toHaveBeenCalledWith(
        "finding-1",
        expect.objectContaining({
          disposition: "Deferred",
          expectedCurrentDispositionRowVersionBase64: "AQID",
        }),
        expect.any(Object),
      );
    });

    expect(readFindingDispositionRestoreSnapshot("finding-1")).toBeNull();
  });

  it("does not clear the restore snapshot on 409", async () => {
    listFindingDispositions.mockResolvedValue([{ currentDispositionRowVersionBase64: "AQID" }]);
    recordFindingDisposition.mockRejectedValue(
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
            findingId: "finding-1",
            disposition: "Remediated",
            reviewerUserId: "bob",
            occurredAtUtc: "2026-09-08T12:00:00.000Z",
            currentDispositionRowVersionBase64: "WIN=",
          },
        },
      }),
    );

    render(<FindingDispositionRestoreButton findingId="finding-1" runId="run-1" />);

    fireEvent.click(screen.getByTestId("finding-disposition-restore-finding-1"));

    expect(await screen.findByTestId("finding-disposition-restore-conflict-finding-1")).toBeInTheDocument();
    expect(readFindingDispositionRestoreSnapshot("finding-1")).not.toBeNull();
    expect(screen.getByTestId("finding-disposition-restore-finding-1")).toBeEnabled();
    clearFindingDispositionRestoreSnapshot("finding-1");
  });
});

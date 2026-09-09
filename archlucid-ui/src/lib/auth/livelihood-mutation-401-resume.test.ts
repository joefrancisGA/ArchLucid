import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import {
  clearLivelihoodPendingMutation,
  consumeLivelihoodPendingMutationForReturnPath,
  executeIdempotentLivelihoodMutation,
  isLivelihoodMutation401RedirectError,
  LivelihoodMutation401RedirectError,
  readLivelihoodPendingMutation,
  writeLivelihoodPendingMutation,
} from "@/lib/auth/livelihood-mutation-401-resume";
import { replayLivelihoodPendingMutation } from "@/lib/auth/livelihood-mutation-401-resume-replay";

const persistIdleDeskRestoreBeforeSessionClear = vi.fn();

vi.mock("@/lib/auth/idle-desk-restore", () => ({
  persistIdleDeskRestoreBeforeSessionClear: (...args: unknown[]) =>
    persistIdleDeskRestoreBeforeSessionClear(...args),
}));

const recordFindingDisposition = vi.fn();
const recordGovernanceMutationCorrection = vi.fn();

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  recordFindingDisposition: (...args: unknown[]) => recordFindingDisposition(...args),
}));

vi.mock("@/lib/governance/governance-mutation-correction-api", () => ({
  recordGovernanceMutationCorrection: (...args: unknown[]) => recordGovernanceMutationCorrection(...args),
}));

describe("livelihood-mutation-401-resume (LP-19)", () => {
  const assignMock = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    persistIdleDeskRestoreBeforeSessionClear.mockReset();
    recordFindingDisposition.mockReset();
    recordGovernanceMutationCorrection.mockReset();
    assignMock.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: assignMock },
    });
  });

  it("persists pending mutation and redirects on 401 with the same idempotency key", async () => {
    const idempotencyKey = "11111111-1111-4111-8111-111111111111";
    const execute = vi.fn().mockRejectedValue(
      new ApiRequestError("Unauthorized", {
        problem: null,
        correlationId: null,
        httpStatus: 401,
      }),
    );

    await expect(
      executeIdempotentLivelihoodMutation({
        kind: "finding_disposition",
        returnPath: "/architecture/reviews/run-1/findings/f-1",
        idempotencyKey,
        payload: {
          findingId: "f-1",
          body: {
            disposition: "Accepted",
            runId: "run-1",
            rationale: "Ship with monitoring",
          },
        },
        execute,
      }),
    ).rejects.toBeInstanceOf(LivelihoodMutation401RedirectError);

    expect(persistIdleDeskRestoreBeforeSessionClear).toHaveBeenCalledWith(
      "/architecture/reviews/run-1/findings/f-1",
    );
    expect(readLivelihoodPendingMutation()?.idempotencyKey).toBe(idempotencyKey);
    expect(assignMock).toHaveBeenCalledWith(
      "/auth/session-expired?reason=idle-timeout&returnUrl=%2Farchitecture%2Freviews%2Frun-1%2Ffindings%2Ff-1",
    );
    expect(isLivelihoodMutation401RedirectError(new LivelihoodMutation401RedirectError())).toBe(true);
  });

  it("replays a stored disposition once with the same idempotency key and row version", async () => {
    const idempotencyKey = "22222222-2222-4222-8222-222222222222";
    const rowVersion = "abc123==";

    writeLivelihoodPendingMutation({
      kind: "finding_disposition",
      idempotencyKey,
      returnPath: "/architecture/reviews/run-2/findings/f-2",
      savedAtUtc: "2026-09-08T12:00:00.000Z",
      requestLeftClient: true,
      payload: {
        findingId: "f-2",
        body: {
          disposition: "Accepted",
          runId: "run-2",
          expectedCurrentDispositionRowVersionBase64: rowVersion,
        },
      },
    });

    recordFindingDisposition.mockResolvedValue({ eventId: "evt-1", disposition: "Accepted" });

    const pending = consumeLivelihoodPendingMutationForReturnPath(
      "/architecture/reviews/run-2/findings/f-2",
    );

    expect(pending).not.toBeNull();

    await replayLivelihoodPendingMutation(pending!);

    expect(recordFindingDisposition).toHaveBeenCalledTimes(1);
    expect(recordFindingDisposition).toHaveBeenCalledWith(
      "f-2",
      {
        disposition: "Accepted",
        runId: "run-2",
        expectedCurrentDispositionRowVersionBase64: rowVersion,
      },
      { idempotencyKey },
    );
    expect(readLivelihoodPendingMutation()).toBeNull();
  });

  it("does not consume pending mutation when return path differs", () => {
    writeLivelihoodPendingMutation({
      kind: "governance_mutation_correction",
      idempotencyKey: "33333333-3333-4333-8333-333333333333",
      returnPath: "/governance/findings",
      savedAtUtc: "2026-09-08T12:00:00.000Z",
      requestLeftClient: true,
      payload: {
        body: {
          mutationKind: "governance_keyboard_finding_disposition",
          subjectId: "f-3",
          runId: "run-3",
          rationale: "Correct the keyboard triage label",
        },
      },
    });

    expect(consumeLivelihoodPendingMutationForReturnPath("/architecture/reviews/run-3")).toBeNull();
    expect(readLivelihoodPendingMutation()).not.toBeNull();
    clearLivelihoodPendingMutation();
  });
});

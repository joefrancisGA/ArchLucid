import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import { LIVELIHOOD_PENDING_MUTATION_KINDS } from "@/lib/auth/livelihood-mutation-401-resume-kinds";
import {
  clearLivelihoodPendingMutation,
  consumeLivelihoodPendingMutationForReturnPath,
  executeIdempotentLivelihoodMutation,
  isLivelihoodMutation401RedirectError,
  LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY,
  LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY_V1,
  LivelihoodMutation401RedirectError,
  migrateLivelihoodPendingMutationV1ToV2,
  readLivelihoodPendingMutation,
  withLivelihood401Resume,
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

describe("livelihood-mutation-401-resume (LP-19 / LW-051)", () => {
  const assignMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
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

  it("persists pending mutation in localStorage and redirects on 401 with the same idempotency key", async () => {
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
    expect(localStorage.getItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY)).not.toBeNull();
    expect(readLivelihoodPendingMutation()?.idempotencyKey).toBe(idempotencyKey);
    expect(sessionStorage.getItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY_V1)).toBeNull();
    expect(assignMock).toHaveBeenCalledWith(
      "/auth/session-expired?reason=idle-timeout&returnUrl=%2Farchitecture%2Freviews%2Frun-1%2Ffindings%2Ff-1",
    );
    expect(isLivelihoodMutation401RedirectError(new LivelihoodMutation401RedirectError())).toBe(true);
  });

  it("migrates sessionStorage v1 into localStorage v2 once", () => {
    const idempotencyKey = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const payload = {
      kind: "finding_disposition" as const,
      idempotencyKey,
      returnPath: "/architecture/reviews/run-m/findings/f-m",
      savedAtUtc: "2026-09-10T12:00:00.000Z",
      requestLeftClient: true,
      payload: {
        findingId: "f-m",
        body: {
          disposition: "Accepted" as const,
          runId: "run-m",
        },
      },
    };

    sessionStorage.setItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY_V1, JSON.stringify(payload));

    migrateLivelihoodPendingMutationV1ToV2();

    expect(localStorage.getItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY)).not.toBeNull();
    expect(readLivelihoodPendingMutation()?.idempotencyKey).toBe(idempotencyKey);
    expect(sessionStorage.getItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY_V1)).toBeNull();
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

  it("persists architecture_draft_patch with expectedUpdatedUtc on 401 (LW-055)", async () => {
    const expectedUpdatedUtc = "2026-09-10T15:00:00.000Z";
    const execute = vi.fn().mockRejectedValue(
      new ApiRequestError("Unauthorized", {
        problem: null,
        correlationId: null,
        httpStatus: 401,
      }),
    );

    await expect(
      withLivelihood401Resume({
        kind: "architecture_draft_patch",
        returnPath: "/architecture/drafts/draft-55",
        idempotencyKey: "55555555-5555-4555-8555-555555555555",
        payload: {
          draftId: "draft-55",
          body: {
            freeTextIntent: "Resume after sign-in",
            expectedUpdatedUtc,
          },
        },
        execute,
      }),
    ).rejects.toBeInstanceOf(LivelihoodMutation401RedirectError);

    const pending = readLivelihoodPendingMutation();

    expect(pending?.kind).toBe("architecture_draft_patch");
    expect(pending?.payload).toMatchObject({
      draftId: "draft-55",
      body: {
        freeTextIntent: "Resume after sign-in",
        expectedUpdatedUtc,
      },
    });
  });

  it("replay switch covers every livelihood pending mutation kind (LW-054)", () => {
    const replaySource = readFileSync(
      join(process.cwd(), "src/lib/auth/livelihood-mutation-401-resume-replay.ts"),
      "utf8",
    );

    for (const kind of LIVELIHOOD_PENDING_MUTATION_KINDS) {
      expect(replaySource).toContain(`case "${kind}"`);
    }
  });

  it("withLivelihood401Resume delegates to executeIdempotentLivelihoodMutation", async () => {
    const execute = vi.fn().mockResolvedValue({ ok: true });

    const result = await withLivelihood401Resume({
      kind: "governance_mutation_correction",
      returnPath: "/governance/findings",
      idempotencyKey: "44444444-4444-4444-8444-444444444444",
      payload: {
        body: {
          mutationKind: "governance_keyboard_finding_disposition",
          subjectId: "f-4",
          runId: "run-4",
          rationale: "Replay once",
        },
      },
      execute,
    });

    expect(result).toEqual({ ok: true });
    expect(execute).toHaveBeenCalledTimes(1);
  });
});

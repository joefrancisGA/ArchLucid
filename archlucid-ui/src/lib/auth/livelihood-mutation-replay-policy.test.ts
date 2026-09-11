import { describe, expect, it } from "vitest";

import type { LivelihoodPendingMutation } from "@/lib/auth/livelihood-mutation-401-resume-kinds";
import {
  livelihoodReplayUsesStoredIdempotencyKey,
  requiresConfirmBeforeLivelihoodReplay,
} from "@/lib/auth/livelihood-mutation-replay-policy";

function buildPending(
  overrides: Partial<LivelihoodPendingMutation> & Pick<LivelihoodPendingMutation, "kind" | "payload">,
): LivelihoodPendingMutation {
  return {
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
    returnPath: "/architecture/reviews/run-1/findings/f-1",
    savedAtUtc: "2026-09-10T12:00:00.000Z",
    requestLeftClient: true,
    ...overrides,
  };
}

describe("livelihood-mutation-replay-policy (LW-063 / LW-065)", () => {
  it("marks idempotent replay kinds as using the stored idempotency key", () => {
    expect(livelihoodReplayUsesStoredIdempotencyKey("finding_disposition")).toBe(true);
    expect(livelihoodReplayUsesStoredIdempotencyKey("architecture_draft_patch")).toBe(false);
  });

  it("requires confirm for draft patch when the request left the client", () => {
    const pending = buildPending({
      kind: "architecture_draft_patch",
      payload: {
        draftId: "draft-1",
        body: { expectedUpdatedUtc: "2026-09-10T12:00:00.000Z" },
      },
    });

    expect(requiresConfirmBeforeLivelihoodReplay(pending)).toBe(true);
  });

  it("allows silent replay for disposition when the request left the client", () => {
    const pending = buildPending({
      kind: "finding_disposition",
      payload: {
        findingId: "f-1",
        body: {
          disposition: "Accepted",
          runId: "run-1",
        },
      },
    });

    expect(requiresConfirmBeforeLivelihoodReplay(pending)).toBe(false);
  });

  it("requires confirm for policy publish even when requestLeftClient is true", () => {
    const pending = buildPending({
      kind: "policy_pack_save",
      payload: {
        operation: "publish",
        policyPackId: "pack-1",
        body: {},
        autoReplay: false,
      },
    });

    expect(requiresConfirmBeforeLivelihoodReplay(pending)).toBe(true);
  });
});

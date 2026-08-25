import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import { ArchitectureRequestCreateUnresolvedError } from "@/lib/api/architecture-request-create-unresolved-error";
import { createArchitectureRun } from "@/lib/api/architecture-runs";
import * as http from "@/lib/api/http";
import {
  clearWizardSubmissionSession,
  getOrCreateWizardIdempotencyKey,
  getOrCreateWizardRequestId,
} from "@/lib/wizard-idempotency-key";

const runIdA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const runIdB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const basePayload = {
  requestId: "ephemeral-request-id",
  description: "Review brief",
  systemName: "Claims intake",
  environment: "staging",
  cloudProvider: "None" as const,
  constraints: [],
  requiredCapabilities: [],
  assumptions: [],
};

function acceptedCreate(runId: string): { location: string; status: number } {
  return { location: `/v1/operations/run:${runId}`, status: 202 };
}

describe("createArchitectureRun idempotency", () => {
  afterEach(() => {
    clearWizardSubmissionSession();
    vi.restoreAllMocks();
  });

  it("replaces ephemeral request ids with the stable wizard session id", async () => {
    const apiPostAcceptedWithLocation = vi
      .spyOn(http, "apiPostAcceptedWithLocation")
      .mockResolvedValue(acceptedCreate(runIdA));
    const sessionRequestId = getOrCreateWizardRequestId();
    const sessionIdempotencyKey = getOrCreateWizardIdempotencyKey();

    const response = await createArchitectureRun(basePayload);

    expect(response.run?.runId).toBe(runIdA);
    expect(apiPostAcceptedWithLocation).toHaveBeenCalledWith(
      "/v1/architecture/request/async",
      expect.objectContaining({ requestId: sessionRequestId }),
      expect.objectContaining({
        extraHeaders: { "Idempotency-Key": sessionIdempotencyKey },
      }),
    );
    expect(sessionStorage.getItem("archlucid_wizard_request_id_v1")).toBeNull();
  });

  it("keeps the same wizard request id when a non-conflict failure is retried", async () => {
    const apiPostAcceptedWithLocation = vi
      .spyOn(http, "apiPostAcceptedWithLocation")
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(acceptedCreate(runIdA));
    const sessionRequestId = getOrCreateWizardRequestId();

    await expect(createArchitectureRun(basePayload)).rejects.toThrow("network down");
    await createArchitectureRun(basePayload);

    expect(apiPostAcceptedWithLocation.mock.calls[0]?.[1]).toMatchObject({ requestId: sessionRequestId });
    expect(apiPostAcceptedWithLocation.mock.calls[1]?.[1]).toMatchObject({ requestId: sessionRequestId });
  });

  it("rotates wizard session keys and retries once after an idempotency body conflict", async () => {
    const apiPostAcceptedWithLocation = vi
      .spyOn(http, "apiPostAcceptedWithLocation")
      .mockRejectedValueOnce(
        new ApiRequestError("Conflict: The Idempotency-Key was already used with a different request body.", {
          problem: {
            title: "Conflict",
            detail: "The Idempotency-Key was already used with a different request body.",
          },
          correlationId: null,
          httpStatus: 409,
        }),
      )
      .mockResolvedValueOnce(acceptedCreate(runIdB));

    const originalIdempotency = getOrCreateWizardIdempotencyKey();
    const response = await createArchitectureRun(basePayload);

    expect(response.run?.runId).toBe(runIdB);
    expect(apiPostAcceptedWithLocation).toHaveBeenCalledTimes(2);
    expect(apiPostAcceptedWithLocation.mock.calls[0]?.[2]?.extraHeaders?.["Idempotency-Key"]).toBe(
      originalIdempotency,
    );
    expect(apiPostAcceptedWithLocation.mock.calls[1]?.[2]?.extraHeaders?.["Idempotency-Key"]).not.toBe(
      originalIdempotency,
    );
  });

  it("maps async create proxy timeout to unresolved, not failed", async () => {
    vi.spyOn(http, "apiPostAcceptedWithLocation").mockRejectedValue(
      new ApiRequestError("Upstream API unreachable", {
        problem: {
          title: "Bad Gateway",
          detail:
            "POST /v1/architecture/request/async timed out after 60s (UI BFF proxy → ArchLucid.Api; budget 60000ms). Cause: The operation was aborted due to timeout",
        },
        correlationId: "corr-1",
        httpStatus: 502,
      }),
    );

    await expect(createArchitectureRun(basePayload)).rejects.toBeInstanceOf(
      ArchitectureRequestCreateUnresolvedError,
    );
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import { createArchitectureRun } from "@/lib/api/architecture-runs";
import * as http from "@/lib/api/http";
import {
  clearWizardSubmissionSession,
  getOrCreateWizardIdempotencyKey,
  getOrCreateWizardRequestId,
} from "@/lib/wizard-idempotency-key";

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

describe("createArchitectureRun idempotency", () => {
  afterEach(() => {
    clearWizardSubmissionSession();
    vi.restoreAllMocks();
  });

  it("replaces ephemeral request ids with the stable wizard session id", async () => {
    const apiPostJson = vi.spyOn(http, "apiPostJson").mockResolvedValue({ run: { runId: "run-1" } });
    const sessionRequestId = getOrCreateWizardRequestId();
    const sessionIdempotencyKey = getOrCreateWizardIdempotencyKey();

    await createArchitectureRun(basePayload);

    expect(apiPostJson).toHaveBeenCalledWith(
      "/v1/architecture/request",
      expect.objectContaining({ requestId: sessionRequestId }),
      expect.objectContaining({
        extraHeaders: { "Idempotency-Key": sessionIdempotencyKey },
      }),
    );
    expect(sessionStorage.getItem("archlucid_wizard_request_id_v1")).toBeNull();
  });

  it("keeps the same wizard request id when a non-conflict failure is retried", async () => {
    const apiPostJson = vi
      .spyOn(http, "apiPostJson")
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ run: { runId: "run-1" } });
    const sessionRequestId = getOrCreateWizardRequestId();

    await expect(createArchitectureRun(basePayload)).rejects.toThrow("network down");
    await createArchitectureRun(basePayload);

    expect(apiPostJson.mock.calls[0]?.[1]).toMatchObject({ requestId: sessionRequestId });
    expect(apiPostJson.mock.calls[1]?.[1]).toMatchObject({ requestId: sessionRequestId });
  });

  it("rotates wizard session keys and retries once after an idempotency body conflict", async () => {
    const apiPostJson = vi
      .spyOn(http, "apiPostJson")
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
      .mockResolvedValueOnce({ run: { runId: "run-2" } });

    const originalIdempotency = getOrCreateWizardIdempotencyKey();
    const response = await createArchitectureRun(basePayload);

    expect(response.run?.runId).toBe("run-2");
    expect(apiPostJson).toHaveBeenCalledTimes(2);
    expect(apiPostJson.mock.calls[0]?.[2]?.extraHeaders?.["Idempotency-Key"]).toBe(originalIdempotency);
    expect(apiPostJson.mock.calls[1]?.[2]?.extraHeaders?.["Idempotency-Key"]).not.toBe(originalIdempotency);
  });
});

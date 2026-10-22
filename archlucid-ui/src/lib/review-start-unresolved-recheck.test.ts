import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureRequestCreateUnresolvedError } from "@/lib/api/architecture-request-create-unresolved-error";
import { ApiRequestError } from "@/lib/api-request-error";
import { createArchitectureRun } from "@/lib/api";
import { REVIEW_START_CREATION_FAILED_MESSAGE } from "@/lib/review-start-progress-copy";

import { recheckUnresolvedArchitectureReviewCreate } from "./review-start-unresolved-recheck";

vi.mock("@/lib/api/architecture-runs", () => ({
  createArchitectureRun: vi.fn(),
}));

const createArchitectureRunMock = vi.mocked(createArchitectureRun);

const basePayload = {
  requestId: "session-request-id",
  description: "Brief",
  systemName: "System",
  environment: "staging",
  cloudProvider: "None" as const,
  constraints: [],
  requiredCapabilities: [],
  assumptions: [],
};

describe("recheckUnresolvedArchitectureReviewCreate", () => {
  beforeEach(() => {
    createArchitectureRunMock.mockReset();
  });

  it("returns found when the idempotent replay resolves to a run id", async () => {
    createArchitectureRunMock.mockResolvedValue({ run: { runId: "run-found-1" } } as never);

    const result = await recheckUnresolvedArchitectureReviewCreate(basePayload);

    expect(result).toEqual({ status: "found", runId: "run-found-1" });
    expect(createArchitectureRunMock).toHaveBeenCalledWith(basePayload);
  });

  it("returns still-unresolved when the gateway stops waiting again", async () => {
    createArchitectureRunMock.mockRejectedValue(
      new ArchitectureRequestCreateUnresolvedError({
        problem: { title: "Bad Gateway" },
        correlationId: "corr-1",
        httpStatus: 502,
      }),
    );

    const result = await recheckUnresolvedArchitectureReviewCreate(basePayload);

    expect(result).toEqual({ status: "still-unresolved" });
  });

  it("returns failed for server-reported errors", async () => {
    createArchitectureRunMock.mockRejectedValue(
      new ApiRequestError("Conflict", {
        problem: { title: "Conflict", detail: "Run already exists under a different key." },
        correlationId: null,
        httpStatus: 409,
      }),
    );

    const result = await recheckUnresolvedArchitectureReviewCreate(basePayload);

    expect(result).toEqual({ status: "failed", message: "Conflict" });
  });

  it("returns failed when the API omits a run id", async () => {
    createArchitectureRunMock.mockResolvedValue({ run: null } as never);

    const result = await recheckUnresolvedArchitectureReviewCreate(basePayload);

    expect(result).toEqual({ status: "failed", message: REVIEW_START_CREATION_FAILED_MESSAGE });
  });
});

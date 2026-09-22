import { beforeEach, describe, expect, it, vi } from "vitest";

const apiPostJsonMock = vi.hoisted(() => vi.fn());

vi.mock("./http-verbs-mutate-post-json", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./http-verbs-mutate-post-json")>();

  return {
    ...actual,
    apiPostJson: apiPostJsonMock,
  };
});

describe("commitArchitectureRun", () => {
  beforeEach(() => {
    apiPostJsonMock.mockReset();
    vi.resetModules();
  });

  it("throws sealed-manifest blockedReason detail on finalize 409", async () => {
    const [{ commitArchitectureRun }, { ApiRequestError }] = await Promise.all([
      import("@/lib/api/architecture-runs-lifecycle"),
      import("@/lib/api-request-error"),
    ]);

    apiPostJsonMock.mockRejectedValueOnce(
      new ApiRequestError("Conflict", {
        httpStatus: 409,
        correlationId: "corr-finalize-409",
        problem: {
          title: "Conflict",
          status: 409,
          detail: "Run 'run-abc' authority lifecycle must be Complete before finalize.",
        },
      }),
    );

    await expect(commitArchitectureRun("run-abc")).rejects.toThrow(
      "Run 'run-abc' authority lifecycle must be Complete before finalize.",
    );
    expect(apiPostJsonMock).toHaveBeenCalledWith(
      "/v1/architecture/review/run-abc/finalize",
      expect.objectContaining({ notifySponsor: false }),
      expect.any(Object),
    );
  });
});

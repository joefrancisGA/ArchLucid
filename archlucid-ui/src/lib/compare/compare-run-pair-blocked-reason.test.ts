import { describe, expect, it } from "vitest";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

describe("compareRunPairBlockedReason", () => {
  it("returns null for non-409 failures", () => {
    const failure: ApiLoadFailureState = {
      message: "Not found",
      problem: null,
      correlationId: null,
      httpStatus: 404,
      retryAfterSeconds: null,
    };

    expect(compareRunPairBlockedReason(failure)).toBeNull();
  });

  it("returns problem detail for compare 409 conflicts", () => {
    const failure: ApiLoadFailureState = {
      message: "Conflict",
      problem: {
        title: "Conflict",
        status: 409,
        detail: "Run 'abc' authority lifecycle must be Complete before compare.",
      },
      correlationId: "corr-1",
      httpStatus: 409,
      retryAfterSeconds: null,
    };

    expect(compareRunPairBlockedReason(failure)).toBe(
      "Run 'abc' authority lifecycle must be Complete before compare.",
    );
  });
});

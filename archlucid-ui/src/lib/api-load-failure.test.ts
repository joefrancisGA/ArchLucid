import { describe, expect, it } from "vitest";

import { ApiRequestError } from "./api-request-error";
import {
  isApiNotFoundFailure,
  isApiTimeoutLoadFailure,
  isApiTransientLoadFailure,
  resolveApiLoadFailurePresentation,
  toApiLoadFailure,
  uiFailureFromMessage,
} from "./api-load-failure";

describe("toApiLoadFailure", () => {
  it("maps ApiRequestError to state", () => {
    const err = new ApiRequestError("m", {
      problem: { title: "T" },
      correlationId: "c",
      httpStatus: 400,
    });

    expect(toApiLoadFailure(err)).toEqual({
      message: "m",
      problem: { title: "T" },
      correlationId: "c",
      httpStatus: 400,
      retryAfterSeconds: null,
    });
  });

  it("maps retryAfterSeconds from ApiRequestError when present", () => {
    const err = new ApiRequestError("rate", {
      problem: null,
      correlationId: null,
      httpStatus: 429,
      retryAfterSeconds: 12,
    });

    expect(toApiLoadFailure(err)).toEqual({
      message: "rate",
      problem: null,
      correlationId: null,
      httpStatus: 429,
      retryAfterSeconds: 12,
    });
  });

  it("maps generic Error to message-only state", () => {
    expect(toApiLoadFailure(new Error("oops"))).toEqual({
      message: "oops",
      problem: null,
      correlationId: null,
      httpStatus: null,
      retryAfterSeconds: null,
    });
  });

  it("maps unknown to generic message", () => {
    expect(toApiLoadFailure(42)).toEqual({
      message: "An unexpected error occurred.",
      problem: null,
      correlationId: null,
      httpStatus: null,
      retryAfterSeconds: null,
    });
  });
});

describe("isApiNotFoundFailure", () => {
  it("is true for 404 httpStatus", () => {
    expect(
      isApiNotFoundFailure({
        message: "m",
        problem: null,
        correlationId: null,
        httpStatus: 404,
        retryAfterSeconds: null,
      }),
    ).toBe(true);
  });

  it("is true for problem.status 404", () => {
    expect(
      isApiNotFoundFailure({
        message: "m",
        problem: { title: "Missing", status: 404 },
        correlationId: null,
        httpStatus: null,
        retryAfterSeconds: null,
      }),
    ).toBe(true);
  });

  it("is false for other errors", () => {
    expect(
      isApiNotFoundFailure({
        message: "m",
        problem: { title: "Bad", status: 400 },
        correlationId: null,
        httpStatus: 400,
        retryAfterSeconds: null,
      }),
    ).toBe(false);
    expect(isApiNotFoundFailure(null)).toBe(false);
  });
});

describe("uiFailureFromMessage", () => {
  it("trims message", () => {
    expect(uiFailureFromMessage("  hello  ")).toMatchObject({
      message: "hello",
      problem: null,
      correlationId: null,
      httpStatus: null,
      retryAfterSeconds: null,
    });
  });

  it("uses default when message empty after trim", () => {
    expect(uiFailureFromMessage("")).toMatchObject({
      message: "Something went wrong.",
    });
  });
});

describe("isApiTransientLoadFailure", () => {
  it("is true for gateway timeout status", () => {
    expect(
      isApiTransientLoadFailure({
        message: "m",
        problem: null,
        correlationId: null,
        httpStatus: 504,
        retryAfterSeconds: null,
      }),
    ).toBe(true);
  });

  it("is true for DATABASE_TIMEOUT error code", () => {
    expect(
      isApiTransientLoadFailure({
        message: "m",
        problem: { errorCode: "DATABASE_TIMEOUT" },
        correlationId: null,
        httpStatus: null,
        retryAfterSeconds: null,
      }),
    ).toBe(true);
  });

  it("is true for AbortError message without status", () => {
    expect(
      isApiTransientLoadFailure({
        message: "This operation was aborted due to timeout",
        problem: null,
        correlationId: null,
        httpStatus: null,
        retryAfterSeconds: null,
      }),
    ).toBe(true);
  });

  it("is false for 404", () => {
    expect(
      isApiTransientLoadFailure({
        message: "m",
        problem: null,
        correlationId: null,
        httpStatus: 404,
        retryAfterSeconds: null,
      }),
    ).toBe(false);
  });
});

describe("isApiTimeoutLoadFailure", () => {
  it("is true for 408 and timeout messages", () => {
    expect(
      isApiTimeoutLoadFailure({
        message: "The operation timed out",
        problem: null,
        correlationId: null,
        httpStatus: null,
        retryAfterSeconds: null,
      }),
    ).toBe(true);
    expect(
      isApiTimeoutLoadFailure({
        message: "m",
        problem: null,
        correlationId: null,
        httpStatus: 408,
        retryAfterSeconds: null,
      }),
    ).toBe(true);
  });
});

describe("resolveApiLoadFailurePresentation", () => {
  it("prefers transient over not-found when both signals appear", () => {
    expect(
      resolveApiLoadFailurePresentation({
        message: "timeout",
        problem: { status: 404 },
        correlationId: null,
        httpStatus: 504,
        retryAfterSeconds: null,
      }),
    ).toBe("transient");
  });

  it("returns not-found for 404 without transient signals", () => {
    expect(
      resolveApiLoadFailurePresentation({
        message: "missing",
        problem: null,
        correlationId: null,
        httpStatus: 404,
        retryAfterSeconds: null,
      }),
    ).toBe("not-found");
  });

  it("returns error for validation failures", () => {
    expect(
      resolveApiLoadFailurePresentation({
        message: "bad",
        problem: null,
        correlationId: null,
        httpStatus: 400,
        retryAfterSeconds: null,
      }),
    ).toBe("error");
  });
});

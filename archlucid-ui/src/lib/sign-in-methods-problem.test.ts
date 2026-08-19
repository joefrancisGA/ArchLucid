import { describe, expect, it } from "vitest";

import {
  classifySignInMethodsHttpFailure,
  digitsOnlyMaxLength,
  formatCountdown,
  isPlausibleEmailAddress,
  isSixDigitVerificationCode,
  msUntilExpiry,
} from "@/lib/sign-in-methods-problem";

const UNAUTHORIZED_JSON = JSON.stringify({
  type: "https://archlucid.example.org/errors#unauthorized",
  title: "Unauthorized",
  status: 401,
  detail: "Authenticated platform user is required.",
  instance: "/v1/auth/sign-in-methods",
  errorCode: "UNAUTHORIZED",
  correlationId: "7561a58d-dfdf-4992-951d-3a9d7dbc4df6",
  traceId: "7561a58d-dfdf-4992-951d-3a9d7dbc4df6",
});

describe("classifySignInMethodsHttpFailure", () => {
  it("maps the observed frictionless 401 ProblemDetails without leaking JSON", () => {
    const problem = classifySignInMethodsHttpFailure(401, UNAUTHORIZED_JSON, "application/problem+json");

    expect(problem.kind).toBe("unauthorized-platform-user");
    expect(problem.message).not.toContain("{");
    expect(problem.message).not.toContain("correlationId");
    expect(problem.message.toLowerCase()).toContain("signed-in");
  });

  it("maps recent-auth 400 to its own kind", () => {
    const body = JSON.stringify({
      title: "Bad Request",
      status: 400,
      detail: "Recent authentication is required. Sign in again and retry.",
    });
    const problem = classifySignInMethodsHttpFailure(400, body, "application/json");

    expect(problem.kind).toBe("recent-auth-required");
    expect(problem.message).toContain("Recent authentication");
  });

  it("uses detail for validation failures", () => {
    const body = JSON.stringify({
      title: "Bad Request",
      status: 400,
      detail: "Email is required.",
    });
    const problem = classifySignInMethodsHttpFailure(400, body, "application/json");

    expect(problem.kind).toBe("validation");
    expect(problem.message).toBe("Email is required.");
  });

  it("falls back when body is empty", () => {
    const problem = classifySignInMethodsHttpFailure(500, "", null);

    expect(problem.kind).toBe("unknown");
    expect(problem.message).not.toContain("{");
  });
});

describe("email and code validators", () => {
  it("accepts plausible emails only", () => {
    expect(isPlausibleEmailAddress("you@example.com")).toBe(true);
    expect(isPlausibleEmailAddress("not-an-email")).toBe(false);
    expect(isPlausibleEmailAddress("")).toBe(false);
  });

  it("requires six digits for verification codes", () => {
    expect(isSixDigitVerificationCode("123456")).toBe(true);
    expect(isSixDigitVerificationCode("12a456")).toBe(false);
    expect(isSixDigitVerificationCode("12345")).toBe(false);
  });

  it("strips non-digits for OTP input", () => {
    expect(digitsOnlyMaxLength("12a34b56c789", 6)).toBe("123456");
  });
});

describe("expiry helpers", () => {
  it("computes remaining ms and countdown", () => {
    const now = Date.parse("2026-08-05T12:00:00.000Z");
    const remaining = msUntilExpiry("2026-08-05T12:04:12.000Z", now);

    expect(remaining).toBe(252_000);
    expect(formatCountdown(remaining!)).toBe("4:12");
    expect(formatCountdown(0)).toBe("0:00");
  });
});

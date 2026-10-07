import { describe, expect, it } from "vitest";

import { mapEmailOtpFailureToCustomerMessage } from "@/lib/auth/sign-in-page-copy";

describe("mapEmailOtpFailureToCustomerMessage", () => {
  it("maps invalid code without API terminology", () => {
    const message = mapEmailOtpFailureToCustomerMessage("invalid_code");

    expect(message).toMatch(/not correct/i);
    expect(message).not.toMatch(/401|unauthorized|exception/i);
  });

  it("maps expired code", () => {
    expect(mapEmailOtpFailureToCustomerMessage("expired_code")).toMatch(/expired/i);
  });

  it("maps rate limited", () => {
    expect(mapEmailOtpFailureToCustomerMessage("rate_limited")).toMatch(/too many sign-in attempts/i);
  });

  it("maps delivery failure", () => {
    expect(mapEmailOtpFailureToCustomerMessage("delivery_failed")).toMatch(/could not send/i);
  });

  it("uses the same delivery_failed copy for verify-step outages mapped via shared 5xx category", () => {
    expect(mapEmailOtpFailureToCustomerMessage("delivery_failed")).toBe(
      "We could not send a sign-in code right now. Try again in a few minutes.",
    );
  });
});

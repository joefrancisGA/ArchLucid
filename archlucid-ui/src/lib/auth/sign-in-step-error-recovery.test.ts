import { describe, expect, it } from "vitest";

import { mapEmailOtpFailureToCustomerMessage } from "@/lib/auth/sign-in-page-copy";

import { shouldOfferSignInStepReportProblem } from "./sign-in-step-error-recovery";

describe("shouldOfferSignInStepReportProblem", () => {
  it("returns false when there is no error", () => {
    expect(shouldOfferSignInStepReportProblem(null)).toBe(false);
    expect(shouldOfferSignInStepReportProblem("")).toBe(false);
    expect(shouldOfferSignInStepReportProblem("   ")).toBe(false);
  });

  it("returns false for inline validation and OTP policy errors", () => {
    expect(shouldOfferSignInStepReportProblem(mapEmailOtpFailureToCustomerMessage("invalid_code"))).toBe(
      false,
    );
    expect(shouldOfferSignInStepReportProblem(mapEmailOtpFailureToCustomerMessage("expired_code"))).toBe(
      false,
    );
    expect(shouldOfferSignInStepReportProblem(mapEmailOtpFailureToCustomerMessage("too_many_attempts"))).toBe(
      false,
    );
    expect(shouldOfferSignInStepReportProblem(mapEmailOtpFailureToCustomerMessage("rate_limited"))).toBe(
      false,
    );
    expect(shouldOfferSignInStepReportProblem(mapEmailOtpFailureToCustomerMessage("delivery_failed"))).toBe(
      false,
    );
  });

  it("returns true for transport and unknown infrastructure failures", () => {
    expect(shouldOfferSignInStepReportProblem(mapEmailOtpFailureToCustomerMessage("network"))).toBe(true);
    expect(shouldOfferSignInStepReportProblem(mapEmailOtpFailureToCustomerMessage("unknown"))).toBe(true);
  });
});

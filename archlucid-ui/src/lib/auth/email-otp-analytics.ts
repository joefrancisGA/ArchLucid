export type EmailOtpAuthAnalyticsEvent =
  | "auth_method_selected"
  | "email_otp_code_requested"
  | "email_otp_verification_completed"
  | "email_otp_sso_redirect_required"
  | "email_otp_failure";

export type EmailOtpAuthAnalyticsPayload = {
  readonly method?: "work_school" | "email_code" | "microsoft" | "google";
  readonly failureCategory?: string;
  readonly nextStep?: string;
};

/** Non-sensitive auth funnel events (no email, codes, or tokens). */
export function recordEmailOtpAuthAnalytics(
  event: EmailOtpAuthAnalyticsEvent,
  payload: EmailOtpAuthAnalyticsPayload = {},
): void {
  if (typeof window === "undefined") {
    return;
  }

  const detail = {
    event,
    ...payload,
  };

  try {
    window.dispatchEvent(new CustomEvent("archlucid:auth-analytics", { detail }));
  } catch {
    /* ignore */
  }
}

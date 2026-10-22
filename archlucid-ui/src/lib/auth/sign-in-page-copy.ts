import type { EmailOtpApiFailureCategory } from "@/lib/auth/email-otp-api";
import {
  CUSTOMER_AUTH_DUAL_METHOD_LEAD,
  CUSTOMER_AUTH_EMAIL_CODE_ACTION,
  CUSTOMER_AUTH_NON_SSO_ORIENTATION,
  CUSTOMER_AUTH_WORK_SCHOOL_ACTION,
} from "@/lib/auth/customer-auth-messaging";
import { productLineDisplayName } from "@/lib/product-line/product-line-display-name";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export function signInOptionsTitle(productLineId: ProductLineId): string {
  return `Sign in to ${productLineDisplayName(productLineId)}`;
}

export function signInEmailLead(productLineId: ProductLineId): string {
  const productName = productLineDisplayName(productLineId);

  return `Enter your email and ${productName} will send a one-time sign-in code — no password is required. Use this for Architect plan and other accounts without company SSO.`;
}

export function signInSsoLead(productLineId: ProductLineId): string {
  return `Your organization requires its configured identity provider for ${productLineDisplayName(productLineId)} access.`;
}

export function signInReturnDestinationHint(productLineId: ProductLineId): string {
  return `After you sign in, ${productLineDisplayName(productLineId)} will return you to the page you were viewing.`;
}

export function signInNetworkFailureMessage(productLineId: ProductLineId): string {
  return `We could not reach ${productLineDisplayName(productLineId)}. Check your connection and try again.`;
}

/** @deprecated Prefer product-line helpers — retained for tests that snapshot architecture defaults. */
export const SIGN_IN_PAGE_COPY = {
  optionsTitle: signInOptionsTitle("architecture"),
  optionsLead: CUSTOMER_AUTH_DUAL_METHOD_LEAD,
  optionsOrientation: CUSTOMER_AUTH_NON_SSO_ORIENTATION,
  workSchoolPrimary: CUSTOMER_AUTH_WORK_SCHOOL_ACTION,
  emailCodeSecondary: CUSTOMER_AUTH_EMAIL_CODE_ACTION,
  microsoftSupplemental: "Continue with Microsoft",
  googleSupplemental: "Continue with Google",
  emailTitle: "Sign in with email",
  emailLead: signInEmailLead("architecture"),
  emailLabel: "Email address",
  sendCode: "Send code",
  backToOptions: "Back to sign-in options",
  codeTitle: "Enter your sign-in code",
  codeLeadPrefix: "We sent a code to",
  codeLabel: "Sign-in code",
  continue: "Continue",
  sendNewCode: "Send a new code",
  useDifferentEmail: "Use a different email",
  resendCountdown: (seconds: number) => `You can request a new code in ${seconds} seconds.`,
  ssoTitle: "Use your organization's sign-in",
  ssoLead: signInSsoLead("architecture"),
  ssoPrimary: "Continue to organization sign-in",
  ssoUseAnotherEmail: "Use another email",
  codeSentAnnouncement: "If that address can receive email, we sent a sign-in code.",
  returnDestinationHint: signInReturnDestinationHint("architecture"),
  sendingCode: "Sending your sign-in code…",
  completingSignIn: "Completing sign-in…",
} as const;

export function mapEmailOtpFailureToCustomerMessage(
  category: EmailOtpApiFailureCategory,
  productLineId: ProductLineId = "architecture",
): string {
  switch (category) {
    case "invalid_code":
      return "That sign-in code is not correct. Check the code in your email and try again.";
    case "expired_code":
      return "That sign-in code has expired. Request a new code to continue.";
    case "too_many_attempts":
      return "Too many incorrect attempts. Request a new code to continue.";
    case "rate_limited":
      return "Too many sign-in attempts. Wait a few minutes and try again.";
    case "delivery_failed":
      return "We could not send a sign-in code right now. Try again in a few minutes.";
    case "network":
      return signInNetworkFailureMessage(productLineId);
    default:
      return "Sign-in could not be completed. Try again or use another sign-in option.";
  }
}

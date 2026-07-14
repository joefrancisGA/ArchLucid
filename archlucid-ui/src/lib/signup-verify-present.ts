import type { LastRegistrationPayload } from "@/lib/registration-session";
import { maskEmailForDisplay } from "@/lib/signup-verify-email";
import { SIGNUP_VERIFY_PAGE_COPY } from "@/lib/signup-verify-page-copy";
import type { SignupVerifyResendCooldown } from "@/lib/signup-verify-resend";
import type { SignupVerifyTrialStatusResult } from "@/lib/signup-verify-trial-status";

export type SignupVerifyViewPhase =
  | "loading"
  | "missing_session"
  | "existing_account"
  | "verification_complete"
  | "verification_pending"
  | "still_pending"
  | "delivery_failed"
  | "resend_success"
  | "resend_cooldown"
  | "resend_failed"
  | "rate_limited";

export type SignupVerifyIconTone = "neutral" | "success" | "pending";

export type SignupVerifyViewModel = {
  readonly phase: SignupVerifyViewPhase;
  readonly heading: string;
  readonly body: string;
  readonly helperText: string | null;
  readonly maskedEmail: string;
  readonly primaryLabel: string;
  readonly primaryDisabled: boolean;
  readonly showResend: boolean;
  readonly resendDisabled: boolean;
  readonly resendLabel: string;
  readonly showDifferentEmail: boolean;
  readonly showReturnSignup: boolean;
  readonly showSignIn: boolean;
  readonly signInLabel: string;
  readonly iconTone: SignupVerifyIconTone;
  readonly statusMessage: string | null;
  readonly autoContinue: boolean;
};

export type BuildSignupVerifyViewModelInput = {
  readonly registration: LastRegistrationPayload | null;
  readonly queryEmail: string;
  readonly trialStatus: SignupVerifyTrialStatusResult | null;
  readonly resendCooldown: SignupVerifyResendCooldown;
  readonly checking: boolean;
  readonly resendPending: boolean;
  readonly resendOutcome: "success" | "failed" | null;
  readonly stillPendingAfterCheck: boolean;
  readonly initialLoadFailed: boolean;
};

function resolveDestinationEmail(registration: LastRegistrationPayload | null, queryEmail: string): string {
  const fromSession = registration?.adminEmail?.trim() ?? "";

  if (fromSession.length > 0) {
    return fromSession;
  }

  return queryEmail.trim();
}

function hasValidRegistrationSession(registration: LastRegistrationPayload | null): boolean {
  if (registration === null) {
    return false;
  }

  const tenantId = registration.tenantId?.trim() ?? "";
  const workspaceId = registration.defaultWorkspaceId?.trim() ?? "";
  const projectId = registration.defaultProjectId?.trim() ?? "";

  return tenantId.length > 0 && workspaceId.length > 0 && projectId.length > 0;
}

function interpolate(template: string, email: string, seconds: number): string {
  return template.replace("{email}", email).replace("{seconds}", String(seconds));
}

export function buildSignupVerifyViewModel(input: BuildSignupVerifyViewModelInput): SignupVerifyViewModel {
  const destinationEmail = resolveDestinationEmail(input.registration, input.queryEmail);
  const maskedEmail = maskEmailForDisplay(destinationEmail);
  const displayEmail = maskedEmail.length > 0 ? maskedEmail : "your work email";

  const basePending: Omit<
    SignupVerifyViewModel,
    "phase" | "heading" | "body" | "primaryLabel" | "statusMessage" | "iconTone" | "signInLabel"
  > = {
    maskedEmail: displayEmail,
    helperText: SIGNUP_VERIFY_PAGE_COPY.deliveryHint,
    primaryDisabled: input.checking || input.resendPending,
    showResend: true,
    resendDisabled: input.resendPending || input.resendCooldown.active || input.checking,
    resendLabel: input.resendPending
      ? SIGNUP_VERIFY_PAGE_COPY.primaryResendPending
      : SIGNUP_VERIFY_PAGE_COPY.primaryResend,
    showDifferentEmail: true,
    showReturnSignup: true,
    showSignIn: false,
    autoContinue: false,
  };

  const defaultSignInLabel = SIGNUP_VERIFY_PAGE_COPY.secondarySignIn;

  if (input.checking && input.trialStatus === null && input.registration !== null) {
    return {
      phase: "loading",
      heading: SIGNUP_VERIFY_PAGE_COPY.checkInboxHeading,
      body: interpolate(SIGNUP_VERIFY_PAGE_COPY.checkInboxBody, displayEmail, 0),
      statusMessage: null,
      primaryLabel: SIGNUP_VERIFY_PAGE_COPY.primaryContinueChecking,
      signInLabel: defaultSignInLabel,
      iconTone: "pending",
      ...basePending,
      primaryDisabled: true,
      showResend: false,
      resendDisabled: true,
      showDifferentEmail: false,
      showReturnSignup: false,
    };
  }

  if (!hasValidRegistrationSession(input.registration)) {
    const sessionEmailHint =
      displayEmail !== "your work email"
        ? interpolate(SIGNUP_VERIFY_PAGE_COPY.sessionExpiredEmailHint, displayEmail, 0)
        : null;

    return {
      phase: "missing_session",
      heading: SIGNUP_VERIFY_PAGE_COPY.sessionExpiredHeading,
      body: SIGNUP_VERIFY_PAGE_COPY.sessionExpiredBody,
      helperText: sessionEmailHint,
      maskedEmail: displayEmail !== "your work email" ? displayEmail : "",
      primaryLabel: SIGNUP_VERIFY_PAGE_COPY.primarySessionExpired,
      primaryDisabled: false,
      showResend: false,
      resendDisabled: true,
      resendLabel: SIGNUP_VERIFY_PAGE_COPY.primaryResend,
      showDifferentEmail: false,
      showReturnSignup: false,
      showSignIn: true,
      signInLabel: SIGNUP_VERIFY_PAGE_COPY.secondarySignInInstead,
      statusMessage: null,
      autoContinue: false,
      iconTone: "neutral",
    };
  }

  if (input.registration?.wasAlreadyProvisioned === true) {
    return {
      phase: "existing_account",
      heading: SIGNUP_VERIFY_PAGE_COPY.existingAccountHeading,
      body: SIGNUP_VERIFY_PAGE_COPY.existingAccountBody,
      helperText: null,
      maskedEmail: displayEmail,
      primaryLabel: SIGNUP_VERIFY_PAGE_COPY.primaryExistingAccount,
      primaryDisabled: false,
      showResend: false,
      resendDisabled: true,
      resendLabel: SIGNUP_VERIFY_PAGE_COPY.primaryResend,
      showDifferentEmail: true,
      showReturnSignup: true,
      showSignIn: false,
      signInLabel: defaultSignInLabel,
      statusMessage: null,
      autoContinue: false,
      iconTone: "neutral",
    };
  }

  if (input.initialLoadFailed) {
    return {
      phase: "delivery_failed",
      heading: SIGNUP_VERIFY_PAGE_COPY.deliveryFailedHeading,
      body: SIGNUP_VERIFY_PAGE_COPY.deliveryFailedBody,
      helperText: SIGNUP_VERIFY_PAGE_COPY.deliveryHint,
      maskedEmail: displayEmail,
      primaryLabel: SIGNUP_VERIFY_PAGE_COPY.primaryPending,
      primaryDisabled: input.checking,
      showResend: true,
      resendDisabled: input.resendPending || input.resendCooldown.active,
      resendLabel: input.resendPending
        ? SIGNUP_VERIFY_PAGE_COPY.primaryResendPending
        : SIGNUP_VERIFY_PAGE_COPY.primaryResend,
      showDifferentEmail: true,
      showReturnSignup: true,
      showSignIn: true,
      signInLabel: defaultSignInLabel,
      statusMessage: null,
      autoContinue: false,
      iconTone: "neutral",
    };
  }

  if (input.trialStatus?.kind === "ready") {
    return {
      phase: "verification_complete",
      heading: SIGNUP_VERIFY_PAGE_COPY.emailVerifiedHeading,
      body: SIGNUP_VERIFY_PAGE_COPY.emailVerifiedBody,
      helperText: null,
      maskedEmail: displayEmail,
      primaryLabel: SIGNUP_VERIFY_PAGE_COPY.primaryVerified,
      primaryDisabled: false,
      showResend: false,
      resendDisabled: true,
      resendLabel: SIGNUP_VERIFY_PAGE_COPY.primaryResend,
      showDifferentEmail: false,
      showReturnSignup: false,
      showSignIn: false,
      signInLabel: defaultSignInLabel,
      statusMessage: null,
      autoContinue: true,
      iconTone: "success",
    };
  }

  if (input.trialStatus?.kind === "throttled" && !input.resendCooldown.active) {
    return {
      phase: "rate_limited",
      heading: SIGNUP_VERIFY_PAGE_COPY.rateLimitedHeading,
      body: SIGNUP_VERIFY_PAGE_COPY.rateLimitedBody,
      helperText: null,
      maskedEmail: displayEmail,
      primaryLabel: SIGNUP_VERIFY_PAGE_COPY.primaryRateLimited,
      primaryDisabled: false,
      showResend: false,
      resendDisabled: true,
      resendLabel: SIGNUP_VERIFY_PAGE_COPY.primaryResend,
      showDifferentEmail: false,
      showReturnSignup: false,
      showSignIn: true,
      signInLabel: SIGNUP_VERIFY_PAGE_COPY.secondarySignInInstead,
      statusMessage: null,
      autoContinue: false,
      iconTone: "neutral",
    };
  }

  if (input.resendOutcome === "success") {
    return {
      phase: "resend_success",
      heading: SIGNUP_VERIFY_PAGE_COPY.checkInboxHeading,
      body: interpolate(SIGNUP_VERIFY_PAGE_COPY.checkInboxResendBody, displayEmail, 0),
      helperText: SIGNUP_VERIFY_PAGE_COPY.deliveryHint,
      maskedEmail: displayEmail,
      primaryLabel: SIGNUP_VERIFY_PAGE_COPY.primaryPending,
      primaryDisabled: input.checking,
      showResend: true,
      resendDisabled: true,
      resendLabel: SIGNUP_VERIFY_PAGE_COPY.primaryResend,
      showDifferentEmail: true,
      showReturnSignup: true,
      showSignIn: false,
      signInLabel: defaultSignInLabel,
      statusMessage: SIGNUP_VERIFY_PAGE_COPY.resendSuccess,
      autoContinue: false,
      iconTone: "pending",
    };
  }

  if (input.resendOutcome === "failed") {
    return {
      phase: "resend_failed",
      heading: SIGNUP_VERIFY_PAGE_COPY.checkInboxHeading,
      body: interpolate(SIGNUP_VERIFY_PAGE_COPY.checkInboxBody, displayEmail, 0),
      helperText: SIGNUP_VERIFY_PAGE_COPY.deliveryHint,
      maskedEmail: displayEmail,
      primaryLabel: SIGNUP_VERIFY_PAGE_COPY.primaryPending,
      primaryDisabled: input.checking,
      showResend: true,
      resendDisabled: input.resendPending,
      resendLabel: SIGNUP_VERIFY_PAGE_COPY.primaryResend,
      showDifferentEmail: true,
      showReturnSignup: true,
      showSignIn: true,
      signInLabel: defaultSignInLabel,
      statusMessage: SIGNUP_VERIFY_PAGE_COPY.resendFailed,
      autoContinue: false,
      iconTone: "pending",
    };
  }

  if (input.resendCooldown.active) {
    return {
      phase: "resend_cooldown",
      heading: SIGNUP_VERIFY_PAGE_COPY.checkInboxHeading,
      body: interpolate(SIGNUP_VERIFY_PAGE_COPY.checkInboxBody, displayEmail, 0),
      helperText: SIGNUP_VERIFY_PAGE_COPY.deliveryHint,
      maskedEmail: displayEmail,
      primaryLabel: SIGNUP_VERIFY_PAGE_COPY.primaryPending,
      primaryDisabled: input.checking,
      showResend: true,
      resendDisabled: true,
      resendLabel: SIGNUP_VERIFY_PAGE_COPY.primaryResend,
      showDifferentEmail: true,
      showReturnSignup: true,
      showSignIn: false,
      signInLabel: defaultSignInLabel,
      statusMessage: interpolate(
        SIGNUP_VERIFY_PAGE_COPY.resendCooldown,
        displayEmail,
        input.resendCooldown.secondsRemaining,
      ),
      autoContinue: false,
      iconTone: "pending",
    };
  }

  if (input.stillPendingAfterCheck) {
    return {
      phase: "still_pending",
      heading: SIGNUP_VERIFY_PAGE_COPY.stillPendingHeading,
      body: SIGNUP_VERIFY_PAGE_COPY.stillPendingBody,
      helperText: SIGNUP_VERIFY_PAGE_COPY.deliveryHint,
      maskedEmail: displayEmail,
      primaryLabel: SIGNUP_VERIFY_PAGE_COPY.primaryPending,
      primaryDisabled: input.checking,
      showResend: true,
      resendDisabled: input.resendPending || input.resendCooldown.active,
      resendLabel: input.resendPending
        ? SIGNUP_VERIFY_PAGE_COPY.primaryResendPending
        : SIGNUP_VERIFY_PAGE_COPY.primaryResend,
      showDifferentEmail: true,
      showReturnSignup: true,
      showSignIn: true,
      signInLabel: defaultSignInLabel,
      statusMessage: null,
      autoContinue: false,
      iconTone: "pending",
    };
  }

  const provisioningHint =
    input.trialStatus?.kind === "not_found" || input.trialStatus?.kind === "pending"
      ? SIGNUP_VERIFY_PAGE_COPY.provisioningBody
      : null;

  return {
    phase: "verification_pending",
    heading: SIGNUP_VERIFY_PAGE_COPY.checkInboxHeading,
    body: interpolate(SIGNUP_VERIFY_PAGE_COPY.checkInboxBody, displayEmail, 0),
    helperText: provisioningHint ?? SIGNUP_VERIFY_PAGE_COPY.deliveryHint,
    maskedEmail: displayEmail,
    primaryLabel: SIGNUP_VERIFY_PAGE_COPY.primaryPending,
    primaryDisabled: input.checking || input.resendPending,
    showResend: true,
    resendDisabled: input.resendPending || input.resendCooldown.active || input.checking,
    resendLabel: input.resendPending
      ? SIGNUP_VERIFY_PAGE_COPY.primaryResendPending
      : SIGNUP_VERIFY_PAGE_COPY.primaryResend,
    showDifferentEmail: true,
    showReturnSignup: true,
    showSignIn: false,
    signInLabel: defaultSignInLabel,
    statusMessage: null,
    autoContinue: false,
    iconTone: "pending",
  };
}

/** Customer-visible strings that must never appear on the verify page. */
export const SIGNUP_VERIFY_BANNED_CUSTOMER_STRINGS = [
  "DevelopmentBypass",
  "POST /v1/register",
  "rate limit",
  "trial workspace seeds",
  "tenant SQL",
  "host configuration",
  "environment enforces",
  "Entra",
  "External ID",
  "LocalIdentity",
] as const;

export const SIGNUP_VERIFY_PAGE_COPY = {
  checkInboxHeading: "Check your inbox",
  emailVerifiedHeading: "Email verified",
  sessionExpiredHeading: "We lost your signup handoff on this device",
  existingAccountHeading: "This organization is already registered",
  deliveryFailedHeading: "We could not confirm your signup",
  stillPendingHeading: "Verification not detected yet",
  rateLimitedHeading: "Please wait before trying again",

  checkInboxBody:
    "We sent a verification link to {email}. Open the email and select Verify email to continue setting up your ArchLucid workspace.",
  deliveryHint: "Delivery can take a minute. Check your spam or junk folder if you do not see it.",
  emailVerifiedBody: "Your email is verified. Continue to set up your evaluation workspace.",
  stillPendingBody:
    "We have not detected verification yet. Open the link in your email, then try again.",
  rateLimitedBody:
    "We are receiving too many checks right now. Wait a short moment, then try again.",
  sessionExpiredBody:
    "We could not restore your signup details on this browser. Start signup again, or sign in if you already have an account.",
  existingAccountBody:
    "An organization with this name is already registered. Sign in to access your workspace, or use a different email to start a new evaluation.",
  deliveryFailedBody:
    "We could not complete the signup handoff. Try again in a moment, or start signup again if the problem continues.",
  resendSuccess: "If another verification message is required, check your inbox again.",
  resendCooldown: "We recently sent a verification email. You can request another in {seconds} seconds.",
  resendFailed: "We could not send another verification message right now. Try again shortly or sign in.",
  provisioningBody: "Your workspace is still being prepared. This usually takes less than a minute.",

  primaryVerified: "Continue to onboarding",
  primaryPending: "I've verified my email",
  primarySending: "Sending email…",
  primaryResendPending: "Sending…",
  primaryResend: "Resend email",
  primarySessionExpired: "Start signup again",
  primaryExistingAccount: "Sign in",
  primaryContinueChecking: "Checking…",

  secondaryDifferentEmail: "Use a different email",
  secondaryReturnSignup: "Return to signup",
  secondarySignIn: "Sign in",

  ariaStatusRegion: "Email verification status",
  ariaResendSuccess: "Verification email resent",
} as const;

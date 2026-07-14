export const SIGNUP_VERIFY_PAGE_COPY = {
  checkInboxHeading: "Check your email",
  emailVerifiedHeading: "Email verified",
  sessionExpiredHeading: "Your signup session has expired",
  existingAccountHeading: "This organization is already registered",
  deliveryFailedHeading: "We could not confirm your signup",
  stillPendingHeading: "Verification not detected yet",
  rateLimitedHeading: "Please wait before trying again",

  checkInboxBody:
    "We sent a verification link to {email}. Open the email and select Verify email to continue setting up your ArchLucid workspace.",
  checkInboxResendBody:
    "We sent a new verification link to {email}. Use the newest link; earlier links will no longer work.",
  deliveryHint: "Delivery can take a minute. Check your spam or junk folder if you do not see it.",
  emailVerifiedBody: "Your email is verified. Continue to set up your evaluation workspace.",
  stillPendingBody:
    "We have not detected verification yet. Open the link in your email, then try again.",
  sessionExpiredBody:
    "For your security, incomplete signup sessions expire after a period of inactivity. Start again to continue creating your workspace.",
  sessionExpiredEmailHint: "We can send a new verification email to {email} after you restart signup.",
  existingAccountBody:
    "An organization with this name is already registered. Sign in to access your workspace, or use a different email to start a new evaluation.",
  deliveryFailedBody:
    "We could not complete the signup handoff. Try again in a moment, or start signup again if the problem continues.",
  rateLimitedBody: "Too many requests were made in a short time. Wait a moment, then return to sign in or try again.",
  resendSuccess: "A new verification email was sent. Check your inbox.",
  resendCooldown: "We recently sent a verification email. You can request another in {seconds} seconds.",
  resendFailed: "We could not send another verification message right now. Try again shortly or sign in.",
  provisioningBody: "Your workspace is still being prepared. This usually takes less than a minute.",

  primaryVerified: "Continue to onboarding",
  primaryPending: "I've verified my email",
  primarySending: "Sending email…",
  primaryResendPending: "Sending…",
  primaryResend: "Send a new verification email",
  primarySessionExpired: "Restart signup",
  primaryExistingAccount: "Sign in",
  primaryContinueChecking: "Checking…",
  primaryRateLimited: "Return to sign in",

  secondaryDifferentEmail: "Use a different email",
  secondaryReturnSignup: "Return to signup",
  secondarySignIn: "Already have an account? Sign in",
  secondarySignInInstead: "Sign in instead",

  ariaStatusRegion: "Email verification status",
  ariaResendSuccess: "Verification email resent",
} as const;

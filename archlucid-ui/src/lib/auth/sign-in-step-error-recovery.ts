/**
 * When email/code OTP steps surface infrastructure failures (not validation-only copy),
 * offer Report Problem + secondary exits (bootstrap mid-flow recovery parity).
 */
export function shouldOfferSignInStepReportProblem(errorMessage: string | null): boolean {
  if (errorMessage === null) {
    return false;
  }

  const trimmed = errorMessage.trim();

  if (trimmed.length === 0) {
    return false;
  }

  const normalized = trimmed.toLowerCase();

  const validationOnlyPhrases = [
    "enter a valid",
    "enter your email",
    "enter the sign-in",
    "sign-in code is not correct",
    "sign-in code has expired",
    "incorrect attempts",
    "invalid code",
    "invalid email",
    "code must",
    "email is required",
    "required field",
    "expired code",
    "too many sign-in attempts",
    "could not send a sign-in code",
    "wait a few minutes",
    "organization requires",
  ];

  if (validationOnlyPhrases.some((phrase) => normalized.includes(phrase))) {
    return false;
  }

  return true;
}

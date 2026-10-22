const CHALLENGE_ID_KEY = "archlucid_email_otp_challenge_id";
const MASKED_EMAIL_KEY = "archlucid_email_otp_masked_email";
const EMAIL_KEY = "archlucid_email_otp_email";
const INVITATION_TOKEN_KEY = "archlucid_email_otp_invitation_token";

export function storeEmailOtpChallengeSession(
  challengeId: string | null,
  maskedEmail: string,
  email: string,
): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.setItem(MASKED_EMAIL_KEY, maskedEmail);
  sessionStorage.setItem(EMAIL_KEY, email.trim());

  if (challengeId !== null && challengeId.trim().length > 0) {
    sessionStorage.setItem(CHALLENGE_ID_KEY, challengeId.trim());
  } else {
    sessionStorage.removeItem(CHALLENGE_ID_KEY);
  }
}

export function readEmailOtpChallengeSession(): {
  challengeId: string | null;
  maskedEmail: string;
  email: string;
} | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const maskedEmail = sessionStorage.getItem(MASKED_EMAIL_KEY)?.trim() ?? "";
  const email = sessionStorage.getItem(EMAIL_KEY)?.trim() ?? "";

  if (maskedEmail.length === 0 || email.length === 0) {
    return null;
  }

  const challengeIdRaw = sessionStorage.getItem(CHALLENGE_ID_KEY)?.trim() ?? "";

  return {
    challengeId: challengeIdRaw.length > 0 ? challengeIdRaw : null,
    maskedEmail,
    email,
  };
}

export function clearEmailOtpChallengeSession(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.removeItem(CHALLENGE_ID_KEY);
  sessionStorage.removeItem(MASKED_EMAIL_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
}

export function storeInvitationToken(token: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.setItem(INVITATION_TOKEN_KEY, token.trim());
}

export function readInvitationToken(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const value = sessionStorage.getItem(INVITATION_TOKEN_KEY)?.trim();

  return value && value.length > 0 ? value : null;
}

export function clearInvitationToken(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.removeItem(INVITATION_TOKEN_KEY);
}

export type EmailOtpChallengeApiResponse = {
  message: string;
  challengeId?: string | null;
  ssoRequired: boolean;
  ssoMessage?: string | null;
  emailDeliverySucceeded?: boolean | null;
};

export type EmailOtpVerifyApiResponse = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  platformUserId: string;
  nextStep: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  invitationId?: string | null;
};

export type EmailOtpApiFailureCategory =
  | "invalid_code"
  | "expired_code"
  | "too_many_attempts"
  | "rate_limited"
  | "delivery_failed"
  | "network"
  | "unknown";

export type EmailOtpChallengeApiResult =
  | { kind: "success"; response: EmailOtpChallengeApiResponse }
  | { kind: "failure"; category: EmailOtpApiFailureCategory };

export type EmailOtpVerifyApiResult =
  | { kind: "success"; response: EmailOtpVerifyApiResponse }
  | { kind: "failure"; category: EmailOtpApiFailureCategory };

export async function requestEmailOtpChallenge(
  email: string,
  invitationToken: string | null,
  botChallengeToken?: string | null,
): Promise<EmailOtpChallengeApiResult> {
  try {
    const response = await fetch("/api/proxy/v1/auth/email-otp/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email,
        invitationToken: invitationToken ?? undefined,
        botChallengeToken: botChallengeToken ?? undefined,
      }),
    });

    if (response.status === 429) {
      return { kind: "failure", category: "rate_limited" };
    }

    if (!response.ok) {
      return { kind: "failure", category: mapStatusToFailureCategory(response.status) };
    }

    const payload = (await response.json()) as EmailOtpChallengeApiResponse;

    if (payload.emailDeliverySucceeded === false) {
      return { kind: "failure", category: "delivery_failed" };
    }

    return { kind: "success", response: payload };
  } catch {
    return { kind: "failure", category: "network" };
  }
}

export async function verifyEmailOtpCode(
  challengeId: string,
  code: string,
  invitationToken: string | null,
): Promise<EmailOtpVerifyApiResult> {
  try {
    const response = await fetch("/api/proxy/v1/auth/email-otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        challengeId,
        code,
        invitationToken: invitationToken ?? undefined,
      }),
    });

    if (response.status === 429) {
      return { kind: "failure", category: "rate_limited" };
    }

    if (response.status === 401) {
      return { kind: "failure", category: "invalid_code" };
    }

    if (!response.ok) {
      return { kind: "failure", category: mapStatusToFailureCategory(response.status) };
    }

    const payload = (await response.json()) as EmailOtpVerifyApiResponse;

    return { kind: "success", response: payload };
  } catch {
    return { kind: "failure", category: "network" };
  }
}

function mapStatusToFailureCategory(status: number): EmailOtpApiFailureCategory {
  if (status === 429) {
    return "rate_limited";
  }

  if (status === 401) {
    return "invalid_code";
  }

  if (status >= 500) {
    return "delivery_failed";
  }

  return "unknown";
}

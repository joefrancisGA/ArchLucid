import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type InvitationValidationStatus =
  | "Valid"
  | "Invalid"
  | "Expired"
  | "Revoked"
  | "Accepted";

export type InvitationValidationResponse = {
  status: InvitationValidationStatus;
  maskedInvitedEmail?: string | null;
  allowEmailCode: boolean;
  requireEnterpriseSso: boolean;
  routingMessage?: string | null;
  appRole?: string | null;
};

export async function validateInvitationToken(token: string): Promise<InvitationValidationResponse> {
  const response = await fetch(
    `/api/proxy/v1/auth/invitations/validate?token=${encodeURIComponent(token)}`,
    mergeRegistrationScopeForProxy({
      headers: { Accept: "application/json" },
      cache: "no-store",
    }),
  );

  if (!response.ok) {
    const bodyText = await response.text();

    throw buildApiRequestErrorFromParts(response, bodyText);
  }

  return (await response.json()) as InvitationValidationResponse;
}

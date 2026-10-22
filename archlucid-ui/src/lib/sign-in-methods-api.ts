import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  SignInMethodsApiError,
  classifySignInMethodsHttpFailure,
  classifySignInMethodsUnknownFailure,
} from "@/lib/sign-in-methods-problem";

export type SignInMethodSummary = {
  identityId: string;
  providerType: string;
  providerLabel: string;
  maskedIdentifier?: string | null;
  addedUtc: string;
  lastUsedUtc?: string | null;
  isActive: boolean;
  canRemove: boolean;
};

export type AuthenticationIdentityLinkProposal = {
  proposalId: string;
  providerType: string;
  providerLabel: string;
  maskedIdentifier?: string | null;
  requiresExplicitConfirmation: boolean;
  confirmationMessage: string;
  expiresUtc: string;
};

export type EmailLinkChallengeResponse = {
  challengeId: string;
};

async function signInMethodsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const opts = mergeRegistrationScopeForProxy({
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
    ...init,
  });

  let response: Response;

  try {
    response = await fetch(path, opts);
  } catch (error) {
    throw new SignInMethodsApiError(classifySignInMethodsUnknownFailure(error));
  }

  if (!response.ok) {
    const text = await response.text();
    const contentType = response.headers.get("content-type");
    throw new SignInMethodsApiError(classifySignInMethodsHttpFailure(response.status, text, contentType));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchSignInMethods(): Promise<SignInMethodSummary[]> {
  return signInMethodsFetch<SignInMethodSummary[]>("/api/proxy/v1/auth/sign-in-methods");
}

export async function requestEmailLinkChallenge(email: string): Promise<EmailLinkChallengeResponse> {
  return signInMethodsFetch<EmailLinkChallengeResponse>("/api/proxy/v1/auth/sign-in-methods/email-otp/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmailLinkChallenge(
  challengeId: string,
  code: string,
): Promise<AuthenticationIdentityLinkProposal> {
  return signInMethodsFetch<AuthenticationIdentityLinkProposal>(
    "/api/proxy/v1/auth/sign-in-methods/email-otp/verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, code }),
    },
  );
}

export async function confirmSignInMethodLinkProposal(proposalId: string): Promise<void> {
  await signInMethodsFetch<{ identityId: string; providerType: string }>(
    `/api/proxy/v1/auth/sign-in-methods/proposals/${encodeURIComponent(proposalId)}/confirm`,
    { method: "POST" },
  );
}

export async function cancelSignInMethodLinkProposal(proposalId: string): Promise<void> {
  await signInMethodsFetch<void>(
    `/api/proxy/v1/auth/sign-in-methods/proposals/${encodeURIComponent(proposalId)}`,
    { method: "DELETE" },
  );
}

export async function removeSignInMethod(identityId: string): Promise<void> {
  await signInMethodsFetch<void>(`/api/proxy/v1/auth/sign-in-methods/${encodeURIComponent(identityId)}`, {
    method: "DELETE",
  });
}

export type AuthSignInRoutingApiResponse = {
  allowEmailCode: boolean;
  ssoRequired: boolean;
  message?: string | null;
  returnPath?: string | null;
};

export async function evaluateAuthSignInRouting(
  email: string,
  invitationToken: string | null,
  returnPath?: string | null,
): Promise<AuthSignInRoutingApiResponse | null> {
  try {
    const response = await fetch("/api/proxy/v1/auth/routing/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email,
        invitationToken: invitationToken ?? undefined,
        returnPath: returnPath ?? undefined,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AuthSignInRoutingApiResponse;
  } catch {
    return null;
  }
}

import { isLikelySignedIn } from "@/lib/oidc/session";
import { registrationScopeHeaders } from "@/lib/registration-session";

/**
 * Merges `x-tenant-id` / `x-workspace-id` / `x-project-id` from the post-registration browser session
 * into same-origin `/api/proxy/*` fetches when the operator has **not** completed OIDC sign-in.
 * JWT-bound scope wins on the API when claims are present; these headers unblock DevelopmentBypass
 * onboarding before the buyer signs in.
 */
export function mergeRegistrationScopeForProxy(input?: RequestInit): RequestInit {
  if (isLikelySignedIn()) {
    return input ?? {};
  }

  const scope = registrationScopeHeaders();

  if (scope === null) {
    return input ?? {};
  }

  const headers = new Headers(input?.headers);

  for (const [key, value] of Object.entries(scope)) {
    headers.set(key, value);
  }

  return { ...input, headers };
}

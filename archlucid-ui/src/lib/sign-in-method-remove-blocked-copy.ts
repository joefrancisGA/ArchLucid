import type { SignInMethodSummary } from "@/lib/sign-in-methods-api";

/** Mirrors `SignInMethodRemovalPolicyService` customer messages when the API omits a reason. */
export const SIGN_IN_METHOD_LAST_REMAINING_BLOCKED_REASON =
  "At least one sign-in method must remain on your account." as const;

export const SIGN_IN_METHOD_ENTERPRISE_SSO_BLOCKED_REASON =
  "Your organization requires enterprise sign-in. Add another organization sign-in method before removing this one." as const;

export const SIGN_IN_METHOD_INACTIVE_BLOCKED_REASON =
  "This sign-in method is inactive and cannot be removed here." as const;

export const SIGN_IN_METHOD_GENERIC_BLOCKED_REASON =
  "This sign-in method cannot be removed right now." as const;

const ENTERPRISE_PROVIDER_TYPES = new Set([
  "MicrosoftIdentity",
  "TenantOidc",
  "TenantSaml",
  "GoogleIdentity",
]);

function isEnterpriseProviderType(providerType: string): boolean {
  return ENTERPRISE_PROVIDER_TYPES.has(providerType);
}

/** Buyer-facing reason when `canRemove` is false on the sign-in methods list. */
export function resolveSignInMethodRemoveBlockedReason(
  method: SignInMethodSummary,
  allMethods: readonly SignInMethodSummary[],
): string {
  if (!method.isActive) {
    return SIGN_IN_METHOD_INACTIVE_BLOCKED_REASON;
  }

  const activeMethods = allMethods.filter((row) => row.isActive);

  if (activeMethods.length <= 1) {
    return SIGN_IN_METHOD_LAST_REMAINING_BLOCKED_REASON;
  }

  if (isEnterpriseProviderType(method.providerType)) {
    const anotherEnterpriseRemains = activeMethods.some(
      (row) =>
        row.identityId !== method.identityId && isEnterpriseProviderType(row.providerType),
    );

    if (!anotherEnterpriseRemains) {
      return SIGN_IN_METHOD_ENTERPRISE_SSO_BLOCKED_REASON;
    }
  }

  return SIGN_IN_METHOD_GENERIC_BLOCKED_REASON;
}

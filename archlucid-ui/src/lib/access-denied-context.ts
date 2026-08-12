import type { CurrentPrincipal } from "@/lib/current-principal";
import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";
import { readLastRegistrationPayload } from "@/lib/registration-session";

export type AccessDeniedSupplementMessage = "missing-role" | "wrong-tenant";

export const ACCESS_DENIED_HEADING = "You don't have access to ArchLucid yet";

export const ACCESS_DENIED_BODY =
  "You're signed in, but your account has not been assigned an ArchLucid app role for this tenant. Ask your administrator to assign access, then sign in again.";

export const ACCESS_DENIED_REQUIRED_ROLES = "Required roles: Admin, Operator, Reader, or Auditor.";

export const ACCESS_DENIED_SUPPLEMENT_COPY: Readonly<Record<AccessDeniedSupplementMessage, string>> = {
  "missing-role": "No ArchLucid app role was found for this account.",
  "wrong-tenant": "This account is not authorized for the selected tenant.",
};

/**
 * True when the hydrated principal should be routed to `/403` (signed-in but no recognized ArchLucid app role).
 */
export function operatorPrincipalLacksArchLucidAccess(
  principal: CurrentPrincipal,
  options: { jwtSignedIn: boolean },
): boolean {
  if (principal.provenance === "auth-me") {
    return !principal.hasRecognizedArchLucidRole;
  }

  if (
    options.jwtSignedIn
    && principal.provenance === "synthetic"
    && principal.syntheticReason === "me-http"
  ) {
    return true;
  }

  return false;
}

/** Optional secondary line when the shell can infer missing roles vs tenant mismatch. */
export function resolveAccessDeniedSupplementMessage(
  principal: CurrentPrincipal,
  options: { jwtSignedIn: boolean },
): AccessDeniedSupplementMessage | null {
  if (principal.provenance === "auth-me" && !principal.hasRecognizedArchLucidRole) {
    return "missing-role";
  }

  if (
    options.jwtSignedIn
    && principal.provenance === "synthetic"
    && principal.syntheticReason === "me-http"
  ) {
    return "wrong-tenant";
  }

  return null;
}

/** Buyer-safe tenant label for support triage — workspace name when known, otherwise tenant id. */
export function formatAccessDeniedTenantLabel(scope: OperatorScopeRecord | null): string | null {
  if (scope === null) {
    return null;
  }

  if (scope.workspaceLabel.length > 0) {
    return scope.workspaceLabel;
  }

  if (scope.tenantId.length > 0) {
    return scope.tenantId;
  }

  return null;
}

/** Example: `2026-07-06 18:42 EDT` */
export function formatAccessDeniedSupportTimestamp(date: Date, timeZone?: string): string {
  const resolvedTimeZone = timeZone ?? "UTC";
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: resolvedTimeZone,
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  const dateSegment = `${lookup("year")}-${lookup("month")}-${lookup("day")}`;
  const timeSegment = `${lookup("hour")}:${lookup("minute")}`;
  const zoneSegment = lookup("timeZoneName");

  if (zoneSegment.length > 0) {
    return `${dateSegment} ${timeSegment} ${zoneSegment}`;
  }

  return `${dateSegment} ${timeSegment}`;
}

/**
 * Returns a `mailto:` href when a tenant admin email was captured during self-service registration.
 * Omit the contact action when no configured administrator contact exists.
 */
export function resolveAdministratorContactHref(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const adminEmail = readLastRegistrationPayload()?.adminEmail?.trim() ?? "";

  if (adminEmail.length === 0 || !adminEmail.includes("@")) {
    return null;
  }

  const subject = encodeURIComponent("ArchLucid access request");

  return `mailto:${adminEmail}?subject=${subject}`;
}

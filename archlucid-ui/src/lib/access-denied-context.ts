import type { CurrentPrincipal } from "@/lib/current-principal";
import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import {
  accessDeniedBody,
  accessDeniedHeading,
  accessDeniedMailtoSubject,
  accessDeniedSupplementCopy,
} from "@/lib/product-line/product-line-display-name";
import { readLastRegistrationPayload } from "@/lib/registration-session";

export type AccessDeniedSupplementMessage = "missing-role" | "wrong-tenant";

/** Architecture-shell default for legacy imports and tests. */
export const ACCESS_DENIED_HEADING = accessDeniedHeading("architecture");

/** Architecture-shell default for legacy imports and tests. */
export const ACCESS_DENIED_BODY = accessDeniedBody("architecture");

export const ACCESS_DENIED_REQUIRED_ROLES = "Required roles: Admin, Operator, Reader, or Auditor.";

export const ACCESS_DENIED_SUPPLEMENT_COPY: Readonly<Record<AccessDeniedSupplementMessage, string>> = {
  "missing-role": accessDeniedSupplementCopy("architecture", "missing-role"),
  "wrong-tenant": accessDeniedSupplementCopy("architecture", "wrong-tenant"),
};

export function resolveAccessDeniedHeading(productLineId: ProductLineId): string {
  return accessDeniedHeading(productLineId);
}

export function resolveAccessDeniedBody(productLineId: ProductLineId): string {
  return accessDeniedBody(productLineId);
}

export function resolveAccessDeniedSupplementCopy(
  productLineId: ProductLineId,
  message: AccessDeniedSupplementMessage,
): string {
  return accessDeniedSupplementCopy(productLineId, message);
}

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
export function resolveAdministratorContactHref(productLineId: ProductLineId = "architecture"): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const adminEmail = readLastRegistrationPayload()?.adminEmail?.trim() ?? "";

  if (adminEmail.length === 0 || !adminEmail.includes("@")) {
    return null;
  }

  const subject = encodeURIComponent(accessDeniedMailtoSubject(productLineId));

  return `mailto:${adminEmail}?subject=${subject}`;
}

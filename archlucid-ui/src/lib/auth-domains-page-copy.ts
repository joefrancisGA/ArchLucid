import type { ErrorRecoveryContractPresentation } from "@/lib/error-recovery-contract-copy";
import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";

export const AUTH_DOMAINS_PAGE_TITLE = "Sign-in domains" as const;

export const AUTH_DOMAINS_PAGE_SUBTITLE =
  "Verify email domain ownership, test routing, and enable SSO enforcement for this tenant." as const;

export const AUTH_DOMAINS_AUTHENTICATION_HELP_CTA = "Open authentication help" as const;

export const AUTH_DOMAINS_SOURCES_DISCLOSURE_TITLE = "Sources and follow-up links" as const;

export const AUTH_DOMAINS_ADMIN_AUTHORITY_READY_LABEL = "Admin authority" as const;

export const AUTH_DOMAINS_ADMIN_AUTHORITY_BLOCKED_LABEL = "Admin authority required" as const;

/** @deprecated Prefer {@link authDomainsAdminAuthorityPresentation}. */
export const AUTH_DOMAINS_ADMIN_AUTHORITY_LABEL = AUTH_DOMAINS_ADMIN_AUTHORITY_BLOCKED_LABEL;

export const AUTH_DOMAINS_ZERO_DOMAIN_POSTURE_LABEL = "Email code sign-in" as const;

export const AUTH_DOMAINS_ZERO_DOMAIN_POSTURE_DETAIL =
  "SSO is not active for this tenant. Users sign in with email codes until you verify a domain and enable enforcement." as const;

export const AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_TITLE = "Before you add a domain" as const;

export const AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_ITEMS = [
  "You need access to publish a DNS TXT record for the domain.",
  "DNS propagation is asynchronous — verification can take minutes or longer.",
  "Adding a domain does not change sign-in behavior until you verify DNS and enable enforcement.",
] as const;

export const AUTH_DOMAINS_ADD_DOMAIN_READINESS =
  "Enter a domain name to continue." as const;

export const AUTH_DOMAINS_DOMAIN_LABEL = "Domain name" as const;

export const AUTH_DOMAINS_DOMAIN_FORMAT_ERROR =
  "Enter a valid domain name such as example.com." as const;

export const AUTH_DOMAINS_EMPTY_TITLE = "No sign-in domains yet" as const;

export const AUTH_DOMAINS_EMPTY_DESCRIPTION =
  "Add an email domain to verify DNS ownership, test SSO routing, and prepare tenant-wide enforcement." as const;

export const AUTH_DOMAINS_EMPTY_FOCUS_ACTION_LABEL = "Add your first domain" as const;

export const AUTH_DOMAINS_JOURNEY_STEPS = [
  { id: "add", label: "Add domain" },
  { id: "verify-dns", label: "Verify DNS" },
  { id: "test-routing", label: "Test routing" },
  { id: "enforce", label: "Enforce SSO" },
] as const;

export type AuthDomainsJourneyStepId = (typeof AUTH_DOMAINS_JOURNEY_STEPS)[number]["id"];

export const AUTH_DOMAINS_JOURNEY_SECTION_IDS: Record<AuthDomainsJourneyStepId, string> = {
  add: "auth-domains-journey-target-add",
  "verify-dns": "auth-domains-journey-target-verify-dns",
  "test-routing": "auth-domains-journey-target-test-routing",
  enforce: "auth-domains-journey-target-enforce",
};

export const AUTH_DOMAINS_MUTATION_ERROR_SUMMARY =
  "This sign-in domain action did not complete." as const;

export const AUTH_DOMAINS_MUTATION_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "ArchLucid could not complete the sign-in domain change.",
  whatIsIntact:
    "Existing verified domains, routing tests, and enforcement settings for this tenant were not changed by this failed request.",
  nextStep:
    "Confirm DNS records and identity-provider configuration, then retry. Open troubleshooting if the error repeats.",
};

export const AUTH_DOMAINS_LIST_LOAD_ERROR_SUMMARY =
  "Sign-in domains could not be loaded." as const;

export const AUTH_DOMAINS_LIST_LOAD_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "The sign-in domains list did not load.",
  whatIsIntact: "Configured domains and enforcement settings on the server are unchanged.",
  nextStep: "Retry loading this page, then open troubleshooting if the list stays unavailable.",
};

/**
 * The stored scope names the *workspace* the operator is browsing, never the tenant. Returning the
 * raw `tenantId` here would print a UUID on a buyer-visible surface, so an unlabelled scope resolves
 * to `null` and the scope line falls back to organization-only wording.
 */
export function resolveAuthDomainsCurrentWorkspaceLabel(scope: OperatorScopeRecord | null): string | null {
  if (scope === null) {
    return null;
  }

  const workspaceLabel = scope.workspaceLabel.trim();

  return workspaceLabel.length > 0 ? workspaceLabel : null;
}

const AUTH_DOMAINS_TENANT_SCOPE_PREFIX =
  "Tenant scope: these sign-in domains apply tenant-wide, to every workspace in this organization";

/**
 * Names the current workspace as one of the affected workspaces rather than as the organization —
 * the shell switcher shows a workspace, and conflating the two is what makes enforcement feel unsafe.
 */
export function authDomainsTenantScopeLine(currentWorkspaceLabel: string | null): string {
  if (currentWorkspaceLabel === null || currentWorkspaceLabel.length === 0) {
    return `${AUTH_DOMAINS_TENANT_SCOPE_PREFIX}.`;
  }

  return `${AUTH_DOMAINS_TENANT_SCOPE_PREFIX} — including ${currentWorkspaceLabel}.`;
}

export function isPlausibleAuthDomainInput(value: string): boolean {
  const trimmed = value.trim().toLowerCase();

  if (trimmed.length === 0 || trimmed.length > 253) {
    return false;
  }

  if (trimmed.includes("://") || trimmed.includes("/") || trimmed.includes("@") || trimmed.includes(" ")) {
    return false;
  }

  const labels = trimmed.split(".");

  if (labels.length < 2) {
    return false;
  }

  return labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
}

export function resolveAuthDomainsJourneyStep(args: {
  readonly domainCount: number;
  readonly selectedDomain: {
    readonly verificationStatus: string;
    readonly routingTestPassedUtc?: string | null;
  } | null;
  readonly domains: readonly {
    readonly verificationStatus: string;
    readonly routingTestPassedUtc?: string | null;
  }[];
}): AuthDomainsJourneyStepId {
  if (args.domainCount === 0) {
    return "add";
  }

  const focusDomain = args.selectedDomain ?? args.domains[0] ?? null;

  if (focusDomain === null) {
    return "add";
  }

  if (focusDomain.verificationStatus !== "Verified") {
    return "verify-dns";
  }

  if (focusDomain.routingTestPassedUtc === null || focusDomain.routingTestPassedUtc === undefined) {
    return "test-routing";
  }

  return "enforce";
}

export function successMessageForAuthDomainAction(
  actionLabel: string,
  displayDomain: string,
): string {
  return `${actionLabel} for ${displayDomain}.`;
}

export function authDomainsAdminAuthorityPresentation(hasAdminAuthority: boolean): {
  readonly kind: "ready" | "needs-attention";
  readonly label: string;
} {
  if (hasAdminAuthority) {
    return { kind: "ready", label: AUTH_DOMAINS_ADMIN_AUTHORITY_READY_LABEL };
  }

  return { kind: "needs-attention", label: AUTH_DOMAINS_ADMIN_AUTHORITY_BLOCKED_LABEL };
}

export function authDomainsTenantSignInPosture(
  domains: readonly { readonly verificationStatus: string; readonly isEnforcementActive: boolean }[],
): {
  readonly kind: "neutral" | "ready" | "needs-attention";
  readonly label: string;
  readonly detail: string;
} {
  if (domains.length === 0) {
    return {
      kind: "neutral",
      label: AUTH_DOMAINS_ZERO_DOMAIN_POSTURE_LABEL,
      detail: AUTH_DOMAINS_ZERO_DOMAIN_POSTURE_DETAIL,
    };
  }

  const verifiedCount = domains.filter((row) => row.verificationStatus === "Verified").length;
  const enforcingCount = domains.filter((row) => row.isEnforcementActive).length;
  const domainCount = domains.length;

  if (enforcingCount > 0) {
    return {
      kind: "ready",
      label: `${enforcingCount} domain${enforcingCount === 1 ? "" : "s"} enforcing SSO`,
      detail: `${enforcingCount} of ${domainCount} domain${domainCount === 1 ? "" : "s"} require SSO for matching email addresses. ${verifiedCount} verified overall.`,
    };
  }

  if (verifiedCount > 0) {
    return {
      kind: "needs-attention",
      label: `${verifiedCount} verified domain${verifiedCount === 1 ? "" : "s"}`,
      detail: `${verifiedCount} of ${domainCount} domain${domainCount === 1 ? "" : "s"} verified. SSO enforcement is not active until you complete routing tests and enable enforcement.`,
    };
  }

  return {
    kind: "neutral",
    label: `${domainCount} domain${domainCount === 1 ? "" : "s"} pending verification`,
    detail: "No domains verified yet. Users still sign in with email codes until verification and enforcement complete.",
  };
}

export function authDomainsJourneyStepAriaLabel(stepIndex: number, stepLabel: string): string {
  return `Go to step ${stepIndex + 1}: ${stepLabel}`;
}

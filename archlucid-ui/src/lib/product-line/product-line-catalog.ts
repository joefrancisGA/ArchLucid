import type { ProductLineAssignment } from "@/lib/product-line/product-line-assignment";

/**
 * Canonical product-line assignments for operator nav hrefs.
 *
 * Unlisted nav hrefs default to **Architecture** (`DEFAULT_PRODUCT_LINE_ASSIGNMENT`).
 * Change a value here (or in the `/internal/product-line` playground) to move a feature
 * between shells without duplicating pages.
 *
 * Security product spine: the `operate-infrastructure` group (`/governance/infrastructure/*`)
 * plus inventory intake (cloud connections / extract-upload) and OpSec factory pages that
 * already sit under Approval nav.
 */
export const PRODUCT_LINE_NAV_ASSIGNMENTS: Readonly<Record<string, ProductLineAssignment>> = {
  "/": "both",

  // Infrastructure evidence workbenches (operate-infrastructure).
  "/governance/infrastructure": "both",
  "/governance/infrastructure/drift": "both",
  "/governance/infrastructure/terraform": "both",
  "/governance/infrastructure/diagrams": "both",
  "/governance/infrastructure/diagram-reconcile": "both",
  "/governance/infrastructure/resources": "both",
  "/governance/infrastructure/ask": "both",
  "/governance/infrastructure/remediation": "both",

  // Operational-security factory (still parked under Approval nav today).
  "/governance/remediation-factory": "both",
  "/governance/remediation-patterns": "both",
  "/governance/audit-evidence": "both",

  // Inventory collection and outbound remediation bridges.
  "/integrations/cloud-connections": "both",
  "/integrations/jira": "both",
  "/integrations/azure-boards": "both",
  "/integrations/servicenow": "both",
  "/integrations/teams": "both",
  "/integrations/slack": "both",
  "/integrations/webhooks": "both",

  // Shared tenant administration.
  "/administration": "both",
  "/administration/notifications": "both",
  "/administration/workspace-settings": "both",
  "/administration/branding": "both",
  "/administration/users": "both",
  "/administration/identity-providers": "both",
  "/administration/scim-provisioning": "both",
  "/administration/billing": "both",
  "/administration/security-trust": "both",
  "/administration/connection-status": "both",
  "/administration/system-health": "both",
  "/administration/support": "both",

  // Recycle bin restores architecture projects — keep it off the Security shell even though
  // `/administration/workspace-settings` itself is shared (exact match beats the nested prefix).
  "/administration/workspace-settings/recycle-bin": "architecture",

  // Shared operator diagnostics (Internal). Architecture-only GTM rows stay unlisted.
  "/internal/health": "both",
  "/internal/deployment-status": "both",
  "/internal/configuration": "both",
  "/internal/failed-integration-messages": "both",
  "/internal/operational-errors": "both",
  "/internal/tenants": "both",
  "/internal/tenant-health": "both",
};

/**
 * Destinations that are not sidebar rows but must remain reachable in the Security shell
 * (settings hub leaves, OAuth returns, playground).
 */
export const PRODUCT_LINE_EXTRA_ASSIGNMENTS: Readonly<Record<string, ProductLineAssignment>> = {
  "/administration/extract-upload": "both",
  "/administration/auth-domains": "both",
  "/administration/identity/sso-wizard": "both",
  "/integrations/itsm/oauth/callback": "both",
  "/internal/product-line": "both",
};

/** Nested URL trees that inherit the parent catalog assignment. */
export const PRODUCT_LINE_NESTED_PREFIXES: readonly string[] = [
  "/governance/infrastructure",
  "/governance/audit-evidence",
  "/governance/remediation-patterns",
  "/governance/remediation-factory",
  "/integrations/cloud-connections",
  "/integrations/jira",
  "/integrations/azure-boards",
  "/integrations/servicenow",
  "/integrations/teams",
  "/integrations/slack",
  "/integrations/webhooks",
  "/administration/workspace-settings",
  "/administration/identity-providers",
  "/administration/identity",
  "/administration/auth-domains",
  "/administration/users",
  "/help",
  "/account",
  "/auth",
];

/** Always reachable in every product (account, help, auth, playground). */
export const PRODUCT_LINE_ALWAYS_ALLOWED_PREFIXES: readonly string[] = [
  "/help",
  "/account",
  "/auth",
  "/403",
  "/why-archlucid",
  "/internal/product-line",
];

export const INTERNAL_PRODUCT_LINE_PATH = "/internal/product-line";

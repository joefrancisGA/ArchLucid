import { API_CONTRACTS_HELP_PATH } from "@/lib/api-contracts-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Canonical OpenAPI document path — contract of record for integrators. */
export const API_CONTRACTS_OPENAPI_PATH = "/openapi/v1.json";

/** Title leads with API contracts, not buyer “Governance …” FAQ framing. */
export const API_CONTRACTS_HELP_PAGE_TITLE = "API contracts (technical reference)";

export const API_CONTRACTS_HELP_PAGE_SUBTITLE =
  "Admin/developer HTTP contract reference — OpenAPI, auth, and versioned endpoint behavior. Not buyer governance-approval help.";

export const API_CONTRACTS_HELP_ACTION_PANEL_TITLE = "Contract of record";

export const API_CONTRACTS_HELP_SOURCES_DISCLOSURE_TITLE = "Sources";

export const API_CONTRACTS_HELP_SOURCES_DISCLOSURE_INTRO =
  "Merged from the repository API contracts reference — contributor CI and snapshot commands are stripped in-app.";

export const API_CONTRACTS_HELP_SOURCES_STRIP_TITLE = "Related diligence topics";

export const API_CONTRACTS_HELP_SOURCES_STRIP_INTRO =
  "Use engineering troubleshooting, audit trail, and admin diagnostics when the issue is live-surface signals — not HTTP contract text.";

export const API_CONTRACTS_HELP_PRIMARY_ACTIONS = {
  openOpenApi: {
    label: "OpenAPI contract",
    href: API_CONTRACTS_OPENAPI_PATH,
  },
} as const;

export type ApiContractsHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Admin Sources — no self-href to this eng runbook. */
export const API_CONTRACTS_HELP_SOURCES: readonly ApiContractsHelpSourceLink[] = [
  { label: "CLI usage", href: inAppHelpHref("cli-usage") },
  { label: "Configuration reference", href: inAppHelpHref("configuration-reference") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("developer-troubleshooting") },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "Admin diagnostics", href: inAppHelpHref("admin-diagnostics") },
] as const;

export const API_CONTRACTS_HELP_CANONICAL_PATH = API_CONTRACTS_HELP_PATH;

/** Reconciliation copy ties the in-app surface to registry verification metadata. */
export function formatApiContractsHelpReconciliationCopy(lastReviewed: string): string {
  return `Reconciled against docs/library/API_CONTRACTS.md on ${lastReviewed}. Prefer GET /openapi/v1.json when prose and OpenAPI disagree.`;
}

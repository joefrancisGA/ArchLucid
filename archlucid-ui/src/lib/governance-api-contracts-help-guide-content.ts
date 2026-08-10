import { GOVERNANCE_API_CONTRACTS_HELP_PATH } from "@/lib/governance-api-contracts-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Canonical OpenAPI document path — contract of record for integrators. */
export const GOVERNANCE_API_CONTRACTS_OPENAPI_PATH = "/openapi/v1.json";

/** TB-1386 — title leads with API contracts, not buyer “Governance …” FAQ framing. */
export const GOVERNANCE_API_CONTRACTS_HELP_PAGE_TITLE = "API contracts (technical reference)";

export const GOVERNANCE_API_CONTRACTS_HELP_PAGE_SUBTITLE =
  "Admin/developer HTTP contract reference — OpenAPI, auth, and versioned endpoint behavior. Not buyer governance-approval help.";

export const GOVERNANCE_API_CONTRACTS_HELP_OVERVIEW =
  "Use this runbook when you need the versioned HTTP contract of record for integrators and Admin support. Architects looking for approval workflows should open Governance approval instead. Prefer the published OpenAPI document over prose when the two disagree.";

export const GOVERNANCE_API_CONTRACTS_HELP_CLAIM_DISCIPLINE =
  "This Admin API-contracts runbook is integrator technical reference — not buyer self-serve governance help and not certification.";

export const GOVERNANCE_API_CONTRACTS_HELP_ACTION_PANEL_TITLE = "Contract-of-record paths";

export const GOVERNANCE_API_CONTRACTS_HELP_ORIENTATION_TITLE = "How to use this reference";

export const GOVERNANCE_API_CONTRACTS_HELP_SOURCES_DISCLOSURE_TITLE = "Sources";

export const GOVERNANCE_API_CONTRACTS_HELP_SOURCES_DISCLOSURE_INTRO =
  "Merged from the repository API contracts reference — contributor CI and snapshot commands are stripped in-app.";

export const GOVERNANCE_API_CONTRACTS_HELP_SOURCES_STRIP_TITLE = "Related diligence topics";

export const GOVERNANCE_API_CONTRACTS_HELP_SOURCES_STRIP_INTRO =
  "Use engineering troubleshooting, audit trail, and admin diagnostics when the issue is live-surface signals — not HTTP contract text.";

export const GOVERNANCE_API_CONTRACTS_HELP_ORIENTATION = [
  "Confirm you need HTTP/OpenAPI contract detail — not the buyer Governance approval FAQ.",
  "Treat OpenAPI as the contract of record when prose and the document disagree.",
  "Use CLI usage or Engineering troubleshooting when the issue is tooling, not the contract text.",
] as const;

export const GOVERNANCE_API_CONTRACTS_HELP_PRIMARY_ACTIONS = {
  openOpenApi: {
    label: "OpenAPI contract (v1)",
    href: GOVERNANCE_API_CONTRACTS_OPENAPI_PATH,
  },
  openCliUsage: {
    label: "CLI usage",
    href: inAppHelpHref("cli-usage"),
  },
  openConfigurationReference: {
    label: "Configuration reference",
    href: inAppHelpHref("configuration-reference"),
  },
  openBuyerGovernanceApproval: {
    label: "Governance approval (buyer)",
    href: inAppHelpHref("governance-approval"),
  },
} as const;

export type GovernanceApiContractsHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Admin Sources — no self-href to this eng runbook. */
export const GOVERNANCE_API_CONTRACTS_HELP_SOURCES: readonly GovernanceApiContractsHelpSourceLink[] = [
  { label: "CLI usage", href: inAppHelpHref("cli-usage") },
  { label: "Configuration reference", href: inAppHelpHref("configuration-reference") },
  { label: "Engineering troubleshooting", href: inAppHelpHref("developer-troubleshooting") },
  { label: "Governance approval", href: inAppHelpHref("governance-approval") },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "Admin diagnostics", href: inAppHelpHref("admin-diagnostics") },
] as const;

export const GOVERNANCE_API_CONTRACTS_HELP_CANONICAL_PATH = GOVERNANCE_API_CONTRACTS_HELP_PATH;

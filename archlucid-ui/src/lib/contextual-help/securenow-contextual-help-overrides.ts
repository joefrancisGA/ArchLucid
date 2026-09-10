import type { PageContextualHelpEntry } from "@/lib/contextual-help/types";
import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH, GOVERNANCE_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH, GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH, GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { CLOUD_CONNECTIONS_CANONICAL_PATH } from "@/lib/cloud-connections-evidence-copy";
import { CLOUD_CONNECTIONS_HELP_PATH } from "@/lib/cloud-connections-help-guide-content";
import { ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH } from "@/lib/enterprise-onboarding-help-evidence-copy";
import { FINDINGS_HELP_PATH } from "@/lib/findings/findings-help-route";
import { IDENTITY_PROVIDERS_SETTINGS_CANONICAL_PATH } from "@/lib/identity-providers-settings-evidence-copy";
import { INTEGRATION_READINESS_HELP_CANONICAL_PATH } from "@/lib/integration-readiness-help-evidence-copy";
import { INTEGRATIONS_JIRA_PATH, INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { INVITE_REVIEWER_CANONICAL_PATH } from "@/lib/invite-reviewer-evidence-copy";
import { SETTINGS_USERS_CANONICAL_PATH } from "@/lib/settings-users-evidence-copy";
import { POLICY_PACKS_HELP_CANONICAL_PATH } from "@/lib/policy/policy-packs-help-evidence-copy";
import { SSO_WIZARD_CANONICAL_PATH } from "@/lib/sso-wizard-evidence-copy";
import { STANDARDS_RULES_HELP_CANONICAL_PATH } from "@/lib/standards-rules-help-evidence-copy";
import { USERS_AND_ROLES_HELP_CANONICAL_PATH } from "@/lib/users-and-roles-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

const SECURENOW_FINDINGS_QUEUE_HUB: PageContextualHelpEntry = {
  whatIsThisPage:
    "Triage open findings raised by ARC-AMPE policy packs against connected cloud inventory evidence in this workspace.",
  whatToDoNext: "Open a finding, assign an owner, and follow the resource evidence hub or audit lineage when context is missing.",
  whyEmpty: "Rows appear after policy packs apply to connected inventory — not after architecture reviews finalize.",
  whereToConfigurePrerequisite: "Assign ARC-AMPE policy packs and connect Azure before expecting inventory-backed findings.",
  whatToDoNextAction: {
    label: "Open assigned-to-me",
    href: SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH,
  },
  whereToConfigureAction: {
    label: "Open policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
  taskSteps: [
    "Open a finding to inspect severity, evidence, and owners.",
    "Assign owners or continue your assigned queue.",
    "Follow resource explorer or audit lineage when evidence context is missing.",
  ],
};

const SECURENOW_FINDINGS_HELP_TOPIC: PageContextualHelpEntry = {
  whatIsThisPage:
    "Findings help — triage ARC-AMPE and cloud-inventory findings, inspect evidence, and assign remediation owners.",
  whatToDoNext: "Open the findings queue or your assigned-to-me lane, then follow policy packs when packs need tuning.",
  whyEmpty: "This guide is always available; live findings appear after packs evaluate connected inventory.",
  whereToConfigurePrerequisite: "Findings respect the workspace and project selected in the header switcher.",
  whatToDoNextAction: {
    label: "Open findings queue",
    href: GOVERNANCE_FINDINGS_PATH,
  },
  whereToConfigureAction: {
    label: "Open policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
};

const SECURENOW_ASSIGNED_TO_ME_FINDINGS: PageContextualHelpEntry = {
  whatIsThisPage:
    "Your personal queue of open findings assigned to you for remediation and follow-up in this workspace.",
  whatToDoNext: "Open the continue-oldest strip or a row to work the next assigned finding.",
  whyEmpty:
    "Nothing is assigned to you yet — the queue uses the assigned-to-me register and excludes closed or other owners' rows.",
  whereToConfigurePrerequisite:
    "When the tenant queue is also empty, assign ARC-AMPE policy packs and confirm Azure inventory is connected.",
  whatToDoNextAction: {
    label: "Open tenant findings queue",
    href: GOVERNANCE_FINDINGS_PATH,
  },
  whereToConfigureAction: {
    label: "Open policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
  taskSteps: [
    "Use continue oldest when the strip is visible.",
    "Open a row to inspect evidence and owners.",
    "Return to policy packs when no findings exist because packs never ran.",
  ],
};

const SECURENOW_POLICY_PACKS_HUB: PageContextualHelpEntry = {
  whatIsThisPage:
    "Assign and order ARC-AMPE and other policy packs for this workspace, including priority floors for cloud evidence scans.",
  whatToDoNext: "Open a pack, set priority floors, then open standards and rules or findings to confirm effective rules.",
  whyEmpty: "Packs appear after bundled packs are available for this workspace.",
  whereToConfigurePrerequisite: "Policy packs respect the workspace and project selected in the header switcher.",
  taskSteps: [
    "Open a pack to inspect rules and version history.",
    "Set priority floors for cloud evidence scans.",
    "Open standards and rules or findings to confirm outcomes.",
  ],
};

const SECURENOW_POLICY_PACKS_HELP: PageContextualHelpEntry = {
  whatIsThisPage: "Policy packs help — assign ARC-AMPE packs, tune priority floors, and understand hierarchical merge for cloud evidence.",
  whatToDoNext: "Open Policy packs for live assignments, then Standards and rules or Findings when violations need triage.",
  whyEmpty: "This guide is always available; live pack rows appear after packs are assigned in this workspace.",
  whereToConfigurePrerequisite: "Pack assignment needs a role that can manage policy packs for this workspace.",
  whatToDoNextAction: {
    label: "Open Policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
};

const SECURENOW_STANDARDS_RULES_HUB: PageContextualHelpEntry = {
  whatIsThisPage:
    "Inspect effective ARC-AMPE and other pack rules for the active workspace scope, including enforcement mode, conflicts, and precedence.",
  whatToDoNext: "Open a rule row, follow linked findings or evidence, then export a resolution snapshot when needed.",
  whyEmpty: "Rules appear after policy packs are assigned to this workspace scope.",
  whereToConfigurePrerequisite: "Assign and order policy packs for the current workspace and project scope.",
  whatToDoNextAction: {
    label: "Open policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
  whereToConfigureAction: {
    label: "Open findings",
    href: GOVERNANCE_FINDINGS_PATH,
  },
  taskSteps: [
    "Open a rule row to read enforcement mode and source pack.",
    "Follow linked findings or evidence when resolution needs context.",
    "Export a resolution snapshot when you need a citeable record.",
  ],
};

const SECURENOW_STANDARDS_RULES_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Standards and rules — how effective policy resolution rows apply to the active workspace scope, not a sealed architecture review.",
  whatToDoNext: "Open standards and rules for this workspace scope, then follow policy packs or findings when maintenance is required.",
  whyEmpty: "This guide is always available; rule rows appear when packs are assigned to this scope.",
  whereToConfigurePrerequisite: "Policy packs help explains how packs are authored, versioned, and assigned across scopes.",
  whatToDoNextAction: {
    label: "Open standards and rules",
    href: GOVERNANCE_STANDARDS_AND_RULES_PATH,
  },
  whereToConfigureAction: {
    label: "Read policy packs help",
    href: inAppHelpHref("policy-packs"),
  },
};

const SECURENOW_CLOUD_CONNECTIONS_HUB: PageContextualHelpEntry = {
  whatIsThisPage:
    "Connect Azure for optional read-only inventory collection, or upload a validated inventory ZIP when no connector is configured.",
  whatToDoNext: "Open Azure connection settings, run preflight, or open Extract and upload for a local ZIP package.",
  whyEmpty: "Azure stays Not connected until Tier 2 federation is validated; ZIP upload stays available anytime.",
  whereToConfigurePrerequisite: "Choose a workspace in the header scope switcher before saving connector settings.",
  taskSteps: [
    "Open the Azure provider card to configure federation.",
    "Run preflight and validate read-only roles.",
    "Open Extract and upload when you prefer a local inventory ZIP.",
  ],
};

const SECURENOW_CLOUD_CONNECTIONS_HELP: PageContextualHelpEntry = {
  whatIsThisPage: "Cloud connections help — optional Azure connector and inventory ZIP intake for SecureNow evidence collection.",
  whatToDoNext: "Open the Azure connections hub to configure federation, or read Connect Azure securely for federation steps.",
  whyEmpty: "This guide is always available; live Azure connection status appears on the Azure connections hub.",
  whereToConfigurePrerequisite: "Azure attachment is optional — inventory ZIP upload works without a cloud connector.",
  whatToDoNextAction: {
    label: "Open Azure connections hub",
    href: CLOUD_CONNECTIONS_CANONICAL_PATH,
  },
};

const SECURENOW_USERS_ADMIN: PageContextualHelpEntry = {
  whatIsThisPage: "Invite users and assign SecureNow workspace roles (Admin, Architect, Reader, Auditor) for this tenant.",
  whatToDoNext: "Invite a teammate, then open Roles and permissions to adjust authority for findings, packs, and inventory work.",
  whyEmpty: "Directory rows appear after invitations are accepted or users are provisioned for this tenant.",
  whereToConfigurePrerequisite: "SSO and identity-provider mapping may be required before enterprise users can sign in.",
  taskSteps: [
    "Invite teammates who need access to this workspace.",
    "Open Roles and permissions to adjust authority.",
    "Configure SSO when enterprise users cannot sign in yet.",
  ],
};

const SECURENOW_INVITE_REVIEWER: PageContextualHelpEntry = {
  whatIsThisPage:
    "Invite a colleague — grant Reader or Auditor access so they can inspect findings, lineage, and inventory evidence.",
  whatToDoNext:
    "Enter the colleague's email, send the invitation, then open Users and roles when you need the full directory or role matrix.",
  whyEmpty: "The invitation form is ready when you have Admin authority in this workspace.",
  whereToConfigurePrerequisite:
    "Workspace Admin authority is required; SSO may need to be configured before invited users can sign in.",
  taskSteps: [
    "Enter the colleague's email and send the invitation.",
    "Open Users and roles for the full directory.",
    "Configure SSO when invited users cannot sign in.",
  ],
};

const SECURENOW_USERS_AND_ROLES_HELP: PageContextualHelpEntry = {
  whatIsThisPage: "Users and roles — SecureNow workspace roles, capabilities, and invitations for findings, packs, and inventory work.",
  whatToDoNext: "Open Users settings to invite or assign roles, or Security and trust when you need assurance orientation.",
  whyEmpty: "This guide is always available; live directory rows appear after users are invited or provisioned.",
  whereToConfigurePrerequisite: "Managing users needs Admin authority; SSO may be required before invited users can sign in.",
  whatToDoNextAction: {
    label: "Open Users settings",
    href: SETTINGS_USERS_CANONICAL_PATH,
  },
};

const SECURENOW_DATA_HANDLING_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Data handling and tenant isolation — how SecureNow stores cloud inventory evidence, findings, connector metadata, and audit lineage.",
  whatToDoNext: "Open Security and trust or Trust Center for diligence artifacts, then review Sources before procurement briefings.",
  whyEmpty: "This guide always shows isolation and data-handling content when the help topic loads.",
  whereToConfigurePrerequisite: "Confirm residency and subprocessors during procurement with your account team.",
  taskSteps: [
    "Review cloud evidence flow and tenant scope vocabulary.",
    "Open Security and trust for diligence artifacts.",
    "Confirm Sources before procurement briefings.",
  ],
};

const SECURENOW_INTEGRATION_READINESS_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Integration readiness — Azure inventory connector plus outbound Jira, ServiceNow, and Teams destinations for SecureNow.",
  whatToDoNext: "Open Connection status for live labels, then configure Azure connections and ticketing integrations.",
  whyEmpty: "This guide is always available; live connector status appears on Connection status after setup.",
  whereToConfigurePrerequisite: "Connector configuration needs a role that can manage integrations for this workspace.",
  whatToDoNextAction: {
    label: "Open Connection status",
    href: "/administration/connection-status",
  },
  taskSteps: [
    "Open Connection status for live connector labels.",
    "Configure Azure connections for inventory evidence.",
    "Add Jira, ServiceNow, or Teams when outbound ticketing is needed.",
  ],
};

const SECURENOW_ENTERPRISE_ONBOARDING_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Enterprise onboarding checklist — configure SSO, roles, audit export, and optional Azure connector evidence for SecureNow.",
  whatToDoNext: "Open Identity providers for SSO, Users and roles for access, then validate Azure or inventory ZIP intake.",
  whyEmpty: "This guide is always available; live identity and role surfaces appear after workspace configuration.",
  whereToConfigurePrerequisite: "SSO and role changes need Admin authority in the current workspace.",
  whatToDoNextAction: {
    label: "Open Identity providers",
    href: IDENTITY_PROVIDERS_SETTINGS_CANONICAL_PATH,
  },
};

const SECURENOW_SSO_WIZARD: PageContextualHelpEntry = {
  whatIsThisPage:
    "SSO wizard — guided OIDC or SAML setup that discovers provider metadata, maps roles, tests connection, then activates SSO for this workspace.",
  whatToDoNext:
    "Choose your identity provider, confirm a protocol, fetch metadata, map claims to SecureNow roles, run a test connection, then activate only after the test succeeds.",
  whyEmpty:
    "Wizard steps always render for authorized Admins; empty issuer or mapping fields mean metadata has not been fetched or claims are not filled yet.",
  whereToConfigurePrerequisite:
    "Activating SSO needs Admin authority and a reachable IdP metadata or discovery URL; current sign-in stays unchanged until the final activate step.",
  taskSteps: [
    "Choose identity provider and protocol.",
    "Fetch metadata and map claims to SecureNow roles.",
    "Run test connection before activating SSO.",
  ],
};

const SECURENOW_IDENTITY_PROVIDERS: PageContextualHelpEntry = {
  whatIsThisPage:
    "SSO and identity — configure federation, sign-in domains, and identity-provider health for this SecureNow workspace.",
  whatToDoNext: "Review overview status, open SAML or OIDC setup, then validate role mapping before inviting shared users.",
  whyEmpty:
    "Summary cards load after auth diagnostics respond; local development sign-in may be enabled until production SSO is configured.",
  whereToConfigurePrerequisite:
    "Changing federation settings needs Admin authority and a verified sign-in domain when enforcement is required.",
  taskSteps: [
    "Review federation status on the overview cards.",
    "Open SAML or OIDC setup when the provider is not configured.",
    "Validate role mapping before inviting shared users.",
  ],
};

const SECURENOW_GETTING_STARTED_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Getting started guide — how SecureNow connects cloud inventory evidence, assigns ARC-AMPE packs, and supports findings and remediation workflows.",
  whatToDoNext:
    "Connect Azure or upload inventory, assign policy packs, then open assigned-to-me or the findings queue when evidence is ready.",
  whyEmpty: "This guide is always available; findings and inventory metrics appear after packs evaluate connected evidence.",
  whereToConfigurePrerequisite: "Choose a workspace in the header scope switcher before changing packs or connectors.",
  taskSteps: [
    "Choose workspace scope in the header switcher.",
    "Connect Azure or upload an inventory ZIP package.",
    "Assign policy packs and triage findings when scans complete.",
  ],
};

const SECURENOW_TROUBLESHOOTING_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Troubleshooting — symptom-first guidance for sign-in, Azure connector, inventory load, extract-upload, and findings export problems.",
  whatToDoNext: "Start with System health, download a support bundle when needed, then open the matching common-issue card.",
  whyEmpty: "This guide is always available; live dependency status appears on System health.",
  whereToConfigurePrerequisite: "Confirm workspace scope in the header switcher before diagnosing tenant-specific failures.",
  taskSteps: [
    "Open System health for dependency status.",
    "Download a support bundle when logs are needed.",
    "Open the matching common-issue card for your symptom.",
  ],
};

const SECURENOW_EXTRACT_UPLOAD: PageContextualHelpEntry = {
  whatIsThisPage:
    "Extract and upload — run the read-only Azure extractor locally, validate the ZIP, then upload inventory for SecureNow inventory workbenches and ARC-AMPE scans.",
  whatToDoNext:
    "Copy the quick-start extractor command, upload a validated inventory ZIP, then open the resource explorer or drift workbench.",
  whyEmpty: "Upload controls are ready when you have Admin or Execute authority; progress rows appear after a package is selected.",
  whereToConfigurePrerequisite:
    "Uploading packages needs workspace Admin or Execute authority; Azure connectors are optional for ZIP-only intake.",
  whatToDoNextAction: {
    label: "Open resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  whereToConfigureAction: {
    label: "Open policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
  taskSteps: [
    "Copy the quick-start extractor command and run it locally — read-only, no vendor credentials in your subscription.",
    "Upload a validated securenow-azure-package.zip inventory ZIP.",
    "Open resource explorer or drift when the upload completes.",
  ],
};

type SecureNowOverride = {
  readonly prefix: string;
  readonly entry: PageContextualHelpEntry;
};

const SECURENOW_CONTEXTUAL_HELP_OVERRIDES: readonly SecureNowOverride[] = [
  { prefix: SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH, entry: SECURENOW_ASSIGNED_TO_ME_FINDINGS },
  { prefix: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH, entry: SECURENOW_ASSIGNED_TO_ME_FINDINGS },
  { prefix: GOVERNANCE_FINDINGS_PATH, entry: SECURENOW_FINDINGS_QUEUE_HUB },
  { prefix: FINDINGS_HELP_PATH, entry: SECURENOW_FINDINGS_HELP_TOPIC },
  { prefix: GOVERNANCE_POLICY_PACKS_PATH, entry: SECURENOW_POLICY_PACKS_HUB },
  { prefix: POLICY_PACKS_HELP_CANONICAL_PATH, entry: SECURENOW_POLICY_PACKS_HELP },
  { prefix: GOVERNANCE_STANDARDS_AND_RULES_PATH, entry: SECURENOW_STANDARDS_RULES_HUB },
  { prefix: STANDARDS_RULES_HELP_CANONICAL_PATH, entry: SECURENOW_STANDARDS_RULES_HELP },
  { prefix: CLOUD_CONNECTIONS_CANONICAL_PATH, entry: SECURENOW_CLOUD_CONNECTIONS_HUB },
  { prefix: CLOUD_CONNECTIONS_HELP_PATH, entry: SECURENOW_CLOUD_CONNECTIONS_HELP },
  { prefix: SETTINGS_USERS_CANONICAL_PATH, entry: SECURENOW_USERS_ADMIN },
  { prefix: INVITE_REVIEWER_CANONICAL_PATH, entry: SECURENOW_INVITE_REVIEWER },
  { prefix: USERS_AND_ROLES_HELP_CANONICAL_PATH, entry: SECURENOW_USERS_AND_ROLES_HELP },
  { prefix: "/help/data-handling", entry: SECURENOW_DATA_HANDLING_HELP },
  { prefix: INTEGRATION_READINESS_HELP_CANONICAL_PATH, entry: SECURENOW_INTEGRATION_READINESS_HELP },
  { prefix: ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH, entry: SECURENOW_ENTERPRISE_ONBOARDING_HELP },
  { prefix: SSO_WIZARD_CANONICAL_PATH, entry: SECURENOW_SSO_WIZARD },
  { prefix: IDENTITY_PROVIDERS_SETTINGS_CANONICAL_PATH, entry: SECURENOW_IDENTITY_PROVIDERS },
  { prefix: "/help/getting-started", entry: SECURENOW_GETTING_STARTED_HELP },
  { prefix: "/help/troubleshooting", entry: SECURENOW_TROUBLESHOOTING_HELP },
  { prefix: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH, entry: SECURENOW_EXTRACT_UPLOAD },
];

/** Longest prefix first so assigned-to-me wins over the tenant findings queue. */
const SECURENOW_CONTEXTUAL_HELP_OVERRIDES_BY_SPECIFICITY = [...SECURENOW_CONTEXTUAL_HELP_OVERRIDES].sort(
  (left, right) => right.prefix.length - left.prefix.length,
);

export function secureNowContextualHelpOverrideForPath(
  path: string,
  productLineId: ProductLineId,
): PageContextualHelpEntry | null {
  if (!isSecureNowProductLine(productLineId)) {
    return null;
  }

  const match = SECURENOW_CONTEXTUAL_HELP_OVERRIDES_BY_SPECIFICITY.find(
    (candidate) => path === candidate.prefix || path.startsWith(`${candidate.prefix}/`),
  );

  return match?.entry ?? null;
}

export {
  SECURENOW_ASSIGNED_TO_ME_FINDINGS,
  SECURENOW_FINDINGS_QUEUE_HUB,
  SECURENOW_GETTING_STARTED_HELP,
  SECURENOW_TROUBLESHOOTING_HELP,
};

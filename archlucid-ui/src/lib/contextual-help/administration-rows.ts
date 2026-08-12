/** Administration hub routes (`/administration/**`). */

import type { PageContextualHelpEntry, PageContextualHelpRow } from "@/lib/contextual-help/types";

/** Exact Settings hub root (`/administration`) — registered via parameterized matcher so children keep their own answers. */
export const SETTINGS_HUB_CONTEXTUAL_HELP: PageContextualHelpEntry = {
  whatIsThisPage:
    "Settings hub — search and open workspace, governance, integration, security, billing, and support configuration pages.",
  whatToDoNext:
    "Search or jump to a section, then open a destination page to change settings. Use the help control for short answers about this index.",
  whyEmpty:
    "Sections appear based on your authority and search; try clearing search or showing advanced settings when a destination is missing.",
  whereToConfigurePrerequisite:
    "Some destinations require Admin or Operator authority; personal preferences stay in the account menu.",
};

export const ADMINISTRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/administration/system-health",
    entry: {
      whatIsThisPage:
        "Confirm workspace service health, required dependencies, and deployment identity for this tenant.",
      whatToDoNext:
        "Refresh readiness, then open Connection status when a dependency needs follow-up.",
      whyEmpty: "Health rows appear after the readiness probe returns for this workspace.",
      whereToConfigurePrerequisite:
        "Dependency connectivity is configured under Administration → Connection status.",
      whatToDoNextAction: {
        label: "Open Connection status",
        href: "/administration/connection-status",
      },
      whereToConfigureAction: {
        label: "Open Connection status",
        href: "/administration/connection-status",
      },
    },
  },
  {
    prefix: "/administration/connection-status",
    entry: {
      whatIsThisPage:
        "Connection status - see which notification, ticketing, publishing, and delivery integrations are ready, recommended, or optional for this workspace.",
      whatToDoNext:
        "Open a connector that needs configuration, or System health when dependency checks need follow-up.",
      whyEmpty:
        "Readiness tiles appear after connector probes load; optional connectors stay listed until configured.",
      whereToConfigurePrerequisite:
        "Configuring connectors needs a role that can manage workspace integrations.",
      whatToDoNextAction: {
        label: "Open System health",
        href: "/administration/system-health",
      },
    },
  },
  {
    prefix: "/administration/developer",
    entry: {
      whatIsThisPage:
        "Internal developer tools - evaluate branded themes and try CLI demos for workspace diagnostics; not part of the customer settings navigation.",
      whatToDoNext:
        "Use the theme selector for visual evaluation, try the CLI demo card when validating local tooling, then open Engineering troubleshooting or System health for live runbooks.",
      whyEmpty:
        "Theme and CLI cards always render for authorized architects; empty results only appear inside the CLI demo after a command returns no output.",
      whereToConfigurePrerequisite:
        "Requires an authenticated Admin session with advanced/developer route access; customer settings hubs do not deep-link here.",
    },
  },
  {
    prefix: "/administration/users/invite-reviewer",
    entry: {
      whatIsThisPage:
        "Invite a reviewer — send Reader or Auditor access so a teammate can sign off on architecture reviews.",
      whatToDoNext:
        "Enter the reviewer's email, send the invitation, then open Users and roles when you need the full directory or role matrix.",
      whyEmpty: "The invitation form is ready when you have Admin authority in this workspace.",
      whereToConfigurePrerequisite:
        "Workspace Admin authority is required; SSO may need to be configured before invited users can sign in.",
    },
  },
  {
    prefix: "/administration/users",
    entry: {
      whatIsThisPage:
        "Invite users and assign ArchLucid app roles for this workspace tenant.",
      whatToDoNext:
        "Invite a teammate, then open Roles and permissions to adjust authority.",
      whyEmpty: "Directory rows appear after invitations are accepted or users are provisioned for this tenant.",
      whereToConfigurePrerequisite:
        "SSO and identity-provider mapping may be required before enterprise users can sign in.",
    },
  },
  {
    prefix: "/administration/identity-providers",
    entry: {
      whatIsThisPage:
        "SSO and identity - configure federation, sign-in domains, and identity-provider health for this workspace.",
      whatToDoNext:
        "Review overview status, open SAML or OIDC setup, then validate role mapping before inviting shared users.",
      whyEmpty:
        "Summary cards load after auth diagnostics respond; local development sign-in may be enabled until production SSO is configured.",
      whereToConfigurePrerequisite:
        "Changing federation settings needs Admin authority and a verified sign-in domain when enforcement is required.",
    },
  },
  {
    prefix: "/administration/identity-providers/oidc",
    entry: {
      whatIsThisPage:
        "OIDC/JWT - review discovery status, authority, audience, and role-claim readiness for this workspace.",
      whatToDoNext:
        "Confirm discovery health, open the SSO wizard when authority needs updates, then validate role mapping before inviting users.",
      whyEmpty:
        "Status cards load after OIDC diagnostics respond; Not configured means no OIDC authority is published yet.",
      whereToConfigurePrerequisite:
        "Changing OIDC settings needs Admin authority and a reachable identity-provider discovery endpoint.",
    },
  },
  {
    prefix: "/administration/identity-providers/saml",
    entry: {
      whatIsThisPage:
        "SAML — look up IdP metadata, configure IdP issuer and role claim mapping, and review read-only SP certificate health. These settings apply to every workspace in the organization.",
      whatToDoNext:
        "Copy ArchLucid SP values, use Fetch IdP metadata to fill issuer and claim fields, save the configuration, then test the saved mapping before inviting users. Saving does not switch anyone to SAML sign-in — that is a separate platform configuration change.",
      whyEmpty:
        "The configuration form always renders for authorized Admins; empty claim tables mean metadata has not been fetched or mapping rows are not filled yet.",
      whereToConfigurePrerequisite:
        "Changing SAML settings needs Admin authority and a reachable IdP metadata URL for lookup; SP signing certificate health is reviewed on Identity diagnostics.",
    },
  },
  {
    prefix: "/administration/identity/sso-wizard",
    entry: {
      whatIsThisPage:
        "SSO wizard - guided OIDC or SAML setup that discovers provider metadata, maps roles, tests connection, then activates SSO for this workspace.",
      whatToDoNext:
        "Choose your identity provider, confirm a protocol, fetch metadata, map claims to ArchLucid roles, run a test connection, then activate only after the test succeeds.",
      whyEmpty:
        "Wizard steps always render for authorized Admins; empty issuer or mapping fields mean metadata has not been fetched or claims are not filled yet.",
      whereToConfigurePrerequisite:
        "Activating SSO needs Admin authority and a reachable IdP metadata or discovery URL; current sign-in stays unchanged until the final activate step.",
    },
  },
  {
    prefix: "/administration/scim-provisioning",
    entry: {
      whatIsThisPage:
        "SCIM provisioning - issue, verify, and revoke inbound directory tokens so your IdP can sync users into this workspace.",
      whatToDoNext:
        "Copy the SCIM base URL, create a token, verify it against Service Provider Config, then revoke tokens you no longer need.",
      whyEmpty:
        "Active tokens appear after creation; an empty list means no inbound provisioning tokens exist yet for this tenant.",
      whereToConfigurePrerequisite:
        "Managing SCIM tokens needs Admin authority; pair tokens with SSO and identity setup before enforcing directory sync.",
    },
  },
  {
    prefix: "/administration/tenant",
    entry: {
      whatIsThisPage:
        "Tenant settings - configure workspace defaults, quality gates, cost settings, and tenant-wide options for this organization.",
      whatToDoNext:
        "Review workspace scope, adjust quality gates or cost settings when needed, then open Projects recycle bin to restore deleted architecture projects.",
      whyEmpty:
        "Cards always render for authorized Admins; empty technical scope values mean the workspace switcher has not selected a tenant, workspace, or project yet.",
      whereToConfigurePrerequisite:
        "Changing tenant defaults needs Admin authority; active workspace and project selection lives in the header workspace switcher.",
    },
  },
  {
    prefix: "/administration/tenant/recycle-bin",
    entry: {
      whatIsThisPage:
        "Projects recycle bin - browse soft-deleted architecture projects for this tenant and restore them when names are free.",
      whatToDoNext:
        "Refresh the list, restore a deleted project when you have Execute authority, then open Architectures or Tenant settings to continue work.",
      whyEmpty:
        "Empty means no soft-deleted projects remain in the retention window, or the recycle-bin API has not returned rows yet.",
      whereToConfigurePrerequisite:
        "Browsing needs Admin access; restore requires Execute authority. Retention and workspace scope live under Tenant settings.",
    },
  },
  {
    prefix: "/administration/identity-providers/role-mapping",
    entry: {
      whatIsThisPage:
        "Role mapping - see how IdP groups or claims become ArchLucid app roles for this workspace tenant.",
      whatToDoNext:
        "Review mapping status, edit SAML role mapping when needed, then open diagnostics to test claims before inviting users.",
      whyEmpty:
        "Status cards load after auth diagnostics respond; Unmapped means no elevated roles until a matching claim is configured.",
      whereToConfigurePrerequisite:
        "Editing mappings needs Admin authority and a configured SAML or OIDC identity source.",
    },
  },
  {
    prefix: "/administration/identity-providers/diagnostics",
    entry: {
      whatIsThisPage:
        "Identity diagnostics - validate federation health probes, OIDC and SAML strips, and token test mapping before enabling SSO for all users.",
      whatToDoNext:
        "Refresh probes, review failing health strips, run token test mapping when claims look wrong, then return to OIDC or Role mapping to fix configuration.",
      whyEmpty:
        "Health and checklist panels appear after diagnostics APIs respond; empty strips mean probes have not loaded yet or the provider is not configured.",
      whereToConfigurePrerequisite:
        "Running diagnostics needs Admin authority and configured identity-provider endpoints; technical detail panels may require the internal admin workspace.",
    },
  },
  {
    prefix: "/administration/api-keys",
    entry: {
      whatIsThisPage:
        "API keys — workspace automation credential controls when in-product management is enabled for your workspace.",
      whatToDoNext:
        "Use Users and roles for people access. Host automation credentials are documented in CLI usage help.",
      whyEmpty:
        "In-product API key management is not available in this workspace UI.",
      whereToConfigurePrerequisite:
        "Workspace Admin authority is required when the surface is enabled; some tenants use SSO-only sign-in without API keys.",
    },
  },
  {
    prefix: "/administration/preferences",
    entry: {
      whatIsThisPage:
        "Preferences - personal appearance settings saved to your ArchLucid account for this device and signed-in profile.",
      whatToDoNext:
        "Choose a theme, then open Sign-in methods when sign-in controls need attention or Getting started for onboarding.",
      whyEmpty:
        "Theme controls are ready whenever you are signed in; saved preferences sync after the preferences API responds.",
      whereToConfigurePrerequisite:
        "No Admin role is required - preferences write only your own account record.",
    },
  },
  {
    prefix: "/administration/notifications",
    entry: {
      whatIsThisPage:
        "Notifications - channel launcher that shows delivery status for digests, in-product alerts, alert rules, Teams, and Slack.",
      whatToDoNext:
        "Review each channel card, then open the destination page to change subscriptions, rules, or webhook connections.",
      whyEmpty:
        "Status tags load from each channel's API; when a destination cannot be read here, configure it on that page.",
      whereToConfigurePrerequisite:
        "Digests, alert rules, Teams, and Slack each save settings on their own pages — this hub does not store a unified preference profile.",
    },
  },
  {
    prefix: "/administration/account-security",
    entry: {
      whatIsThisPage:
        "Sign-in methods — manage personal sign-in methods linked to your ArchLucid account for this workspace.",
      whatToDoNext:
        "Review linked methods, add email with a one-time code while signed in when needed, then open Preferences or Security and trust help for related controls.",
      whyEmpty:
        "Method rows load after the sign-in methods API responds; empty lists mean no secondary methods are linked yet.",
      whereToConfigurePrerequisite:
        "Removing a method may require signing in again when your session is stale; email matches alone never link accounts.",
    },
  },
  {
    prefix: "/administration/auth-domains",
    entry: {
      whatIsThisPage:
        "Sign-in domains - verify email domain ownership, test SSO routing, and enable domain enforcement for this workspace.",
      whatToDoNext:
        "Add and verify a domain, test routing, then open Identity providers before enabling SSO enforcement.",
      whyEmpty:
        "Domain rows load after the auth-domains API responds; unverified domains stay pending until DNS TXT succeeds.",
      whereToConfigurePrerequisite:
        "Enforcement needs Admin authority, a verified domain, recovery admins, and a configured identity provider.",
    },
  },
  {
    prefix: "/administration/extract-upload",
    entry: {
      whatIsThisPage:
        "Extract and Upload - run the read-only Azure extractor locally, validate the ZIP, then upload inventory for architecture reviews.",
      whatToDoNext:
        "Copy the quick-start command, upload a validated ZIP, then open Start a review when the package is ready.",
      whyEmpty:
        "Upload controls are ready when you have Admin or Execute authority; progress rows appear after a package is selected.",
      whereToConfigurePrerequisite:
        "Uploading packages needs workspace authority; cloud connectors are optional for evidence-only ZIP intake.",
    },
  },
  {
    prefix: "/administration/model-governance",
    entry: {
      whatIsThisPage:
        "AI and model governance - manage the workspace default execution profile and governed model aliases used on reviews.",
      whatToDoNext:
        "Review the effective profile, set or clear a tenant override, then open AI usage when spend signals need attention.",
      whyEmpty:
        "Catalog rows load after the model-governance API responds; empty registries mean aliases are not published yet.",
      whereToConfigurePrerequisite:
        "Changing execution profiles needs Admin authority in this workspace.",
    },
  },
  {
    prefix: "/administration/security-trust",
    entry: {
      whatIsThisPage:
        "Operator Security & Trust — procurement-oriented materials, tenant isolation posture, retention notes, and NDA-gated diligence requests for this workspace.",
      whatToDoNext:
        "Open Assurance status or Trust Center for assurance surfaces, or Audit when you need governed activity trails.",
      whyEmpty:
        "Public materials list here when published; NDA-gated packs require contacting security@archlucid.net.",
      whereToConfigurePrerequisite:
        "No workspace toggle is required — this page orients architects to published and NDA diligence paths.",
    },
  },
  {
    prefix: "/administration/billing",
    entry: {
      whatIsThisPage:
        "Billing & plans - view the current subscription, compare available plans, and manage usage and wallet controls for this workspace.",
      whatToDoNext:
        "Review the current plan card, compare Available plans, then open AI usage or Billing help when spend questions need methodology.",
      whyEmpty:
        "Plan and usage cards appear after billing data loads for this tenant; wallet controls need Admin authority to mutate.",
      whereToConfigurePrerequisite:
        "Changing plans or payment methods needs a role that can manage workspace billing.",
    },
  },
  {
    prefix: "/administration/ai-usage",
    entry: {
      whatIsThisPage:
        "AI usage and cost - monitor estimated AI spend, remaining budget, and the workflows driving cost for this workspace.",
      whatToDoNext:
        "Review KPIs and daily usage, then open Billing & plans when budget caps or plan changes are needed.",
      whyEmpty:
        "Spend cards appear after cost-reporting data loads; quiet empty periods hide zeroed cockpit noise until activity resumes.",
      whereToConfigurePrerequisite:
        "Budget edits need a role that can manage workspace billing; estimated spend is not invoice-accurate.",
    },
  },
  {
    prefix: "/administration/baseline",
    entry: {
      whatIsThisPage:
        "Baseline settings - capture ROI measurement anchors (review cycle hours, prep time, people per review) for this workspace.",
      whatToDoNext:
        "Save or clear baseline anchors, then open Pilot ROI model help or Architecture scorecard when numbers need methodology.",
      whyEmpty:
        "Fields load after tenant baseline API responds; empty values mean conservative defaults until you save anchors.",
      whereToConfigurePrerequisite:
        "Saving baseline anchors needs Execute authority in this workspace.",
    },
  },
];

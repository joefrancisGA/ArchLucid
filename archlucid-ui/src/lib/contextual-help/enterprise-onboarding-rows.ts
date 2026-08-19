/** Enterprise onboarding identity surfaces and enterprise-onboarding help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH,
  ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL,
} from "@/lib/enterprise-onboarding-help-evidence-copy";
import { IDENTITY_PROVIDERS_SETTINGS_CANONICAL_PATH } from "@/lib/identity-providers-settings-evidence-copy";
import { SCIM_PROVISIONING_CANONICAL_PATH } from "@/lib/scim-provisioning-evidence-copy";
import { SSO_WIZARD_CANONICAL_PATH } from "@/lib/sso-wizard-evidence-copy";

export const ENTERPRISE_ONBOARDING_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: IDENTITY_PROVIDERS_SETTINGS_CANONICAL_PATH,
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
    prefix: SSO_WIZARD_CANONICAL_PATH,
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
    prefix: SCIM_PROVISIONING_CANONICAL_PATH,
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
    prefix: ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Enterprise onboarding checklist — ${ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL.toLowerCase()} for SSO, roles, governance, policy packs, audit export, and optional Azure evidence.`,
      whatToDoNext:
        "Open Identity providers for SSO, Users and roles for access, then Assurance status for assurance orientation.",
      whyEmpty: "This guide is always available; live identity and role surfaces appear after workspace configuration.",
      whereToConfigurePrerequisite:
        "SSO and role changes need System Admin authority in the current workspace.",
      whatToDoNextAction: {
        label: "Open Identity providers",
        href: IDENTITY_PROVIDERS_SETTINGS_CANONICAL_PATH,
      },
    },
  },
];

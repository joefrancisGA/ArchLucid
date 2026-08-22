/** Identity administration child routes (OIDC, SAML, role mapping, diagnostics, sign-in domains, sign-in methods). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { ACCOUNT_SECURITY_SETTINGS_CANONICAL_PATH } from "@/lib/account-security-settings-evidence-copy";
import { AUTH_DOMAINS_SETTINGS_CANONICAL_PATH } from "@/lib/auth-domains-settings-evidence-copy";
import { IDENTITY_PROVIDERS_DIAGNOSTICS_CANONICAL_PATH } from "@/lib/identity-providers-diagnostics-evidence-copy";
import { IDENTITY_PROVIDERS_OIDC_CANONICAL_PATH } from "@/lib/identity-providers-oidc-evidence-copy";
import { IDENTITY_PROVIDERS_SAML_CANONICAL_PATH } from "@/lib/identity-providers-saml-evidence-copy";
import { ROLE_MAPPING_SETTINGS_CANONICAL_PATH } from "@/lib/role-mapping-settings-evidence-copy";

export const IDENTITY_ADMINISTRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: IDENTITY_PROVIDERS_OIDC_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "OIDC/JWT - review discovery status, authority, audience, and role-claim readiness for this workspace.",
      whatToDoNext:
        "Confirm discovery health, open the SSO wizard when authority needs updates, then validate role mapping before inviting users.",
      whyEmpty:
        "Status cards load after OIDC diagnostics respond; Not configured means no OIDC authority is published yet.",
      whereToConfigurePrerequisite:
        "Changing OIDC settings needs Admin authority and a reachable identity-provider discovery endpoint.",
      taskSteps: [
        "Confirm OIDC discovery health on the status cards.",
        "Update authority or audience when discovery fails.",
        "Validate role mapping before inviting users.",
      ],
    },
  },
  {
    prefix: IDENTITY_PROVIDERS_SAML_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "SAML — look up IdP metadata, configure IdP issuer and role claim mapping, and review read-only SP certificate health. These settings apply to every workspace in the organization.",
      whatToDoNext:
        "Copy ArchLucid SP values, use Fetch IdP metadata to fill issuer and claim fields, save the configuration, then test the saved mapping before inviting users. Saving does not switch anyone to SAML sign-in — that is a separate platform configuration change.",
      whyEmpty:
        "The configuration form always renders for authorized Admins; empty claim tables mean metadata has not been fetched or mapping rows are not filled yet.",
      whereToConfigurePrerequisite:
        "Changing SAML settings needs Admin authority and a reachable IdP metadata URL for lookup; SP signing certificate health is reviewed on Identity diagnostics.",
      taskSteps: [
        "Copy ArchLucid SP values for your IdP configuration.",
        "Fetch IdP metadata to fill issuer and claim fields.",
        "Test saved mapping before inviting users.",
      ],
    },
  },
  {
    prefix: ROLE_MAPPING_SETTINGS_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Role mapping - see how IdP groups or claims become ArchLucid app roles for this workspace tenant.",
      whatToDoNext:
        "Review mapping status, edit SAML role mapping when needed, then open diagnostics to test claims before inviting users.",
      whyEmpty:
        "Status cards load after auth diagnostics respond; Unmapped means no elevated roles until a matching claim is configured.",
      whereToConfigurePrerequisite:
        "Editing mappings needs Admin authority and a configured SAML or OIDC identity source.",
      taskSteps: [
        "Review which IdP claims map to ArchLucid roles.",
        "Edit SAML or OIDC mapping when claims are unmapped.",
        "Run diagnostics to verify claims before invites.",
      ],
    },
  },
  {
    prefix: IDENTITY_PROVIDERS_DIAGNOSTICS_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Identity diagnostics - validate federation health probes, OIDC and SAML strips, and token test mapping before enabling SSO for all users.",
      whatToDoNext:
        "Refresh probes, review failing health strips, run token test mapping when claims look wrong, then return to OIDC or Role mapping to fix configuration.",
      whyEmpty:
        "Health and checklist panels appear after diagnostics APIs respond; empty strips mean probes have not loaded yet or the provider is not configured.",
      whereToConfigurePrerequisite:
        "Running diagnostics needs Admin authority and configured identity-provider endpoints; technical detail panels may require the internal admin workspace.",
      taskSteps: [
        "Refresh federation health probes.",
        "Review failing OIDC or SAML strips.",
        "Return to OIDC or Role mapping to fix configuration.",
      ],
    },
  },
  {
    prefix: ACCOUNT_SECURITY_SETTINGS_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Sign-in methods — manage personal sign-in methods linked to your ArchLucid account for this workspace.",
      whatToDoNext:
        "Review linked methods, add email with a one-time code while signed in when needed, then open Preferences or Security and trust help for related controls.",
      whyEmpty:
        "Method rows load after the sign-in methods API responds; empty lists mean no secondary methods are linked yet.",
      whereToConfigurePrerequisite:
        "Removing a method may require signing in again when your session is stale; email matches alone never link accounts.",
      taskSteps: [
        "Review linked personal sign-in methods.",
        "Add email with a one-time code when needed.",
        "Open Preferences for related account controls.",
      ],
    },
  },
  {
    prefix: AUTH_DOMAINS_SETTINGS_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Sign-in domains - verify email domain ownership, test SSO routing, and enable domain enforcement for this workspace.",
      whatToDoNext:
        "Add and verify a domain, test routing, then open Identity providers before enabling SSO enforcement.",
      whyEmpty:
        "Domain rows load after the auth-domains API responds; unverified domains stay pending until DNS TXT succeeds.",
      whereToConfigurePrerequisite:
        "Enforcement needs Admin authority, a verified domain, recovery admins, and a configured identity provider.",
      taskSteps: [
        "Add and verify each sign-in domain with DNS TXT.",
        "Test SSO routing before enforcement.",
        "Configure identity providers before enabling enforcement.",
      ],
    },
  },
];

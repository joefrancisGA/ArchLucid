/** Claim-then-sources evidence strips for administration and account settings surfaces. */
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  BASELINE_SETTINGS_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_SOURCES,
  BASELINE_SETTINGS_SOURCES_INTRO,
} from "@/lib/baseline-settings-evidence-copy";
import {
  API_KEYS_SETTINGS_FOLLOW_UPS_TITLE,
  API_KEYS_SETTINGS_SOURCES,
  API_KEYS_SETTINGS_SOURCES_INTRO,
} from "@/lib/api-keys-settings-evidence-copy";
import {
  ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE,
  ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  ACCOUNT_SECURITY_SETTINGS_CLAIM_HEADING_ID,
  ACCOUNT_SECURITY_SETTINGS_FOLLOW_UPS_TITLE,
  ACCOUNT_SECURITY_SETTINGS_SOURCES,
  ACCOUNT_SECURITY_SETTINGS_SOURCES_INTRO,
} from "@/lib/account-security-settings-evidence-copy";
import {
  AI_USAGE_SETTINGS_FOLLOW_UPS_TITLE,
  AI_USAGE_SETTINGS_SOURCES,
  AI_USAGE_SETTINGS_SOURCES_INTRO,
} from "@/lib/ai-usage-settings-evidence-copy";
import {
  AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE,
  AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  AUTH_DOMAINS_SETTINGS_CLAIM_HEADING_ID,
  AUTH_DOMAINS_SETTINGS_FOLLOW_UPS_TITLE,
  AUTH_DOMAINS_SETTINGS_SOURCES,
  AUTH_DOMAINS_SETTINGS_SOURCES_INTRO,
} from "@/lib/auth-domains-settings-evidence-copy";
import {
  PREFERENCES_SETTINGS_CLAIM_DISCIPLINE,
  PREFERENCES_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  PREFERENCES_SETTINGS_CLAIM_HEADING_ID,
  PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE,
  PREFERENCES_SETTINGS_SOURCES,
  PREFERENCES_SETTINGS_SOURCES_INTRO,
} from "@/lib/preferences-settings-evidence-copy";
import {
  MODEL_GOVERNANCE_SETTINGS_FOLLOW_UPS_TITLE,
  MODEL_GOVERNANCE_SETTINGS_SOURCES,
  MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO,
} from "@/lib/model-governance-settings-evidence-copy";
import {
  EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE,
  EXTRACT_UPLOAD_SETTINGS_SOURCES,
  EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO,
} from "@/lib/extract-upload-settings-evidence-copy";
import {
  OPERATOR_BILLING_SETTINGS_FOLLOW_UPS_TITLE,
  OPERATOR_BILLING_SETTINGS_SOURCES,
  OPERATOR_BILLING_SETTINGS_SOURCES_INTRO,
} from "@/lib/operator/operator-billing-settings-evidence-copy";
import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_FOLLOW_UPS_TITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES,
  IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES_INTRO,
} from "@/lib/identity-providers-diagnostics-evidence-copy";
import {
  IDENTITY_PROVIDERS_OIDC_FOLLOW_UPS_TITLE,
  IDENTITY_PROVIDERS_OIDC_SOURCES,
  IDENTITY_PROVIDERS_OIDC_SOURCES_INTRO,
} from "@/lib/identity-providers-oidc-evidence-copy";
import {
  IDENTITY_PROVIDERS_SAML_FOLLOW_UPS_TITLE,
  IDENTITY_PROVIDERS_SAML_SOURCES,
  IDENTITY_PROVIDERS_SAML_SOURCES_INTRO,
} from "@/lib/identity-providers-saml-evidence-copy";
import {
  IDENTITY_PROVIDERS_SETTINGS_FOLLOW_UPS_TITLE,
  IDENTITY_PROVIDERS_SETTINGS_SOURCES,
  IDENTITY_PROVIDERS_SETTINGS_SOURCES_INTRO,
} from "@/lib/identity-providers-settings-evidence-copy";
import {
  ROLE_MAPPING_SETTINGS_FOLLOW_UPS_TITLE,
  ROLE_MAPPING_SETTINGS_SOURCES,
  ROLE_MAPPING_SETTINGS_SOURCES_INTRO,
} from "@/lib/role-mapping-settings-evidence-copy";
import {
  SCIM_PROVISIONING_FOLLOW_UPS_TITLE,
  SCIM_PROVISIONING_SOURCES,
  SCIM_PROVISIONING_SOURCES_INTRO,
} from "@/lib/scim-provisioning-evidence-copy";
import {
  SSO_WIZARD_FOLLOW_UPS_TITLE,
  SSO_WIZARD_SOURCES,
  SSO_WIZARD_SOURCES_INTRO,
} from "@/lib/sso-wizard-evidence-copy";
import {
  TENANT_SETTINGS_FOLLOW_UPS_TITLE,
  TENANT_SETTINGS_SOURCES,
  TENANT_SETTINGS_SOURCES_INTRO,
} from "@/lib/tenant-settings-evidence-copy";

export function BaselineSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="baseline-settings"
      claimElement="div"
      sourcesTitle={BASELINE_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={BASELINE_SETTINGS_SOURCES_INTRO}
      sources={BASELINE_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ExtractUploadSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="extract-upload-settings"
      claimElement="div"
      sourcesTitle={EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO}
      sources={EXTRACT_UPLOAD_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function OperatorBillingSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="operator-billing-settings"
      claimElement="div"
      sourcesTitle={OPERATOR_BILLING_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={OPERATOR_BILLING_SETTINGS_SOURCES_INTRO}
      sources={OPERATOR_BILLING_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function PreferencesSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="preferences-settings"
      claim={PREFERENCES_SETTINGS_CLAIM_DISCIPLINE}
      claimHeading={PREFERENCES_SETTINGS_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={PREFERENCES_SETTINGS_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={PREFERENCES_SETTINGS_SOURCES_INTRO}
      sources={PREFERENCES_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function RoleMappingSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="role-mapping-settings"
      claimElement="div"
      sourcesTitle={ROLE_MAPPING_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={ROLE_MAPPING_SETTINGS_SOURCES_INTRO}
      sources={ROLE_MAPPING_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AccountSecuritySettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="account-security-settings"
      claim={ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE}
      claimHeading={ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ACCOUNT_SECURITY_SETTINGS_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={ACCOUNT_SECURITY_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={ACCOUNT_SECURITY_SETTINGS_SOURCES_INTRO}
      sources={ACCOUNT_SECURITY_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AuthDomainsSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="auth-domains-settings"
      claim={AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE}
      claimHeading={AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={AUTH_DOMAINS_SETTINGS_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={AUTH_DOMAINS_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={AUTH_DOMAINS_SETTINGS_SOURCES_INTRO}
      sources={AUTH_DOMAINS_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ModelGovernanceSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="model-governance-settings"
      claimElement="div"
      sourcesTitle={MODEL_GOVERNANCE_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO}
      sources={MODEL_GOVERNANCE_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AiUsageSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="ai-usage-settings"
      claimElement="div"
      sourcesTitle={AI_USAGE_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={AI_USAGE_SETTINGS_SOURCES_INTRO}
      sources={AI_USAGE_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function IdentityProvidersSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="identity-providers-settings"
      claimElement="div"
      sourcesTitle={IDENTITY_PROVIDERS_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={IDENTITY_PROVIDERS_SETTINGS_SOURCES_INTRO}
      sources={IDENTITY_PROVIDERS_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function IdentityProvidersOidcSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="identity-providers-oidc-settings"
      claimElement="div"
      sourcesTitle={IDENTITY_PROVIDERS_OIDC_FOLLOW_UPS_TITLE}
      sourcesIntro={IDENTITY_PROVIDERS_OIDC_SOURCES_INTRO}
      sources={IDENTITY_PROVIDERS_OIDC_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function IdentityProvidersSamlSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="identity-providers-saml-settings"
      claimElement="div"
      sourcesTitle={IDENTITY_PROVIDERS_SAML_FOLLOW_UPS_TITLE}
      sourcesIntro={IDENTITY_PROVIDERS_SAML_SOURCES_INTRO}
      sources={IDENTITY_PROVIDERS_SAML_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function IdentityProvidersDiagnosticsSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="identity-providers-diagnostics-settings"
      claimElement="div"
      sourcesTitle={IDENTITY_PROVIDERS_DIAGNOSTICS_FOLLOW_UPS_TITLE}
      sourcesIntro={IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES_INTRO}
      sources={IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ScimProvisioningSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="scim-provisioning-settings"
      claimElement="div"
      sourcesTitle={SCIM_PROVISIONING_FOLLOW_UPS_TITLE}
      sourcesIntro={SCIM_PROVISIONING_SOURCES_INTRO}
      sources={SCIM_PROVISIONING_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function SsoWizardSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="sso-wizard-settings"
      claimElement="div"
      sourcesTitle={SSO_WIZARD_FOLLOW_UPS_TITLE}
      sourcesIntro={SSO_WIZARD_SOURCES_INTRO}
      sources={SSO_WIZARD_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function TenantSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="tenant-settings"
      claimElement="div"
      sourcesTitle={TENANT_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={TENANT_SETTINGS_SOURCES_INTRO}
      sources={TENANT_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ApiKeysSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="api-keys-settings"
      claimElement="div"
      sourcesTitle={API_KEYS_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={API_KEYS_SETTINGS_SOURCES_INTRO}
      sources={API_KEYS_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

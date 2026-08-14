import { INTERNAL_EVIDENCE_PROPOSALS_PATH, INTERNAL_PRICING_QUOTE_AGING_PATH } from "@/lib/internal-ops-route-paths";
import { SETTINGS_ACCOUNT_SECURITY_PATH, SETTINGS_PREFERENCES_PATH, SETTINGS_SECURITY_TRUST_PATH, SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

/** Traffic workbook rows for the `admin` workbook section. */
export const ADMIN_TRAFFIC_ROWS: readonly UiRouteTrafficRow[] = [
  /** Traffic workbook row ID for operator Billing & plans settings. Owner backlog shorthand: ABI (template formerly SBE on legacy settings/billing path). */
  {
    rowId: "ABI",
    path: "/administration/billing",
    section: "Admin",
    note: "Billing & plans (Settings/Admin) - OperatorBillingSettingsClient with PageContextualHelpButton (topic map billing-and-plans; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, current plan / plans / usage / wallet. Sibling HBX = billing-and-plans help; P = /pricing; ADI = ai-usage. Commercial controls - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["OperatorBillingSettingsClient", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Configuration summary. Owner backlog shorthand: ACX. */
  {
    rowId: "ACX",
    path: "/internal/configuration",
    section: "Admin",
    note: "Configuration summary (Admin) - AdminConfigurationPageView with PageContextualHelpButton (topic map configuration-reference; Category-1 registry), search/filters/lint. Sibling AHX = diagnostics; ADY = system-health. Not a signed-record Sources trail. Score 62/100 (2026-08-08) - admin config browse hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for operator Baseline settings. Owner backlog shorthand: ADA (template formerly SBX on legacy settings/baseline path). */
  {
    rowId: "ADA",
    path: "/administration/baseline",
    section: "Admin",
    note: "Baseline settings (Settings/Admin) - BaselineSettingsClient with PageContextualHelpButton (topic map sponsor-report#pilot-roi-measurement; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, ROI measurement anchors + save/clear. Sibling SPE = sponsor-report; SCX = architecture-scorecard; ABI = billing. Measurement anchors - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["BaselineSettingsClient", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Connection status (integration readiness). Owner backlog shorthand: ADC. */
  {
    rowId: "ADC",
    path: "/administration/connection-status",
    section: "Admin",
    note: "Connection status (Admin) - AdministrationConnectionStatusPage with PageContextualHelpButton (topic map integration-readiness; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, ConnectorOperationsDashboard readiness tiles. Sibling ADY = system-health; IJX/ISX/IWX = connectors; OID = DLQ. Integration readiness hub - not a signed-record Sources trail.admin KPI/config ceiling below ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["ConnectorOperationsDashboard", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Demo readiness admin diagnostics. Owner backlog shorthand: ADD. */
  {
    rowId: "ADD",
    path: "/internal/demo-readiness",
    section: "Admin",
    note: "Demo readiness (Admin) - DemoReadinessAdminPageClient with PageContextualHelpButton (topic map path-chooser; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, BuyerCtoDemoReadinessPanel internal diagnostics. Sibling ATD = trial-funnel; ATX = tenant-health; ADY = system-health. Internal employee diagnostic - not a signed-record Sources trail.admin KPI/config ceiling below ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["DemoReadinessAdminPageClient", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Deployment status admin diagnostics. Owner backlog shorthand: ADE. */
  {
    rowId: "ADE",
    path: "/internal/deployment-status",
    section: "Admin",
    note: "Deployment status (Admin) - AdminDeploymentStatusPageView with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, BUILD_ID agreement + refresh. Sibling ADY = system-health; ADD = demo-readiness; ATX = tenant-health. Internal release identity - not a signed-record Sources trail.admin KPI/config ceiling below ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["AdminDeploymentStatusPageView", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Role mapping settings. Owner backlog shorthand: ADO (template formerly SEO on legacy settings path). */
  {
    rowId: "ADO",
    path: "/administration/identity-providers/role-mapping",
    section: "Admin",
    note: "Role mapping (Settings/Admin) - IdentityProvidersRoleMappingPageView with PageContextualHelpButton (topic map users-and-roles; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, status / examples / SAML+diagnostics CTAs. Sibling AUX = users; AID = identity-providers hub. Access configuration - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["IdentityProvidersRoleMappingPageView", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for API keys settings. Owner backlog shorthand: ADP (template formerly SAE on legacy settings/api-keys path). */
  {
    rowId: "ADP",
    path: "/administration/api-keys",
    section: "Admin",
    note: "API keys (Admin/Settings) - ApiKeysSettingsPageClient with PageContextualHelpButton (topic map users-and-roles; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, summary / credentials / recent events. Sibling AUX = users; HCX = cli-usage help. Automation credential controls - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["ApiKeysSettingsPageClient", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Preferences settings. Owner backlog shorthand: ADR (template formerly SEP on legacy settings/preferences path). */
  {
    rowId: "ADR",
    path: SETTINGS_PREFERENCES_PATH,
    section: "Admin",
    note: "Preferences (Settings) - PreferencesSettingsPageView with PageContextualHelpButton (topic map getting-started; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, appearance / theme. Sibling ADS = account-security; HGX = getting-started help. Personal account settings - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["PreferencesSettingsPageView", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Account security settings. Owner backlog shorthand: ADS (template formerly SEA; template advisory-scans tab ADS renamed ADT). */
  {
    rowId: "ADS",
    path: SETTINGS_ACCOUNT_SECURITY_PATH,
    section: "Admin",
    note: "Account security (Settings) - AccountSecurityPageClient with PageContextualHelpButton (topic map security-trust; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, sign-in methods / link flows. Sibling ADR = preferences; WSX = security-trust settings; HSE = security-trust help. Personal sign-in controls - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["AccountSecurityPageClient", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Sign-in domains (auth-domains) settings. Owner backlog shorthand: ADU (template formerly SEU on legacy settings/auth-domains path). */
  {
    rowId: "ADU",
    path: "/administration/auth-domains",
    section: "Admin",
    note: "Sign-in domains (Settings/Admin) - AuthDomainsPageClient with PageContextualHelpButton (topic map enterprise-onboarding; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, domain verify / routing test / SSO enforcement. Sibling AID = identity-providers; ADS = account-security; HEX = enterprise-onboarding help. Access configuration - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["AuthDomainsPageClient", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Extract and Upload settings. Owner backlog shorthand: ADX (template formerly SE on legacy settings/extract-upload path). */
  {
    rowId: "ADX",
    path: "/administration/extract-upload",
    section: "Admin",
    note: "Extract and Upload (Settings) - ExtractUploadSettingsPageClient with PageContextualHelpButton (topic map evidence-intake; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, extractor command / ZIP upload. Sibling EVI = evidence-intake help; RNX = start review; SCE = cloud-connections. Inventory intake controls - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["ExtractUploadSettingsPageClient", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Evidence proposals. Owner backlog shorthand: AEX. */
  {
    rowId: "AEX",
    path: INTERNAL_EVIDENCE_PROPOSALS_PATH,
    section: "Admin",
    note: "Evidence proposals (Admin) - AdminEvidenceProposalsPageClient with PageContextualHelpButton (topic map evidence-trail; Category-1 registry), promote queue. Internal agent catalog candidates - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Fleet LLM COGS. Owner backlog shorthand: AFX. */
  {
    rowId: "AFX",
    path: "/internal/fleet-llm-cogs",
    section: "Admin",
    note: "Fleet LLM COGS (Admin) - FleetLlmCogsAdminPageClient with PageContextualHelpButton (Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), fleet cost table. Internal ops cost console - not a signed-record Sources trail.admin KPI/config ceiling below ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["FleetLlmCogsAdminPageClient", "cannot improve further toward 80"],
    sectionMustNotEqualLower: ["marketing"],
  },
  /** Traffic workbook row ID for Diagnostics dashboard (/internal/health). Owner backlog shorthand: AHX. */
  {
    rowId: "AHX",
    path: "/internal/health",
    section: "Admin",
    note: "Diagnostics dashboard (Admin) - AdminHealthPageView with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), readiness/config lint tiles. Sibling ADY = system-health; ACX = configuration. Not a signed-record Sources trail. Score 68/100 (2026-08-08) - admin diagnostics at ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for SSO and identity (identity-providers) hub. Owner backlog shorthand: AID (template formerly SIX on legacy settings path). */
  {
    rowId: "AID",
    path: "/administration/identity-providers",
    section: "Admin",
    note: "SSO and identity hub (Settings/Admin) - IdentityProvidersSettingsPageView with PageContextualHelpButton (shared header; topic map enterprise-onboarding; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, overview summary / configure links. Sibling ADU = auth-domains; ADO = role-mapping; HEX = enterprise-onboarding help. Access configuration - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["IdentityProvidersSettingsPageView", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for ITSM connectors (admin). Owner backlog shorthand: AII. */
  {
    rowId: "AII",
    path: "/internal/integrations/itsm",
    section: "Admin",
    note: "ITSM connectors (Admin) - AdminItsmConnectorsPageClient with PageContextualHelpButton (topic map integration-readiness; Category-1 registry), health probes + wizard. Sibling IJX/ISX = buyer Jira/ServiceNow; IIO = OAuth callback. Not a signed-record Sources trail. Score 78/100 (2026-08-08) - admin connector hub hard-caps short of diligence packing. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
  },
  /** Traffic workbook row ID for AI and model governance settings. Owner backlog shorthand: AMO (template formerly SEM on legacy settings path). */
  {
    rowId: "AMO",
    path: "/administration/model-governance",
    section: "Admin",
    note: "AI and model governance (Settings/Admin) - ModelGovernanceSettingsPage with PageContextualHelpButton (topic map getting-started; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, execution profile / alias registry. Sibling ADI = ai-usage; ABI = billing; HBX = billing-and-plans help. Model profile controls - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["ModelGovernanceSettingsPage", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for OIDC identity-provider settings. Owner backlog shorthand: AOI (template formerly SOI on legacy settings path). */
  {
    rowId: "AOI",
    path: "/administration/identity-providers/oidc",
    section: "Admin",
    note: "OIDC identity provider (Settings/Admin) - IdentityProvidersOidcPageView with PageContextualHelpButton (shared header; topic map enterprise-onboarding; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, discovery / authority / audience status. Sibling AID = identity-providers hub; ADO = role-mapping; HEX = enterprise-onboarding help. Access configuration - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["IdentityProvidersOidcPageView", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Pricing quote follow-up. Owner backlog shorthand: APX. */
  {
    rowId: "APX",
    path: INTERNAL_PRICING_QUOTE_AGING_PATH,
    section: "Admin",
    note: "Pricing quote follow-up (Admin) - PricingQuoteAgingPageClient with PageContextualHelpButton (topic map billing-and-plans; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, open-quote SLA / owner table. Sibling ATD = trial-funnel; ATX = tenant-health; P = /pricing. Internal sales ops - not a signed-record Sources trail.admin KPI/config ceiling below ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["PricingQuoteAgingPageClient", "claim-discipline", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for RAG corpus health. Owner backlog shorthand: ARX. */
  {
    rowId: "ARX",
    path: "/internal/rag-health",
    section: "Admin",
    note: "RAG corpus health (Admin) - RagHealthAdminPageClient with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), per-corpus table. Sibling AHX = diagnostics; ADY = system-health. Not a signed-record Sources trail. Score 62/100 (2026-08-08) - admin RAG ops hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for SAML identity-provider settings. Owner backlog shorthand: ASA (template formerly SSA on legacy settings path). */
  {
    rowId: "ASA",
    path: "/administration/identity-providers/saml",
    section: "Admin",
    note: "SAML identity provider (Settings/Admin) - IdentityProvidersSamlPageClient with PageContextualHelpButton (shared header; topic map enterprise-onboarding; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, SamlSpConfigurationForm metadata / issuer / claim mapping. Sibling AID = identity-providers hub; AOI = oidc; ADO = role-mapping; SEI = diagnostics. Access configuration - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["IdentityProvidersSamlPageClient", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for SCIM provisioning. Owner backlog shorthand: ASC (template formerly SSX on legacy settings path). */
  {
    rowId: "ASC",
    path: "/administration/scim-provisioning",
    section: "Admin",
    note: "SCIM provisioning (Settings/Admin) - ScimProvisioningSettingsPageClient with PageContextualHelpButton (topic map enterprise-onboarding; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, inbound token issue / verify / revoke. Sibling AID = identity-providers hub; ASS = sso-wizard; AUX = users. Access configuration - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["ScimProvisioningSettingsPageClient", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for SSO wizard. Owner backlog shorthand: ASS (template formerly SIS on legacy settings path). */
  {
    rowId: "ASS",
    path: "/administration/identity/sso-wizard",
    section: "Admin",
    note: "SSO wizard (Settings/Admin) - SsoWizardPageClient with PageContextualHelpButton (topic map enterprise-onboarding; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, guided OIDC/SAML discover / map / test / activate. Sibling AID = identity-providers hub; ASA = saml; AOI = oidc; SEI = diagnostics. Access configuration - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["SsoWizardPageClient", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Admin trial funnel. Owner backlog shorthand: ATD. */
  {
    rowId: "ATD",
    path: "/internal/trial-funnel",
    section: "Admin",
    note: "Trial funnel (Admin) - TrialFunnelOpsPageClient with PageContextualHelpButton (topic map billing-and-plans; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, stage KPIs + cohort table/export. Internal conversion metrics Ã¢â‚¬â€ not a signed-record Sources trail.admin KPI/config ceiling below ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["TrialFunnelOpsPageClient", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Tenant settings. Owner backlog shorthand: ATE (template formerly STX on legacy settings path). */
  {
    rowId: "ATE",
    path: "/administration/workspace-settings",
    section: "Admin",
    note: "Tenant settings (Settings/Admin) - TenantSettingsPageView with PageContextualHelpButton (topic map scope; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, workspace defaults / quality gates / cost settings. Sibling STR = recycle-bin; DIS = digests schedule. Access configuration - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["TenantSettingsPageView", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Admin tenant health. Owner backlog shorthand: ATX. */
  {
    rowId: "ATX",
    path: "/internal/tenant-health",
    section: "Admin",
    note: "Tenant health (Admin) - TenantHealthAdminPageClient with PageContextualHelpButton (topic map troubleshooting; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), engagement/governance/funnel table. Internal CS engagement scores - not a signed-record Sources trail. Score 58/100 (2026-08-08) - admin KPI hub ceiling below ADY readiness band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["TenantHealthAdminPageClient", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Users and roles settings. Owner backlog shorthand: AUX. */
  {
    rowId: "AUX",
    path: SETTINGS_USERS_PATH,
    section: "Admin",
    note: "Users and roles (Settings/Admin) - SettingsRolesPageView with PageContextualHelpButton (topic map users-and-roles; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), Users/Roles tabs, invite + matrix. Access configuration - not a signed-record Sources trail. Score 68/100 (2026-08-08) - access-hub at SET Admin Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["SettingsRolesPageView", "Score 68/100", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Admin tenants provisioning. Owner backlog shorthand: ATY. */
  {
    rowId: "INT",
    path: "/internal/tenants",
    section: "Admin",
    note: "Tenants (Admin) - AdminTenantsPageClient with PageContextualHelpButton (topic map enterprise-onboarding; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, provision / shut-off / lifecycle table. Sibling ATX = tenant-health. Internal tenant lifecycle console - not a signed-record Sources trail.admin KPI/config ceiling below ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["AdminTenantsPageClient", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Identity providers diagnostics. Owner backlog shorthand: SEI. */
  {
    rowId: "SEI",
    path: "/administration/identity-providers/diagnostics",
    section: "Admin",
    note: "Identity diagnostics (Settings/Admin) - IdentityProvidersDiagnosticsPageView with PageContextualHelpButton (shared header; topic map enterprise-onboarding; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, health probes / OIDC+SAML strips / token test mapping. Sibling AID = identity-providers hub; AOI = oidc; ADO = role-mapping. Access diagnostic surface - not a signed-record Sources trail.admin KPI/config ceiling below ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["IdentityProvidersDiagnosticsPageView", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Administration / Settings hub. Owner backlog shorthand: SET. */
  {
    rowId: "SET",
    path: "/administration",
    section: "Admin",
    note: "Settings hub (Admin) - SettingsPageView with SettingsMasterOverviewHeader PageContextualHelpButton (topic map configuration-reference; Category-1 registry), section search/cards. Sibling ADY = system-health; AUX = users; ATE = tenant. Not a signed-record Sources trail by itself. Score 68/100 (2026-08-08) - configuration launcher at ADY Admin Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Invite a reviewer. Owner backlog shorthand: SRI. */
  {
    rowId: "SRI",
    path: "/administration/users/invite-reviewer",
    section: "Admin",
    note: "Invite a reviewer (Settings/Admin) - InviteReviewerPageView with PageContextualHelpButton (topic map users-and-roles; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), invite panel + Reader capabilities summary. Access invitation hub - not a signed-record Sources trail. Sibling AUX = Users and roles. Score 68/100 (2026-08-08) - access-invite hub access-invite hub at AUX Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["InviteReviewerPageView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Projects recycle bin. Owner backlog shorthand was ARE (collides with template sponsor-dashboard); template/catalog ID is STR. */
  {
    rowId: "STR",
    path: "/administration/workspace-settings/recycle-bin",
    section: "Admin",
    note: "Projects recycle bin (Administration) - ProjectsRecycleBinPage with OperatorPageBreadcrumb Administration parent, PageContextualHelpButton (topic map scope; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, soft-deleted project restore. Sibling ATE = tenant settings; ARA = architectures list. Access configuration - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["ProjectsRecycleBinPage", "Administration", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for operator Security & Trust settings. Owner backlog shorthand: WSX. */
  {
    rowId: "WSX",
    path: SETTINGS_SECURITY_TRUST_PATH,
    section: "Admin",
    note: "Security & Trust (Settings) - OperatorSecurityTrustPageView with PageContextualHelpButton (topic map security-trust; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, procurement materials + NDA/roadmap honesty. Sibling SEC = /security-trust hub; HSE = /help/security-trust; TXX = /trust. Operator orientation Ã¢â‚¬â€ not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["OperatorSecurityTrustPageView", "Sources", "cannot improve further toward 80"],
  },
];

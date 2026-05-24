> **Scope:** Authoritative crosswalk of HTTP route families → commercial tier gate (if any), ASP.NET authorization policy, and operator nav visibility — for procurement reviewers and contributors avoiding “UI link implies HTTP access” confusion.

# Route, tier, policy, and navigation matrix

This matrix complements **[PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md)** four-boundary rules. **HTTP behavior** is defined by controllers and **`CommercialTenantTierFilter`**; **nav visibility** is defined by **`archlucid-ui/src/lib/nav-config.ts`** pipeline (**tier → authority** in **`nav-shell-visibility.ts`**). Cells cite source; use **verify pending** when an attribute was not re-checked in the same edit.

## Pilot-critical routes (sample)

| HTTP route family | Commercial tier gate (`RequiresCommercialTenantTier`) | Primary policy (`[Authorize(Policy=…)]`) | Nav (`href` · tier · `requiredAuthority`) | Notes |
| --- | --- | --- | --- | --- |
| `GET/POST /v1/pilots/*` (excluding Standard-only actions) | None on controller base (`PilotsController` uses `ReadAuthority`) | Mix: base **ReadAuthority**; `PUT scorecard/baselines`, `POST closeout` **ExecuteAuthority** | Pilot: `/`, `/reviews/new`, `/reviews?projectId=default` · essential · (unset) | `POST …/sponsor-one-pager` **Standard** per PRODUCT_PACKAGING §4 |
| `GET/POST /v1/runs/*`, run detail APIs | None on typical read paths (verify per action) | **ReadAuthority** / **ExecuteAuthority** per action | Pilot essential + extended **`/governance/findings`** | Compare PRODUCT_PACKAGING Layer A/B inventories |
| `GET /v1/tenant/trial-status` | None | **ReadAuthority** (`TenantTrialController.GetTrialStatusAsync`) | (indirect — Home / trial widgets) | Class `[Authorize]` + action policy |
| `POST /v1/diagnostics/core-pilot-rail-step` | None | **`[AllowAnonymous]`** on action (overrides controller **ReadAuthority**); **fixed** rate limit | N/A | Core Pilot checklist counter only (`ClientErrorTelemetryController`) |

## Operate routes (sample)

| HTTP route family | Tier gate | Policy | Nav | Notes |
| --- | --- | --- | --- | --- |
| `POST /v1/governance/approval-requests` | **Standard** (per PRODUCT_PACKAGING §4 inventory) | **ExecuteAuthority** typical | **`operate-governance`** links · extended+ | Sub-tier → **404** |
| `GET/POST /v1/alerts/*` | **Standard** min for many mutations (verify controller) | Mixed Read/Execute | **`/alerts`** · tier **essential** for hub | Tier gate per Commercial filter |
| `GET/POST /v1/compare`, `/v1/replay` | **Standard** (per packaging doc) | Mixed | `/compare`, `/replay` · extended | Progressive disclosure |

## Single source of truth order

1. **Code:** `ArchLucid.Api` controllers + **`CommercialTenantTierFilter`**.  
2. **Executable registry + CI:** `scripts/ci/data/route_tier_policy_nav_registry.json` + **`assert_route_tier_policy_nav.py`** (appendix table below). After adding or changing a controller, run **`python scripts/ci/assert_route_tier_policy_nav.py --sync`** (or rely on the installed **`pre-commit`** hook — **`pwsh scripts/install-git-hooks.ps1`**). Set **`nav_operator_href`** / exemption overrides in **`scripts/ci/data/route_tier_policy_nav_overrides.json`** when the API maps to operator nav or is exempt from nav parity.  
3. **Nav:** `nav-config` builders + **`nav-shell-visibility`**.  
4. **Narrative:** **[PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md)** — update the sample tables in this doc when buyer-visible behavior changes; refresh the appendix when controllers ship.

**Related:** **[PROCUREMENT_FAST_LANE.md](../go-to-market/PROCUREMENT_FAST_LANE.md)** (procurement skim), **[NAV_CONFIG_CONTRACT.md](NAV_CONFIG_CONTRACT.md)** if present.

## Appendix — per-controller registry (CI)

Merge-blocking check: `python scripts/ci/assert_route_tier_policy_nav.py` after editing controllers, overrides, or this table.

- **Registry JSON:** `scripts/ci/data/route_tier_policy_nav_registry.json` (regenerate: `python scripts/ci/assert_route_tier_policy_nav.py --sync`).
- **Allowlist / exemption reasons:** `scripts/ci/data/route_tier_policy_nav_exemptions.json`.
- **Nav / exemption overrides:** `scripts/ci/data/route_tier_policy_nav_overrides.json`.

<!-- route-tier-policy-nav-registry-count:147 -->

| Controller source | API prefix (normalized) | commercial_tier (class) | class_policy | Operator nav href (parity only) | Exemption code |
| --- | --- | --- | --- | --- | --- |
| `Admin/AdminApiKeySettingsController.cs` | `/v1/admin/settings/api-keys` | none | AdminAuthority | /settings/api-keys |  |
| `Admin/AdminAuthDiagnosticsController.cs` | `/v1/admin` | none | AdminAuthority |  | auth_debug_api |
| `Admin/AdminController.cs` | `/v1/admin` | none | AdminAuthority |  |  |
| `Admin/AdminLlmCostTuningController.cs` | `/v1/admin` | none | AdminAuthority | /settings/tenant-cost |  |
| `Admin/AdminLlmMonthlyDollarBudgetStatusController.cs` | `/v1/admin` | none | ExecuteAuthority |  |  |
| `Admin/AdminTenantsController.cs` | `/v1/admin/tenants` | none | PlatformTenantDeletionAuthority | /admin/users |  |
| `Admin/AuditController.cs` | `/v1/audit` | none | ReadAuthority | /audit |  |
| `Admin/AuthDebugController.cs` | `/api/auth` | none | ReadAuthority |  | auth_debug_api |
| `Admin/ClientErrorTelemetryController.cs` | `/v1/diagnostics` | none | ReadAuthority |  |  |
| `Admin/ConfluencePublishingAdminController.cs` | `/v1/admin/integrations/confluence` | none | AdminAuthority |  |  |
| `Admin/CustomRolesAdminController.cs` | `/v1/admin/roles` | none | AdminAuthority |  |  |
| `Admin/DemoController.cs` | `/v1/demo` | none | ExecuteAuthority |  | demo_tooling |
| `Admin/DiagnosticsController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Admin/DocsController.cs` | `/docs` | none | ReadAuthority |  | static_operator_docs_html |
| `Admin/EvidenceProposalsController.cs` | `/v1/admin/evidence` | none | AdminAuthority |  |  |
| `Admin/HostedAzureExtractorAdminController.cs` | `/v1/admin/azure-extractor/hosted` | none | AdminAuthority |  |  |
| `Admin/HostedAzureExtractorRunController.cs` | `/v1/admin/azure-extractor/hosted` | none | ExecuteAuthority |  |  |
| `Admin/IdentityProviderConfigurationController.cs` | `/v1/admin/identity` | none | AdminAuthority |  |  |
| `Admin/JobsController.cs` | `/v1/jobs` | none | ReadAuthority |  |  |
| `Admin/MarketingPricingQuoteAgingAdminController.cs` | `/v1/admin/marketing/pricing-quote-aging` | none | AdminAuthority |  |  |
| `Admin/MeteringAdminController.cs` | `/v1/admin/metering` | none | AdminAuthority | /settings/tenant-cost |  |
| `Admin/PromptVariantsAdminController.cs` | `/v1/admin/prompt-variants` | none | AdminAuthority |  |  |
| `Admin/ReferenceEvidenceAdminController.cs` | `/v1/admin/tenants/{tenantId:guid}/reference-evidence` | none | AdminAuthority |  |  |
| `Admin/RoiBulletinAdminController.cs` | `/v1/admin/roi-bulletin-preview` | none | AdminAuthority |  |  |
| `Admin/ScimTokensAdminController.cs` | `/v1/admin/scim/tokens` | none | AdminAuthority |  |  |
| `Admin/ScopeDebugController.cs` | `/v1/scope` | none | ReadAuthority |  |  |
| `Admin/SecurityTrustPublicationController.cs` | `/v1/admin/security-trust` | none | AdminAuthority | /workspace/security-trust |  |
| `Admin/SettingsController.cs` | `/v1/admin/settings` | none | AdminAuthority | /settings/tenant |  |
| `Admin/SupportBundleController.cs` | `/v1/admin` | none | AdminAuthority | /admin/support |  |
| `Admin/TenantsAdminController.cs` | `/v1/admin/tenants` | none | AdminAuthority | /admin/users |  |
| `Advisory/AdvisoryController.cs` | `/v1/advisory` | standard | ReadAuthority | /advisory |  |
| `Advisory/AdvisorySchedulingController.cs` | `/v1/advisory-scheduling` | standard | ReadAuthority |  |  |
| `Advisory/DigestSubscriptionsController.cs` | `/v1/digest-subscriptions` | standard | ReadAuthority | /digests |  |
| `Advisory/LearningController.cs` | `/v1/learning` | standard | ReadAuthority |  |  |
| `Advisory/ProductLearningController.cs` | `/v1/product-learning` | standard | ReadAuthority | /product-learning |  |
| `Advisory/RecommendationLearningController.cs` | `/v1/recommendation-learning` | standard | ReadAuthority | /recommendation-learning |  |
| `AgentExecution/AgentExecutionCostPreviewController.cs` | `/v1/agent-execution` | none | AllowAnonymous |  | anonymous_wizard_cost_preview |
| `Alerts/AlertRoutingSubscriptionsController.cs` | `/v1/alert-routing-subscriptions` | standard | ReadAuthority | /alerts |  |
| `Alerts/AlertRulesController.cs` | `/v1/alert-rules` | standard | ReadAuthority | /alerts |  |
| `Alerts/AlertSimulationController.cs` | `/v1/alert-simulation` | standard | ReadAuthority | /alerts |  |
| `Alerts/AlertTuningController.cs` | `/v1/alert-tuning` | standard | ReadAuthority | /alerts |  |
| `Alerts/AlertsController.cs` | `/v1/alerts` | standard | ReadAuthority | /alerts |  |
| `Alerts/CompositeAlertRulesController.cs` | `/v1/composite-alert-rules` | standard | ReadAuthority | /alerts |  |
| `Analytics/InternalCrossTenantAnalyticsController.cs` | `/v1/internal/analytics` | none | RequireOperatorRole |  | internal_cross_tenant_analytics |
| `Analytics/RoiAnalyticsController.cs` | `/v1/analytics` | none | ReadAuthority |  |  |
| `Auth/TrialLocalIdentityAuthController.cs` | `/v1/auth/trial/local` | none | AllowAnonymous |  | trial_local_identity_auth |
| `Authority/AnalysisReportsController.cs` | `/v1/architecture` | standard | ExecuteAuthority |  |  |
| `Authority/ArchitectureDefinitionImportController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/ArchitectureExportController.cs` | `/v1/architecture` | standard | ReadAuthority |  |  |
| `Authority/ArchitectureQuickScanController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/ArtifactExportController.cs` | `/v1/artifacts` | standard | ReadAuthority |  |  |
| `Authority/AuthorityCompareController.cs` | `/v1/authority/compare` | standard | ReadAuthority |  |  |
| `Authority/AuthorityQueryController.cs` | `/v1/authority` | none | ReadAuthority |  |  |
| `Authority/AuthorityReplayController.cs` | `/v1/internal/authority/replay` | standard | RequireOperatorRole |  | internal_replay_diagnostics |
| `Authority/AuthorityRunEventsController.cs` | `/v1/authority` | none | ReadAuthority |  |  |
| `Authority/AzureExtractorUploadController.cs` | `/v1/azure-extractor` | none | ReadAuthority |  |  |
| `Authority/DocxExportController.cs` | `/v1/docx` | standard | ReadAuthority |  |  |
| `Authority/EvidenceBulkUploadController.cs` | `/v1/architecture/run/{runId:guid}/evidence` | none | ExecuteAuthority |  |  |
| `Authority/ExecutiveSummaryController.cs` | `/api/authority/executive-summary` | none | ReadAuthority |  | non_versioned_executive_api |
| `Authority/ExportsController.cs` | `/v1/architecture` | standard | ReadAuthority |  |  |
| `Authority/FastPathContextController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/ImportRequestFileController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/InternalArchitectureDiagnosticsController.cs` | `/v1/internal/architecture` | none | RequireOperatorRole |  | internal_architecture_diagnostics |
| `Authority/RunAgentEvaluationController.cs` | `/v1/internal/architecture` | none | ReadAuthority |  | internal_architecture_diagnostics |
| `Authority/RunComparisonController.cs` | `/v1/architecture` | standard | ReadAuthority | /compare |  |
| `Authority/RunQueryController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/RunsController.cs` | `/v1/architecture` | none | ReadAuthority | /reviews?projectId=default |  |
| `Authority/RunsExportController.cs` | `/v1/runs` | standard | ReadAuthority |  |  |
| `Authority/TemplatesController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/Tier2ConnectionController.cs` | `/v1/azure-extractor/connections` | none | ExecuteAuthority |  |  |
| `Billing/BillingCheckoutController.cs` | `/v1/tenant/billing` | none | AdminAuthority | /settings/tenant |  |
| `Billing/BillingMarketplaceWebhookController.cs` | `/v1/billing/webhooks` | none | AllowAnonymous |  | partner_webhook_ingest |
| `Billing/BillingStripeWebhookController.cs` | `/v1/billing/webhooks` | none | AllowAnonymous |  | partner_webhook_ingest |
| `Demo/DemoCommitPagePreviewController.cs` | `/v1/demo` | none | AllowAnonymous |  | demo_tooling |
| `Demo/DemoExplainController.cs` | `/v1/demo` | none | AllowAnonymous |  | demo_tooling |
| `Demo/DemoViewerController.cs` | `/v1/demo/viewer` | none | AllowAnonymous |  | demo_tooling |
| `Demo/QuickStartController.cs` | `/v1/demo` | none | AllowAnonymous |  | demo_tooling |
| `Diagnostics/ConfigurationHealthController.cs` | `/v1/diagnostics` | none | RequireAdmin | /admin/health |  |
| `Diagnostics/OperatorTaskSuccessDiagnosticsController.cs` | `/v1/diagnostics` | standard | ReadAuthority |  |  |
| `Diagnostics/SyntheticOperatorDemoPackController.cs` | `/v1/diagnostics` | none | RequireAdmin |  | synthetic_demo_admin_pack |
| `E2e/E2eHarnessController.cs` | `/v1/e2e` | none | AllowAnonymous |  | e2e_nonprod_harness |
| `Evolution/EvolutionController.cs` | `/v1/evolution` | standard | ReadAuthority | /evolution-review |  |
| `Findings/ArchitectureFindingAskController.cs` | `/v1/architecture/finding` | standard | ReadAuthority |  |  |
| `Findings/FindingInspectController.cs` | `/v1/findings` | standard | ReadAuthority | /governance/findings |  |
| `Findings/FindingMuteController.cs` | `/v1/findings` | standard | ExecuteAuthority | /governance/findings |  |
| `Governance/GovernanceController.cs` | `/v1/governance` | standard | ReadAuthority | /governance |  |
| `Governance/GovernancePreCommitSimulationController.cs` | `/v1/governance/pre-commit` | standard | ReadAuthority |  |  |
| `Governance/GovernancePreviewController.cs` | `/v1/governance-preview` | standard | ReadAuthority |  |  |
| `Governance/GovernanceResolutionController.cs` | `/v1/governance-resolution` | standard | ReadAuthority | /governance-resolution |  |
| `Governance/ManifestsController.cs` | `/v1/architecture` | standard | ReadAuthority |  |  |
| `Governance/PolicyPacksController.cs` | `/v1/policy-packs` | standard | ReadAuthority | /policy-packs |  |
| `Integrations/ItsmCorrelationController.cs` | `/v1/integrations/itsm/correlations` | none | ExecuteAuthority |  |  |
| `Integrations/ItsmInboundWebhooksController.cs` | `/v1/integrations/webhooks` | none | AllowAnonymous |  | partner_webhook_ingest |
| `Integrations/ItsmIntegrationHealthController.cs` | `/v1/integrations/itsm/health` | standard | Authorize |  |  |
| `Integrations/ItsmOutboundIssuesController.cs` | `/v1/integrations/itsm/outbound/issues` | none | ExecuteAuthority |  |  |
| `Integrations/SlackInteractivityController.cs` | `/v1/integrations/webhooks/slack` | none | AllowAnonymous |  | partner_webhook_ingest |
| `Integrations/TeamsIncomingWebhookConnectionsController.cs` | `/v1/integrations/teams` | standard | Authorize | /integrations/teams |  |
| `Integrations/WebhookConnectionsController.cs` | `/v1/integrations/webhooks` | standard | ReadAuthority |  |  |
| `Integrations/WebhookSimulationController.cs` | `/v1/integrations/webhooks` | none | ExecuteAuthority |  |  |
| `Marketing/EnterpriseComparisonMarketingController.cs` | `/v1/marketing` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/MarketingEarlyAccessRequestController.cs` | `/v1/marketing/early-access` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/MarketingPricingQuoteRequestController.cs` | `/v1/marketing/pricing` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/MarketingShowcaseController.cs` | `/v1/marketing/showcase` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/SponsorBriefMarketingController.cs` | `/v1/marketing` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/TrustCenterEvidencePackController.cs` | `/v1/marketing/trust-center` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/WhyArchlucidMarketingPackController.cs` | `/v1/marketing` | none | AllowAnonymous |  | marketing_public_api |
| `Notifications/CustomerNotificationChannelPreferencesController.cs` | `/v1/notifications` | standard | AuthenticatedUserOnly |  |  |
| `Notifications/ExecDigestUnsubscribeController.cs` | `/v1/notifications/exec-digest` | none | AllowAnonymous |  | signed_token_unsubscribe |
| `Operator/OperatorSavedViewsController.cs` | `/v1/operator/saved-views` | standard | AuthenticatedUserOnly |  |  |
| `Pilots/PilotsBoardPackController.cs` | `/v1/pilots` | standard | ExecuteAuthority | /scorecard |  |
| `Pilots/PilotsController.cs` | `/v1/pilots` | none | ReadAuthority | /reviews?projectId=default |  |
| `Planning/AskController.cs` | `/v1/ask` | standard | ReadAuthority | /ask |  |
| `Planning/ComparisonController.cs` | `/v1/compare` | standard | ReadAuthority | /compare |  |
| `Planning/ComparisonsController.cs` | `/v1/architecture` | standard | ReadAuthority | /replay |  |
| `Planning/ConversationController.cs` | `/v1/conversations` | standard | ReadAuthority |  |  |
| `Planning/ExplanationController.cs` | `/v1/explain` | standard | ReadAuthority |  |  |
| `Planning/FindingFeedbackController.cs` | `/v1/explain` | standard | ExecuteAuthority |  |  |
| `Planning/GraphController.cs` | `/v1/graph` | standard | ReadAuthority | /graph |  |
| `Planning/ProvenanceController.cs` | `/v1/provenance` | standard | ReadAuthority |  |  |
| `Planning/ProvenanceQueryController.cs` | `/v1/authority` | standard | ReadAuthority |  |  |
| `Planning/RetrievalController.cs` | `/v1/retrieval` | standard | ReadAuthority | /search |  |
| `RegistrationController.cs` | `/v1/register` | none | AllowAnonymous |  | registration_public_flow |
| `Reports/ExecutiveSummaryController.cs` | `/v1/reports/executive-summary` | none | ReadAuthority |  |  |
| `Reports/ReportsController.cs` | `/v1/reports` | none | ReadAuthority |  |  |
| `Roi/RoiController.cs` | `/v1/roi` | none | ReadAuthority | /dashboard |  |
| `Scim/ScimDiscoveryController.cs` | `/scim/v2` | none | ScimWrite |  | scim_idp_automation |
| `Scim/ScimGroupsController.cs` | `/scim/v2/Groups` | none | ScimWrite |  | scim_idp_automation |
| `Scim/ScimUsersController.cs` | `/scim/v2/Users` | none | ScimWrite |  | scim_idp_automation |
| `SearchController.cs` | `/v1/search` | none | ReadAuthority |  |  |
| `Tenancy/CorePilotTeamChecklistController.cs` | `/v1/tenant/core-pilot-checklist` | standard | Authorize | /onboarding |  |
| `Tenancy/TenantBaselineController.cs` | `/v1/tenant/baseline` | none | Authorize | /settings/baseline |  |
| `Tenancy/TenantCostEstimateController.cs` | `/v1/tenant/cost-estimate` | standard | Authorize | /settings/tenant-cost |  |
| `Tenancy/TenantCostSettingsController.cs` | `/v1/tenant/cost-settings` | none | Authorize |  |  |
| `Tenancy/TenantCustomerSuccessController.cs` | `/v1/tenant/customer-success` | standard | Authorize |  |  |
| `Tenancy/TenantErasureLegalHoldController.cs` | `/v1/tenant/erasure` | none | Authorize |  |  |
| `Tenancy/TenantExecDigestPreferencesController.cs` | `/v1/tenant` | standard | Authorize |  |  |
| `Tenancy/TenantIntegrationsOperationsController.cs` | `/v1/tenant/integrations/operations` | standard | Authorize |  |  |
| `Tenancy/TenantMeasuredRoiController.cs` | `/v1/tenant/measured-roi` | standard | Authorize | /value-report/roi |  |
| `Tenancy/TenantPilotValueReportController.cs` | `/v1/tenant` | none | Authorize | /value-report/pilot |  |
| `Tenancy/TenantTrialController.cs` | `/v1/tenant` | none | Authorize | /settings/tenant |  |
| `Tenancy/TenantWeeklyDigestHealthController.cs` | `/v1/tenant/operate/weekly-digest-health` | standard | Authorize |  |  |
| `Tenancy/TenantWorkspaceBaselineArtifactsController.cs` | `/v1/tenant/workspace-baseline-artifacts` | none | Authorize |  |  |
| `Tenancy/TenantWorkspacesController.cs` | `/v1/tenant/workspaces` | none | Authorize |  |  |
| `ValueReports/ValueReportController.cs` | `/v1/value-report` | standard | ExecuteAuthority | /value-report |  |
| `VersionController.cs` | `/version` | none | AllowAnonymous |  | unversioned_version_probe |
| `Webhooks/OutboundWebhookDryRunController.cs` | `/v1/webhooks` | none | ExecuteAuthority |  |  |
| `Webhooks/WebhooksController.cs` | `/v1/webhooks/subscriptions` | standard | ReadAuthority |  |  |

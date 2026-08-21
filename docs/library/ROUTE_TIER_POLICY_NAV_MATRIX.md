> **Scope:** Authoritative crosswalk of HTTP route families → commercial tier gate (if any), ASP.NET authorization policy, and operator nav visibility — for procurement reviewers and contributors avoiding “UI link implies HTTP access” confusion.

# Route, tier, policy, and navigation matrix

This matrix complements **[PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md)** four-boundary rules. **HTTP behavior** is defined by controllers and **`CommercialTenantTierFilter`**; **nav visibility** is defined by **`archlucid-ui/src/lib/nav-config.ts`** pipeline (**tier → authority** in **`nav-shell-visibility.ts`**). Cells cite source; use **verify pending** when an attribute was not re-checked in the same edit.

## Freshness Summary

| Signal | Current value |
| --- | --- |
| Registry rows | **207** controller route families (`route-tier-policy-nav-registry-count`) |
| Executable registry | `scripts/ci/data/route_tier_policy_nav_registry.json` |
| CI command | `python scripts/ci/assert_route_tier_policy_nav.py` |
| Regenerate intentionally | `python scripts/ci/assert_route_tier_policy_nav.py --sync` |
| Freshness trigger | Controller routes, `[Authorize]` policies, `[RequiresCommercialTenantTier]`, operator nav builders, packaging/pricing route claims |

Reviewer shorthand: the appendix below is generated from the executable registry. If a branch changes route code, commercial tier filters, policy attributes, or operator navigation, rerun the guard before procurement or sponsor handoff. The matrix explains visibility; it does **not** grant access and does not replace API authorization.

## Pilot-critical routes (sample)

| HTTP route family | Commercial tier gate (`RequiresCommercialTenantTier`) | Primary policy (`[Authorize(Policy=…)]`) | Nav (`href` Â· tier Â· `requiredAuthority`) | Notes |
| --- | --- | --- | --- | --- |
| `GET/POST /v1/pilots/*` (excluding Standard-only actions) | None on controller base (`PilotsController` uses `ReadAuthority`) | Mix: base **ReadAuthority**; `PUT scorecard/baselines`, `POST closeout` **ExecuteAuthority** | Pilot: `/`, `/architecture/reviews/new`, `/architecture/reviews?projectId=default` Â· essential Â· (unset) | `POST …/sponsor-one-pager` **Standard** per PRODUCT_PACKAGING Â§4 |
| `GET/POST /v1/runs/*`, run detail APIs | None on typical read paths (verify per action) | **ReadAuthority** / **ExecuteAuthority** per action | Pilot essential + extended **`/governance/findings`** | Compare PRODUCT_PACKAGING Layer A/B inventories |
| `GET /v1/tenant/trial-status` | None | **ReadAuthority** (`TenantTrialController.GetTrialStatusAsync`) | (indirect — Home / trial widgets) | Class `[Authorize]` + action policy |
| `POST /v1/diagnostics/core-pilot-rail-step` | None | **`[AllowAnonymous]`** on action (overrides controller **ReadAuthority**); **fixed** rate limit | N/A | Core Pilot checklist counter only (`ClientErrorTelemetryController`) |

## Operate routes (sample)

| HTTP route family | Tier gate | Policy | Nav | Notes |
| --- | --- | --- | --- | --- |
| `POST /v1/governance/approval-requests` | **Standard** (per PRODUCT_PACKAGING Â§4 inventory) | **ExecuteAuthority** typical | **`operate-governance`** links Â· extended+ | Sub-tier → **404** |
| `GET/POST /v1/alerts/*` | **Standard** min for many mutations (verify controller) | Mixed Read/Execute | **`/alerts`** Â· tier **essential** for hub | Tier gate per Commercial filter |
| `GET/POST /v1/compare`, `/v1/replay` | **Standard** (per packaging doc) | Mixed | `/compare`, `/replay` Â· extended | Progressive disclosure |

## Single source of truth order

1. **Code:** `ArchLucid.Api` controllers + **`CommercialTenantTierFilter`**.  
2. **Executable registry + CI:** `scripts/ci/data/route_tier_policy_nav_registry.json` + **`assert_route_tier_policy_nav.py`** (appendix table below). After adding or changing a controller, run **`python scripts/ci/assert_route_tier_policy_nav.py --sync`** (or rely on the installed **`pre-commit`** hook — **`pwsh scripts/install-git-hooks.ps1`**). Set **`nav_operator_href`** / exemption overrides in **`scripts/ci/data/route_tier_policy_nav_overrides.json`** when the API maps to operator nav or is exempt from nav parity.  
3. **Nav:** `nav-config` builders + **`nav-shell-visibility`**.  
4. **Narrative:** **[PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md)** — update the sample tables in this doc when buyer-visible behavior changes; refresh the appendix when controllers ship.

## When to run the guard

Run the guard before sponsor/procurement handoff when a branch changes any of these:

- `ArchLucid.Api/Controllers/**`
- `[RequiresCommercialTenantTier]` usage
- `ArchLucidPolicies.*` authorization on buyer-visible controllers
- operator navigation builders under `archlucid-ui/src/lib`
- pricing, packaging, or route-tier documentation

Use:

```powershell
python scripts/ci/assert_route_tier_policy_nav.py
```

Use `--sync` only when intentionally regenerating the registry and appendix after reviewing route/tier/policy changes. This check protects buyer claims; it does not grant access or replace API authorization.

**Related:** **[PROCUREMENT_PACK_INDEX.md](../go-to-market/PROCUREMENT_PACK_INDEX.md#fast-lane-starter)** (procurement skim), **[../../archlucid-ui/docs/../../archlucid-ui/docs/../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md](../../archlucid-ui/docs/../../archlucid-ui/docs/../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md)** if present.

## Appendix — per-controller registry (CI)

Merge-blocking check: `python scripts/ci/assert_route_tier_policy_nav.py` after editing controllers, overrides, or this table.

- **Registry JSON:** `scripts/ci/data/route_tier_policy_nav_registry.json` (regenerate: `python scripts/ci/assert_route_tier_policy_nav.py --sync`).
- **Allowlist / exemption reasons:** `scripts/ci/data/route_tier_policy_nav_exemptions.json`.
- **Nav / exemption overrides:** `scripts/ci/data/route_tier_policy_nav_overrides.json`.

<!-- route-tier-policy-nav-registry-count:207 -->

| Controller source | API prefix (normalized) | commercial_tier (class) | class_policy | Operator nav href (parity only) | Exemption code |
| --- | --- | --- | --- | --- | --- |
| `Admin/AdminAgentModelCatalogController.cs` | `/v1/admin/agent-model-catalog` | none | AdminAuthority |  |  |
| `Admin/AdminAiUsageDashboardController.cs` | `/v1/admin` | none | ExecuteAuthority |  |  |
| `Admin/AdminApiKeySettingsController.cs` | `/v1/admin/settings/api-keys` | none | AdminAuthority |  |  |
| `Admin/AdminAuthDiagnosticsController.cs` | `/v1/admin` | none | AdminAuthority |  | auth_debug_api |
| `Admin/AdminAzureOpenAiConnectionController.cs` | `/v1/admin/settings/azure-openai-connection` | none | AdminAuthority |  |  |
| `Admin/AdminController.cs` | `/v1/admin` | none | AdminAuthority |  |  |
| `Admin/AdminCrossTenantUsageRollupController.cs` | `/v1/admin/analytics` | none | PlatformCrossTenantReadAuthority |  |  |
| `Admin/AdminCustomerSuccessController.cs` | `/v1/admin` | none | AdminAuthority |  |  |
| `Admin/AdminDeploymentStatusController.cs` | `/v1/admin` | none | AdminAuthority |  |  |
| `Admin/AdminFleetLlmCogsController.cs` | `/v1/admin/operational` | none | AdminAuthority |  |  |
| `Admin/AdminIdentityProviderDiagnosticsController.cs` | `/v1/admin/diagnostics` | none | AdminAuthority |  |  |
| `Admin/AdminIntegrationsController.cs` | `/v1/admin/integrations` | none | AdminAuthority |  |  |
| `Admin/AdminLlmCostTuningController.cs` | `/v1/admin` | none | AdminAuthority | /administration/ai-usage |  |
| `Admin/AdminLlmMonthlyDollarBudgetStatusController.cs` | `/v1/admin` | none | ExecuteAuthority |  |  |
| `Admin/AdminPlatformBundledPolicyPacksController.cs` | `/v1/admin/platform-bundled-policy-packs` | none | AdminAuthority |  |  |
| `Admin/AdminPrerequisitesController.cs` | `/v1/admin/prerequisites` | none | ExecuteAuthority |  |  |
| `Admin/AdminQualityGateDiagnosticsController.cs` | `/v1/admin/diagnostics` | none | AdminAuthority |  |  |
| `Admin/AdminQuickScanBudgetController.cs` | `/v1/admin/quick-scan/budget` | none | AdminAuthority |  |  |
| `Admin/AdminQuickScanSafetyController.cs` | `/v1/admin/quick-scan/safety` | none | AdminAuthority |  |  |
| `Admin/AdminRagHealthController.cs` | `/v1/admin` | none | AdminAuthority |  |  |
| `Admin/AdminTenantCatalogMigrationController.cs` | `/v1/admin/tenants` | none | AdminAuthority |  |  |
| `Admin/AdminTenantsController.cs` | `/v1/admin/tenants` | none | PlatformTenantDeletionAuthority | /administration/users |  |
| `Admin/AdminTrialFunnelOperationalController.cs` | `/v1/admin/operational` | none | AdminAuthority |  |  |
| `Admin/AuditController.cs` | `/v1/audit` | none | ReadAuthority | /governance/audit |  |
| `Admin/AuthDebugController.cs` | `/api/auth` | none | ReadAuthority |  | auth_debug_api |
| `Admin/ClientErrorTelemetryController.cs` | `/v1/diagnostics` | none | ReadAuthority |  |  |
| `Admin/ConfluencePublishingAdminController.cs` | `/v1/admin/integrations/confluence` | none | AdminAuthority |  |  |
| `Admin/CustomRolesAdminController.cs` | `/v1/admin/roles` | none | AdminAuthority |  |  |
| `Admin/DemoController.cs` | `/v1/demo` | none | ExecuteAuthority |  | demo_tooling |
| `Admin/DiagnosticsController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Admin/DocsController.cs` | `/docs` | none | ReadAuthority |  | static_operator_docs_html |
| `Admin/EvidenceProposalsController.cs` | `/v1/admin/evidence` | none | AdminAuthority |  |  |
| `Admin/HostedAwsExtractorRunController.cs` | `/v1/admin/aws-extractor/hosted` | none | AdminAuthority | /integrations/cloud-connections |  |
| `Admin/HostedAzureExtractorAdminController.cs` | `/v1/admin/azure-extractor/hosted` | none | AdminAuthority |  |  |
| `Admin/HostedAzureExtractorRunController.cs` | `/v1/admin/azure-extractor/hosted` | none | AdminAuthority |  |  |
| `Admin/HostedGcpExtractorRunController.cs` | `/v1/admin/gcp-extractor/hosted` | none | AdminAuthority | /integrations/cloud-connections |  |
| `Admin/IdentityMigrationReviewAdminController.cs` | `/v1/admin/identity/migration-reviews` | none | AdminAuthority |  |  |
| `Admin/IdentityProviderConfigurationController.cs` | `/v1/admin/identity` | none | AdminAuthority |  |  |
| `Admin/JobsController.cs` | `/v1/jobs` | none | ReadAuthority |  |  |
| `Admin/MarketingPricingQuoteAgingAdminController.cs` | `/v1/admin/marketing/pricing-quote-aging` | none | AdminAuthority |  |  |
| `Admin/MarketingPricingQuoteFollowUpAdminController.cs` | `/v1/admin/marketing/pricing-quote-requests` | none | AdminAuthority |  |  |
| `Admin/MeteringAdminController.cs` | `/v1/admin/metering` | none | AdminAuthority | /administration/ai-usage |  |
| `Admin/OperationsController.cs` | `/v1/operations` | none | ReadAuthority |  |  |
| `Admin/PromptVariantsAdminController.cs` | `/v1/admin/prompt-variants` | none | AdminAuthority |  |  |
| `Admin/ReferenceEvidenceAdminController.cs` | `/v1/admin/reference-evidence` | none | AdminAuthority |  |  |
| `Admin/RoiBulletinAdminController.cs` | `/v1/admin/roi-bulletin-preview` | none | AdminAuthority |  |  |
| `Admin/ScimTokensAdminController.cs` | `/v1/admin/scim/tokens` | none | AdminAuthority |  |  |
| `Admin/ScopeDebugController.cs` | `/v1/scope` | none | ReadAuthority |  |  |
| `Admin/SecurityTrustPublicationController.cs` | `/v1/admin/security-trust` | none | AdminAuthority | /administration/security-trust |  |
| `Admin/SettingsController.cs` | `/v1/admin/settings` | none | AdminAuthority | /administration/workspace-settings |  |
| `Admin/SupportBundleController.cs` | `/v1/admin` | none | ExecuteAuthority | /administration/support |  |
| `Admin/TenantAuthDomainAdminController.cs` | `/v1/admin/identity/domains` | none | AdminAuthority |  |  |
| `Admin/TenantsAdminController.cs` | `/v1/admin/tenants` | none | AdminAuthority | /administration/users |  |
| `Admin/UsersAdminController.cs` | `/v1/admin/users` | none | AdminAuthority |  |  |
| `Advisory/AdvisoryController.cs` | `/v1/advisory` | standard | ReadAuthority | /governance/advisory-scans |  |
| `Advisory/AdvisorySchedulingController.cs` | `/v1/advisory-scheduling` | standard | ReadAuthority |  |  |
| `Advisory/DigestSubscriptionsController.cs` | `/v1/digest-subscriptions` | standard | ReadAuthority | /architecture/digests |  |
| `Advisory/LearningController.cs` | `/v1/learning` | standard | ReadAuthority |  |  |
| `Advisory/ProductLearningController.cs` | `/v1/product-learning` | standard | ReadAuthority | /internal/product-learning |  |
| `Advisory/RecommendationLearningController.cs` | `/v1/recommendation-learning` | standard | ReadAuthority | /internal/recommendation-learning |  |
| `AgentExecution/AgentExecutionCostPreviewController.cs` | `/v1/agent-execution` | none | AllowAnonymous |  | anonymous_wizard_cost_preview |
| `Alerts/AlertRoutingSubscriptionsController.cs` | `/v1/alert-routing-subscriptions` | standard | ReadAuthority | /governance/alerts |  |
| `Alerts/AlertRulesController.cs` | `/v1/alert-rules` | standard | ReadAuthority | /governance/alerts |  |
| `Alerts/AlertSimulationController.cs` | `/v1/alert-simulation` | standard | ReadAuthority | /governance/alerts |  |
| `Alerts/AlertTuningController.cs` | `/v1/alert-tuning` | standard | ReadAuthority | /governance/alerts |  |
| `Alerts/AlertsController.cs` | `/v1/alerts` | standard | ReadAuthority | /governance/alerts |  |
| `Alerts/CompositeAlertRulesController.cs` | `/v1/composite-alert-rules` | standard | ReadAuthority | /governance/alerts |  |
| `Analytics/InternalCrossTenantAnalyticsController.cs` | `/v1/internal/analytics` | none | PlatformCrossTenantReadAuthority |  | internal_cross_tenant_analytics |
| `Analytics/PatternInsightsController.cs` | `/v1/analytics/patterns` | none | Authorize |  |  |
| `Analytics/RoiAnalyticsController.cs` | `/v1/analytics` | none | ReadAuthority |  |  |
| `Architecture/DraftRequestsController.cs` | `/v1/architecture/draft` | standard | AuthenticatedUserOnly |  |  |
| `ArchitectureIntelligence/ArchitectureIntelligenceController.cs` | `/v1/architecture-intelligence` | standard | ExecuteAuthority |  |  |
| `Auth/AuthSignInRoutingController.cs` | `/v1/auth/routing` | none | AllowAnonymous |  |  |
| `Auth/AuthenticationSignInMethodsController.cs` | `/v1/auth/sign-in-methods` | none | AuthenticatedUserOnly |  |  |
| `Auth/EmailOtpAuthController.cs` | `/v1/auth/email-otp` | none | AllowAnonymous |  |  |
| `Auth/PostAuthBootstrapController.cs` | `/v1/auth/bootstrap` | none | AuthenticatedUserOnly |  |  |
| `Auth/TrialLocalIdentityAuthController.cs` | `/v1/auth/trial/local` | none | AllowAnonymous |  | trial_local_identity_auth |
| `Auth/UserInvitationPublicController.cs` | `/v1/auth/invitations` | none | AllowAnonymous |  |  |
| `Authority/AnalysisReportsController.cs` | `/v1/architecture` | standard | ExecuteAuthority |  |  |
| `Authority/ArchitectureDefinitionImportController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/ArchitectureExportController.cs` | `/v1/architecture` | standard | ReadAuthority |  |  |
| `Authority/ArchitectureQuickScanController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/ArtifactExportController.cs` | `/v1/artifacts` | standard | ReadAuthority |  |  |
| `Authority/AuthorityCompareController.cs` | `/v1/authority/compare` | standard | ReadAuthority |  |  |
| `Authority/AuthorityQueryController.cs` | `/v1/authority` | none | ReadAuthority |  |  |
| `Authority/AuthorityReplayController.cs` | `/v1/internal/authority/replay` | standard | RequireOperatorRole |  | internal_replay_diagnostics |
| `Authority/AuthorityRunEventsController.cs` | `/v1/authority` | none | ReadAuthority |  |  |
| `Authority/AwsTier2ConnectionController.cs` | `/v1/aws-extractor/connections` | none | ExecuteAuthority | /integrations/cloud-connections |  |
| `Authority/AzureExtractorUploadController.cs` | `/v1/azure-extractor` | none | ReadAuthority |  |  |
| `Authority/CloudInventoryExtractorUploadController.cs` | `/v1/extractor` | none | ReadAuthority |  |  |
| `Authority/DocxExportController.cs` | `/v1/docx` | standard | ReadAuthority |  |  |
| `Authority/EvidenceBulkUploadController.cs` | `/v1/architecture/review/{runId:guid}/evidence` | none | ExecuteAuthority |  |  |
| `Authority/ExportsController.cs` | `/v1/architecture` | standard | ReadAuthority |  |  |
| `Authority/FastPathContextController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/GcpTier2ConnectionController.cs` | `/v1/gcp-extractor/connections` | none | ExecuteAuthority | /integrations/cloud-connections |  |
| `Authority/ImportRequestFileController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/InternalArchitectureDiagnosticsController.cs` | `/v1/internal/architecture` | none | RequireOperatorRole |  | internal_architecture_diagnostics |
| `Authority/InternalArchitectureTraceForensicsController.cs` | `/v1/internal/architecture` | none | RequireOperatorRole |  |  |
| `Authority/ReviewClarificationQuestionsController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/ReviewsDemoController.cs` | `/v1/reviews` | none | ExecuteAuthority |  |  |
| `Authority/RunAgentEvaluationController.cs` | `/v1/internal/architecture` | none | ReadAuthority |  | internal_architecture_diagnostics |
| `Authority/RunComparisonController.cs` | `/v1/architecture` | standard | ReadAuthority | /insights/compare-two-reviews |  |
| `Authority/RunCoverageController.cs` | `/v1/runs` | none | ReadAuthority |  |  |
| `Authority/RunDetailPageBundleController.cs` | `/v1/authority/reviews/{runId:guid}` | none | ReadAuthority |  |  |
| `Authority/RunQueryController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/RunsController.cs` | `/v1/architecture` | none | ReadAuthority | /architecture/reviews |  |
| `Authority/RunsExportController.cs` | `/v1/runs` | standard | ReadAuthority |  |  |
| `Authority/TechnologyLedgerController.cs` | `/v1/runs` | none | ReadAuthority |  |  |
| `Authority/TemplatesController.cs` | `/v1/architecture` | none | ReadAuthority |  |  |
| `Authority/Tier2ConnectionController.cs` | `/v1/azure-extractor/connections` | none | ExecuteAuthority |  |  |
| `Billing/BillingCheckoutController.cs` | `/v1/tenant/billing` | none | AdminAuthority | /administration/workspace-settings |  |
| `Billing/BillingMarketplaceWebhookController.cs` | `/v1/billing/webhooks` | none | AllowAnonymous |  | partner_webhook_ingest |
| `Billing/BillingStripeWebhookController.cs` | `/v1/billing/webhooks` | none | AllowAnonymous |  | partner_webhook_ingest |
| `Billing/WalletController.cs` | `/v1/billing/wallet` | none | AdminAuthority |  |  |
| `Demo/DemoCommitPagePreviewController.cs` | `/v1/demo` | none | AllowAnonymous |  | demo_tooling |
| `Demo/DemoExplainController.cs` | `/v1/demo` | none | AllowAnonymous |  | demo_tooling |
| `Demo/DemoViewerController.cs` | `/v1/demo/viewer` | none | AllowAnonymous |  | demo_tooling |
| `Demo/QuickStartController.cs` | `/v1/demo` | none | AllowAnonymous |  | demo_tooling |
| `Diagnostics/ConfigurationHealthController.cs` | `/v1/diagnostics` | none | RequireAdmin | /internal/health |  |
| `Diagnostics/OperatorTaskSuccessDiagnosticsController.cs` | `/v1/diagnostics` | standard | ReadAuthority |  |  |
| `Diagnostics/SyntheticOperatorDemoPackController.cs` | `/v1/diagnostics` | none | RequireAdmin |  | synthetic_demo_admin_pack |
| `E2e/E2eHarnessController.cs` | `/v1/e2e` | none | AllowAnonymous |  | e2e_nonprod_harness |
| `Evolution/EvolutionController.cs` | `/v1/evolution` | standard | ReadAuthority | /insights/impact-preview |  |
| `Findings/ArchitectureFindingAskController.cs` | `/v1/architecture/finding` | standard | ReadAuthority |  |  |
| `Findings/FindingInspectController.cs` | `/v1/findings` | standard | ReadAuthority | /governance/findings |  |
| `Findings/FindingMuteController.cs` | `/v1/findings` | standard | ExecuteAuthority | /governance/findings |  |
| `Findings/FindingRemediationAssignmentController.cs` | `/v1/findings` | standard | ExecuteAuthority | /governance/findings |  |
| `Governance/GovernanceController.cs` | `/v1/governance` | standard | ReadAuthority | /governance/approval-queue |  |
| `Governance/GovernanceCoverageController.cs` | `/v1/governance` | standard | ReadAuthority |  |  |
| `Governance/GovernancePreCommitSimulationController.cs` | `/v1/governance/pre-finalize` | standard | ReadAuthority |  |  |
| `Governance/GovernancePreviewController.cs` | `/v1/governance-preview` | standard | ReadAuthority |  |  |
| `Governance/GovernanceResolutionController.cs` | `/v1/governance-resolution` | standard | ReadAuthority | /governance/standards-and-rules |  |
| `Governance/GovernanceSetupController.cs` | `/v1/governance` | standard | ReadAuthority |  |  |
| `Governance/GovernanceStickinessController.cs` | `/v1/governance` | standard | ReadAuthority |  |  |
| `Governance/ManifestsController.cs` | `/v1/architecture` | standard | ReadAuthority |  |  |
| `Governance/PolicyPacksController.cs` | `/v1/policy-packs` | standard | ReadAuthority | /governance/policy-packs |  |
| `Integrations/AzureBoardsIntegrationsController.cs` | `/v1/integrations/azure-boards` | standard | Authorize |  |  |
| `Integrations/ItsmCorrelationController.cs` | `/v1/integrations/itsm/correlations` | none | ReadAuthority |  |  |
| `Integrations/ItsmInboundWebhooksController.cs` | `/v1/integrations/webhooks` | none | AllowAnonymous |  | partner_webhook_ingest |
| `Integrations/ItsmIntegrationHealthController.cs` | `/v1/integrations/itsm/health` | standard | Authorize |  |  |
| `Integrations/ItsmOutboundIssuesController.cs` | `/v1/integrations/itsm/outbound/issues` | none | ExecuteAuthority |  |  |
| `Integrations/ItsmProviderIntegrationPageController.cs` | `/v1/integrations/itsm` | standard | Authorize |  |  |
| `Integrations/SlackInteractivityController.cs` | `/v1/integrations/webhooks/slack` | none | AllowAnonymous |  | partner_webhook_ingest |
| `Integrations/TeamsIncomingWebhookConnectionsController.cs` | `/v1/integrations/teams` | standard | Authorize |  |  |
| `Integrations/TenantItsmConnectorConnectionsController.cs` | `/v1/integrations/itsm/connections` | standard | Authorize | /administration/connection-status |  |
| `Integrations/TenantItsmOutboundSettingsController.cs` | `/v1/integrations/itsm/settings` | standard | Authorize | /administration/connection-status |  |
| `Integrations/WebhookConnectionsController.cs` | `/v1/integrations/webhooks` | standard | ReadAuthority |  |  |
| `Integrations/WebhookSimulationController.cs` | `/v1/integrations/webhooks` | none | ExecuteAuthority |  |  |
| `Internal/PlatformIdentityRecoveryController.cs` | `/v1/internal/identity/recovery` | none | PlatformIdentityRecoveryAuthority |  |  |
| `Marketing/EnterpriseComparisonMarketingController.cs` | `/v1/marketing` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/MarketingEarlyAccessRequestController.cs` | `/v1/marketing/early-access` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/MarketingPricingQuoteRequestController.cs` | `/v1/marketing/pricing` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/MarketingQuickScanController.cs` | `/v1/marketing/quick-scan` | none | AllowAnonymous |  |  |
| `Marketing/MarketingShowcaseController.cs` | `/v1/marketing/showcase` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/SponsorBriefMarketingController.cs` | `/v1/marketing` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/TrustCenterEvidencePackController.cs` | `/v1/marketing/trust-center` | none | AllowAnonymous |  | marketing_public_api |
| `Marketing/WhyArchlucidMarketingPackController.cs` | `/v1/marketing` | none | AllowAnonymous |  | marketing_public_api |
| `Mcp/McpRetrievalToolsController.cs` | `/v1/mcp/retrieval` | none | ReadAuthority |  |  |
| `Notifications/CustomerNotificationChannelPreferencesController.cs` | `/v1/notifications` | standard | AuthenticatedUserOnly |  |  |
| `Notifications/ExecDigestSponsorDeepLinkController.cs` | `/v1/notifications/exec-digest` | none | AllowAnonymous |  |  |
| `Notifications/ExecDigestUnsubscribeController.cs` | `/v1/notifications/exec-digest` | none | AllowAnonymous |  | signed_token_unsubscribe |
| `Notifications/SponsorDigestUnsubscribeController.cs` | `/v1/notifications/sponsor-digest` | none | AllowAnonymous |  |  |
| `Operator/OperatorSavedViewsController.cs` | `/v1/operator/saved-views` | standard | AuthenticatedUserOnly |  |  |
| `Operator/OperatorShellStatusController.cs` | `/v1/operator/shell-status` | standard | AuthenticatedUserOnly |  |  |
| `Pilots/PilotsBoardPackController.cs` | `/v1/pilots` | standard | ExecuteAuthority | /insights/architecture-scorecard |  |
| `Pilots/PilotsController.cs` | `/v1/pilots` | none | ReadAuthority | /architecture/reviews |  |
| `Planning/AskController.cs` | `/v1/ask` | standard | ReadAuthority | /insights/ask-review-questions |  |
| `Planning/ComparisonController.cs` | `/v1/compare` | standard | ReadAuthority | /insights/compare-two-reviews |  |
| `Planning/ComparisonsController.cs` | `/v1/architecture` | standard | ReadAuthority | /internal/validate-route |  |
| `Planning/ConversationController.cs` | `/v1/conversations` | standard | ReadAuthority |  |  |
| `Planning/ExplanationController.cs` | `/v1/explain` | standard | ReadAuthority |  |  |
| `Planning/FindingFeedbackController.cs` | `/v1/explain` | standard | ExecuteAuthority |  |  |
| `Planning/GraphController.cs` | `/v1/evidence-graph` | standard | ReadAuthority | /insights/evidence-graph |  |
| `Planning/ProvenanceController.cs` | `/v1/provenance` | standard | ReadAuthority |  |  |
| `Planning/ProvenanceQueryController.cs` | `/v1/authority` | standard | ReadAuthority |  |  |
| `Planning/RetrievalController.cs` | `/v1/retrieval` | standard | ReadAuthority | /insights/search-review-evidence |  |
| `RegistrationController.cs` | `/v1/register` | none | AllowAnonymous |  | registration_public_flow |
| `Reports/SponsorSummaryController.cs` | `/v1/reports/sponsor-report` | none | ReadAuthority |  |  |
| `Roi/RoiController.cs` | `/v1/roi` | none | ReadAuthority | /architecture/sponsor-dashboard |  |
| `Scim/ScimDiscoveryController.cs` | `/scim/v2` | none | ScimWrite |  | scim_idp_automation |
| `Scim/ScimGroupsController.cs` | `/scim/v2/Groups` | none | ScimWrite |  | scim_idp_automation |
| `Scim/ScimUsersController.cs` | `/scim/v2/Users` | none | ScimWrite |  | scim_idp_automation |
| `SearchController.cs` | `/v1/search` | none | ReadAuthority |  |  |
| `Support/SupportProblemReportsController.cs` | `/v1/support` | none | ExecuteAuthority |  |  |
| `Tenancy/CorePilotTeamChecklistController.cs` | `/v1/tenant/core-pilot-checklist` | standard | Authorize | /architecture/first-review-guide |  |
| `Tenancy/TenantBaselineController.cs` | `/v1/tenant/baseline` | none | Authorize |  |  |
| `Tenancy/TenantCatalogMigrationStatusController.cs` | `/v1/tenant` | none | Authorize |  |  |
| `Tenancy/TenantCostSettingsController.cs` | `/v1/tenant/cost-settings` | none | Authorize |  |  |
| `Tenancy/TenantCustomerSuccessController.cs` | `/v1/tenant/customer-success` | standard | Authorize |  |  |
| `Tenancy/TenantErasureLegalHoldController.cs` | `/v1/tenant/erasure` | none | Authorize |  |  |
| `Tenancy/TenantExecDigestPreferencesController.cs` | `/v1/tenant` | standard | Authorize |  |  |
| `Tenancy/TenantHomepageSettingsController.cs` | `/v1/tenant/homepage-settings` | none | Authorize |  |  |
| `Tenancy/TenantIntegrationsOperationsController.cs` | `/v1/tenant/integrations/operations` | standard | Authorize |  |  |
| `Tenancy/TenantLlmCostReportingController.cs` | `/v1/tenant` | none | ReadAuthority |  |  |
| `Tenancy/TenantMeasuredRoiController.cs` | `/v1/tenant/measured-roi` | standard | Authorize | /insights/roi-summary |  |
| `Tenancy/TenantPilotValueReportController.cs` | `/v1/tenant` | none | Authorize | /insights/sponsor-report |  |
| `Tenancy/TenantSponsorDigestPreferencesController.cs` | `/v1/tenant` | standard | Authorize |  |  |
| `Tenancy/TenantTrialController.cs` | `/v1/tenant` | none | Authorize | /administration/workspace-settings |  |
| `Tenancy/TenantUsageStatusController.cs` | `/v1/tenant` | none | Authorize |  |  |
| `Tenancy/TenantWeeklyDigestHealthController.cs` | `/v1/tenant/operate/weekly-digest-health` | standard | Authorize |  |  |
| `Tenancy/TenantWorkspaceBaselineArtifactsController.cs` | `/v1/tenant/workspace-baseline-artifacts` | none | Authorize |  |  |
| `Tenancy/TenantWorkspacesController.cs` | `/v1/tenant/workspaces` | none | Authorize |  |  |
| `User/UserPreferencesController.cs` | `/v1/user/preferences` | standard | AuthenticatedUserOnly |  |  |
| `ValueReports/ValueReportController.cs` | `/v1/value-report` | standard | ExecuteAuthority | /insights/sponsor-report |  |
| `VersionController.cs` | `/version` | none | AllowAnonymous |  | unversioned_version_probe |
| `Webhooks/OutboundWebhookDryRunController.cs` | `/v1/webhooks` | none | ExecuteAuthority |  |  |
| `Webhooks/WebhooksController.cs` | `/v1/webhooks/subscriptions` | standard | ReadAuthority |  |  |

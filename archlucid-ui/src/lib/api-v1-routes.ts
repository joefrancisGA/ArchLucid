/**
 * Path segments for ArchLucid API v1 (no trailing slash; prefix with "/" when building URLs).
 * Keeps UI aligned with `ArchLucid.Api.Routing.ApiV1Routes` in tests.
 */
export const ApiV1Routes = {
  /** Anonymous early-access / waitlist (`POST` from `/welcome` hero). */
  marketingEarlyAccess: "v1/marketing/early-access",
  policyPacks: "v1/policy-packs",
  governanceResolution: "v1/governance-resolution",
  governance: "v1/governance",
  alertRules: "v1/alert-rules",
  alerts: "v1/alerts",
  compositeAlertRules: "v1/composite-alert-rules",
  alertSimulation: "v1/alert-simulation",
  alertTuning: "v1/alert-tuning",
  alertRoutingSubscriptions: "v1/alert-routing-subscriptions",
  digestSubscriptions: "v1/digest-subscriptions",
  tenantExecDigestPreferences: "v1/tenant/exec-digest-preferences",
  tenantTrialStatus: "v1/tenant/trial-status",
  tenantCostEstimate: "v1/tenant/cost-estimate",
  tenantMeasuredRoi: "v1/tenant/measured-roi",
  tenantWorkspaces: "v1/tenant/workspaces",
  /** Persisted Azure extractor baseline artifact presence for the scoped workspace. */
  tenantWorkspaceBaselineArtifacts: "v1/tenant/workspace-baseline-artifacts",
  /** Soft-deleted architecture projects grouped by workspace. */
  tenantWorkspacesRecycleBin: "v1/tenant/workspaces/recycle-bin",
  /** Pilot value report JSON/Markdown aggregate (`GET` with `fromUtc` / `toUtc` query). */
  tenantPilotValueReport: "v1/tenant/pilot-value-report",
  /** Executive ROI dashboard aggregates (mocked upstream until analytics persistence lands). */
  analyticsRoi: "v1/analytics/roi",
  /** Cross-run executive ROI summary (latest run per system, savings rollup, top issues). */
  roiExecutiveSummary: "v1/roi/executive-summary",
  /** Cross-tenant portfolio ROI summary (aggregates across all accessible tenants, enforces k-anonymity). */
  roiCrossTenantPortfolio: "v1/roi/cross-tenant-portfolio",
  /** Sponsor evidence bundle (Standard tier): explainability completeness, deltas, governance counts. */
  pilotsSponsorEvidencePack: "v1/pilots/sponsor-evidence-pack",
  /** In-product pilot scorecard metrics + ROI baselines (`GET` / `PUT baselines`). */
  pilotsScorecard: "v1/pilots/scorecard",
  teamsIncomingWebhookConnections: "v1/integrations/teams/connections",
  teamsNotificationTriggerCatalog: "v1/integrations/teams/triggers",
  integrationWebhooks: "v1/integrations/webhooks",
  webhookSubscriptions: "v1/webhooks/subscriptions",
  /** Pilot / product feedback rollups (58R). */
  productLearning: "v1/product-learning",
  /** 59R improvement themes and plans (read-only planning bridge). */
  learning: "v1/learning",
  /** 60R evolution: candidate change sets and simulation results. */
  evolution: "v1/evolution",
} as const;

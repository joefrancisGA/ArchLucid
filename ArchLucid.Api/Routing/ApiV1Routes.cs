namespace ArchLucid.Api.Routing;

/// <summary>
///     Relative URL segments (no leading slash) for versioned operator/governance APIs — use with
///     <c>"/" + ApiV1Routes.X</c> in tests and clients.
/// </summary>
public static class ApiV1Routes
{
    /// <summary>Internal operator diagnostics (replay, determinism, seed) under <c>/v1/internal/architecture</c>.</summary>
    public const string InternalArchitectureBase = "v1/internal/architecture";

    /// <summary>
    ///     Authority replay rebuild under <c>/v1/internal/authority/replay</c> (legacy alias <c>/v1/authority/replay</c>
    ///     ).
    /// </summary>
    public const string InternalAuthorityReplay = "v1/internal/authority/replay";

    /// <summary>Federated artifact listing/download routes rooted at <c>/v1/runs/{runId}/artifacts</c>.</summary>
    public const string RunsArtifactsRelativePrefix = "v1/runs";

    public const string PolicyPacks = "v1/policy-packs";
    public const string GovernanceResolution = "v1/governance-resolution";
    public const string AlertRules = "v1/alert-rules";
    public const string Alerts = "v1/alerts";
    public const string CompositeAlertRules = "v1/composite-alert-rules";
    public const string AlertSimulation = "v1/alert-simulation";
    public const string AlertTuning = "v1/alert-tuning";
    public const string AlertRoutingSubscriptions = "v1/alert-routing-subscriptions";
    public const string DigestSubscriptions = "v1/digest-subscriptions";

    public const string TenantExecDigestPreferences = "v1/tenant/exec-digest-preferences";

    public const string TenantCostEstimate = "v1/tenant/cost-estimate";

    public const string TenantMeasuredRoi = "v1/tenant/measured-roi";

    /// <summary>Workspaces + architecture projects for scope switcher (<c>GET /v1/tenant/workspaces</c>).</summary>
    public const string TenantWorkspaces = "v1/tenant/workspaces";

    /// <summary>Azure extractor baseline artifact presence for the scoped workspace.</summary>
    public const string TenantWorkspaceBaselineArtifacts = "v1/tenant/workspace-baseline-artifacts";

    /// <summary>Soft-deleted architecture projects by workspace (<c>GET /v1/tenant/workspaces/recycle-bin</c>).</summary>
    public const string TenantWorkspacesRecycleBin = "v1/tenant/workspaces/recycle-bin";

    /// <summary>Mocked executive ROI aggregates until analytics persistence is wired.</summary>
    public const string AnalyticsRoi = "v1/analytics/roi";

    /// <summary>Cross-run executive ROI summary (latest run per system + top systemic issues).</summary>
    public const string RoiExecutiveSummary = "v1/roi/executive-summary";

    public const string RoiExecutiveSummaryBoardPack = "v1/roi/executive-summary/board-pack";

    /// <summary>Operator-only anonymized cross-tenant SQL aggregates.</summary>
    public const string InternalCrossTenantAnalytics = "v1/internal/analytics/cross-tenant";

    /// <summary>Single JSON sponsor evidence bundle aligned with measured ROI (Standard tier).</summary>
    public const string PilotsSponsorEvidencePack = "v1/pilots/sponsor-evidence-pack";

    public const string TeamsIncomingWebhookConnections = "v1/integrations/teams/connections";

    public const string TeamsNotificationTriggerCatalog = "v1/integrations/teams/triggers";

    public const string Evolution = "v1/evolution";
}

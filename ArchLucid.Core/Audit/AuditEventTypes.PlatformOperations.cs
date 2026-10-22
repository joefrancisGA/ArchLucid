namespace ArchLucid.Core.Audit;

// Internal diagnostics, demo seeding, data-consistency remediation, background loops, and operator preferences.
public static partial class AuditEventTypes
{
    /// <summary>Operator created a saved filter preset (<c>POST /v1/operator/saved-views</c>).</summary>
    public const string OperatorSavedViewCreated = "OperatorSavedView.Created";

    /// <summary>Operator deleted a saved filter preset (<c>DELETE /v1/operator/saved-views/{viewId}</c>).</summary>
    public const string OperatorSavedViewDeleted = "OperatorSavedView.Deleted";

    /// <summary>Internal QA: POST <c>…/internal/architecture/runs/{{runId}}/determinism-check</c> completed.</summary>
    public const string InternalArchitectureDeterminismCheckExecuted = "InternalArchitectureDeterminismCheckExecuted";

    /// <summary>Internal dev: POST <c>…/internal/architecture/runs/{{runId}}/seed-fake-results</c> succeeded.</summary>
    public const string InternalArchitectureFakeResultsSeeded = "InternalArchitectureFakeResultsSeeded";

    /// <summary>Operator refresh of pseudonymized <c>dbo.InternalCrossTenantRollupDaily</c> for a UTC day.</summary>
    public const string InternalCrossTenantRollupRefreshed = "InternalCrossTenantRollupRefreshed";

    /// <summary>
    ///     Operator diagnostics: synthetic markers from <c>POST /v1/diagnostics/synthetic-operator-demo-pack</c> (
    ///     <c>archlucid seed-demo-data</c>) for empty-tenant UI validation only.
    /// </summary>
    public const string SyntheticOperatorDemoPackMarker = "SyntheticOperatorDemoPack.Marker";

    /// <summary>
    ///     Admin invoked <c>POST /v1/diagnostics/synthetic-operator-demo-pack</c> (markers follow as
    ///     <see cref="SyntheticOperatorDemoPackMarker" /> rows).
    /// </summary>
    public const string SyntheticOperatorDemoPackInvoked = "SyntheticOperatorDemoPack.Invoked";

    /// <summary>
    ///     Admin invoked <c>POST /v1/diagnostics/reset-development-catalog</c> to drop and recreate the local
    ///     development SQL catalog.
    /// </summary>
    public const string DevelopmentCatalogResetInvoked = "DevelopmentCatalogReset.Invoked";

    /// <summary>Post-commit projection outbox row exhausted retries during background side-effect processing (TB-309).</summary>
    public const string PostCommitProjectionDeadLettered = "PostCommitProjectionDeadLettered";

    /// <summary>
    ///     Background <c>DataArchivalHostedService</c> iteration failed after logging (see payload for exception
    ///     details).
    /// </summary>
    public const string DataArchivalHostLoopFailed = "DataArchivalHostLoopFailed";

    /// <summary>
    ///     Admin remediation removed orphan <c>dbo.ComparisonRecords</c> rows whose run ids do not exist on <c>dbo.Runs</c>
    ///     (see <c>DataConsistencyOrphanRemediationSql</c>). Payload includes dry-run flag, count, and ids.
    /// </summary>
    public const string ComparisonRecordOrphansRemediated = "ComparisonRecordOrphansRemediated";

    /// <summary>
    ///     Admin remediation removed orphan <c>dbo.GoldenManifests</c> rows (no matching <c>dbo.Runs.RunId</c>), after
    ///     deleting dependent <c>dbo.ArtifactBundles</c>.
    /// </summary>
    public const string GoldenManifestOrphansRemediated = "GoldenManifestOrphansRemediated";

    /// <summary>
    ///     Admin remediation removed orphan <c>dbo.FindingsSnapshots</c> rows (no matching run, not referenced by any golden
    ///     manifest).
    /// </summary>
    public const string FindingsSnapshotOrphansRemediated = "FindingsSnapshotOrphansRemediated";

    /// <summary>Admin acknowledged a marketing pricing quote request (first-response SLA).</summary>
    public const string MarketingPricingQuoteRequestAcknowledged = "Marketing.PricingQuoteRequestAcknowledged";

    /// <summary>Admin closed a marketing pricing quote request (no longer in aging triage).</summary>
    public const string MarketingPricingQuoteRequestClosed = "Marketing.PricingQuoteRequestClosed";
}

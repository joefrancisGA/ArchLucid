namespace ArchLucid.Core.Audit;

/// <summary>
///     Canonical durable <c>dbo.AuditEvents</c> event type strings.
/// </summary>
/// <remarks>
///     <para>
///         Values are persisted, queried by SIEM exports, and asserted by the audit matrix guard, so an existing
///         constant's string value must never change: add a new constant instead.
///     </para>
///     <para>
///         The catalog is split into family partials (<c>AuditEventTypes.&lt;Family&gt;.cs</c>): intake, findings,
///         exports, analysis, alerts, governance, pilot value, execution, tenant, identity, integrations, and platform
///         operations. This part carries run and manifest lifecycle.
///     </para>
/// </remarks>
public static partial class AuditEventTypes
{
    public const string RunStarted = "RunStarted";
    public const string RunCompleted = "RunCompleted";

    public const string ManifestGenerated = "ManifestGenerated";

    /// <summary>Durable audit when a run's golden manifest is finalized (committed) in one atomic transaction with outbox.</summary>
    public const string ManifestFinalized = "ManifestFinalized";

    /// <summary>Run submission (<c>POST /v1/architecture/review/{runId}/execute</c>).</summary>
    public const string RunSubmitted = "RunSubmitted";

    /// <summary>Operator viewed committed manifest JSON (<c>GET /v1/runs/{runId}/manifest</c>).</summary>
    public const string ManifestViewed = "ManifestViewed";

    /// <summary>Operator retrieved review trail / pipeline timeline (<c>GET /v1/runs/{runId}/review-trail</c>).</summary>
    public const string ReviewTrailAccessed = "ReviewTrailAccessed";

    /// <summary>Operator retrieved decision provenance graph (<c>GET …/review-trail/provenance</c>).</summary>
    public const string ProvenanceAccessed = "ProvenanceAccessed";

    /// <summary>Golden manifest superseded by a newer authority row in the same scope (policy- or admin-driven).</summary>
    public const string ManifestSuperseded = "ManifestSuperseded";

    /// <summary>Golden manifest soft-archived (<c>ArchivedUtc</c> set).</summary>
    public const string ManifestArchived = "ManifestArchived";

    public const string ReplayExecuted = "ReplayExecuted";

    /// <summary>Workspace curation: <c>PATCH /v1/architecture/review/{{runId}}/pin</c> set or toggled <c>dbo.Runs.IsPinned</c>.</summary>
    public const string RunPinStateChanged = "RunPinStateChanged";

    /// <summary>Operator updated a Technology Ledger entry (<c>PATCH /v1/runs/{{runId}}/technology-ledger/{{entryId}}</c>).</summary>
    public const string TechnologyLedgerEntryUpdated = "TechnologyLedgerEntryUpdated";

    /// <summary>
    ///     Demo seed or replay commit persisted the authority SQL FK chain (context / graph / findings / decision trace +
    ///     golden manifest) outside the main pipeline executor.
    /// </summary>
    public const string AuthorityCommittedChainPersisted = "AuthorityCommittedChainPersisted";

    /// <summary>Pilot <c>archlucid try --real</c>: POST execute received with pilot try header (real AOAI attempt).</summary>
    public const string FirstRealValueRunStarted = "FirstRealValueRunStarted";

    /// <summary>Pilot <c>archlucid try --real</c>: pilot-marked execute completed without throwing.</summary>
    public const string FirstRealValueRunCompleted = "FirstRealValueRunCompleted";

    /// <summary>Pilot <c>archlucid try --real</c>: development seed path recorded simulator substitution after AOAI failure.</summary>
    public const string FirstRealValueRunFellBackToSimulator = "FirstRealValueRunFellBackToSimulator";

    /// <summary>
    ///     After execute, coordinator promoted <c>dbo.Runs.LegacyRunStatus</c> to <c>ReadyForCommit</c> when Topology,
    ///     Cost, Compliance, and Critic each contributed exactly one persisted agent result (ADR-0012; distinct from golden
    ///     manifest finalize at commit).
    /// </summary>
    public const string RunLegacyReadyForCommitPromoted = "RunLegacyReadyForCommitPromoted";

    /// <summary>
    ///     Canonical durable <c>dbo.AuditEvents</c> event types for architecture run-stage semantics (create, execute,
    ///     commit, failure).
    /// </summary>
    public static class Run
    {
        public const string Created = "Run.Created";

        public const string ExecuteStarted = "Run.ExecuteStarted";

        public const string ExecuteSucceeded = "Run.ExecuteSucceeded";

        public const string CommitCompleted = "Run.CommitCompleted";

        public const string Failed = "Run.Failed";

        /// <summary>Post-execute agent output quality gate blocked run completion for the workspace.</summary>
        public const string QualityGateRejected = "Run.QualityGateRejected";

        /// <summary>Operator or API requested retry of a failed run (same <c>RunId</c>).</summary>
        public const string RetryRequested = "Run.RetryRequested";

        /// <summary>Operator or API requested selective re-execute of specific agents/tasks (TB-938).</summary>
        public const string SelectiveExecuteRequested = "Run.SelectiveExecuteRequested";
    }

    /// <summary>Unified long-running operation lifecycle events (TB-2074 / TB-2076).</summary>
    public static class Operation
    {
        public const string CancelRequested = "Operation.CancelRequested";
    }
}

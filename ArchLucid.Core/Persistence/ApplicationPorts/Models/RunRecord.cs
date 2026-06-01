using ArchLucid.Contracts.Common;

namespace ArchLucid.Persistence.Models;

public sealed class RunRecord
{
    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    /// <summary>Scoped solution/project boundary (GUID). Distinct from <see cref="ProjectId" /> slug.</summary>
    public Guid ScopeProjectId
    {
        get;
        set;
    }

    public Guid RunId
    {
        get;
        set;
    }

    public string ProjectId
    {
        get;
        set;
    } = "";

    public string? Description
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public Guid? ContextSnapshotId
    {
        get;
        set;
    }

    public Guid? GraphSnapshotId
    {
        get;
        set;
    }

    public Guid? FindingsSnapshotId
    {
        get;
        set;
    }

    public Guid? GoldenManifestId
    {
        get;
        set;
    }

    public Guid? DecisionTraceId
    {
        get;
        set;
    }

    public Guid? ArtifactBundleId
    {
        get;
        set;
    }

    /// <summary>FK logical key to <c>ArchitectureRequests.RequestId</c>.</summary>
    public string? ArchitectureRequestId
    {
        get;
        set;
    }

    /// <summary>String form of lifecycle enum (<c>ArchitectureRunStatus</c>) for API/read parity with legacy rows.</summary>
    public string? LegacyRunStatus
    {
        get;
        set;
    }

    /// <summary>UTC when the run reached a terminal lifecycle state.</summary>
    public DateTime? CompletedUtc
    {
        get;
        set;
    }

    /// <summary>Latest committed manifest version key.</summary>
    public string? CurrentManifestVersion
    {
        get;
        set;
    }

    /// <summary>W3C trace ID from <c>Activity.Current?.TraceId</c> at run creation; used for post-hoc trace lookup.</summary>
    public string? OtelTraceId
    {
        get;
        set;
    }

    /// <summary>When <see langword="true" />, this run was created by <c>SeedTrialWelcomeRunAsync</c> for trial onboarding.</summary>
    public bool IsDemoWelcomeRun
    {
        get;
        set;
    }

    /// <summary>When <see langword="true" />, anonymous marketing may read a bounded showcase payload for this run.</summary>
    public bool IsPublicShowcase
    {
        get;
        set;
    }

    /// <summary>
    ///     When <see langword="true" />, this run was seeded as live sample data and is eligible for auto-purge on first
    ///     real commit or TTL expiry (OS-1b).
    /// </summary>
    public bool IsSample
    {
        get;
        set;
    }

    /// <summary>When <see langword="true" />, the operator pinned this run as a workspace reference architecture.</summary>
    public bool IsPinned
    {
        get;
        set;
    }

    /// <summary>When set, the run is excluded from list/detail authority APIs (soft archival).</summary>
    public DateTime? ArchivedUtc
    {
        get;
        set;
    }

    /// <summary>
    ///     When <see langword="true" />, <c>archlucid try --real</c> substituted simulator output after real Azure OpenAI
    ///     execution did not complete (first-value report shows a warning callout).
    /// </summary>
    public bool RealModeFellBackToSimulator
    {
        get;
        set;
    }

    /// <summary>INV-002: honest structural execution labeling for buyer-visible surfaces.</summary>
    public StructuralExecutionMode StructuralExecutionMode
    {
        get;
        set;
    } = StructuralExecutionMode.Simulator;

    /// <summary>Optional snapshot of <c>AzureOpenAI:DeploymentName</c> at fallback time (for provenance footer).</summary>
    public string? PilotAoaiDeploymentSnapshot
    {
        get;
        set;
    }

    /// <summary>Count of user/API-initiated retries after <see cref="LegacyRunStatus" /> <c>Failed</c>.</summary>
    public int RetryCount
    {
        get;
        set;
    }

    /// <summary>Optional durable reason for the last transition to <c>Failed</c>.</summary>
    public string? LastFailureReason
    {
        get;
        set;
    }

    /// <summary>
    ///     SQL Server <c>ROWVERSION</c> for optimistic concurrency on updates; <see langword="null" /> before first
    ///     read/insert round-trip.
    /// </summary>
    public byte[]? RowVersion
    {
        get;
        set;
    }

    /// <summary>Populated on read queries when findings snapshots report warnings for this run.</summary>
    public bool HasWarnings
    {
        get;
        set;
    }

    /// <summary>Populated on read queries when open governance alerts exist for this run.</summary>
    public bool HasGovernanceWarnings
    {
        get;
        set;
    }

    /// <summary>TB-112: latest run-level operator governance decision name when recorded.</summary>
    public string? OperatorGovernanceDecision
    {
        get;
        set;
    }

    /// <summary>TB-112: rationale captured with <see cref="OperatorGovernanceDecision" />.</summary>
    public string? OperatorGovernanceDecisionRationale
    {
        get;
        set;
    }

    /// <summary>TB-112: UTC timestamp when the operator disposition was recorded.</summary>
    public DateTime? OperatorGovernanceDecisionUtc
    {
        get;
        set;
    }

    /// <summary>TB-112: operator principal that recorded the disposition.</summary>
    public string? OperatorGovernanceDecisionByUserId
    {
        get;
        set;
    }
}

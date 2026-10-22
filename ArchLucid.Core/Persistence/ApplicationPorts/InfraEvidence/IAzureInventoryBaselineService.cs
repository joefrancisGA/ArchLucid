using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAzureInventoryBaselineService
{
    Task<AzureInventoryBaselineDesignateResult> TryDesignateBaselineAsync(
        ScopeContext scope,
        Guid snapshotId,
        AzureInventoryBaselineKind baselineKind,
        string designatedBy,
        string? notes,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AzureInventoryBaselineRecord>> ListBaselinesAsync(
        ScopeContext scope,
        string? subscriptionId,
        CancellationToken cancellationToken = default);
}

public sealed class AzureInventoryBaselineDesignateResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? BaselineId
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public interface IAzureInventoryDriftClassificationService
{
    Task<AzureInventoryDriftReportRecord?> TryGetDriftReportAsync(
        ScopeContext scope,
        Guid diffId,
        CancellationToken cancellationToken = default);
}

public interface IAzureInventoryDriftApprovalService
{
    Task<AzureInventoryDriftApprovalCreateResult> TryCreateApprovalAsync(
        ScopeContext scope,
        Guid diffId,
        Guid? changeId,
        string approver,
        string reason,
        string? ticketReference,
        DateTime expirationUtc,
        CancellationToken cancellationToken = default);
}

public sealed class AzureInventoryDriftApprovalCreateResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? ApprovalId
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public interface IAzureInventoryDiffNarrativeService
{
    AzureInventoryDiffExecutiveSummaryRecord BuildExecutiveSummary(
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryClassifiedChangeRecord> classifiedChanges);

    Task<AzureInventoryDiffNarrativeResult> TryBuildNarrativeAsync(
        ScopeContext scope,
        Guid diffId,
        AzureInventoryDiffNarrativeKind narrativeKind,
        bool useSimulator,
        CancellationToken cancellationToken = default);
}

public sealed class AzureInventoryDiffNarrativeResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public AzureInventoryDiffNarrativeRecord? Narrative
    {
        get;
        init;
    }
}

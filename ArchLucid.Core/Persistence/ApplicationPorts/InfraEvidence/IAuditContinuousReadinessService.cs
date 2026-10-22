using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditContinuousReadinessProcessResult
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

    public IReadOnlyList<Guid> AffectedControlIds
    {
        get;
        init;
    } = [];

    public IReadOnlyList<Guid> ReEvaluatedControlIds
    {
        get;
        init;
    } = [];

    public int FindingHandoffCount
    {
        get;
        init;
    }
}

public interface IAuditContinuousReadinessService
{
    Task<AuditContinuousReadinessProcessResult> ProcessInventoryDiffAsync(
        ScopeContext scope,
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryChangeRecord> changes,
        CancellationToken cancellationToken = default);
}

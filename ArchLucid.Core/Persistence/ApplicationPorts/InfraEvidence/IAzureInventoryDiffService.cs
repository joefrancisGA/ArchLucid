using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAzureInventoryDiffService
{
    Task<AzureInventoryDiffComputeResult> ComputeAndPersistDiffAsync(
        ScopeContext scope,
        Guid snapshotAId,
        Guid snapshotBId,
        CancellationToken cancellationToken = default);
}

public sealed class AzureInventoryDiffComputeResult
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

    public bool WasExisting
    {
        get;
        init;
    }

    public Guid? DiffId
    {
        get;
        init;
    }

    public AzureInventoryDiffSummaryRecord? Summary
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryChangeRecord> Changes
    {
        get;
        init;
    } = [];
}

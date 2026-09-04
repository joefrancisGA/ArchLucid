using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAzureInventoryDiffRepository
{
    Task<AzureInventoryDiffSummaryRecord?> TryGetBySnapshotPairAsync(
        ScopeContext scope,
        Guid snapshotAId,
        Guid snapshotBId,
        CancellationToken cancellationToken = default);

    Task<AzureInventoryDiffPersistResult> InsertDiffAsync(
        ScopeContext scope,
        AzureInventoryDiffPersistRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AzureInventoryChangeRecord>> ListChangesByDiffIdAsync(
        ScopeContext scope,
        Guid diffId,
        CancellationToken cancellationToken = default);
}

public sealed class AzureInventoryDiffPersistRequest
{
    public Guid DiffId
    {
        get;
        init;
    }

    public Guid SnapshotAId
    {
        get;
        init;
    }

    public Guid SnapshotBId
    {
        get;
        init;
    }

    public string? SubscriptionId
    {
        get;
        init;
    }

    public AzureInventoryDiffSummaryRecord Summary
    {
        get;
        init;
    } = null!;

    public IReadOnlyList<AzureInventoryChangeRecord> Changes
    {
        get;
        init;
    } = [];
}

public sealed class AzureInventoryDiffPersistResult
{
    public bool WasExisting
    {
        get;
        init;
    }

    public Guid DiffId
    {
        get;
        init;
    }

    public AzureInventoryDiffSummaryRecord Summary
    {
        get;
        init;
    } = null!;
}

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventorySnapshotMaterializeResult
{
    /// <summary>Terminal analysis outcome, distinct from the capture result. Null if capture did not commit.</summary>
    public string? PostMaterializationAnalysisOutcome { get; init; }

    public bool Succeeded
    {
        get;
        init;
    }

    public AzureInventoryCaptureStatus CaptureStatus
    {
        get;
        init;
    }

    public int ResourceCount
    {
        get;
        init;
    }

    public int RelationshipCount
    {
        get;
        init;
    }

    public byte[]? ContentHashSha256
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

public interface IAzureInventorySnapshotMaterializer
{
    Task<AzureInventorySnapshotMaterializeResult> TryMaterializePackageAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid packageId,
        byte[] packageBytes,
        AzureInventoryCaptureMethod captureMethod,
        string? collectorVersion,
        CancellationToken cancellationToken = default);
}

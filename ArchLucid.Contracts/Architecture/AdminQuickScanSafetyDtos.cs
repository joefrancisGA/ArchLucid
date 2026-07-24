namespace ArchLucid.Contracts.Architecture;

/// <summary>Admin view of Quick Scan runtime safety override (TB-898).</summary>
public sealed class AdminQuickScanSafetySnapshotResponse
{
    public required string OperationalMode { get; init; }

    public required bool AnonymousExecutionAllowed { get; init; }

    public required bool SampleResultAvailable { get; init; }

    public required string PublicMessage { get; init; }

    public required string Reason { get; init; }

    public required string ActorUserId { get; init; }

    public required DateTimeOffset? UpdatedUtc { get; init; }

    public required bool StoreHealthy { get; init; }
}

/// <summary>Admin mutation request for Quick Scan runtime safety override.</summary>
public sealed class AdminQuickScanSafetyUpdateRequest
{
    public required string OperationalMode { get; init; }

    public string? PublicMessage { get; init; }

    public required string Reason { get; init; }
}

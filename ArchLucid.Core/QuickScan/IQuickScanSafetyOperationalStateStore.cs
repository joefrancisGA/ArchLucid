using ArchLucid.Core.Configuration;

namespace ArchLucid.Core.QuickScan;

/// <summary>Cluster-wide runtime Quick Scan safety override (TB-898).</summary>
public interface IQuickScanSafetyOperationalStateStore
{
    Task<QuickScanSafetyOperationalOverrideRow?> GetOverrideAsync(CancellationToken cancellationToken = default);

    Task SetOverrideAsync(
        QuickScanSafetyOperationalOverrideWriteRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>Persisted operator override row.</summary>
public sealed class QuickScanSafetyOperationalOverrideRow
{
    public required QuickScanSafetyOperationalMode Mode { get; init; }

    public required string PublicMessage { get; init; }

    public required string Reason { get; init; }

    public required string ActorUserId { get; init; }

    public required DateTimeOffset UpdatedUtc { get; init; }
}

/// <summary>Input for mutating the runtime override.</summary>
public sealed class QuickScanSafetyOperationalOverrideWriteRequest
{
    public required QuickScanSafetyOperationalMode Mode { get; init; }

    public required string PublicMessage { get; init; }

    public required string Reason { get; init; }

    public required string ActorUserId { get; init; }

    public required DateTimeOffset UpdatedUtc { get; init; }
}

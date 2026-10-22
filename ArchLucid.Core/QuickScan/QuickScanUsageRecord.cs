namespace ArchLucid.Core.QuickScan;

/// <summary>Durable Quick Scan attempt outcome for operator monitoring (TB-899). No raw prompts.</summary>
public sealed class QuickScanUsageRecord
{
    public Guid UsageId { get; init; } = Guid.NewGuid();

    public Guid? ReservationId { get; init; }

    public required string Status { get; init; }

    public required string RouteKind { get; init; }

    public required string ClientIpHash { get; init; }

    public required string SessionIdHash { get; init; }

    public decimal? ReservedUsd { get; init; }

    public decimal? ActualCostUsd { get; init; }

    public int? InputTokens { get; init; }

    public int? OutputTokens { get; init; }

    public string? ModelLabel { get; init; }

    public string? RejectionReason { get; init; }

    public int DurationMs { get; init; }

    public DateTimeOffset OccurredUtc { get; init; }
}

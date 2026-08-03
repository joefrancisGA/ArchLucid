namespace ArchLucid.Contracts.Alerts;

/// <summary>
/// Card-row aggregates for the operator alerts inbox (TB-2023) — one round trip instead of N× list page-size-1.
/// </summary>
public sealed class AlertsInboxSummaryDto
{
    public int OpenCount { get; init; }

    public int AcknowledgedCount { get; init; }

    public int ResolvedCount { get; init; }

    /// <summary>Open alerts with Critical or High severity.</summary>
    public int BlockingCount { get; init; }

    /// <summary>Newest <c>LastUpdatedUtc</c> or <c>CreatedUtc</c> among non-archived alerts in scope.</summary>
    public DateTime? LastEvaluatedUtc { get; init; }
}

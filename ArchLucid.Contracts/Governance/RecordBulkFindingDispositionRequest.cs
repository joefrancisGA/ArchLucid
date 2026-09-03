namespace ArchLucid.Contracts.Governance;

using ArchLucid.Contracts.Findings;

public sealed class RecordBulkFindingDispositionRequest
{
    public required IReadOnlyList<string> FindingIds { get; init; }
    public required FindingDisposition Disposition { get; init; }
    public required string Rationale { get; init; }

    /// <summary>Shared trade-off narrative when disposition is Accepted (defaults to <see cref="Rationale"/> when omitted).</summary>
    public string? TradeOffAcknowledgment
    {
        get;
        init;
    }

    public DateTimeOffset? RevisitDueUtc { get; init; }
}

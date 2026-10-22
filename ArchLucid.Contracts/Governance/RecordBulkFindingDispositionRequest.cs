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

    /// <summary>Shared evidence request when disposition is NeedsEvidence.</summary>
    public string? EvidenceRequestText { get; init; }

    /// <summary>
    ///     Per-finding ADR 0076 expected current-pointer tokens. Missing keys are treated as a first write
    ///     (null expected). Extra keys are ignored. Do not substitute inspect-payload versions server-side.
    /// </summary>
    public IReadOnlyDictionary<string, string>? ExpectedCurrentDispositionRowVersionBase64ByFindingId
    {
        get;
        init;
    }
}

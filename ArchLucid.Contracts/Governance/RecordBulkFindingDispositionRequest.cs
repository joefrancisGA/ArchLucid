namespace ArchLucid.Contracts.Governance;

using ArchLucid.Contracts.Findings;

public sealed class RecordBulkFindingDispositionRequest
{
    public required IReadOnlyList<string> FindingIds { get; init; }
    public required FindingDisposition Disposition { get; init; }
    public required string Rationale { get; init; }
    public DateTimeOffset? RevisitDueUtc { get; init; }
}

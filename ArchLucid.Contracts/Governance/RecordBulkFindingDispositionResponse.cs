namespace ArchLucid.Contracts.Governance;

public sealed class RecordBulkFindingDispositionResponse
{
    public int ProcessedCount { get; init; }
    public required IReadOnlyList<string> UpdatedFindingIds { get; init; }
}

namespace ArchLucid.Contracts.Governance;

public sealed class RecordBulkFindingDispositionResponse
{
    public int ProcessedCount { get; init; }
    public required IReadOnlyList<string> UpdatedFindingIds { get; init; }

    /// <summary>New current-pointer tokens keyed by finding id, for bulk undo CAS.</summary>
    public IReadOnlyDictionary<string, string>? CurrentDispositionRowVersionBase64ByFindingId
    {
        get;
        init;
    }
}

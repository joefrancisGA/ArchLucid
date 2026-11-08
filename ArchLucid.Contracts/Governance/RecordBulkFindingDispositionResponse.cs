namespace ArchLucid.Contracts.Governance;

using ArchLucid.Contracts.Serialization;

public sealed class RecordBulkFindingDispositionResponse
{
    public int ProcessedCount { get; init; }

    private IReadOnlyList<string> updatedFindingIds = [];

    public required IReadOnlyList<string> UpdatedFindingIds
    {
        get => updatedFindingIds;
        init => updatedFindingIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>New current-pointer tokens keyed by finding id, for bulk undo CAS.</summary>
    public IReadOnlyDictionary<string, string>? CurrentDispositionRowVersionBase64ByFindingId
    {
        get;
        init;
    }
}

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>List projection for findings keyset queries (no payloads / trace graph).</summary>
public sealed record FindingRecordMetadataRow(
    Guid FindingRecordId,
    int SortOrder,
    string FindingId,
    string FindingType,
    string Category,
    string EngineType,
    string Severity,
    string Title,
    int? PriorityRank = null);

/// <summary>
///     Keyset page of finding metadata rows ordered by <c>SortOrder ASC</c>, <c>FindingRecordId ASC</c>.
/// </summary>
public sealed record FindingRecordMetadataPage
{
    public FindingRecordMetadataPage(IReadOnlyList<FindingRecordMetadataRow> Items, bool HasMore)
    {
        itemsBacking = ContractCollectionDefaults.CoalesceReadOnly(Items);
        this.HasMore = HasMore;
    }

    private IReadOnlyList<FindingRecordMetadataRow> itemsBacking = [];

    public IReadOnlyList<FindingRecordMetadataRow> Items
    {
        get => itemsBacking;
        init => itemsBacking = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public bool HasMore
    {
        get;
        init;
    }
}

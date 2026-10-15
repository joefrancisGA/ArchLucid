using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ProductLearning;

/// <summary>Deterministic triage queue slice for operator review.</summary>
public sealed class ProductLearningTriageQueueResponse
{
    public DateTime GeneratedUtc
    {
        get;
        init;
    }

    private IReadOnlyList<TriageQueueItem> items = [];

    public IReadOnlyList<TriageQueueItem> Items
    {
        get => items;
        init => items = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}

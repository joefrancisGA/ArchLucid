using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>Tenant-scoped novelty-rate rollup for Working-mode diagnostics (DX-23).</summary>
public sealed class EngineInsightNoveltyRatesResponse
{
    public DateTime FromUtc
    {
        get;
        set;
    }

    public DateTime ToUtcExclusive
    {
        get;
        set;
    }

    private IReadOnlyList<EngineInsightNoveltyRateRow> rows = [];

    public IReadOnlyList<EngineInsightNoveltyRateRow> Rows
    {
        get => rows;
        set => rows = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}

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

    public IReadOnlyList<EngineInsightNoveltyRateRow> Rows
    {
        get;
        set;
    } = [];
}

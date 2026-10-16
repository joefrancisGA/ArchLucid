using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Explanation;

/// <summary>Run-level retrieval grounding diagnostics for operator forensic review.</summary>
public sealed class RunRetrievalGroundingResponse
{
    public string RunId { get; set; } = string.Empty;

    private IReadOnlyList<RunRetrievalGroundingRow> rows = [];

    public IReadOnlyList<RunRetrievalGroundingRow> Rows
    {
        get => rows;
        set => rows = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public int TraceCount { get; set; }

    public bool HasDegradedMetadata { get; set; }
}

namespace ArchLucid.Contracts.Explanation;

/// <summary>Run-level retrieval grounding diagnostics for operator forensic review.</summary>
public sealed class RunRetrievalGroundingResponse
{
    public string RunId { get; set; } = string.Empty;

    public IReadOnlyList<RunRetrievalGroundingRow> Rows { get; set; } = [];

    public int TraceCount { get; set; }

    public bool HasDegradedMetadata { get; set; }
}

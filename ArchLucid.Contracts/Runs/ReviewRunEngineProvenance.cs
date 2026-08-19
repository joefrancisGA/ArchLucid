namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Run-level model engine provenance captured after agent execute completes. Persisted on <c>dbo.Runs</c> as JSON
///     and surfaced on <see cref="ArchLucid.Persistence.Queries.RunDetailDto" /> for operator audit.
/// </summary>
public sealed class ReviewRunEngineProvenance
{
    /// <summary>Logical provider kind (e.g. <c>azure-openai</c>, <c>deterministic</c>).</summary>
    public string ProviderKind
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Primary deployment or model identifier aggregated from execution traces.</summary>
    public string DeploymentOrModelId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Distinct prompt pack / release labels from agent traces, when recorded.</summary>
    public string? PromptPackVersion
    {
        get;
        set;
    }

    /// <summary>Policy pack labels from the evidence package, when present.</summary>
    public string? PolicyPackVersion
    {
        get;
        set;
    }

    /// <summary>Evidence snapshot anchor (context snapshot id) when available.</summary>
    public string? EvidenceSnapshotVersion
    {
        get;
        set;
    }

    /// <summary>Authority findings output schema label (e.g. <c>FindingsSnapshot v2</c>).</summary>
    public string? OutputSchemaVersion
    {
        get;
        set;
    }

    /// <summary>UTC timestamp for the review run (typically <c>RunRecord.CreatedUtc</c>).</summary>
    public DateTime RunTimestampUtc
    {
        get;
        set;
    }

    /// <summary>Summed prompt/input tokens from persisted traces, when reported.</summary>
    public int? TotalInputTokens
    {
        get;
        set;
    }

    /// <summary>Summed completion/output tokens from persisted traces, when reported.</summary>
    public int? TotalOutputTokens
    {
        get;
        set;
    }

    /// <summary>Estimated USD cost from trace token counts when estimation is enabled.</summary>
    public decimal? EstimatedCostUsd
    {
        get;
        set;
    }

    /// <summary>Optional named engine profile for future multi-provider routing (null in V1).</summary>
    public string? EngineProfileId
    {
        get;
        set;
    }

    /// <summary>Catalog alias selected for this review at run create (TB-2110 / TB-2106).</summary>
    public string? ModelAliasId
    {
        get;
        set;
    }

    /// <summary>Per-task evaluation state frozen at selection time (TB-2105 / TB-2106).</summary>
    public IReadOnlyList<ReviewRunEngineTaskEvaluationSnapshot>? TaskEvaluationSnapshotsAtSelection
    {
        get;
        set;
    }
}

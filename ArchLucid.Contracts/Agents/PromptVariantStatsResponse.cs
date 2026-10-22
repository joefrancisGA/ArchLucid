namespace ArchLucid.Contracts.Agents;

/// <summary>Per-variant semantic and quality-gate aggregates for prompt A/B analysis.</summary>
public sealed class PromptVariantStatsResponse
{
    public required string PromptTemplateName
    {
        get;
        init;
    }

    public required IReadOnlyList<PromptVariantStatsItem> Variants
    {
        get;
        init;
    }
}

public sealed class PromptVariantStatsItem
{
    public required string VariantKey
    {
        get;
        init;
    }

    public int SampleCount
    {
        get;
        init;
    }

    public double MeanSemanticScore
    {
        get;
        init;
    }

    public double MedianSemanticScore
    {
        get;
        init;
    }

    public double QualityGatePassRate
    {
        get;
        init;
    }
}

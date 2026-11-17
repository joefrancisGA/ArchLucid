using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Agents;

/// <summary>Per-variant semantic and quality-gate aggregates for prompt A/B analysis.</summary>
public sealed class PromptVariantStatsResponse
{
    public required string PromptTemplateName
    {
        get;
        init;
    }

    private IReadOnlyList<PromptVariantStatsItem> variants = [];

    public required IReadOnlyList<PromptVariantStatsItem> Variants
    {
        get => variants;
        init => variants = ContractCollectionDefaults.CoalesceReadOnly(value);
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
